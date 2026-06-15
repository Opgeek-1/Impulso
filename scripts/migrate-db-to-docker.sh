#!/usr/bin/env bash
set -euo pipefail

SOURCE_URL="${SOURCE_DATABASE_URL:-}"
TARGET_URL="${TARGET_DATABASE_URL:-postgres://impulso:impulso_dev_password@localhost:54329/impulso?sslmode=disable}"
TARGET_CONTAINER_URL="postgres://impulso:impulso_dev_password@postgres:5432/impulso?sslmode=disable"

if [[ -z "$SOURCE_URL" ]]; then
  SOURCE_URL="$(node - <<'NODE'
const fs = require("fs");
function parse(value) {
  value = value.trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return value;
}
for (const file of [".env", ".env.local"]) {
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*DATABASE_URL\s*=\s*(.*)$/);
    if (match && parse(match[1])) {
      process.stdout.write(parse(match[1]));
      process.exit(0);
    }
  }
}
NODE
)"
fi

if [[ -z "$SOURCE_URL" ]]; then
  echo "SOURCE_DATABASE_URL is required or DATABASE_URL must be present in .env/.env.local." >&2
  exit 1
fi

docker_source_url="$SOURCE_URL"
docker_source_url="${docker_source_url//@localhost:/@host.docker.internal:}"
docker_source_url="${docker_source_url//@127.0.0.1:/@host.docker.internal:}"

docker compose up -d postgres

echo "Waiting for Docker Postgres..."
until docker compose exec -T postgres pg_isready -U impulso -d impulso >/dev/null 2>&1; do
  sleep 1
done

dump_file="$(mktemp -t impulso-db-dump.XXXXXX.sql)"
cleanup() {
  rm -f "$dump_file"
}
trap cleanup EXIT

echo "Dumping source database..."
if docker run --rm --add-host=host.docker.internal:host-gateway postgres:17-alpine \
  pg_dump --no-owner --no-acl --clean --if-exists "$docker_source_url" > "$dump_file"; then
  echo "Restoring into Docker Postgres..."
  docker compose exec -T postgres psql "$TARGET_CONTAINER_URL" -v ON_ERROR_STOP=1 < "$dump_file"
else
  echo "Warning: source dump failed. Docker Postgres will still be initialized with the current Prisma schema." >&2
fi

echo "Applying current Prisma schema..."
DATABASE_URL="$TARGET_URL" npx prisma db push

echo "Done. Docker database is ready at:"
echo "$TARGET_URL"
