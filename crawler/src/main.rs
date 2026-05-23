use sqlx::postgres::PgPoolOptions;
use std::env;
use std::time::Duration;
use uuid::Uuid;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let db_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let redis_url = env::var("REDIS_URL").expect("REDIS_URL must be set");
    let max_concurrent: usize = env::var("MAX_CONCURRENT_SCRAPES")
        .unwrap_or_else(|_| "5".to_string())
        .parse()
        .expect("MAX_CONCURRENT_SCRAPES must be a valid number");

    println!("Connecting to Postgres...");
    let db_pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&db_url)
        .await?;

    println!("Connecting to Redis...");
    let req_client = reqwest::Client::builder()
        .user_agent("Spider-Minimal-Engine/1.0 (Polite Bot)")
        .timeout(Duration::from_secs(15))
        .build()?;

    let crawler_id = Uuid::new_v4().to_string();
    println!("Crawler started. ID: {}, Max concurrent workers: {}", crawler_id, max_concurrent);

    let mut handles = vec![];

    for i in 0..max_concurrent {
        let worker_id = format!("{}-{}", &crawler_id[..8], i);
        let db_pool = db_pool.clone();
        let redis_url = redis_url.clone();
        let req_client = req_client.clone();

        handles.push(tokio::spawn(async move {
            let redis_client = redis::Client::open(redis_url).unwrap();
            let mut redis_conn = redis_client.get_multiplexed_async_connection().await.unwrap();
            let status_key = format!("crawler:status:{}", worker_id);

            loop {
                let _: Result<(), redis::RedisError> = redis::cmd("SETEX")
                    .arg(&status_key)
                    .arg(10)
                    .arg("Idle")
                    .query_async(&mut redis_conn)
                    .await;

                let url: Option<String> = redis::cmd("RPOP")
                    .arg("crawler:queue")
                    .query_async(&mut redis_conn)
                    .await
                    .unwrap_or(None);

                if let Some(url) = url {
                    let _: Result<(), redis::RedisError> = redis::cmd("SETEX")
                        .arg(&status_key)
                        .arg(60)
                        .arg(&url)
                        .query_async(&mut redis_conn)
                        .await;

                    println!("Worker {} scraping: {}", worker_id, url);
                    
                    match scrape_and_save(&url, &req_client, &db_pool).await {
                        Ok(_) => println!("Worker {} finished: {}", worker_id, url),
                        Err(e) => eprintln!("Worker {} failed on {}: {}", worker_id, url, e),
                    }
                } else {
                    tokio::time::sleep(Duration::from_secs(2)).await;
                }
            }
        }));
    }

    for handle in handles {
        let _ = handle.await;
    }

    Ok(())
}

async fn scrape_and_save(
    url: &str,
    client: &reqwest::Client,
    db: &sqlx::PgPool,
) -> Result<(), String> {
    let resp = client.get(url).send().await.map_err(|e| e.to_string())?;
    
    if !resp.status().is_success() {
        return Err(format!("HTTP {}", resp.status()));
    }

    let html = resp.text().await.map_err(|e| e.to_string())?;
    
    let (title, content) = {
        let document = scraper::Html::parse_document(&html);
        
        let title = {
            let title_selector = scraper::Selector::parse("title").unwrap();
            document.select(&title_selector).next()
                .map(|t| t.text().collect::<Vec<_>>().join(" "))
                .unwrap_or_else(|| "No Title".to_string())
        };

        let content = {
            let body_selector = scraper::Selector::parse("body").unwrap();
            document.select(&body_selector).next()
                .map(|b| b.text().collect::<Vec<_>>().join(" "))
                .unwrap_or_default()
        };

        let content = content.split_whitespace().collect::<Vec<_>>().join(" ");
        let title = title.trim().to_string();

        (title, content)
    };

    sqlx::query("INSERT INTO documents (url, title, content) VALUES ($1, $2, $3) ON CONFLICT (url) DO NOTHING")
        .bind(url)
        .bind(&title)
        .bind(&content)
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}
