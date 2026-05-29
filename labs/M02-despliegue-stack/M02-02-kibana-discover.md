# Laboratorio M02-02 — Añadir la capa de visualización (Kibana)

[← Página anterior](M02-01-solo-elasticsearch.md) · [▲ Módulo M02](README.md) · [Siguiente página →](M02-03-filebeat-ingesta-viva.md)

> ⏱️ ~30 min · 🧩 Requisitos: M02-01 (Elasticsearch healthy + `lab-smoke`) · 🖥️ Terminal + navegador

**Objetivo:** levantar **Kibana** sobre el nodo que ya tienes y ver en Discover el documento `lab-smoke` que indexaste solo con `curl`.

> Compruebas que Kibana **no almacena** datos: solo consulta lo que ya está en Elasticsearch.

---

### Paso 1 — Arrancar Kibana sobre ES existente

Con Elasticsearch aún en marcha:

```bash
docker compose -f infra/docker-compose.yml up -d kibana
docker compose -f infra/docker-compose.yml ps
```

Debes ver `lab-elasticsearch` **healthy** y `lab-kibana` **Up** (Kibana tarda 60–90 s en estar listo).

---

### Paso 2 — API de estado antes de abrir el navegador

```bash
curl -fsS http://localhost:5601/api/status 2>/dev/null | head -c 400; echo
```

Repite cada 20 s hasta ver `available` o similar en el JSON.

---

### Paso 3 — Abrir Discover y encontrar `lab-smoke`

1. Codespaces → **Ports** → abrir **5601**.
2. ☰ → **Analytics** → **Discover**.
3. Crear data view **`lab-smoke`** con campo de tiempo `@timestamp`.
4. Ampliar el time picker a **Last 1 year** (el smoke tiene fecha fija).
5. Filtro KQL: `course.exercise : "M02-01"`.

Debes ver el documento del paso 4 de M02-01. Si no aparece:

```bash
curl -fsS 'http://localhost:9200/lab-smoke/_search?pretty'
```

Si `curl` sí lo ve y Discover no → problema de data view o rango de tiempo, no de ES.

---

### Paso 4 — Stack Management: el índice físico

☰ → **Management** → **Stack Management** → **Index Management**.

Confirma el índice `lab-smoke` con al menos 1 documento.

---

### Paso 5 — Cortar Elasticsearch y observar Kibana

```bash
docker compose -f infra/docker-compose.yml stop elasticsearch
```

Refresca Discover o vuelve a cargar Kibana: deberías ver errores o datos no actualizables.

```bash
docker compose -f infra/docker-compose.yml start elasticsearch
```

Tras `healthy`, Discover vuelve a funcionar. **Kibana depende de ES; nunca al revés.**

---

## Validación

- [ ] Discover muestra el documento `M02-01` en `lab-smoke`.
- [ ] Index Management lista `lab-smoke`.
- [ ] Sin ES, Kibana deja de ser útil (lo comprobaste en el paso 5).

---

## Antes de seguir

### Pon el foco en

- Data view = nombre lógico (`lab-smoke`) sobre un índice real.
- `ELASTICSEARCH_HOSTS=http://elasticsearch:9200` en el compose (DNS interno).
- Sin security, cualquiera con el puerto 5601 ve los datos (M09 lo endurecerá).

### Reto (tómate tu tiempo)

1. `docker logs lab-kibana --tail 20` — localiza conexión al cluster.
2. ¿Qué tres cosas mirarías si la UI carga pero Discover está vacío?
3. (Opcional) [Discover](https://www.elastic.co/docs/explore-analyze/discover)
