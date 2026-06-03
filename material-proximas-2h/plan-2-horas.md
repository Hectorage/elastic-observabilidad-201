# Plan — próximas 2 horas (M02)

Trabajo en equipo sobre el repo; cada bloque apunta al lab oficial (no lo duplicamos aquí).

**Prerrequisito:** M01 completo. Stack arriba con `--profile beats`.

---

## Si aún no terminamos M02-01 (~35 min extra)

| Min | Actividad | Lab |
|-----|-----------|-----|
| 0–35 | Solo Elasticsearch: API, `lab-smoke`, volumen `esdata` | [M02-01](../labs/M02-despliegue-stack/M02-01-solo-elasticsearch.md) |

Después encadenamos el plan de abajo (quedarán ~85 min → priorizar M02-04 y M02-05 si vamos justos).

---

## Plan estándar (2 h) — M02-02 a M02-05

### 0:00 – 0:10 · Aquecimiento

- `./scripts/health-check.sh` OK.
- Repaso oral (5 min): fuente → Beat → ES `:9200` → Kibana `:5601`.
- Lectura rápida opcional: [conceptos-clave.md](conceptos-clave.md) (data stream vs índice).

**Salida:** todos con `filebeat-*/_count` > 0 y Discover con `demo-app`.

---

### 0:10 – 0:40 · Kibana sobre ES ya montado (30 min)

**Lab:** [M02-02 — Kibana + Discover](../labs/M02-despliegue-stack/M02-02-kibana-discover.md)

| Qué fijamos | Por qué ahora |
|-------------|----------------|
| Kibana **no almacena** logs | Separa incidente de UI vs de ingesta (M02-04) |
| Data view `lab-smoke` + time picker amplio | Error #1: «curl ve datos, Kibana no» |
| Index Management vs Discover | Vista lógica vs índice físico |
| Parar ES → Kibana inútil | Dirección de dependencia |

**Validación del bloque:**

- [ ] Documento `M02-01` visible en Discover (`course.exercise : "M02-01"`).
- [ ] Sin ES, la UI falla o no actualiza.

---

### 0:40 – 1:15 · Ingesta en vivo + dos modelos de datos (35 min)

**Lab:** [M02-03 — Filebeat + loggen](../labs/M02-despliegue-stack/M02-03-filebeat-ingesta-viva.md)

| Qué fijamos | Por qué ahora |
|-------------|----------------|
| Leer `filebeat.yml` antes del `up` | El contrato de paths y campos |
| `_count` sube entre dos lecturas | Ingesta viva, no foto única |
| `lab-smoke` + `filebeat-*` en el mismo clúster | Legacy + data stream conviven |
| Campo `team: platform` solo en eventos nuevos | El histórico indexado no se reescribe |

**Comandos núcleo:**

```bash
C1=$(curl -fsS 'http://localhost:9200/filebeat-*/_count' | grep -o '"count":[0-9]*' | cut -d: -f2)
sleep 30
C2=$(curl -fsS 'http://localhost:9200/filebeat-*/_count' | grep -o '"count":[0-9]*' | cut -d: -f2)
echo "t0=$C1 t+30s=$C2"
```

**Validación del bloque:**

- [ ] `C2` > `C1`.
- [ ] Mismo evento en `app.log` y en `_search`.
- [ ] Discover: `filebeat-*` y `lab-smoke` con time pickers distintos.

---

### 1:15 – 1:55 · Operación: fallos y runbook (40 min)

**Lab:** [M02-04 — Fallos y recovery](../labs/M02-despliegue-stack/M02-04-fallos-y-recovery.md)

| Escenario | Señal que importa |
|-----------|-------------------|
| ES caído | Filebeat: `connection refused`; `_count` congelado |
| Discover vacío | Primero `_count` y Beat `Up`; luego time picker / data view |
| `localhost` dentro del contenedor Beat | Falla; `elasticsearch:9200` funciona |
| Recovery `down` / `up` | Tiempo hasta health-check + `_count` creciendo |

**Runbook mínimo (completar en tabla del lab):**

| Síntoma | Comprobación 1 | Comprobación 2 | Acción |
|---------|----------------|----------------|--------|
| Discover vacío | `_count` ¿sube al repetir curl? | ¿`lab-filebeat` Up? | Ampliar rango temporal o revisar ingesta |

**Validación del bloque:**

- [ ] Tras caída de ES, `_count` vuelve a subir sin reinstalar Filebeat.
- [ ] Explicamos por qué cluster `green` ≠ ingesta activa.

---

### 1:55 – 2:00 · Cierre rápido o arranque M02-05

Si queda tiempo → empezar [M02-05](../labs/M02-despliegue-stack/M02-05-ha-shards-replicas.md) (shards, `yellow` en single-node).

Si no → dejar M02-05 como **tarea** antes de M03 (15–35 min).

**Preguntas de cierre (2 min):**

1. ¿Dónde hacemos `curl` para contar eventos de Filebeat? → **ES :9200**, patrón `filebeat-*`.
2. ¿Por qué el lab puede estar `yellow`? → réplicas sin nodo donde asignarse.
3. ¿Índice o data stream para logs del Beat? → **data stream** (`filebeat-*`).

---

## Después de las 2 h

| Estado | Siguiente paso |
|--------|----------------|
| M02-05 pendiente | Completar HA/shards (~35 min) antes de sesión 2 |
| M02 cerrado | Sesión 2: [M03](../labs/M03-recoleccion-beats/README.md) + [M04](../labs/M04-logstash-pipelines/README.md) |

---

## Ajustes si vamos lentos

1. Acortar M02-02: solo pasos 1–3 + validación Discover.
2. M02-04: escenarios A y B solamente; C y recovery completo en casa.
3. M02-05: solo lectura de [conceptos-clave.md](conceptos-clave.md) + `_cat/shards` (10 min).

## Ajustes si vamos rápidos

1. Completar M02-05 en la misma sesión.
2. Avanzar M03-01 (dos orígenes de logs) si queda >20 min.
