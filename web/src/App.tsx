import { useState, useEffect } from 'react';
import { client } from './api';

function App() {
  const [query, set_query] = useState('');
  const [results, set_results] = useState<any[]>([]);
  const [loading, set_loading] = useState(false);
  const [error, set_error] = useState('');
  const [cached, set_cached] = useState(false);

  useEffect(() => {
    const fetch_results = async () => {
      if (!query.trim()) {
        set_results([]);
        return;
      }
      set_loading(true);
      set_error('');
      try {
        const { data, error: api_error } = await client.GET('/search', {
          params: { query: { q: query } },
        });

        if (api_error) {
          set_error(api_error.error || 'Failed to search');
        } else if (data) {
          set_results(data.results);
          set_cached(data.cached);
        }
      } catch (err: any) {
        set_error(err.message || 'Error occurred');
      } finally {
        set_loading(false);
      }
    };

    const timeout_id = setTimeout(() => {
      fetch_results();
    }, 300);

    return () => clearTimeout(timeout_id);
  }, [query]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>spider search</h1>
      
      <input
        type="text"
        placeholder="Search documents..."
        value={query}
        onChange={(e) => set_query(e.target.value)}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '18px',
          borderRadius: '8px',
          border: '1px solid #ccc',
          boxSizing: 'border-box',
          marginBottom: '20px'
        }}
      />

      {loading && <div>Searching...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {!loading && !error && query && (
        <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
          Found {results.length} results {cached && <span style={{ color: 'green' }}>(from cache)</span>}
        </div>
      )}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {results.map((result) => (
          <li
            key={result.id}
            style={{
              padding: '16px',
              border: '1px solid #eee',
              borderRadius: '8px',
              marginBottom: '10px'
            }}
          >
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#1a0dab' }}>
              <a href={result.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                {result.title}
              </a>
            </h2>
            <div style={{ fontSize: '14px', color: '#006621', marginBottom: '8px' }}>
              {result.url}
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: '#3c4043', lineHeight: '1.4' }}>
              {result.content_snippet}...
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
