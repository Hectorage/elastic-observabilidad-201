# Laboratorio M04-04 — Rutas condicionales y data streams separados

[▲ Módulo M04](README.md) · [← Anterior](M04-03-ingest-pipeline-nativo.md) · [Siguiente módulo →](../M05-dashboards-kibana/M05-01-lens-primeros-pasos.md)

> ⏱️ ~60 min · 🧩 Perfil `logstash`

**Objetivo:** enviar eventos **ERROR** a un data stream `filebeat-errors` y el resto al stream habitual.

> **Por qué enrutar:** no todos los logs merecen la misma retención ni las mismas alertas. ERROR → stream corto + alertas agresivas; INFO → retención larga. M06 (ILM) y M08 (alertas) se apoyan en esta separación.

---

### Paso 1 — Cambiar pipeline activo

Logstash carga todos los `.conf` del directorio pipeline; desactivamos el 10 y activamos el 20 renombrando ficheros.

```bash
mv infra/logstash/pipeline/10-beats-to-es.conf infra/logstash/pipeline/10-beats-to-es.conf.disabled
mv infra/logstash/pipeline/20-rutas-condicionales.conf.disabled infra/logstash/pipeline/20-rutas-condicionales.conf
docker compose -f infra/docker-compose.yml -f infra/docker-compose.logstash.yml restart logstash
sleep 60
```

**Importante:** al terminar el módulo restaura el pipeline 10 (paso 5) — otros labs asumen el pipeline por defecto.

---

### Paso 2 — Forzar tráfico ERROR

El `loggen` ya emite ~10 % ERROR. No necesitas simular caída — solo esperar ingesta.

```bash
curl -fsS 'http://localhost:9200/filebeat-errors-*/_count' 2>/dev/null || echo "count 0 (aún)"
sleep 90
curl -fsS 'http://localhost:9200/filebeat-errors-*/_count'
curl -fsS 'http://localhost:9200/filebeat-*/_count'
```

Salida esperada: ambos contadores > 0. El stream de errores debería crecer más lento que el general (solo ERROR).

| Stream | Contenido esperado | ILM futuro (M06) |
|--------|-------------------|------------------|
| `filebeat-*` | INFO, WARN, 200, 404… | Retención estándar |
| `filebeat-errors-*` | ERROR, 5xx | Retención corta o alertas dedicadas |

---

### Paso 3 — Discover en dos data views

Crea o usa dos data views — evita mezclar en uno solo si quieres RBAC distinto (M09):

- `filebeat-*` — tráfico general
- `filebeat-errors-*` — solo severidad alta (`log.level : "ERROR"` si existe)

Filtro común: `log_source : "demo-app"`.

**Comprueba manualmente:** abre un doc de cada stream y verifica que ERROR no aparece masivamente en `filebeat-*` (puede haber lag de unos segundos).

---

### Paso 4 — Romper y reparar

Repite el patrón M01-03: Logstash caído = ingesta parada aunque ES esté green.

```bash
docker stop lab-logstash
sleep 20
curl -fsS 'http://localhost:9200/filebeat-*/_count'  # no sube
docker start lab-logstash
```

Anota cuánto tardó Filebeat en reconectar (`docker logs lab-filebeat --tail 10`).

---

### Paso 5 — Restaurar pipeline por defecto (para otros módulos)

```bash
mv infra/logstash/pipeline/20-rutas-condicionales.conf infra/logstash/pipeline/20-rutas-condicionales.conf.disabled
mv infra/logstash/pipeline/10-beats-to-es.conf.disabled infra/logstash/pipeline/10-beats-to-es.conf
docker compose -f infra/docker-compose.yml -f infra/docker-compose.logstash.yml restart logstash
```

Sin este paso, M05+ pueden ver streams inesperados o doble enrutado.

---

## Validación

- [ ] `filebeat-errors-*` recibe solo errores (muestreo manual OK).
- [ ] Recuperación tras parar Logstash documentada.
- [ ] Pipeline 10 restaurado en disco y contenedor reiniciado.

---

## Antes de seguir

### Pon el foco en

- Enrutar por severidad facilita **retención ILM** distinta (M06) y alertas (M08).
- Demasiados data streams complican gobierno; usa criterio de negocio (legal, equipo, criticidad).

### Reto

¿Cómo enviarías WARN a un tercer stream sin duplicar todo el bloque `output`?

<details>
<summary>Ver respuestas</summary>

Opciones habituales:

1. **`else if` en Logstash** — un solo `output { elasticsearch { ... } }` con condiciones encadenadas por nivel (`ERROR` → stream A, `WARN` → stream B, default → stream C).
2. **`mutate` + tags** en filter y un output condicionado por tag (`if "warn_route" in [tags]`).
3. **Pipeline ingest** con `reroute` processor (8.x) hacia distinto data stream según campo `log.level`.

Evita copiar/pegar bloques `elasticsearch` completos; varía solo `data_stream_dataset` o el destino.

</details>
