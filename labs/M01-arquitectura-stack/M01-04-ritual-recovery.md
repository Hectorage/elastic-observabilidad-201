# Laboratorio M01-04 — Ritual de arranque y recovery en vivo

[← Página anterior](M01-03-romper-reparar-pipeline.md) · [▲ Módulo M01](README.md) · [Módulo siguiente: M02 — Despliegue →](../M02-despliegue-stack/README.md)

> ⏱️ ~25 min · 🧩 Requisitos: M01-01 a M01-03 · 🖥️ Terminal + Kibana

Repetimos de memoria el ciclo **apagar → levantar → validar → Discover** que usaremos cada jornada del curso, cronometrando cuánto tarda el recovery.

---

### Paso 1 — Apagado completo

El ritual empieza sabiendo **cómo se ve el stack muerto**. `connection refused` en `:9200` confirma que no queda un ES zombie ocupando el puerto — condición previa a un `up` limpio.

```bash
docker compose -f infra/docker-compose.yml --profile beats down
docker compose -f infra/docker-compose.yml ps
curl -fsS http://localhost:9200/ 2>&1 | head -1
```

Salida esperada: `ps` vacío o sin servicios del lab; `curl` falla con *connection refused*.

---

### Paso 2 — Arranque desde cero y cronómetro

Medimos el **tiempo hasta datos útiles**, no solo hasta contenedores `Up`. ES puede estar `healthy` antes de que Filebeat haya enviado el primer bulk; el health-check del repo cruza ambas señales. Ese intervalo es lo que repetiremos al inicio de cada sesión.

```bash
date +%H:%M:%S
docker compose -f infra/docker-compose.yml --profile beats up -d
```

Espera y repite cada 30 s hasta que funcione:

```bash
./scripts/health-check.sh
```

Anotamos la hora en que ves `OK` y el mensaje `filebeat-*` con docs > 0. Ese es nuestro **tiempo de recovery** de referencia.

---

### Paso 3 — Comprobar el flujo en 2 minutos (checklist operativo)

Orden **infra → API → ingesta → UI**. Saltarte un escalón lleva a diagnosticar Kibana cuando el problema es Filebeat, o al revés. Esta tabla es nuestro runbook mínimo de aceptación.

Ejecutamos en orden sin saltarte pasos:

| # | Acción | ¿OK? |
|---|--------|------|
| 1 | `docker compose -f infra/docker-compose.yml ps` → ES `healthy`, Kibana `Up` | |
| 2 | `curl -fsS 'http://localhost:9200/_cluster/health?pretty' \| grep status` | |
| 3 | `curl -fsS 'http://localhost:9200/filebeat-*/_count'` → `count` > 0 y sube al repetir | |
| 4 | Kibana :5601 → Discover `filebeat-*` → filtro `log_source : "demo-app"` | |
| 5 | Último documento con `@timestamp` de los últimos 5 min | |

---

### Paso 4 — Ritual escrito (cópialo en las notas)

Este checklist es el de **arranque del stack**, no el de Git. El fork del paso 1 de M01-01 solo hace falta una vez; en cada sesión trabajamos desde la **raíz del repo** (en Codespace suele ser `/workspaces/<nombre-del-repo>`).

```text
1. cd a la raíz del repo del lab
2. docker compose -f infra/docker-compose.yml --profile beats up -d
3. ./scripts/health-check.sh
4. Kibana :5601 → Discover → filebeat-*
5. curl filebeat-*/_count dos veces (debe subir)
```

Opcional al inicio de una jornada nueva: `git pull` si quieres el material más reciente del curso — no forma parte del ritual de observabilidad.

---

### Paso 5 — Prueba `down` vs `down -v` (solo lectura, no ejecutes `-v` aún)

Distinguimos **parar procesos** de **borrar datos**. El volumen `esdata` sobrevive a `down` — los índices y documentos persisten entre sesiones. `down -v` es reset destructivo; en lab solo cuando quieras empezar de cero.

```bash
docker volume ls | grep esdata
```

`down` sin `-v` **conserva** ese volumen (los índices sobreviven). `down -v` lo borra.

Para cerrar la jornada sin perder datos:

```bash
docker compose -f infra/docker-compose.yml --profile beats down
```

---

## Validación

- [ ] Hemos cronometrado un arranque completo hasta `health-check.sh` OK.
- [ ] La tabla del paso 3 está toda marcada.
- [ ] Tenemos el ritual de 5 pasos con la ruta real de nuestro repo (Codespace o local).
- [ ] Sabemos qué hace `down -v` sin haberlo ejecutado en producción.

---

## Antes de seguir

- M02 desmonta el stack **capa a capa** (solo ES, luego Kibana, luego Beats); ya dominamos el conjunto.
- Este ritual nos ahorra 15–20 min de clase cuando algo se queda colgado.

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

En `~/.bashrc` (ajusta la ruta a la raíz de tu clone del repo):

```bash
alias elab='cd /workspaces/<nombre-repo> && ./scripts/health-check.sh'
```

En local, sustituye por la carpeta donde clonaste el curso.

</details>
