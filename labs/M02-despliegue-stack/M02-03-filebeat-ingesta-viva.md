# Laboratorio M02-03 — Añadir ingesta en vivo (Filebeat + loggen)

[← Página anterior](M02-02-kibana-discover.md) · [▲ Módulo M02](README.md) · [Siguiente página →](M02-04-fallos-y-recovery.md)

> ⏱️ ~35 min · 🧩 Requisitos: M02-02 (ES + Kibana + `lab-smoke`) · 🖥️ Terminal + Discover

Conectamos **Filebeat** y `loggen` al clúster que montamos en M02-01/02 y repetimos el rastreo de un evento hasta Discover. Es el mismo flujo que M01-01, pero esta vez hemos levantado cada capa por separado.

---

### Paso 1 — Línea base (sin Beats aún)

Antes de conectar ingesta, fijemos qué **ya existe** en el clúster (`lab-smoke` manual). Así distinguirás documentos indexados a mano de los que creará Filebeat en el data stream `filebeat-*`.

```bash
curl -fsS 'http://localhost:9200/filebeat-*/_count' 2>/dev/null || echo "filebeat: sin índice aún"
curl -fsS 'http://localhost:9200/_cat/indices?v' | grep -E 'lab-smoke|filebeat' || true
```

Solo debería existir `lab-smoke` (índice clásico).

---

### Paso 2 — Activar generador y Filebeat

Leemos `filebeat.yml` **antes** del `up` — ahí está el contrato de qué paths vigila, qué campos añade y a qué host ES envía. Sorpresas en Discover casi siempre vienen de config no leída, no de Elasticsearch.

Revisa la config antes de arrancar — entender qué fichero vigila evita sorpresas en Discover:

```bash
cat infra/filebeat/filebeat.yml
docker compose -f infra/docker-compose.yml --profile beats up -d loggen filebeat
docker compose -f infra/docker-compose.yml ps loggen filebeat
```

| Contenedor | Función |
|------------|---------|
| `lab-loggen` | Escribe líneas en `infra/samples/logs/app.log` |
| `lab-filebeat` | Tail del fichero → bulk a ES |

Sin `loggen`, Filebeat no tiene líneas nuevas — mismo síntoma que perfil `beats` olvidado en M01.

---

### Paso 3 — Medir que la ingesta arranca

Dos lecturas de `_count` separadas 30 s confirman **crecimiento**, no un número aislado. La aparición de `.ds-filebeat-...` indica que Filebeat creó el data stream vía index template — no tuvimos que crear el índice manualmente.

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

Repetimos la correlación fichero → API porque ahora montamos ES y Kibana por separado. Si falla aquí, el problema está en la capa de ingesta, no en la base que ya validamos en M02-01/02.

```bash
tail -2 infra/samples/logs/app.log
curl -fsS 'http://localhost:9200/filebeat-*/_search?size=1&sort=@timestamp:desc&pretty' | grep -E '"message"|"log_source"|"host.name"|"agent.type"'
```

El `message` de la API debe corresponder a una línea reciente de `app.log`.

---

### Paso 5 — Discover: dos familias de datos

Un clúster real mezcla **índices legacy** y **data streams** durante años de migración. Cambiar de data view implica cambiar modelo de tiempo y campos — no es solo cambiar el nombre del patrón.

Kibana puede consultar **modelos distintos** en un solo clúster — no mezclamos data views sin saber qué índice hay detrás.

1. Data view **`filebeat-*`** (`@timestamp`) — time picker **Last 15 minutes**.
2. Filtro: `log_source : "demo-app"`.
3. Filtro: `message : *ERROR*` — esperamos ver errores (~10 % del tráfico del `loggen`).
4. Cambia a data view **`lab-smoke`** — time picker **Last 1 year** — sigue existiendo el documento manual de M02-01.

| Data view | Modelo | Origen del dato |
|-----------|--------|-----------------|
| `lab-smoke` | Índice clásico | `curl` manual M02-01 |
| `filebeat-*` | Data stream | Filebeat + loggen continuo |

**Reflexión:** en prod conviven índices legacy y data streams durante migraciones — ILM (M06) trata cada uno según política.

---

### Paso 6 — Cambio de config en caliente

Filebeat no reindexa el pasado — **solo eventos nuevos** llevan campos añadidos tras el restart. Esa inmutabilidad del histórico indexado es regla general en ES: cambios de mapping o enrichers afectan hacia adelante, no hacia atrás.

Editamos `infra/filebeat/filebeat.yml` y añade bajo `fields` del input principal:

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
- [ ] Vemos ERROR y el documento antiguo en `lab-smoke`.
- [ ] Al menos un evento nuevo tiene `team: platform`.

---

## Antes de seguir

- Filebeat crea el data stream automáticamente; no creamos el índice a mano.
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
