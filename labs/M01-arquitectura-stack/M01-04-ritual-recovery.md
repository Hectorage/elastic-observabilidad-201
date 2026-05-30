# Laboratorio M01-04 — Ritual de arranque y recovery en vivo

[← Página anterior](M01-03-romper-reparar-pipeline.md) · [▲ Módulo M01](README.md) · [Módulo siguiente: M02 — Despliegue →](../M02-despliegue-stack/README.md)

> ⏱️ ~25 min · 🧩 Requisitos: M01-01 a M01-03 · 🖥️ Terminal + Kibana

**Objetivo:** repetir de memoria el ciclo **apagar → levantar → validar → usar Discover** que usarás cada jornada del curso, cronometrando el tiempo de recovery.

---

### Paso 1 — Apagado completo

```bash
docker compose -f infra/docker-compose.yml --profile beats down
docker compose -f infra/docker-compose.yml ps
curl -fsS http://localhost:9200/ 2>&1 | head -1
```

Salida esperada: `ps` vacío o sin servicios del lab; `curl` falla con *connection refused*.

---

### Paso 2 — Arranque desde cero y cronómetro

```bash
date +%H:%M:%S
docker compose -f infra/docker-compose.yml --profile beats up -d
```

Espera y repite cada 30 s hasta que funcione:

```bash
./scripts/health-check.sh
```

Anota la hora en que ves `OK` y el mensaje `filebeat-*` con docs > 0. Ese es tu **tiempo de recovery** de referencia.

---

### Paso 3 — Comprobar el flujo en 2 minutos (checklist operativo)

Ejecuta en orden sin saltarte pasos:

| # | Acción | ¿OK? |
|---|--------|------|
| 1 | `docker compose -f infra/docker-compose.yml ps` → ES `healthy`, Kibana `Up` | |
| 2 | `curl -fsS 'http://localhost:9200/_cluster/health?pretty' \| grep status` | |
| 3 | `curl -fsS 'http://localhost:9200/filebeat-*/_count'` → `count` > 0 y sube al repetir | |
| 4 | Kibana :5601 → Discover `filebeat-*` → filtro `log_source : "demo-app"` | |
| 5 | Último documento con `@timestamp` de los últimos 5 min | |

---

### Paso 4 — Ritual escrito (cópialo en tus notas)

```text
1. cd <tu-fork> && git pull
2. docker compose -f infra/docker-compose.yml --profile beats up -d
3. ./scripts/health-check.sh
4. Kibana :5601 → Discover → filebeat-*
5. curl filebeat-*/_count dos veces (debe subir)
```

---

### Paso 5 — Prueba `down` vs `down -v` (solo lectura, no ejecutes `-v` aún)

```bash
docker volume ls | grep esdata
```

`down` sin `-v` **conserva** ese volumen (tus índices sobreviven). `down -v` lo borra.

Para cerrar la jornada sin perder datos:

```bash
docker compose -f infra/docker-compose.yml --profile beats down
```

---

## Validación

- [ ] Has cronometrado un arranque completo hasta `health-check.sh` OK.
- [ ] La tabla del paso 3 está toda marcada.
- [ ] Tienes el ritual de 5 pasos personalizado con tu ruta.
- [ ] Sabes qué hace `down -v` sin haberlo ejecutado en producción.

---

## Antes de seguir

### Pon el foco en

- M02 desmonta el stack **capa a capa** (solo ES, luego Kibana, luego Beats); ya dominas el conjunto.
- Este ritual te ahorra 15–20 min de clase cuando algo se queda colgado.

### Reto (tómate tu tiempo)

1. Si `health-check` falla en Kibana pero ES está green, ¿qué dos comandos lanzas? (`docker logs lab-kibana`, comprobar puerto 5601)
2. Explica en 20 segundos el flujo fuente → Beat → ES → Kibana a un compañero.
3. (Opcional) Crea un alias `elab` que ejecute `health-check.sh` desde la raíz del repo.

<details>
<summary>Ver respuestas</summary>

**1. Kibana falla, ES green**

```bash
docker logs lab-kibana --tail 30
curl -fsS http://localhost:5601/api/status | head -c 300; echo
```

Además comprueba en Codespaces que el puerto **5601** está reenviado (pestaña Ports). ES green no arregla solo la UI.

**2. Flujo en 20 segundos**

«La app escribe logs en disco → Filebeat los lee y manda JSON a Elasticsearch → Kibana consulta ES y te los muestra en Discover. Kibana no guarda logs; solo visualiza.»

**3. Alias opcional**

En `~/.bashrc` (ajusta la ruta a tu fork):

```bash
alias elab='cd ~/elastic-observabilidad-201 && ./scripts/health-check.sh'
```

O con la ruta del Codespace: `/workspaces/<nombre-repo>`.

</details>
