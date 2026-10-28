#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
# Mount source + installed devDependencies for tests; production image stays small.
# Compose injects Docker DB/Redis/notification addresses; .env is never copied to the image.
docker compose --profile full run --rm --no-deps -v "$PWD:/app" app npm test
