# Laboratorio M01-03 — Romper y reparar el pipeline

[← Página anterior](M01-02-eventos-data-streams-campos.md) · [▲ Módulo M01](README.md) · [Siguiente página →](M01-04-ritual-recovery.md)

> ⏱️ ~30 min · 🧩 Requisitos: M01-01 y M01-02 (stack en marcha) · 🖥️ Terminal + Discover

Vamos a provocar fallos controlados — Beat parado, otra fuente de logs — y **medir el efecto** en `_count` y en Discover. La idea es no confundir «clúster verde» con «observabilidad funcionando»; aquí todo se comprueba con números y pantalla.

---

### Paso 1 — Línea base medible

Todo experimento de fallo necesita un **baseline numérico**. `_count` y eventos recientes en Discover son nuestro termómetro de ingesta; `_cluster/health` es otro indicador distinto. Confundirlos es el error clásico del operador junior.

```bash
./scripts/health-check.sh
COUNT1=$(curl -fsS 'http://localhost:9200/filebeat-*/_count' | grep -o '"count":[0-9]*' | cut -d: -f2)
echo "filebeat count inicial: $COUNT1"
```

Anotamos `COUNT1`. En Discover (`filebeat-*`), confirma que ves eventos recientes de `demo-app`.

---

### Paso 2 — Cortar la ingesta (Filebeat parado)

Vemos que un clúster **green/yellow no implica observabilidad activa**. Elasticsearch sigue sirviendo lo ya indexado; Filebeat parado corta el flujo nuevo. `loggen` sigue escribiendo en disco — las líneas se acumulan hasta que reinicies el Beat (comportamiento de buffer en disco de Filebeat).

```bash
docker compose -f infra/docker-compose.yml stop filebeat
sleep 45
COUNT2=$(curl -fsS 'http://localhost:9200/filebeat-*/_count' | grep -o '"count":[0-9]*' | cut -d: -f2)
echo "filebeat count tras parar beat: $COUNT2"
curl -fsS 'http://localhost:9200/_cluster/health?pretty' | grep '"status"'
```

Salida esperada:

- `"status" : "green"` o `"yellow"` (el clúster sigue sano — **solo mide shards ES**, no ingesta).
- `COUNT2` ≈ `COUNT1` (no crece — **cortamos el transporte**, no el almacén).

| Señal | Qué nos dice |
|-------|-------------|
| Cluster green/yellow | ES responde; datos ya indexados siguen consultables |
| `_count` congelado | Ningún bulk nuevo llega desde Filebeat |
| `app.log` sigue creciendo | La fuente (`loggen`) no es el cuello de botella |

En Discover: refresca 30 s — no deberían aparecer líneas nuevas con `@timestamp` reciente.

Repara el pipeline:

```bash
docker compose -f infra/docker-compose.yml start filebeat
sleep 30
COUNT3=$(curl -fsS 'http://localhost:9200/filebeat-*/_count' | grep -o '"count":[0-9]*' | cut -d: -f2)
echo "filebeat count tras reparar: $COUNT3"
```

`COUNT3` debe ser **mayor** que `COUNT2`.

---

### Paso 3 — Segundo origen de logs (sin reiniciar Filebeat)

Un Beat puede vigilar **varios inputs** (ficheros, contenedores, syslog). Añadir `system-lab.log` prueba que la ingesta no depende solo de `loggen` — mismo agente, nueva fuente, mismo data stream si comparten tipo de dato.

```bash
echo "$(date -Iseconds) WARN sshd Failed password for invalid user lab from 203.0.113.50 port 22" \
  >> infra/samples/logs/system-lab.log
sleep 20
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_search?pretty' \
  -d '{"size":1,"query":{"match":{"message":"sshd"}}}'
```

En Discover:

```text
message : *sshd* and message : *lab*
```

Esperamos ver nuestra línea nueva. Mismo Beat, otro fichero en `infra/samples/logs/`.

---

### Paso 4 — ¿Sigue el generador si paras solo loggen?

Separamos **fuente** (quién escribe) de **transporte** (quién envía a ES). Parar `loggen` congela `app.log` pero no tumba Elasticsearch ni Filebeat — síntoma distinto al paso 2. En producción, una app caída se parece a esto: el agente sigue Up pero deja de haber líneas nuevas.

```bash
docker compose -f infra/docker-compose.yml stop loggen
tail -2 infra/samples/logs/app.log
sleep 10
tail -2 infra/samples/logs/app.log
```

El fichero **deja de crecer**. Con Filebeat activo, `_count` también deja de subir (salvo otros logs).

Vuelve a arrancar:

```bash
docker compose -f infra/docker-compose.yml start loggen
```

---

### Paso 5 — Límites del Codespace (datos para M02)

Elasticsearch es **hambriento de heap**. En un Codespace de 8 GB, ES + Kibana + Beats compiten por RAM; OOM del contenedor ES explica arranques lentos o `lab-elasticsearch` en restart loop. M02 ajustará `ES_JAVA_OPTS` con datos, no a ciegas.

```bash
free -h | grep -E 'Mem|available'
docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}' \
  lab-elasticsearch lab-kibana lab-filebeat 2>/dev/null
```

Si Elasticsearch usa casi toda la RAM del contenedor, en M02 bajaremos `ES_JAVA_OPTS` en `infra/.env`.

---

## Validación

- [ ] Con Filebeat parado, `_count` no crece pero `_cluster/health` puede seguir green/yellow.
- [ ] Tras `start filebeat`, `_count` vuelve a subir.
- [ ] El evento `sshd` con `lab` aparece en Discover.
- [ ] Parar `loggen` detiene el crecimiento de `app.log`.

---

## Antes de seguir

- Buen operador = mirar **ingesta** (`_count`, Discover), no solo salud del clúster.
- Un Beat puede leer varios ficheros; varias fuentes, un agente.
- Codespaces tiene techo de RAM: lo medimos con datos reales.

### Reto (tómate tu tiempo)

1. Escribe el síntoma en una frase si solo miras `_cluster/health` y no `_count`.
2. `ss -tlnp | grep 9200` — ¿quién escucha en 9200?
3. Para `lab-kibana` (no Filebeat). ¿Sigue Kibana en el navegador? ¿Sigue Elasticsearch respondiendo?

<details>
<summary>Ver respuestas</summary>

**1. Síntoma en una frase**

«El clúster está green/yellow pero **no entran logs nuevos**» — salud del nodo no implica ingesta activa; hay que mirar `_count` o Discover.

**2. Quién escucha en 9200**

El proceso **Elasticsearch** (contenedor `lab-elasticsearch`), mapeado a `0.0.0.0:9200` en el host. En Codespaces veremos el proxy de Docker o `java` del nodo ES según el SO.

**3. Parar Kibana**

- **Navegador:** Kibana **no carga** o muestra error de conexión (puerto 5601 caído).
- **Elasticsearch:** **`curl localhost:9200/_cluster/health` sigue respondiendo** — ES no depende de Kibana. La ingesta (Filebeat) también puede seguir si está Up.

</details>
