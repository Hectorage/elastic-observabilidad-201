# Filebeat

[← Índice](README.md)

## Propósito

Agente ligero de **shipping de logs**. Vigila ficheros, contenedores, sockets o fuentes cloud, detecta eventos nuevos, opcionalmente los enriquece y los envía a Elasticsearch o Logstash. Diseñado para correr en el edge (servidor, nodo, sidecar) con bajo overhead.

## Rol en el pipeline

```text
  Ficheros / streams  ──input──►  Filebeat  ──output──►  Elasticsearch | Logstash
                                        │
                                  processors, parsers
```

Patrón habitual: aplicación escribe en disco → Filebeat tailing → bulk index en destino.

## Tecnología subyacente

- Miembro de la familia **Beats** (Go, single binary).
- Input **filestream** (8.x): seguimiento por inode/offset, manejo de rotación y truncado.
- **Registry** local: checkpoint de lectura para at-least-once sin re-leer todo el histórico tras reinicio.
- **Processors**: add_host_metadata, decode_json_fields, drop_event, etc.
- Salida vía **Elasticsearch bulk API** o protocolo **Lumberjack** hacia Logstash.
- Integración con **ILM** y data streams cuando `setup.ilm.enabled: true`.

## Modo de despliegue

| | |
|---|---|
| **Alta disponibilidad (producción)** | No hay clúster HA del agente. Patrón **uno por host** (VM, bare metal, sidecar en pod): la resiliencia es de flota — muchos hosts con su Filebeat. Si un agente cae, solo se pierde ingesta de ese host hasta recuperarlo (el registry conserva el offset). |
| **Standalone / desarrollo** | Un agente en una máquina o contenedor. |
| **En este repositorio** | Un contenedor (`lab-filebeat`). |

## Operación y estado

| Área | Qué vigilar |
|------|-------------|
| **Registry / offset** | Persistir en volumen local; pérdida del registry puede implicar reenvío duplicado o salto de líneas según config. |
| **Backpressure** | Si ES/Logstash rechaza bulk, Filebeat retiene en memoria/disco interno; monitorizar cola y logs de publish failed. |
| **Permisos** | Usuario del proceso debe leer paths de log y, si aplica, metadata de contenedor. |
| **Rotación de logs** | Configuración correcta de filestream ante copytruncate, rename o rotación diaria. |
| **Carga** | Volumen de líneas/s, multiline pesado y processors costosos aumentan CPU del agente. |
| **Despliegue** | Una instancia por host lógico (o por contenedor sidecar); evitar dos Filebeats leyendo el mismo fichero sin coordinación. |
| **Actualizaciones** | Rolling por host; validar compatibilidad de versión con Elasticsearch destino. |

## Señales y comprobaciones

```bash
filebeat test config -c /etc/filebeat/filebeat.yml
filebeat test output
curl -fsS 'http://localhost:9200/filebeat-*/_count'
```

Logs del Beat: `connection refused`, `403`, rotación no detectada, harvester started/stopped.

## Documentación oficial

- [Filebeat overview](https://www.elastic.co/docs/reference/beats/filebeat)
- [Filestream input](https://www.elastic.co/docs/reference/beats/filebeat/filebeat-input-filestream)
- [Beats vs Logstash](https://www.elastic.co/docs/reference/beats/auditbeat/diff-logstash-beats)
