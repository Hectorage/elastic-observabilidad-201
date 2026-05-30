# Laboratorio M02-01 — Montar solo el motor de datos (Elasticsearch)

[▲ Módulo M02](README.md) · [Siguiente página →](M02-02-kibana-discover.md)

> ⏱️ ~35 min · 🧩 Requisitos: M01 completado · 🖥️ Terminal

**Objetivo:** aislar **Elasticsearch** del resto del stack, validar su API y indexar un documento de prueba que persistirá en el volumen Docker.

> En M01 viste todo junto; aquí construyes **solo la capa de almacenamiento** y compruebas que funciona sin Kibana ni Beats.

---

### Paso 1 — Apagar el stack completo y revisar la definición

```bash
docker compose -f infra/docker-compose.yml --profile beats down
sed -n '5,30p' infra/docker-compose.yml
grep -E 'STACK_VERSION|ES_JAVA' infra/.env
```

Confirma `discovery.type=single-node` y `xpack.security.enabled=false`.

---

### Paso 2 — Levantar solo Elasticsearch

```bash
docker compose -f infra/docker-compose.yml up -d elasticsearch
docker compose -f infra/docker-compose.yml ps elasticsearch
```

Salida esperada (1–3 min):

```text
lab-elasticsearch   Up (healthy)   0.0.0.0:9200->9200/tcp
```

---

### Paso 3 — Hablar con el clúster (API)

```bash
curl -fsS http://localhost:9200/ | grep -E 'number|cluster_name|version'
curl -fsS 'http://localhost:9200/_cluster/health?pretty' | grep -E 'cluster_name|status|number_of_nodes|unassigned'
curl -fsS 'http://localhost:9200/_cat/nodes?v&h=name,heap.percent,ram.percent,cpu'
```

Anota `cluster_name` (`lab-observability`) y `status` (`green` o `yellow`).

---

### Paso 4 — Indexar y recuperar un documento (sin Kibana)

```bash
curl -fsS -X POST 'http://localhost:9200/lab-smoke/_doc' \
  -H 'Content-Type: application/json' \
  -d '{"@timestamp":"2026-05-29T12:00:00Z","message":"smoke test M02-01","course":{"exercise":"M02-01"}}'
curl -fsS 'http://localhost:9200/lab-smoke/_search?pretty'
curl -fsS 'http://localhost:9200/_cat/indices/lab-smoke?v'
```

Salida esperada: `hits.total.value` ≥ 1; fila `lab-smoke` en `_cat/indices`.

Has demostrado que **Elasticsearch almacena y devuelve JSON** sin ninguna UI.

---

### Paso 5 — Persistencia del volumen (prueba en vivo)

```bash
docker compose -f infra/docker-compose.yml stop elasticsearch
docker compose -f infra/docker-compose.yml start elasticsearch
# espera healthy
curl -fsS 'http://localhost:9200/lab-smoke/_count'
```

Salida esperada: `{"count":1,...}` — el documento **sobrevive** al reinicio del contenedor (volumen `esdata`).

---

### Paso 6 — Si no arranca (solo entonces)

```bash
docker logs lab-elasticsearch --tail 40
```

OOM → baja `ES_JAVA_OPTS` en `infra/.env` a `-Xms512m -Xmx512m` y:

```bash
docker compose -f infra/docker-compose.yml up -d --force-recreate elasticsearch
```

Más casos: [TROUBLESHOOTING](../TROUBLESHOOTING.md).

---

## Validación

- [ ] Solo `lab-elasticsearch` está `Up (healthy)`.
- [ ] `lab-smoke` existe y `_search` devuelve tu documento.
- [ ] Tras stop/start del contenedor, `_count` sigue siendo 1.

---

## Antes de seguir

### Pon el foco en

- Puerto **9200** = contrato del nodo; todo Beat/Kibana hablará con esta API.
- `yellow` en nodo único suele ser normal; `red` = parar y mirar shards.
- Sin Elasticsearch, no hay observabilidad aunque tengas agentes instalados.

### Reto (tómate tu tiempo)

1. `GET /` — ¿qué versión del stack imprime?
2. Borra el contenedor sin `-v` y vuelve a crearlo: ¿sigue `lab-smoke`? (`docker compose up -d --force-recreate elasticsearch`)
3. (Opcional) Doc: [The Elastic Stack — Elasticsearch](https://www.elastic.co/docs/get-started/the-stack)

<details>
<summary>Ver respuestas</summary>

**1. Versión en `GET /`**

```bash
curl -fsS http://localhost:9200/ | grep number
```

Debe coincidir con `STACK_VERSION` del `.env` (p. ej. **8.17.2**).

**2. Recrear contenedor sin `-v`**

**Sí**, `lab-smoke` sigue existiendo: los datos viven en el volumen **`esdata`**, no en el contenedor. `docker compose up -d --force-recreate elasticsearch` solo recrea el proceso; el volumen persiste.

**3. Elasticsearch en el stack (opcional)**

Nodo de almacenamiento y búsqueda; recibe bulk, indexa documentos y sirve consultas. Kibana y Beats son clientes de su API `:9200`.

</details>
