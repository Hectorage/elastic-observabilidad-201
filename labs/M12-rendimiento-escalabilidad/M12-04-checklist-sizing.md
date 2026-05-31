# Laboratorio M12-04 — Checklist de sizing y cierre del curso

[▲ Módulo M12](README.md) · [← Anterior](M12-03-heap-recursos-jvm.md) · [Fin del curso →](../../README.md)

> ⏱️ ~40 min

**Objetivo:** completar checklist de sizing, repasar pipeline M01–M12 y dejar runbook personal.

> **Cierre operativo:** el curso te dio piezas — sizing real combina volumen (GB/día), retención (ILM), SLA de búsqueda y presupuesto. Este ejercicio fuerza explicitar supuestos antes de un proyecto prod.

---

### Paso 1 — Checklist sizing (rellena)

No hay respuesta única — documenta **tu** entorno lab y extrapola:

| Pregunta | Tu respuesta lab | Pregunta prod que derivarías |
|----------|------------------|------------------------------|
| GB RAM Codespace | | ¿Cuántos nodos data hot? |
| `ES_JAVA_OPTS` | | ¿Heap por nodo vs RAM? |
| Retención logs (ILM lab) | minutos | ¿Días hot/warm/delete legal? |
| Nº shards en `filebeat-*` | | ¿GB/shard objetivo 20–50 GB? |
| ¿Necesitas Kafka? | sí/no + por qué | ¿Picos medidos vs ES headroom? |
| Latencia búsqueda M12-01 | | ¿SLA p95 Discover? |
| Seguridad M09 | desactivada | ¿LDAP/SSO desde día 1? |

---

### Paso 2 — Health check final

```bash
docker compose -f infra/docker-compose.yml --profile beats up -d
./scripts/health-check.sh
```

Si falla algún check, usa [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) — demostrar recovery es parte del cierre.

---

### Paso 3 — Recorrido oral (5 min)

Explica en voz alta el flujo completo — como si onboardaras a un compañero:

1. **Ingesta** — Beats / Fluent Bit / bulk / Kafka buffer (M03, M04, M11)
2. **Procesamiento** — Logstash grok, ingest pipelines, enriquecimiento (M04, M07)
3. **Almacenamiento** — data streams, ILM, snapshots (M01-02, M06)
4. **Visualización y alertas** — Lens, dashboards, rules, Watcher (M05, M08)
5. **Seguridad y self-monitoring** — RBAC, TLS checklist, stack health (M09, M10)
6. **Rendimiento** — profile, bulk, heap (M12)

Señala **un** punto donde perderías datos en tu lab si no actúas (Beat parado, ILM delete sin snapshot, etc.).

---

### Paso 4 — Runbook personal

Copia y adapta en tus notas:

```markdown
## Incidente: no hay logs nuevos
1. docker ps | grep filebeat
2. docker logs lab-filebeat --tail 30
3. curl localhost:9200/_cluster/health
4. curl localhost:9200/filebeat-*/_count  (¿crece?)
5. Kibana Discover — time picker Last 15m, data view filebeat-*
6. labs/TROUBLESHOOTING.md
```

Añade una línea para **«Kibana lenta»** (M12-01 slowlog, heap M12-03).

---

## Validación

- [ ] Checklist sizing completo con columna «prod derivada».
- [ ] Health check OK o incidencia documentada.
- [ ] Runbook de ≥5 pasos escrito.

---

## Cierre del curso

Has recorrido el curso **M01–M12** en **25 h** (5 sesiones × 5 h), formato lab-first. Siguiente paso profesional: proyecto real con SLAs, seguridad desde día 1 y sizing basado en métricas de producción — no en defaults del lab.

### Reto final

Exporta un dashboard NDJSON de M05 o M10 y compártelo con un compañero importándolo en otro fork.

<details>
<summary>Ver respuestas</summary>

**Exportar**

1. Kibana → ☰ → **Management** → **Stack Management** → **Saved Objects**.

   ![Saved Objects — captura real](../../docs/imagenes/kibana/kibana-saved-objects.png)

2. Marca el dashboard (y dependencias si Kibana lo ofrece).
3. **Export** → descarga `.ndjson`.

**Importar en otro fork**

1. Mismo menú → **Import**.
2. Sube el NDJSON; resuelve conflictos (overwrite/rename).
3. Abre el dashboard y comprueba data views e índices existen en el fork destino.

Los saved objects viven en ES; el NDJSON es el «paquete» portable entre entornos de lab.

</details>
