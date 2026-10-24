#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
node scripts/init-env.mjs
docker compose up -d --wait mysql redis mailpit
node scripts/infra-setup.mjs
docker compose --profile full build
docker compose --profile full run --rm --no-deps app node scripts/hrm-cli.js migrate
docker compose --profile full run --rm --no-deps app node scripts/hrm-cli.js seed
docker compose --profile full run --rm --no-deps notifications node src/migrate.js
docker compose --profile full up -d --wait
printf '
HRM: http://localhost:8087
Mailpit: http://localhost:8037
Demo: admin@hrm.local / HrmDemo123!
'
