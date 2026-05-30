# Laboratorio M06-02 — Rollover con alias

[▲ Módulo M06](README.md) · [← Anterior](M06-01-politica-ilm-basica.md) · [Siguiente →](M06-03-snapshot-repositorio.md)

> ⏱️ ~40 min · 🧩 Tras `setup-ilm-lab.sh`

**Objetivo:** crear índice inicial con alias write y forzar **rollover**.

> **Idea clave:** las aplicaciones y Beats escriben en un **alias** (`lab-ilm-demo`), no en el índice físico (`lab-ilm-demo-000001`). Cuando ILM hace rollover, el alias apunta al índice nuevo y el viejo envejece por fases sin que el productor cambie configuración.

---

### Paso 1 — Índice + alias

El alias `lab-ilm-demo` con `is_write_index: true` marca cuál backing index recibe documentos nuevos. Es el patrón previo a data streams (conceptualmente equivalente).

```bash
curl -fsS -X PUT 'http://localhost:9200/lab-ilm-demo-000001' \
  -H 'Content-Type: application/json' \
  -d '{
    "aliases": {
      "lab-ilm-demo": { "is_write_index": true }
    }
  }'
```

**Caso de uso:** un servicio de logging que indexa en `logs-checkout` sin saber que detrás hay `logs-checkout-000042`. Operaciones rota índices; desarrollo no toca código.

---

### Paso 2 — Indexar documentos

Generamos carga mínima para que el índice exista y tenga documentos antes del rollover. En producción esta carga sería continua (Filebeat, bulk API, etc.).

```bash
for i in $(seq 1 50); do
  curl -fsS -X POST 'http://localhost:9200/lab-ilm-demo/_doc' \
    -H 'Content-Type: application/json' \
    -d "{\"message\":\"ilm test $i\",\"@timestamp\":\"$(date -Iseconds)\"}" >/dev/null
done
curl -fsS 'http://localhost:9200/lab-ilm-demo/_count'
```

Anota el `_count`. Si indexas siempre por el **alias**, nunca necesitas actualizar el nombre del índice en el cliente.

---

### Paso 3 — Rollover manual

En lab forzamos rollover para no esperar 1 GB. En producción ILM lo dispara solo al cumplir `max_size` o `max_age` de la fase hot.

```bash
curl -fsS -X POST 'http://localhost:9200/lab-ilm-demo/_rollover'
curl -fsS 'http://localhost:9200/_cat/indices/lab-ilm-demo*?v'
```

Salida esperada: al menos dos índices `lab-ilm-demo-000001` y `000002`. El `-000002` debe ser el write index (comprueba en Index Management).

En Kibana → **Index Management**, filtra `lab-ilm-demo` para ver los backing indices y la política ILM enlazada:

![Index Management — índices `lab-ilm-demo-*` — captura real](../../docs/imagenes/kibana/kibana-index-management-ilm-indices.png)

**Qué deberías ver:** columna *Lifecycle policy* = `lab-hot-warm-delete`; un índice en fase hot reciente y otro que empieza a envejecer.

---

### Paso 4 — ILM explain

`_ilm/explain` es la radiografía de ILM: fase actual, acción en curso y errores. Lo usarás en incidentes («¿por qué no borró el índice?»).

```bash
curl -fsS 'http://localhost:9200/lab-ilm-demo-*/_ilm/explain?pretty' | head -40
```

**Campos útiles**

| Campo | Significado |
|-------|-------------|
| `"phase"` | `hot`, `warm` o `delete` |
| `"action"` | p. ej. `rollover`, `shrink`, `delete` |
| `"step"` | sub-paso dentro de la acción |
| `"failed_step"` | si ILM está bloqueado, aquí aparece el motivo |

Compara el índice `000001` (más viejo) con `000002` (write): no tienen por qué estar en la misma fase al mismo tiempo.

---

## Validación

- [ ] Dos backing indices tras rollover.
- [ ] `_ilm/explain` muestra fase y acción por índice.
- [ ] Entiendes por qué el cliente escribe en alias, no en `.ds-*` ni `-00000N`.

---

## Antes de seguir

Los **data streams** de Beats ocultan alias y rollover: Elasticsearch los gestiona igual por detrás. Saber el patrón clásico te ayuda a depurar integraciones y índices legacy en el mismo clúster.
