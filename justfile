set dotenv-load := true
set quiet := true

default:
	just --list

check-env:
	./scripts/check-env.sh

validate:
	just check-env

setup:
	chmod +x scripts/check-env.sh
	pnpm exec husky init
	cd api && pnpm install
	cd web && pnpm install

dev-api:
	just validate
	cd api && pnpm dev

dev-web:
	just validate
	cd web && pnpm dev

dev-crawler:
	just validate
	cd crawler && odin run src

dev-db:
	docker compose up -d db

push-db:
	cd api && pnpm exec drizzle-kit push

sync-api:
	cd web && pnpm exec openapi-typescript http://localhost:$API_PORT/openapi.json --output src/api/api_paths.ts

seed-db:
	cd api && pnpm exec tsx src/seed.ts

migrate-db:
	cd api && pnpm exec tsx src/db/migrate.ts

