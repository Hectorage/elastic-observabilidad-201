# Laboratorio M02-04 — Operación: romper, diagnosticar, recuperar

[← Página anterior](M02-03-filebeat-ingesta-viva.md) · [▲ Módulo M02](README.md) · [Módulo siguiente: M03 — Recolección →](../M03-recoleccion-beats/README.md)

> ⏱️ ~40 min · 🧩 Requisitos: M02-03 (stack completo) · 🖥️ Terminal + Discover

**Objetivo:** ejecutar escenarios de fallo reales (ES caído, Beat caído, Discover vacío), documentar síntoma → comprobación → acción y recuperar el stack con el ritual de M01-04.

---

### Paso 1 — Estado sano de referencia

```bash
./scripts/health-check.sh
C0=$(curl -fsS 'http://localhost:9200/filebeat-*/_count' | grep -o '"count":[0-9]*' | cut -d: -f2)
echo "baseline count=$C0"
```

---

### Paso 2 — Escenario A: Elasticsearch caído

```bash
docker compose -f infra/docker-compose.yml stop elasticsearch
docker logs lab-filebeat --tail 15
curl -fsS http://localhost:9200/ 2>&1 | head -1
```

Salida esperada en Filebeat: `connection refused` o error de conexión a `elasticsearch:9200`.

Repara:

```bash
docker compose -f infra/docker-compose.yml start elasticsearch
# espera healthy en: docker compose ps elasticsearch
sleep 20
docker logs lab-filebeat --tail 5
C1=$(curl -fsS 'http://localhost:9200/filebeat-*/_count' | grep -o '"count":[0-9]*' | cut -d: -f2)
echo "count tras recovery=$C1"
```

`C1` debe ser > `C0`.

---

### Paso 3 — Escenario B: Discover vacío (checklist real)

Simula olvido del operador: time picker estrecho.

1. En Discover (`filebeat-*`), pon el rango a **Last 15 minutes** si hay pocos eventos.
2. Si no ves nada, ejecuta en terminal:

```bash
curl -fsS 'http://localhost:9200/filebeat-*/_count'
docker compose -f infra/docker-compose.yml ps filebeat
```

3. Si `_count` > 0 y Filebeat `Up` → amplía time picker a **Last 24 hours**.

Rellena tu runbook:

| Síntoma | Comprobación 1 | Comprobación 2 | Acción |
|---------|----------------|----------------|--------|
| Discover vacío | `_count` ¿crece? | ¿`lab-filebeat` Up? | |

Compara con [TROUBLESHOOTING](../TROUBLESHOOTING.md).

---

### Paso 4 — Escenario C: red interna vs localhost

```bash
docker exec lab-filebeat sh -c 'wget -qO- http://elasticsearch:9200/ 2>/dev/null | head -c 80' || \
  docker exec lab-filebeat sh -c 'curl -fsS http://elasticsearch:9200/ | head -c 80'
docker exec lab-filebeat sh -c 'curl -fsS http://localhost:9200/ 2>&1 | head -1' || true
```

Dentro del contenedor **`elasticsearch:9200` funciona**; `localhost:9200` no apunta al nodo ES.

---

### Paso 5 — Recovery completo cronometrado

```bash
docker compose -f infra/docker-compose.yml --profile beats down
date +%H:%M:%S
docker compose -f infra/docker-compose.yml --profile beats up -d
./scripts/health-check.sh
date +%H:%M:%S
```

Anota el tiempo total. Abre Discover y confirma eventos `demo-app` en los últimos 15 min.

---

## Validación

- [ ] Filebeat reconectó tras caída de ES sin reinstalar.
- [ ] Tienes runbook de 3 líneas para “Discover vacío”.
- [ ] Entiendes por qué `localhost` falla dentro del contenedor Beat.
- [ ] Completaste un `down` / `up` con health-check OK.

---

## Antes de seguir

### Pon el foco en

- Orden de arranque: ES → Kibana → Beats.
- Logs del contenedor antes de `pull` o reinstalar imágenes.
- `down -v` borra datos; en lab solo si quieres reset total.

### Reto (tómate tu tiempo)

1. `curl -fsS 'http://localhost:9200/_cat/shards?v' | grep UNASSIGNED` — ¿cuándo lo usarías?
2. Para `lab-filebeat` 2 min: ¿sube `_count`? ¿sigue green el cluster?
3. (Opcional) Baja `ES_JAVA_OPTS` y mide tiempo hasta `healthy` tras reinicio.

<details>
<summary>Ver respuestas</summary>

**1. Shards UNASSIGNED**

Cuando el clúster está **`red`** o sospechas shards primarios/replicas sin asignar tras caída de nodo, disco lleno o corrupción. Complementa con `_cluster/allocation/explain`.

**2. Filebeat parado 2 min**

- **`_count`:** no sube (o se congela).
- **Cluster:** puede seguir **green/yellow** — la salud del clúster no depende de que Filebeat ingiera.

**3. JVM más baja (opcional)**

Con `-Xms512m -Xmx512m` el arranque suele **tardar más** o fallar en hosts justos de RAM; cronometra desde `up` hasta `healthy` en el healthcheck y compara con 768m.

</details>
