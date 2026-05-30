# Laboratorio M02-03 — Añadir ingesta en vivo (Filebeat + loggen)

[← Página anterior](M02-02-kibana-discover.md) · [▲ Módulo M02](README.md) · [Siguiente página →](M02-04-fallos-y-recovery.md)

> ⏱️ ~35 min · 🧩 Requisitos: M02-02 (ES + Kibana + `lab-smoke`) · 🖥️ Terminal + Discover

**Objetivo:** conectar **Filebeat** y el generador `loggen` al clúster que montaste en M02-01/02 y repetir el rastreo de un evento hasta Discover.

> Es el mismo flujo que M01-01, pero esta vez **tú** has levantado cada capa por separado.

---

### Paso 1 — Línea base (sin Beats aún)

```bash
curl -fsS 'http://localhost:9200/filebeat-*/_count' 2>/dev/null || echo "filebeat: sin índice aún"
curl -fsS 'http://localhost:9200/_cat/indices?v' | grep -E 'lab-smoke|filebeat' || true
```

Solo debería existir `lab-smoke` (índice clásico).

---

### Paso 2 — Activar generador y Filebeat

```bash
cat infra/filebeat/filebeat.yml
docker compose -f infra/docker-compose.yml --profile beats up -d loggen filebeat
docker compose -f infra/docker-compose.yml ps loggen filebeat
```

---

### Paso 3 — Medir que la ingesta arranca

```bash
sleep 45
C1=$(curl -fsS 'http://localhost:9200/filebeat-*/_count' | grep -o '"count":[0-9]*' | cut -d: -f2)
sleep 30
C2=$(curl -fsS 'http://localhost:9200/filebeat-*/_count' | grep -o '"count":[0-9]*' | cut -d: -f2)
echo "count t0=$C1 t+30s=$C2"
curl -fsS 'http://localhost:9200/_cat/indices/.ds-filebeat*?v&h=index,docs.count' | head -3
```

Salida esperada: `C2` > `C1`; aparece un backing index `.ds-filebeat-8.17.2-...`.

---

### Paso 4 — Rastrear un evento (como en M01-01)

```bash
tail -2 infra/samples/logs/app.log
curl -fsS 'http://localhost:9200/filebeat-*/_search?size=1&sort=@timestamp:desc&pretty' | grep -E '"message"|"log_source"|"host.name"|"agent.type"'
```

El `message` de la API debe corresponder a una línea reciente de `app.log`.

---

### Paso 5 — Discover: dos familias de datos

1. Data view **`filebeat-*`** (`@timestamp`).
2. Filtro: `log_source : "demo-app"`.
3. Filtro: `message : *ERROR*` — debes ver errores (~10 % del tráfico del `loggen`).
4. Cambia a data view **`lab-smoke`** — sigue existiendo el documento manual de M02-01.

Ahora tienes **índice clásico** (`lab-smoke`) y **data stream** (`filebeat-*`) en el mismo clúster.

---

### Paso 6 — Cambio de config en caliente

Edita `infra/filebeat/filebeat.yml` y añade bajo `fields` del input principal:

```yaml
      team: platform
```

```bash
docker compose -f infra/docker-compose.yml restart filebeat
sleep 30
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_search?pretty' \
  -d '{"size":1,"sort":[{"@timestamp":"desc"}],"query":{"term":{"team":"platform"}}}'
```

Solo los **nuevos** eventos llevan `team: platform`.

---

## Validación

- [ ] `filebeat-*/_count` crece entre dos lecturas.
- [ ] Un evento de `app.log` aparece en `_search` y en Discover.
- [ ] Ves ERROR y el documento antiguo en `lab-smoke`.
- [ ] Al menos un evento nuevo tiene `team: platform`.

---

## Antes de seguir

### Pon el foco en

- Filebeat crea el data stream automáticamente; no creaste el índice a mano.
- `loggen` = fuente; en producción serían logs reales de app o contenedor.
- Reinicio del Beat tras cambiar `filebeat.yml`.

### Reto (tómate tu tiempo)

1. Para `lab-filebeat` — ¿deja de crecer `_count`?
2. En un evento expandido, localiza el campo que añade `add_host_metadata`.
3. (Opcional) [Beats vs Logstash](https://www.elastic.co/docs/reference/beats/auditbeat/diff-logstash-beats)

<details>
<summary>Ver respuestas</summary>

**1. Parar Filebeat**

Sí: `_count` en `filebeat-*` **deja de aumentar** mientras Filebeat está parado (mismo comportamiento que M01-01). `loggen` sigue escribiendo en disco.

**2. Campo de `add_host_metadata`**

Campos bajo **`host.*`**: p. ej. `host.name`, `host.hostname`, `host.architecture`, `host.os.name`. El processor enriquece cada evento con metadata del contenedor/host.

**3. Beats vs Logstash (opcional)**

Beats = agente ligero en el edge, shipping directo. Logstash = transformación centralizada, múltiples inputs/outputs, buffers. Usa Logstash cuando el parseo supera lo razonable en el Beat (M04).

</details>
