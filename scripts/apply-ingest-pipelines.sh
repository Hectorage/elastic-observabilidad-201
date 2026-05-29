#!/usr/bin/env bash
# Carga pipelines de ingestión del repo en Elasticsearch (M04/M07)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ES_URL="${ES_URL:-http://localhost:9200}"
DIR="${ROOT}/infra/ingest-pipelines"

for f in "${DIR}"/*.json; do
  name="$(basename "${f}" .json)"
  echo "PUT _ingest/pipeline/${name}"
  curl -fsS -X PUT "${ES_URL}/_ingest/pipeline/${name}" \
    -H 'Content-Type: application/json' \
    -d @"${f}"
  echo
done
echo "OK — pipelines aplicados."
