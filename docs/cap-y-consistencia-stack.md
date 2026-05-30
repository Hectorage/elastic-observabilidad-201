# CAP, consistencia y disponibilidad en el Elastic Stack

Cómo razonar sobre **particiones, consistencia y disponibilidad** en un pipeline de observabilidad formado por Beats, Elasticsearch y Kibana — y por qué conviene hablar de **garantías concretas** antes que de etiquetas CAP rígidas.

## Qué plantea CAP (en una línea)

Ante una **partición de red** entre nodos, un datastore distribuido no puede garantizar a la vez consistencia fuerte y disponibilidad total de lecturas/escrituras: hay que **priorizar** uno u otro (o aceptar concesiones).

CAP describe un dilema en sistemas **distribuidos con estado replicado**. No es un manual de operación diaria; sirve para **encuadrar expectativas** cuando diseñas o incidentas un stack.

## Por qué no basta con decir “el stack es CP” o “es AP”

El Elastic Stack no es un solo sistema CAP:

| Capa | Rol | ¿CAP clásico? |
|------|-----|----------------|
| Beats / Logstash | Ingesta en el edge | No: agentes con cola local y semántica **at-least-once** |
| Elasticsearch | Almacén distribuido | **Sí**: shards, réplicas, quorum de master |
| Kibana | UI stateless | No: disponibilidad acoplada a ES; no particiona datos |
| Alertas / Watcher | Consultas programadas | Heredan el comportamiento de ES en el momento de evaluar |

Etiquetar todo el stack como “CP” u “AP” **oculta** decisiones reales: niveles de ack en bulk, réplicas, `wait_for_active_shards`, colas de Beats, retención ILM, tolerancia a duplicados en logs.

En observabilidad suele primar otro criterio: **durabilidad e ingesta continua** frente a **consistencia inmediata global**. Un log puede tardar segundos en aparecer en Discover; eso es **consistencia eventual** aceptable si no se pierde el evento.

## Posicionamiento del stack completo

### Prioridad operativa típica

```text
  1. No perder eventos en origen (Beats retienen / reintentan)
  2. Seguir aceptando ingesta aunque el clúster esté degradado (yellow)
  3. Consulta y dashboards eventualmente al día (Kibana → ES)
  4. Consistencia fuerte solo donde el negocio la exija (índices concretos, acks estrictos)
```

En conjunto, el pipeline se comporta como **AP en espíritu operativo** para telemetría: se prefiere **seguir recibiendo y buscando** con datos posiblemente ligeramente desfasados o duplicados, antes que bloquear ingesta por no tener quorum perfecto en cada write.

Eso **no** significa que Elasticsearch renuncie a consistencia: en multi-nodo, la elección de master y la asignación de shards son **CP-leaning** bajo partición (sin quorum no hay cluster lógico estable).

### Flujo y punto de verdad

```text
  [Origen] → [Beat/Logstash] → [Elasticsearch] ← [Kibana / alertas]
     │              │                  │
  append local   cola + retry    fuente de verdad
  at-least-once  at-least-once   consistencia por shard / réplica
```

- **Fuente de verdad temporal**: disco local del host (logs) + registry del Beat.
- **Fuente de verdad analítica**: Elasticsearch una vez indexado.
- **Visibilidad**: Kibana refleja ES; no introduce un tercer estado distribuido.

### Bajo fallo parcial

| Escenario | Comportamiento esperado |
|-----------|-------------------------|
| ES en **yellow** (réplicas sin asignar) | Ingesta y búsqueda suelen continuar; riesgo si cae el único nodo con primario |
| ES en **red** | Shards primarios sin asignar: escrituras/lecturas afectadas en esos índices |
| Beat no puede enviar a ES | Eventos en cola local o backpressure; riesgo de pérdida solo si se agota disco/memoria del agente |
| Kibana caída | Datos siguen en ES; ingesta no se detiene |
| Partición entre nodos ES (multi-nodo) | Master election con quorum; mitad del clúster puede quedar sin servir escrituras hasta resolver |

## Dónde entra CAP de verdad: Elasticsearch

Elasticsearch es el único componente del stack donde CAP es **directamente accionable**:

| Dimensión | Comportamiento |
|-----------|----------------|
| **Consistencia** | Por documento/shard; réplicas sincronizadas según ciclo de indexación; lecturas “near real-time” (refresh interval) |
| **Disponibilidad** | Escala con nodos data + réplicas; un nodo caído no tumba el índice si hay réplica en otro nodo |
| **Tolerancia a partición** | Requiere **quorum** de master-eligible nodes; split-brain se evita con `discovery.seed_hosts` y número impar de masters |

Parámetros que mueven el equilibrio (sin cambiar de producto):

- Número de **réplicas** (`index.number_of_replicas`)
- **`wait_for_active_shards`** en bulk (cuántas copias deben confirmar antes de ack)
- Topología **multi-nodo** vs **single-node**

En **single-node** (desarrollo, muchos labs): no hay partición entre nodos del clúster. CAP casi no aplica; el trade-off real es **simplicidad vs cero redundancia** — un fallo del proceso o del disco implica indisponibilidad total.

Detalle operativo del nodo: [componentes/elasticsearch.md](componentes/elasticsearch.md).

## Beats y capa de ingesta: semántica de entrega

Filebeat, Metricbeat y Auditbeat no eligen “C” o “A” a nivel cluster; implementan **entrega at-least-once**:

- Registry / offset local → reintento tras caída
- Cola interna si el destino rechaza bulk
- **Duplicados posibles** tras reinicios o timeouts (idempotencia downstream si hace falta)
- **Huecos** raros si se pierde registry sin backup

Prioridad práctica: **disponibilidad de la ingesta en el host** (seguir leyendo logs aunque ES esté lento) frente a **exactly-once** global (costoso y poco habitual en logs).

## Kibana y consulta

Kibana no replica shards. Si Elasticsearch responde, Kibana sirve; si ES no responde, la UI no tiene de dónde leer. La “consistencia” que ve el usuario es la de ES en el instante de la query más el **refresh** de índices (por defecto ~1 s en muchos casos).

## Resumen: por qué importa en diseño y operación

1. **Expectativas realistas**: Discover no es una réplica en tiempo real del disco del servidor; es una vista **eventual** sobre lo indexado.
2. **Incidentes**: `yellow` en observabilidad a menudo es **operable**; `red` en primarios no. No confundir salud del clúster con salud del negocio.
3. **Sizing HA**: la disponibilidad del stack de datos vive en **réplicas y nodos ES**, no en “más Kibana”.
4. **Ingesta**: proteger colas y disco en Beats; ES degradado ≠ parar agentes sin plan.
5. **CAP como marco, no como etiqueta**: usar quorum, réplicas, acks y at-least-once en runbooks concretos.

## Lecturas relacionadas

- [Componentes del stack](componentes/README.md)
- [Elasticsearch — modo de despliegue y salud](componentes/elasticsearch.md)
- [Filebeat — operación y estado](componentes/filebeat.md)
- [Cluster health (API oficial)](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/cluster-health)
- [Production guidance](https://www.elastic.co/docs/deploy-manage/production-guidance)
- [Enlaces oficiales](enlaces-oficiales.md)
