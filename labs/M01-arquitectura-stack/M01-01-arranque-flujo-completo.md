# Laboratorio M01-01 — Arranque del stack y flujo completo en vivo

[▲ Módulo M01](README.md) · [Siguiente página →](M01-02-eventos-data-streams-campos.md)

> ⏱️ ~40 min · 🧩 Requisitos: fork del repo + Codespace con Docker · 🖥️ Terminal + navegador (Kibana)

Vamos a levantar el stack de demostración del curso y **seguir un evento real** desde que se genera hasta que lo vemos en Kibana — recolectar → almacenar → visualizar, con todo en marcha. Primero lo vemos funcionar; los nombres de la arquitectura llegan después.

---

### Paso 1 — Fork y Codespace

Todo el curso vive en un entorno reproducible (Docker + scripts del repo). El fork nos da una copia editable; el Codespace evita instalar Elastic en la máquina local y unifica puertos, RAM y versión del stack entre alumnos.

1. Haz **fork** del repositorio del curso en GitHub.
2. Abre un **Codespace** desde el fork.
3. En la terminal del Codespace, confirma la raíz del repo:

```bash
pwd
ls labs infra scripts
```

---

### Paso 2 — Preparar el entorno Docker

Antes de levantar contenedores, confirmamos que la **versión del stack** y el runtime están alineados con el material. `STACK_VERSION` en `.env` fija la imagen de Elasticsearch, Kibana y Beats; un desajuste aquí produce errores de API o de mapping difíciles de diagnosticar más adelante.

El `.env` no se versiona con secretos reales — solo parámetros de lab (`STACK_VERSION`, `ES_JAVA_OPTS`). Copiarlo desde `.env.example` es el contrato mínimo entre repo y el entorno del lab.

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

No montamos la arquitectura pieza a piece todavía — levantamos el **circuito completo** para ver datos moverse. Eso fija una referencia mental: cuando algo falle en M02–M04, sabremos cómo se ve «cuando funciona».

El repo incluye Elasticsearch, Kibana, un generador de logs (`loggen`), Filebeat, Metricbeat y Auditbeat en `infra/docker-compose.yml`. Referencia: [docs/componentes/](../../docs/componentes/README.md).

`loggen`, Filebeat, Metricbeat y Auditbeat están en el perfil compose **`beats`**. Docker Compose solo arranca servicios del perfil que indicas: sin `--profile beats` solo suben Elasticsearch y Kibana. Los pasos 6–7 **no funcionarán** (no existirá `app.log` ni el contenedor `lab-filebeat`). Es el error más frecuente en la primera sesión — anótalo.

En producción la fuente sería la aplicación; aquí `loggen` escribe líneas periódicas en un volumen compartido con Filebeat. El patrón es el mismo: **texto en disco → agente → bulk HTTP a ES**.

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

Comprobamos que `loggen` ya creó el fichero de log (no viene en el repo; lo genera el contenedor al arrancar):

```bash
ls -la infra/samples/logs/app.log
tail -2 infra/samples/logs/app.log
```

Si `app.log` no existe o faltan contenedores `lab-loggen` / `lab-filebeat`, no sigas: revisa que el comando `up` incluía **`--profile beats`** y vuelve a ejecutarlo. Si algo falla: [TROUBLESHOOTING](../TROUBLESHOOTING.md).

---

### Paso 4 — Checklist rápido

`_cluster/health` solo dice si Elasticsearch **puede servir datos**; no garantiza que Filebeat esté enviando. El script condensa varias comprobaciones que repetiremos cada jornada — conviene acostumbrarse a leer su salida entera, no solo la última línea.

```bash
./scripts/health-check.sh
```

Esperamos ver `status: green` o `yellow`, contenedores `lab-loggen` y `lab-filebeat` en la sección Docker, y contadores `filebeat-*` > 0 tras un minuto.

| Señal en el script | Qué confirma |
|--------------------|--------------|
| `status: green/yellow` | Nodo ES responde; primarios asignados |
| `lab-filebeat` Up | Agente de ingesta en marcha |
| `filebeat-*` count > 0 | Al menos un bulk llegó a ES (pipeline vivo) |

`yellow` en nodo único con réplicas por defecto es **esperado** (M02-05 lo explica); no lo tratamos como fallo todavía.

---

### Paso 5 — Ver el almacén: Elasticsearch responde

Kibana llegará en el paso 7; aquí hablamos **directamente con el motor de datos** vía REST. Todo Beat y toda UI son clientes de `:9200`. Si `_count` sube, la ingesta funciona independientemente de si Discover está configurado.

```bash
curl -fsS 'http://localhost:9200/_cluster/health?pretty' | grep -E 'cluster_name|status|number_of_nodes'
curl -fsS 'http://localhost:9200/filebeat-*/_count'
docker compose -f infra/docker-compose.yml --profile beats ps loggen filebeat
```

