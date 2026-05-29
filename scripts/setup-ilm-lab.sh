#!/usr/bin/env bash
# Política ILM de laboratorio (M06) — índice clásico lab-ilm-demo
set -euo pipefail
ES_URL="${ES_URL:-http://localhost:9200}"

curl -fsS -X PUT "${ES_URL}/_ilm/policy/lab-hot-warm-delete" \
  -H 'Content-Type: application/json' \
  -d '{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_primary_shard_size": "1gb",
            "max_age": "7d"
          },
          "set_priority": { "priority": 100 }
        }
      },
      "warm": {
        "min_age": "1m",
        "actions": {
          "set_priority": { "priority": 50 },
          "shrink": { "number_of_shards": 1 }
        }
      },
      "delete": {
        "min_age": "5m",
        "actions": { "delete": {} }
      }
    }
  }
}'

curl -fsS -X PUT "${ES_URL}/_index_template/lab-ilm-demo-template" \
  -H 'Content-Type: application/json' \
  -d '{
  "index_patterns": ["lab-ilm-demo-*"],
  "template": {
    "settings": {
      "index.lifecycle.name": "lab-hot-warm-delete",
      "index.lifecycle.rollover_alias": "lab-ilm-demo"
    }
  }
}'

echo "OK — política lab-hot-warm-delete y plantilla lab-ilm-demo-* creadas."
