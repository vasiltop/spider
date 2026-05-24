set dotenv-load := true
set quiet := true

VAULT := "deployment/group_vars/production/vault.yml"
PASS   := ".vault_pass"

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

deploy:
    ansible-playbook -i deployment/inventory.ini deployment/deploy.yml \
      --vault-password-file .vault_pass

encrypt:
    ansible-vault encrypt {{VAULT}} --vault-password-file {{PASS}}

decrypt:
    ansible-vault decrypt {{VAULT}} --vault-password-file {{PASS}}

edit-vault:
    ansible-vault edit {{VAULT}} --vault-password-file {{PASS}}

view-vault:
    ansible-vault view {{VAULT}} --vault-password-file {{PASS}}

dev-api:
	just validate
	cd api && pnpm dev

dev-web:
	just validate
	cd web && pnpm dev

dev-crawler:
	just validate
	cd crawler && cargo run

dev-db:
	docker compose up -d db

push-db:
	cd api && pnpm exec drizzle-kit push

generate-db:
	cd api && pnpm exec drizzle-kit generate

migrate-db:
    cd api && pnpm exec drizzle-kit generate
    cd api && pnpm exec drizzle-kit migrate 

seed-db:
	cd api && pnpm exec tsx src/seed.ts

shell-db:
    psql -U postgres -h localhost -p 5432 -d spider

sync-api:
	cd web && pnpm exec openapi-typescript http://localhost:$API_PORT/api/openapi.json --output src/api/api_paths.ts