Anotamos el `count` de Filebeat; lo usaremos en el paso 7. Si `_count` es 0, espera 30–60 s (Filebeat arranca tras Elasticsearch healthy) y repite. Si sigue en 0, revisa `docker logs lab-filebeat`.

---

### Paso 6 — Seguir UN evento en la terminal (recolectar → almacenar)

Correlacionamos **la misma línea** en tres puntos del pipeline (fichero → logs del Beat → `_search`). Esa trazabilidad es la base del troubleshooting: sin ella solo vemos «no hay datos» sin saber en qué tramo se cortó. Necesitamos los pasos 3–5 con **`--profile beats`**: `lab-loggen` y `lab-filebeat` en `Up`, y `infra/samples/logs/app.log` existente.

**6a — Origen:** el contenedor `lab-loggen` escribe líneas en ese fichero (creado al arrancar loggen, no versionado en Git). Filebeat hace *tail* del inode; no necesita reinicio cuando el fichero crece:

```bash
tail -3 infra/samples/logs/app.log
```

Copiamos mentalmente la última línea (nivel `INFO`, `WARN` o `ERROR`, `path=...`, `status=...`).

**6b — Agente:** Filebeat lee ese fichero, envuelve cada línea en un documento JSON (campos ECS + `message`) y lo manda en **bulk** a Elasticsearch:

```bash
docker logs lab-filebeat --tail 5
```

Busca actividad de publicación sin `connection refused` ni `events were dropped`. Un `dropped` suele indicar mapping conflict (p. ej. campo mal nombrado) — lo veremos en M01-02 con `log.source` vs `log_source`. Si el contenedor no existe, vuelve al paso 3 y confirma `--profile beats`.

**6c — Almacén:** recupera el último documento indexado. `_search` con `sort=@timestamp:desc` devuelve lo más reciente; compara `_source.message` con lo que vimos en `tail`:

```bash
curl -fsS 'http://localhost:9200/filebeat-*/_search?size=1&sort=@timestamp:desc&pretty'
```

En `_source.message` deberíamos reconocer el mismo texto (o muy similar) que vimos en `app.log`. Eso es el flujo **fichero → Beat → Elasticsearch**.

---

### Paso 7 — Ver el mismo flujo en Kibana (visualizar)

Elasticsearch ya tiene los documentos; Kibana **no ingiere nada** — traduce consultas a la API de ES y las presenta. Si el paso 6 funcionó pero Discover está vacío, el fallo casi siempre está en **data view**, **campo de tiempo** o **rango temporal**, no en el pipeline.

Guía detallada con capturas reales del stack: [docs/guia-kibana-discover-data-view.md](../../docs/guia-kibana-discover-data-view.md) · [catálogo de imágenes](../../docs/imagenes/README.md).

**7a — Comprobar Kibana y datos**

```bash
curl -fsS http://localhost:5601/api/status 2>/dev/null | head -c 200; echo
curl -fsS 'http://localhost:9200/filebeat-*/_count'
```

**7b — Abrir la UI**

1. Codespaces → pestaña **Ports** → puerto **5601** → **Open in Browser** (globo).
2. Si ves *Connecting to the forwarded port…*, espera 30–60 s y recarga.

**7c — Ir a Discover**

1. Menú **☰** (arriba izquierda) → **Analytics** → **Discover**.

**7d — Crear el data view** (primera vez)

Un **data view** es la capa lógica entre la UI y los índices físicos: patrón (`filebeat-*`), campo de tiempo (`@timestamp`) y metadatos de campos. Discover **filtra por tiempo antes de pintar filas** — por eso un data view mal configurado muestra cero resultados aunque `_count` sea alto.

1. Clic en **Create data view** / *Crear data view* (si ya hay data views, usa el desplegable arriba a la izquierda → **Create data view**).
2. Rellena:

   | Campo | Valor |
   |-------|-------|
   | Index pattern | `filebeat-*` |
   | Timestamp field | `@timestamp` |

3. **Save data view to Kibana**.

   ![Create data view — captura real del stack 8.17.2](../../docs/imagenes/kibana/kibana-crear-data-view.png)

   Si no aparece `@timestamp` o el patrón no coincide con ningún índice, vuelve al paso 5: Filebeat aún no ha indexado.

**7e — Ver los eventos de loggen**

El `loggen` etiqueta cada línea con `demo-app` vía campo custom `log_source` (configurado en Filebeat). Filtrar por ese campo separa tráfico de demo del resto; filtrar por `message` es fallback cuando el campo estructurado no existe o no está parseado (tema de M04).

