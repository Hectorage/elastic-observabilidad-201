# Laboratorio M01-01 — Arranque del stack y flujo completo en vivo

[▲ Módulo M01](README.md) · [Siguiente página →](M01-02-eventos-data-streams-campos.md)

> ⏱️ ~40 min · 🧩 Requisitos: fork del repo + Codespace con Docker · 🖥️ Terminal + navegador (Kibana)

**Objetivo:** levantar el stack de demostración del curso y **seguir un evento real** desde que se genera hasta que lo ves en Kibana, para entender el flujo recolectar → almacenar → visualizar con herramientas en marcha.

> Este ejercicio es 100 % operativo. La arquitectura se nombra **después** de verla funcionar, no antes.

---

### Paso 1 — Fork y Codespace

1. Haz **fork** del repositorio del curso en GitHub.
2. Abre un **Codespace** desde tu fork.
3. En la terminal del Codespace, confirma la raíz del repo:

```bash
pwd
ls labs infra scripts
```

---

### Paso 2 — Preparar el entorno Docker

```bash
cd infra
cp --update=none .env.example .env
grep STACK_VERSION .env
cd ..
docker --version
docker compose version
```

Salida esperada: `STACK_VERSION=8.17.2` y Docker Compose v2.

---

### Paso 3 — Levantar el stack de demostración (preconstruido)

El repo incluye Elasticsearch, Kibana, un generador de logs (`loggen`), Filebeat, Metricbeat y Auditbeat en `infra/docker-compose.yml`. Referencia: [docs/componentes/](../../docs/componentes/README.md).

`loggen`, Filebeat, Metricbeat y Auditbeat están en el perfil compose **`beats`**. Sin ese flag solo arrancan Elasticsearch y Kibana; los pasos 6–7 **no funcionarán** (no existirá `app.log` ni el contenedor `lab-filebeat`).

```bash
docker compose -f infra/docker-compose.yml --profile beats up -d
docker compose -f infra/docker-compose.yml --profile beats ps
```

Espera 2–3 minutos la primera vez. Salida esperada en `ps` (6 contenedores):

```text
lab-elasticsearch   Up (healthy)
lab-kibana          Up
lab-loggen          Up
lab-filebeat        Up
lab-metricbeat      Up
lab-auditbeat       Up
```

Comprueba que `loggen` ya creó el fichero de log (no viene en el repo; lo genera el contenedor al arrancar):

```bash
ls -la infra/samples/logs/app.log
tail -2 infra/samples/logs/app.log
```

Si `app.log` no existe o faltan contenedores `lab-loggen` / `lab-filebeat`, no sigas: revisa que el comando `up` incluía **`--profile beats`** y vuelve a ejecutarlo. Si algo falla: [TROUBLESHOOTING](../TROUBLESHOOTING.md).

---

### Paso 4 — Checklist rápido

```bash
./scripts/health-check.sh
```

Debes ver `status: green` o `yellow`, contenedores `lab-loggen` y `lab-filebeat` en la sección Docker, y contadores `filebeat-*` > 0 tras un minuto.

---

### Paso 5 — Ver el almacén: Elasticsearch responde

```bash
curl -fsS 'http://localhost:9200/_cluster/health?pretty' | grep -E 'cluster_name|status|number_of_nodes'
curl -fsS 'http://localhost:9200/filebeat-*/_count'
docker compose -f infra/docker-compose.yml --profile beats ps loggen filebeat
```

Anota el `count` de Filebeat; lo usarás en el paso 7. Si `_count` es 0, espera 30–60 s (Filebeat arranca tras Elasticsearch healthy) y repite. Si sigue en 0, revisa `docker logs lab-filebeat`.

---

### Paso 6 — Seguir UN evento en la terminal (recolectar → almacenar)

> Requisito: pasos 3–5 con **`--profile beats`**. `lab-loggen` y `lab-filebeat` deben estar `Up` y `infra/samples/logs/app.log` debe existir.

**6a — Origen:** el contenedor `lab-loggen` escribe líneas en ese fichero (creado al arrancar loggen, no versionado en Git):

