#!/usr/bin/env bash
# Simple E2E script: register -> login -> create -> update -> delete -> list
set -euo pipefail
PORT=${PORT:-5001}
BASE="http://localhost:${PORT}"
TMPDIR=$(mktemp -d)
echo "Using temp dir: $TMPDIR"
EMAIL="e2e_$(date +%s)@example.com"

echo "Starting server in background..."
PORT=${PORT} node src/server.js > "$TMPDIR/server.log" 2>&1 & echo $! > "$TMPDIR/server.pid"
sleep 2

echo "Registering $EMAIL"
curl -s -X POST "$BASE/api/auth/register" -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"TestPass123!\",\"name\":\"E2E Tester\"}" -o "$TMPDIR/register.json" -w "\nHTTP %{http_code}\n"
curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"TestPass123!\"}" -o "$TMPDIR/login.json" -w "\nHTTP %{http_code}\n"
TOKEN=$(node -e "console.log(require('$TMPDIR/login.json').token)")
echo "Token length: ${#TOKEN}"

echo "Attempting create (good)"
curl -s -X POST "$BASE/api/items" -H "Authorization: Bearer ${TOKEN}" -H 'Content-Type: application/json' -d '{"sku":"E2E-SKU-1","name":"E2E Item","quantity":1,"price":"1.00","barcode":"E2E-BC"}' -o "$TMPDIR/create.json" -w "\nHTTP %{http_code}\n"
ITEM_ID=$(node -e "console.log(require('$TMPDIR/create.json').id)")
echo "Created item id: $ITEM_ID"

echo "Updating item"
curl -s -X PUT "$BASE/api/items/${ITEM_ID}" -H "Authorization: Bearer ${TOKEN}" -H 'Content-Type: application/json' -d '{"name":"E2E Item Updated","quantity":2,"price":"2.50"}' -o "$TMPDIR/update.json" -w "\nHTTP %{http_code}\n"

echo "Fetching item"
curl -s -X GET "$BASE/api/items/${ITEM_ID}" -H "Authorization: Bearer ${TOKEN}" -o "$TMPDIR/get.json" -w "\nHTTP %{http_code}\n"

echo "Deleting item"
curl -s -X DELETE "$BASE/api/items/${ITEM_ID}" -H "Authorization: Bearer ${TOKEN}"

echo "Listing items"
curl -s -X GET "$BASE/api/items" -H "Authorization: Bearer ${TOKEN}" -o "$TMPDIR/list.json" -w "\nHTTP %{http_code}\n"

echo "Outputs saved under $TMPDIR"
echo "Stopping server"
kill "$(cat $TMPDIR/server.pid)" || true

echo "Done"
