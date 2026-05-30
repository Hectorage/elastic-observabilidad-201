# Laboratorio M06-03 — Repositorio de snapshots

[▲ Módulo M06](README.md) · [← Anterior](M06-02-rollover-alias.md) · [Siguiente →](M06-04-fase-delete-lab.md)

> ⏱️ ~40 min

**Objetivo:** registrar repositorio `lab_fs` y tomar un snapshot del índice de prueba.

---

### Paso 1 — Repositorio (path.repo ya configurado en compose)

```bash
curl -fsS -X PUT 'http://localhost:9200/_snapshot/lab_fs' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "fs",
    "settings": {
      "location": "/usr/share/elasticsearch/snapshots",
      "compress": true
    }
  }'
curl -fsS 'http://localhost:9200/_snapshot/lab_fs?pretty'
```

---

### Paso 2 — Crear snapshot

```bash
curl -fsS -X PUT 'http://localhost:9200/_snapshot/lab_fs/snap-lab-ilm-1?wait_for_completion=true' \
  -H 'Content-Type: application/json' \
  -d '{
    "indices": "lab-ilm-demo-*",
    "include_global_state": false
  }'
```

Salida esperada: `"state":"SUCCESS"`.

---

### Paso 3 — Listar snapshots

```bash
curl -fsS 'http://localhost:9200/_snapshot/lab_fs/_all?pretty'
```

Kibana → **Stack Management** → **Snapshot and Restore**:

![Repositorios — `lab_fs` — captura real](../../docs/imagenes/kibana/kibana-snapshot-repositories.png)

![Snapshot `snap-lab-ilm-1` SUCCESS — captura real](../../docs/imagenes/kibana/kibana-snapshots-list.png)

---

### Paso 4 — Restaurar (simulación, no ejecutar en prod)

Lee la respuesta de:

```bash
curl -fsS 'http://localhost:9200/_snapshot/lab_fs/snap-lab-ilm-1?pretty' | head -20
```

Restaurar crearía índices nuevos con sufijo — documentado en doc oficial.

---

## Validación

- [ ] Repositorio `lab_fs` registrado.
- [ ] Snapshot `snap-lab-ilm-1` SUCCESS.
- [ ] Sabes qué índices incluiste.

---

## Antes de seguir

Snapshots ≠ backups de máquina; son copias consistentes a nivel índice ES.