```bash
tail -3 infra/samples/logs/app.log
```

Copia mentalmente la última línea (nivel `INFO`, `WARN` o `ERROR`, `path=...`, `status=...`).

**6b — Agente:** Filebeat lee ese fichero y envía JSON a Elasticsearch:

```bash
docker logs lab-filebeat --tail 5
```

Busca una línea sin error de conexión (publish/events OK). Si el contenedor no existe, vuelve al paso 3 y confirma `--profile beats`.

**6c — Almacén:** recupera el último documento indexado:

```bash
curl -fsS 'http://localhost:9200/filebeat-*/_search?size=1&sort=@timestamp:desc&pretty'
```

En `_source.message` deberías reconocer el mismo texto (o muy similar) que viste en `app.log`. Eso es el flujo **fichero → Beat → Elasticsearch**.

---

### Paso 7 — Ver el mismo flujo en Kibana (visualizar)

1. En Codespaces, abre el puerto **5601** (pestaña *Ports* → globo).
2. Menú ☰ → **Analytics** → **Discover**.
3. Crea o selecciona un data view `filebeat-*` con campo de tiempo `@timestamp`.
4. Filtra (KQL): `log.source : "demo-app"`.
5. Abre el documento más reciente y localiza `message`, `host.name`, `agent.type`.

Comprueba que el contador de documentos en Discover crece: espera 30 s y pulsa refrescar (o vuelve a ejecutar `_count` en terminal).

---

### Paso 8 — Etiquetar lo que acabas de hacer (mapa de arquitectura)

Sin teoría previa: relaciona lo vivido con el diagrama del curso:

```text
 [loggen → app.log]  →  [Filebeat]  →  [Elasticsearch :9200]  ←  [Kibana :5601]
        fuente              recolectar        almacenar              visualizar
```

| Lo que hiciste | Componente | Puerto / recurso |
|----------------|------------|------------------|
| `tail app.log` | Fuente de datos | Fichero en `infra/samples/logs/` |
| `docker logs lab-filebeat` | Filebeat (Beat) | Envía a `http://elasticsearch:9200` |
| `curl .../_search` | Elasticsearch | API `localhost:9200` |
| Discover en navegador | Kibana | UI `localhost:5601` |

Logstash y las alertas llegan en **M04** y **M08**; aquí el Beat envía **directo** a Elasticsearch (caso más simple del curso).

Para profundizar en componentes: [docs/componentes/](../../docs/componentes/README.md) · [The Elastic Stack](https://www.elastic.co/docs/get-started/the-stack) · [Observability overview](https://www.elastic.co/docs/solutions/observability).

---

## Validación

- [ ] El stack está `Up` y `health-check.sh` termina sin error en Elasticsearch.
- [ ] `filebeat-*/_count` aumenta entre dos lecturas separadas 30 s.
- [ ] En Discover ves eventos `demo-app` con `message` reconocible respecto a `app.log`.
- [ ] Puedes nombrar en orden: fuente → Beat → Elasticsearch → Kibana.

---

## Antes de seguir

### Pon el foco en

- Has **visto** el flujo; el mapa es una etiqueta de lo operado, no un ejercicio de lectura.
- Kibana no recibe ficheros: solo consulta lo que Elasticsearch ya indexó.
- `localhost:9200` es tu nodo desde el Codespace; dentro de contenedores el host es `elasticsearch`.

### Reto (tómate tu tiempo)

1. Para `lab-filebeat` con `docker compose stop filebeat`. ¿Qué pasa con `_count` tras 1 minuto? Vuelve a arrancarlo.
2. ¿Por qué Filebeat usa `elasticsearch:9200` y no `localhost:9200` dentro del contenedor?
3. Filtra en Discover solo `message : *ERROR*`. ¿Cuántos eventos ves? (El `loggen` del lab genera ~10 % ERROR.)
4. (Opcional) Lee la sección *Beats* en [The Elastic Stack](https://www.elastic.co/docs/get-started/the-stack) y anota una diferencia con Elastic Agent.
