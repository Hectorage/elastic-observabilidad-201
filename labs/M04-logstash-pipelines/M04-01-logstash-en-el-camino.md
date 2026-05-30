# Laboratorio M04-01 — Logstash en el camino del dato

[▲ Módulo M04](README.md) · [Siguiente página →](M04-02-filtros-grok-logstash.md)

> ⏱️ ~45 min · 🧩 Requisitos: M03 · 🖥️ Terminal + Discover

**Objetivo:** cambiar el pipeline a **Filebeat → Logstash → Elasticsearch** y comprobar que los eventos siguen llegando a data streams.

> **Por qué Logstash:** Filebeat es ligero y va bien al edge; Logstash concentra transformaciones pesadas (grok, enriquecimiento, rutas condicionales) y puede hacer de buffer. Pagas un contenedor JVM extra a cambio de flexibilidad.

---

### Paso 1 — Parar el stack anterior y levantar con Logstash

El compose de Logstash cambia el output de Filebeat de `:9200` a `:5044`. Sin reiniciar con el override correcto seguirías en modo M03.

```bash
docker compose -f infra/docker-compose.yml --profile beats down
docker compose -f infra/docker-compose.yml \
  -f infra/docker-compose.logstash.yml \
  --profile beats --profile logstash up -d
./scripts/health-check.sh
```

Salida esperada: contenedor `lab-logstash` en estado running.

| Componente | Puerto | Rol |
|------------|--------|-----|
| Filebeat | — | Lee `app.log`, envía a Logstash |
| Logstash | 5044 (beats input), 9600 (API) | Pipeline `10-beats-to-es` |
| Elasticsearch | 9200 | Indexa en data streams |

---

### Paso 2 — API de nodos Logstash

La API `:9600` confirma que el pipeline está cargado — equivalente operativo a mirar logs, pero parseable.

```bash
curl -fsS 'http://localhost:9600/_node/stats/pipelines?pretty' | head -40
docker logs lab-logstash --tail 15
```

Debe aparecer al menos un pipeline activo (`10-beats-to-es`). Si no: revisa que el fichero `.conf` esté montado y sin errores de sintaxis (Logstash no arranca el pipeline roto).

**Caso de uso:** en producción scrapeas estas métricas (eventos in/out, duración) para detectar cuellos de botella en el pipeline.

---

### Paso 3 — Contar documentos tras 1 minuto

Logstash añade latencia (milisegundos–segundos). Espera un ciclo completo de ingesta antes de concluir fallo.

```bash
sleep 60
curl -fsS 'http://localhost:9200/filebeat-*/_count'
```

Salida esperada: `"count"` > 0 y creciendo. Anota el valor; lo compararás si paras Logstash en el reto.

---

### Paso 4 — Discover

Data view `filebeat-*`, filtro `log_source : "demo-app"`, time picker **Last 15 minutes**.

**Qué validar:** mismos campos que en M03 (`message`, `log_source`, `@timestamp`). Si ves documentos, Logstash **no rompió** el contrato de ingesta — solo añadió un salto intermedio.

| Aspecto | M03 (directo) | M04 (con Logstash) |
|---------|---------------|---------------------|
| Origen | `loggen` → Filebeat | Igual |
| Camino a ES | Filebeat → ES :9200 | Filebeat → Logstash :5044 → ES |
| Campos en Discover | `demo-app`, status en message | Deberían coincidir salvo enriquecimiento futuro (M04-02 grok) |
| Latencia | Menor (un salto menos) | Algo mayor — normal |
| Punto de fallo extra | No | Logstash caído = ingesta parada |

Si M03 tenía datos y M04 no: sospecha pipeline Logstash caído (`docker logs lab-logstash`), no Filebeat ni ES.

---

### Paso 5 — Trazar el flujo (dibujo mental)

```text
loggen → fichero → Filebeat → :5044 Logstash → Elasticsearch → Kibana
```

Anota en un evento: `agent.type` (filebeat), `host.name`, `@timestamp`. Ese triplete te servirá en M04-04 cuando enrutes por severidad.

**Decisión de arquitectura:** ¿cuándo evitar Logstash? Ingesta simple Beats→ES, bajo volumen, parseo con ingest pipelines nativos (M04-03). ¿Cuándo usarlo? Decenas de fuentes, buffers, enriquecimiento complejo, salidas múltiples.

---

## Validación

- [ ] `lab-logstash` healthy.
- [ ] `_count` en `filebeat-*` aumenta.
- [ ] Discover muestra eventos recientes de `demo-app`.

---

## Antes de seguir

### Pon el foco en

- Logstash añade **CPU/RAM** y un punto de fallo más; compensa con transformaciones complejas y buffers.
- Filebeat puede enviar a ES o a Logstash; no ambos a la vez con la misma config.

### Reto

1. ¿Qué pasa si paras Logstash (`docker stop lab-logstash`) y miras `docker logs lab-filebeat`?
2. Vuelve a arrancarlo antes del siguiente ejercicio.

<details>
<summary>Ver respuestas</summary>

**1. Parar Logstash**

Filebeat acumula eventos en cola o muestra **`connection refused`** / **`publish failed`** hacia `logstash:5044`. `_count` en ES **deja de crecer** (o crece mucho más lento si hay buffer). Los logs del Beat son la primera pista.

**2. Volver a arrancar**

```bash
docker compose -f infra/docker-compose.yml -f infra/docker-compose.logstash.yml \
  --profile beats --profile logstash start logstash
```

Espera API `:9600` y verifica que Filebeat reconecta antes de M04-02.

</details>
