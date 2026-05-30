# Laboratorio M06-02 — Rollover con alias

[▲ Módulo M06](README.md) · [← Anterior](M06-01-politica-ilm-basica.md) · [Siguiente →](M06-03-snapshot-repositorio.md)

> ⏱️ ~40 min · 🧩 Tras `setup-ilm-lab.sh`

**Objetivo:** crear índice inicial con alias write y forzar **rollover**.

---

### Paso 1 — Índice + alias

```bash
curl -fsS -X PUT 'http://localhost:9200/lab-ilm-demo-000001' \
  -H 'Content-Type: application/json' \
  -d '{
    "aliases": {
      "lab-ilm-demo": { "is_write_index": true }
    }
  }'
```

---

### Paso 2 — Indexar documentos

```bash
for i in $(seq 1 50); do
  curl -fsS -X POST 'http://localhost:9200/lab-ilm-demo/_doc' \
    -H 'Content-Type: application/json' \
    -d "{\"message\":\"ilm test $i\",\"@timestamp\":\"$(date -Iseconds)\"}" >/dev/null
done
curl -fsS 'http://localhost:9200/lab-ilm-demo/_count'
```

---

### Paso 3 — Rollover manual

```bash
curl -fsS -X POST 'http://localhost:9200/lab-ilm-demo/_rollover'
curl -fsS 'http://localhost:9200/_cat/indices/lab-ilm-demo*?v'
```

Salida esperada: al menos dos índices `lab-ilm-demo-000001` y `000002`.

En Kibana → **Index Management**, filtra `lab-ilm-demo` para ver los backing indices y la política ILM enlazada:

![Index Management — índices `lab-ilm-demo-*` — captura real](../../docs/imagenes/kibana/kibana-index-management-ilm-indices.png)

---

### Paso 4 — ILM explain

```bash
curl -fsS 'http://localhost:9200/lab-ilm-demo-*/_ilm/explain?pretty' | head -40
```

---

## Validación

- [ ] Dos backing indices tras rollover.
- [ ] `_ilm/explain` muestra fase actual.

---

## Antes de seguir

Data streams hacen rollover automático; el alias write es el patrón clásico equivalente.
