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
	cd api && pnpm dev

dev-web:
	cd web && pnpm dev

sync-api:
	pnpx openapi-typescript http://localhost:$API_PORT/openapi.json --output web/src/api/api_paths.ts
