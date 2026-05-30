# Laboratorio M06-04 — Observar fase delete (lab acelerado)

[▲ Módulo M06](README.md) · [← Anterior](M06-03-snapshot-repositorio.md) · [Siguiente módulo →](../M07-enriquecimiento-eventos/M07-01-grok-access-logs.md)

> ⏱️ ~35 min · ⏳ Espera ~5–10 min

**Objetivo:** ver cómo ILM mueve y **borra** índices con `min_age` corto del script de lab.

---

### Paso 1 — Estado ILM

```bash
curl -fsS 'http://localhost:9200/_cat/indices/lab-ilm-demo*?v'
curl -fsS 'http://localhost:9200/lab-ilm-demo-*/_ilm/explain?pretty' | grep -E '"phase"|"action"|"step"' | head -20
```

En paralelo puedes refrescar **Index Management** filtrando `lab-ilm-demo` (columna *Lifecycle phase*): [captura de referencia](../../docs/imagenes/kibana/kibana-index-management-ilm-indices.png).

---

### Paso 2 — Esperar fase delete

```bash
# Repite cada 2 min hasta ver índices eliminados o en delete
watch -n 120 'curl -fsS http://localhost:9200/_cat/indices/lab-ilm-demo*?v' 
# Ctrl+C cuando veas cambios
```

En Codespaces, 5–10 min suele bastar según `setup-ilm-lab.sh`.

---

### Paso 3 — Recuperación desde snapshot (opcional)

Si el índice desapareció:

```bash
curl -fsS -X POST 'http://localhost:9200/_snapshot/lab_fs/snap-lab-ilm-1/_restore' \
  -H 'Content-Type: application/json' \
  -d '{"indices":"lab-ilm-demo-*","rename_pattern":"(.+)","rename_replacement":"restored-$1"}'
```

Solo si el snapshot del ejercicio anterior existe.

---

## Validación

- [ ] Viste transición de fase en `_ilm/explain` o desaparición de índices viejos.
- [ ] Tienes snapshot de respaldo del paso M06-03.

---

## Antes de seguir

En producción alarga `min_age`; delete irreversible requiere snapshots y SLAs claros.
