# Laboratorio M03-04 — Auditoría FIM y correlación de tres familias

[← Página anterior](M03-03-metricbeat-docker-correlacion.md) · [▲ Módulo M03](README.md) · [Fin de la primera capa →](../../README.md) *(M04 en preparación)*

> ⏱️ ~40 min · 🧩 Requisitos: M03-01 a M03-03 · 🖥️ Terminal + Discover (3 data views)

**Objetivo:** generar eventos **Auditbeat** (integridad de ficheros), verlos junto a logs y métricas del mismo `host.name`, y cerrar M03 con el health check de las tres familias.

---

### Paso 1 — Arrancar Auditbeat

```bash
docker compose -f infra/docker-compose.yml --profile beats up -d auditbeat
docker logs lab-auditbeat --tail 20
curl -fsS 'http://localhost:9200/auditbeat-*/_count'
```

Salida esperada: `count` > 0 tras el arranque (scan inicial de `audit-watch`).

---

### Paso 2 — Generar cambios en la carpeta vigilada

```bash
TS=$(date -Iseconds)
echo "change $TS" >> infra/samples/audit-watch/change.log
mv infra/samples/audit-watch/change.log infra/samples/audit-watch/change-renamed.log
rm -f infra/samples/audit-watch/change-renamed.log
sleep 30
```

---

### Paso 3 — Ver eventos FIM en API y Discover

```bash
curl -fsS 'http://localhost:9200/auditbeat-*/_search?pretty' \
  -H 'Content-Type: application/json' \
  -d '{"size":10,"sort":[{"@timestamp":"desc"}],"query":{"wildcard":{"file.path":"*audit-watch*"}}}'
```

Discover (`auditbeat-*`):

```text
file.path : *audit-watch*
```

Anota para un evento reciente:

| Campo | Valor |
|-------|-------|
| `@timestamp` | |
| `event.action` | |
| `file.path` | |
| `host.name` | |

Debes ver acciones tipo `created`, `updated`, `deleted` o equivalentes del módulo file_integrity.

---

### Paso 4 — Correlación guiada (misma línea temporal)

Elige el `@timestamp` del borrado o movimiento del paso 2.

**Logs** (`filebeat-*`), ventana ±2 min, mismo host:

```text
host.name : "<tu-host.name>" 
```

**Métricas** (`metricbeat-*`), misma ventana y host:

```text
host.name : "<tu-host.name>" and event.module : "docker"
```

Redacta una frase operativa:

> “Si alguien sustituyó un binario en `audit-watch`, en logs vería ___ y en métricas ___.”

(No tiene que haber un pico dramático en el lab; el ejercicio es **alinear dimensiones**).

---

### Paso 5 — Simular “incidente” de 3 minutos (opcional avanzado)

En una sola secuencia:

```bash
echo "$(date -Iseconds) ERROR demo-app request_id=incident-1 path=/api/admin status=500" >> infra/samples/logs/app.log
echo "incident marker" >> infra/samples/audit-watch/incident.txt
sleep 25
```

Busca en las tres data views el mismo rango de tiempo:

- `message : *incident-1*`
- `file.path : *incident.txt*`
- métricas del host en esos minutos

---

### Paso 6 — Cierre M03

```bash
./scripts/health-check.sh
curl -fsS 'http://localhost:9200/_cat/indices?v' | grep -E 'filebeat|metricbeat|auditbeat'
```

Salida esperada en health-check: las tres familias con docs > 0.

---

## Validación

- [ ] Eventos FIM con `file.path` bajo `audit-watch`.
- [ ] Correlacionaste por `host.name` y ventana de tiempo en 3 data views.
- [ ] Health check OK con tres familias activas.

---

## Antes de seguir

### Pon el foco en

- En el lab usamos **file_integrity**, no auditd del kernel (limitación de Codespaces).
- Auditoría aquí = trazabilidad de cambios, no certificación legal.
- Correlación = tiempo + dimensiones comunes, no un índice único mágico.

### Reto (tómate tu tiempo)

1. ¿Qué `event.action` viste al borrar el fichero?
2. Campos ECS comunes entre un doc Filebeat y uno Auditbeat (`@timestamp`, `host.name`, `agent.*`).
3. (Opcional) Por qué security (M09) sigue desactivado aunque veamos `sshd` en logs.

<details>
<summary>Ver respuestas</summary>

**1. `event.action` al borrar**

Suele ser **`deleted`** (o `deletion` según versión/campo ECS). También verás eventos `created`, `updated`, `moved` en el ciclo create → rename → delete del paso 2.

**2. Campos ECS comunes**

`@timestamp`, `host.name`, `host.hostname`, `agent.type`, `agent.version`, `agent.name`, `ecs.version` — permiten correlacionar logs, métricas y auditoría en Discover por host y ventana temporal.

**3. Security desactivado (opcional)**

Ver líneas `sshd` en logs **≠** clúster asegurado: no hay TLS, auth ni RBAC (`xpack.security.enabled=false`). M09 activa autenticación y cifrado; aquí solo simulas telemetría de seguridad.

</details>

---

**Siguiente módulo →** [M04-01 — Logstash en el camino](../M04-logstash-pipelines/M04-01-logstash-en-el-camino.md)
