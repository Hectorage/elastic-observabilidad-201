# Laboratorio M06-03 — Repositorio de snapshots

[▲ Módulo M06](README.md) · [← Anterior](M06-02-rollover-alias.md) · [Siguiente →](M06-04-fase-delete-lab.md)

> ⏱️ ~40 min

**Objetivo:** registrar repositorio `lab_fs` y tomar un snapshot del índice de prueba.

> **Por qué snapshots:** la fase **delete** de ILM borra datos sin preguntar. Los snapshots son la red de seguridad: copia consistente en reposo para recuperar tras borrado accidental, corrupción o auditoría. No sustituyen backup de VM — son backup **a nivel índice Elasticsearch**.

---

### Paso 1 — Repositorio (path.repo ya configurado en compose)

Elasticsearch solo escribe snapshots en rutas declaradas en `path.repo` (en compose: volumen `infra/snapshots`). Registrar el repositorio le dice al clúster **dónde** guardar y con qué compresión.

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

**Producción:** S3, GCS o Azure Blob son habituales; el tipo `fs` es válido solo en labs o nodos con disco compartido. El nombre `lab_fs` es arbitrario — en prod suele incluir entorno (`prod-es-backup`).

---

### Paso 2 — Crear snapshot

Un snapshot captura el estado de los índices listados en el momento de la petición. `include_global_state: false` evita guardar plantillas globales del clúster (útil cuando solo quieres datos de negocio).

```bash
curl -fsS -X PUT 'http://localhost:9200/_snapshot/lab_fs/snap-lab-ilm-1?wait_for_completion=true' \
  -H 'Content-Type: application/json' \
  -d '{
    "indices": "lab-ilm-demo-*",
    "include_global_state": false
  }'
```

Salida esperada: `"state":"SUCCESS"`.

**Cuándo hacer snapshot en operaciones reales**

| Evento | ¿Snapshot? |
|--------|------------|
| Antes de cambio mayor de mapping | Sí |
| Antes de que ILM entre en delete masivo | Sí |
| Cada hora en logs de alta cardinalidad | Política SLM (Snapshot Lifecycle Management) |
| «Por si acaso» sin retención definida | No — define caducidad de snapshots |

---

### Paso 3 — Listar snapshots

```bash
curl -fsS 'http://localhost:9200/_snapshot/lab_fs/_all?pretty'
```

Kibana → **Stack Management** → **Snapshot and Restore**:

![Repositorios — `lab_fs` — captura real](../../docs/imagenes/kibana/kibana-snapshot-repositories.png)

![Snapshot `snap-lab-ilm-1` SUCCESS — captura real](../../docs/imagenes/kibana/kibana-snapshots-list.png)

Comprueba que el snapshot lista **1 índice** y **0 failed shards**. Un snapshot parcial (shards fallidos) no sirve para restore fiable.

---

### Paso 4 — Restaurar (simulación, no ejecutar en prod)

Antes de restaurar en producción siempre: **¿sobrescribo o renombro?** Restaurar sobre índices existentes puede fallar o mezclar datos.

Lee la metadata del snapshot:

```bash
curl -fsS 'http://localhost:9200/_snapshot/lab_fs/snap-lab-ilm-1?pretty' | head -20
```

**Qué implica restore**

- Crea índices **nuevos** a partir de la copia (salvo que fuerces overwrite).
- En M06-04 usarás `rename_pattern` / `rename_replacement` para evitar colisión con `lab-ilm-demo-*` vivos.
- Restore no «deshace» un delete ya ejecutado — **recupera una copia** con otro nombre.

Documentación: [Snapshot and restore](https://www.elastic.co/docs/deploy-manage/tools/snapshot-and-restore).

---

## Validación

- [ ] Repositorio `lab_fs` registrado.
- [ ] Snapshot `snap-lab-ilm-1` SUCCESS.
- [ ] Sabes qué índices incluiste y por qué `include_global_state: false`.

---

## Antes de seguir

Snapshots + ILM delete = modelo maduro: ILM libera disco; snapshots cumplen retención larga o requisitos legales en almacenamiento barato.