1. **Time picker** (arriba): **Last 15 minutes** o **Last 1 hour** (los logs son recientes; un rango vacío o muy antiguo deja la tabla en blanco).
2. Barra KQL: `log_source : "demo-app"` → Enter.  
   Si no devuelve nada, prueba sin filtro y luego `message : *demo-app*` (el texto siempre va en `message`).
3. Con el filtro aplicado, abre un documento y localiza `message`, `log_source`, `host.name`, `agent.type`:

   - Clic en **`>`** a la izquierda de una fila (el detalle se abre **debajo** de la fila, no siempre hay panel derecho).
   - O en la barra **izquierda** (*Available fields*): añade `host.name` y `agent.type` con **`+`** como columnas.

   ![Discover con eventos `demo-app` — captura real](../../docs/imagenes/kibana/kibana-discover-con-eventos.png)

**7f — Confirmar que el flujo sigue vivo**

Observabilidad implica **series temporales continuas**, no una foto estática. Espera 30 s → **Refresh** en Discover (o repite `_count` en terminal). Si el histograma se desplaza y el contador sube, tenemos ingesta en tiempo casi real — condición necesaria para alertas (M08) y dashboards (M05).

---

### Paso 8 — Etiquetar lo que acabamos de hacer (mapa de arquitectura)

Nombrar componentes **después** de operarlos fija el vocabulario en experiencia, no en slides. Cuando en M04 insertemos Logstash en el medio, sabremos exactamente qué tramo del diagrama estamos modificando.

Relaciona lo vivido con el diagrama del curso:

```text
 [loggen → app.log]  →  [Filebeat]  →  [Elasticsearch :9200]  ←  [Kibana :5601]
        fuente              recolectar        almacenar              visualizar
```

| Lo que hicimos | Componente | Puerto / recurso |
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
- [ ] En Discover vemos eventos `demo-app` con `message` reconocible respecto a `app.log`.
- [ ] Podemos nombrar en orden: fuente → Beat → Elasticsearch → Kibana.

---

## Antes de seguir

- Hemos **visto** el flujo; el mapa es una etiqueta de lo operado, no un ejercicio de lectura.
- Kibana no recibe ficheros: solo consulta lo que Elasticsearch ya indexó.
- `localhost:9200` es el nodo desde el Codespace; dentro de contenedores el host es `elasticsearch`.

### Reto (tómate tu tiempo)

1. Para `lab-filebeat` con `docker compose stop filebeat`. ¿Qué pasa con `_count` tras 1 minuto? Vuelve a arrancarlo.
2. ¿Por qué Filebeat usa `elasticsearch:9200` y no `localhost:9200` dentro del contenedor?
3. Filtra en Discover solo `message : *ERROR*`. ¿Cuántos eventos ves? (El `loggen` del lab genera ~10 % ERROR.)
4. (Opcional) Lee la sección *Beats* en [The Elastic Stack](https://www.elastic.co/docs/get-started/the-stack) y anota una diferencia con Elastic Agent.

<details>
<summary>Ver respuestas</summary>

**1. Parar Filebeat**

`loggen` sigue escribiendo en `app.log`, pero `_count` en `filebeat-*` **deja de crecer** (el valor se congela). Los eventos nuevos se acumulan en disco hasta que vuelves a arrancar Filebeat:

```bash
docker compose -f infra/docker-compose.yml --profile beats stop filebeat
sleep 60
curl -fsS 'http://localhost:9200/filebeat-8.17.2/_count'
docker compose -f infra/docker-compose.yml --profile beats start filebeat
```

Tras el `start`, `_count` vuelve a subir con las líneas pendientes.

**2. `elasticsearch:9200` vs `localhost:9200`**

Dentro del contenedor Filebeat, `localhost` es **el propio contenedor**, no el host ni Elasticsearch. En Docker Compose, `elasticsearch` es el **nombre DNS del servicio** en la red interna; Compose lo resuelve a la IP del contenedor ES. Desde la terminal del Codespace (fuera de contenedores) sí usas `localhost:9200`.

**3. Filtro `message : *ERROR*`**

Aproximadamente **10 %** de los eventos. El script de `loggen` emite ERROR 1 de cada 10 líneas (patrón cíclico 70 % INFO / 20 % WARN / 10 % ERROR). El número exacto depende del rango temporal y de cuánto lleve corriendo loggen.

**4. Beats vs Elastic Agent (opcional)**

**Beats** (Filebeat, Metricbeat, …) son agentes **independientes**, uno por rol, configurados con fichero local. **Elastic Agent** es un agente **unificado** gestionado desde **Fleet** en Kibana (políticas centralizadas, actualizaciones remotas, integraciones empaquetadas). En producción moderna Elastic empuja Agent + Fleet; los Beats siguen siendo válidos en el edge o en labs como este.

</details>
