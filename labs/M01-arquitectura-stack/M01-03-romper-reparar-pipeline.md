# Laboratorio M01-03 — Romper y reparar el pipeline

[← Página anterior](M01-02-eventos-data-streams-campos.md) · [▲ Módulo M01](README.md) · [Siguiente página →](M01-04-ritual-recovery.md)

> ⏱️ ~30 min · 🧩 Requisitos: M01-01 y M01-02 (stack en marcha) · 🖥️ Terminal + Discover

**Objetivo:** provocar fallos controlados (Beat parado, fuente distinta de logs) y **medir el efecto** en `_count` y en Discover, para no confundir “clúster verde” con “observabilidad funcionando”.

> Todo se valida con números y pantallas, no con tablas teóricas.

---

### Paso 1 — Línea base medible

```bash
./scripts/health-check.sh
COUNT1=$(curl -fsS 'http://localhost:9200/filebeat-*/_count' | grep -o '"count":[0-9]*' | cut -d: -f2)
echo "filebeat count inicial: $COUNT1"
```

Anota `COUNT1`. En Discover (`filebeat-*`), confirma que ves eventos recientes de `demo-app`.

---

### Paso 2 — Cortar la ingesta (Filebeat parado)

```bash
docker compose -f infra/docker-compose.yml stop filebeat
sleep 45
COUNT2=$(curl -fsS 'http://localhost:9200/filebeat-*/_count' | grep -o '"count":[0-9]*' | cut -d: -f2)
echo "filebeat count tras parar beat: $COUNT2"
curl -fsS 'http://localhost:9200/_cluster/health?pretty' | grep '"status"'
```

Salida esperada:

- `"status" : "green"` o `"yellow"` (el clúster sigue sano).
- `COUNT2` ≈ `COUNT1` (no crece).

En Discover: refresca 30 s — no deberían aparecer líneas nuevas con `@timestamp` reciente.

Repara el pipeline:

```bash
docker compose -f infra/docker-compose.yml start filebeat
sleep 30
COUNT3=$(curl -fsS 'http://localhost:9200/filebeat-*/_count' | grep -o '"count":[0-9]*' | cut -d: -f2)
echo "filebeat count tras reparar: $COUNT3"
```

`COUNT3` debe ser **mayor** que `COUNT2`.

---

### Paso 3 — Segundo origen de logs (sin reiniciar Filebeat)

```bash
echo "$(date -Iseconds) WARN sshd Failed password for invalid user lab from 203.0.113.50 port 22" \
  >> infra/samples/logs/system-lab.log
sleep 20
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_search?pretty' \
  -d '{"size":1,"query":{"match":{"message":"sshd"}}}'
```

En Discover:

```text
message : *sshd* and message : *lab*
```

Debes ver tu línea nueva. Mismo Beat, otro fichero en `infra/samples/logs/`.

---

### Paso 4 — ¿Sigue el generador si paras solo loggen?

```bash
docker compose -f infra/docker-compose.yml stop loggen
tail -2 infra/samples/logs/app.log
sleep 10
tail -2 infra/samples/logs/app.log
```

El fichero **deja de crecer**. Con Filebeat activo, `_count` también deja de subir (salvo otros logs).

Vuelve a arrancar:

```bash
docker compose -f infra/docker-compose.yml start loggen
```

---

### Paso 5 — Límites del Codespace (datos para M02)

```bash
free -h | grep -E 'Mem|available'
docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}' \
  lab-elasticsearch lab-kibana lab-filebeat 2>/dev/null
```

Si Elasticsearch usa casi toda la RAM del contenedor, en M02 bajarás `ES_JAVA_OPTS` en `infra/.env`.

---

## Validación

- [ ] Con Filebeat parado, `_count` no crece pero `_cluster/health` puede seguir green/yellow.
- [ ] Tras `start filebeat`, `_count` vuelve a subir.
- [ ] El evento `sshd` con `lab` aparece en Discover.
- [ ] Parar `loggen` detiene el crecimiento de `app.log`.

---

## Antes de seguir

### Pon el foco en

- Operador bueno = mira **ingesta** (`_count`, Discover), no solo salud del clúster.
- Un Beat puede leer varios ficheros; varias fuentes, un agente.
- Codespaces tiene techo de RAM: lo mediste con datos reales.

### Reto (tómate tu tiempo)

1. Escribe el síntoma en una frase si solo miras `_cluster/health` y no `_count`.
2. `ss -tlnp | grep 9200` — ¿quién escucha en 9200?
3. Para `lab-kibana` (no Filebeat). ¿Sigue Kibana en el navegador? ¿Sigue Elasticsearch respondiendo?
