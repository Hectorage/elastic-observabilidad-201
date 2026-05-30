# Laboratorio M04-04 — Rutas condicionales y data streams separados

[▲ Módulo M04](README.md) · [← Anterior](M04-03-ingest-pipeline-nativo.md) · [Siguiente módulo →](../M05-dashboards-kibana/M05-01-lens-primeros-pasos.md)

> ⏱️ ~60 min · 🧩 Perfil `logstash`

**Objetivo:** enviar eventos **ERROR** a un data stream `filebeat-errors` y el resto al stream habitual.

---

### Paso 1 — Cambiar pipeline activo

```bash
mv infra/logstash/pipeline/10-beats-to-es.conf infra/logstash/pipeline/10-beats-to-es.conf.disabled
mv infra/logstash/pipeline/20-rutas-condicionales.conf.disabled infra/logstash/pipeline/20-rutas-condicionales.conf
docker compose -f infra/docker-compose.yml -f infra/docker-compose.logstash.yml restart logstash
sleep 60
```

---

### Paso 2 — Forzar tráfico ERROR

El `loggen` ya emite ~10 % ERROR. Espera 2 minutos o reinicia `lab-loggen`.

```bash
curl -fsS 'http://localhost:9200/filebeat-errors-*/_count' 2>/dev/null || echo "count 0 (aún)"
sleep 90
curl -fsS 'http://localhost:9200/filebeat-errors-*/_count'
curl -fsS 'http://localhost:9200/filebeat-*/_count'
```

Salida esperada: ambos contadores > 0.

---

### Paso 3 — Discover en dos data views

Crea o usa:

- `filebeat-*` — INFO/WARN
- `filebeat-errors-*` — solo ERROR (`log.level : "ERROR"`)

Filtro común: `log_source : "demo-app"`.

---

### Paso 4 — Romper y reparar

```bash
docker stop lab-logstash
sleep 20
curl -fsS 'http://localhost:9200/filebeat-*/_count'  # no sube
docker start lab-logstash
```

---

### Paso 5 — Restaurar pipeline por defecto (para otros módulos)

```bash
mv infra/logstash/pipeline/20-rutas-condicionales.conf infra/logstash/pipeline/20-rutas-condicionales.conf.disabled
mv infra/logstash/pipeline/10-beats-to-es.conf.disabled infra/logstash/pipeline/10-beats-to-es.conf
```

---

## Validación

- [ ] `filebeat-errors-*` recibe solo errores (muestreo manual OK).
- [ ] Recuperación tras parar Logstash.
- [ ] Pipeline 10 restaurado en disco.

---

## Antes de seguir

### Pon el foco en

- Enrutar por severidad facilita **retención ILM** distinta (M06) y alertas (M08).
- Demasiados data streams complican gobierno; usa criterio de negocio.

### Reto

¿Cómo enviarías WARN a un tercer stream sin duplicar todo el bloque `output`?
