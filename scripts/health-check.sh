#!/usr/bin/env bash
# Checklist operativo reutilizable — Elastic Stack Observabilidad Lab First
# Uso:   ./scripts/health-check.sh
# Salida: 0 si Elasticsearch responde; 1 si no.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${ROOT}/infra/docker-compose.yml"
ES_URL="${ES_URL:-http://localhost:9200}"
KIBANA_URL="${KIBANA_URL:-http://localhost:5601}"

green() { printf '\033[0;32m%s\033[0m\n' "$1"; }
red()   { printf '\033[0;31m%s\033[0m\n' "$1"; }
hr()    { printf -- '----------------------------------------\n'; }

echo "== Elastic Stack Lab — health check =="
echo "ES_URL=${ES_URL}  KIBANA_URL=${KIBANA_URL}"
hr

echo "[1/6] Docker"
docker --version || { red "Docker no disponible"; exit 1; }
docker compose version 2>/dev/null || echo "AVISO: usa 'docker-compose' (v1) si 'docker compose' no existe"
hr

echo "[2/6] Contenedores (compose)"
docker compose -f "${COMPOSE_FILE}" ps 2>/dev/null || echo "AVISO: no se pudo leer estado de compose"
hr

echo "[3/6] Elasticsearch cluster health"
if HEALTH="$(curl -fsS "${ES_URL}/_cluster/health" 2>/dev/null)"; then
  echo "${HEALTH}" | tr ',' '\n' | grep -E '"(cluster_name|status|number_of_nodes|active_shards|unassigned_shards)"' || echo "${HEALTH}"
  STATUS="$(echo "${HEALTH}" | grep -o '"status":"[a-z]*"' | cut -d'"' -f4)"
  case "${STATUS}" in
    green)  green "status: green" ;;
    yellow) echo  "status: yellow (normal en nodo único)" ;;
    red)    red   "status: RED — revisa shards sin asignar" ;;
  esac
else
  red "ERROR: no responde ${ES_URL} (¿'docker compose up -d' en infra/?)"
  exit 1
fi
hr

echo "[4/6] Nodos"
curl -fsS "${ES_URL}/_cat/nodes?v&h=name,version,heap.percent,ram.percent,cpu,node.role" 2>/dev/null
hr

echo "[5/6] Eventos por familia (Beats)"
for fam in filebeat metricbeat auditbeat; do
  COUNT="$(curl -fsS "${ES_URL}/${fam}-*/_count" 2>/dev/null | grep -o '"count":[0-9]*' | cut -d: -f2)"
  printf '  %-12s %s docs\n' "${fam}-*" "${COUNT:-0}"
done
hr

echo "[6/6] Kibana status"
if curl -fsS "${KIBANA_URL}/api/status" 2>/dev/null | grep -qE '"level":"available"|"overall".*available|available'; then
  green "Kibana available — UI: ${KIBANA_URL}"
else
  echo "AVISO: Kibana aún no disponible en ${KIBANA_URL} (puede estar arrancando)"
fi

hr
green "OK — checklist completado."
