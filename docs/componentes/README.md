# Componentes del Elastic Stack

Referencia de los servicios que forman el pipeline de observabilidad del repositorio ([`infra/docker-compose.yml`](../../infra/docker-compose.yml)).

## Flujo de datos

```text
  Aplicaciones / ficheros de log
           │
           ▼
       Filebeat ──────────────────────────────┐
           │                                 │
  APIs del sistema (Docker, host, …)        │
           │                                 │
           ▼                                 ▼
     Metricbeat ──► Elasticsearch :9200 ◄── Kibana :5601
           │              ▲
           │              │
     Auditbeat ───────────┘

  (Logstash puede insertarse entre Beats y Elasticsearch como capa de transformación.)
```

## Índice

| Componente | Ficha |
|------------|-------|
| Elasticsearch | [elasticsearch.md](elasticsearch.md) |
| Kibana | [kibana.md](kibana.md) |
| Filebeat | [filebeat.md](filebeat.md) |
| Metricbeat | [metricbeat.md](metricbeat.md) |
| Auditbeat | [auditbeat.md](auditbeat.md) |
| Generador de logs (`loggen`) | [loggen.md](loggen.md) |

Documentación oficial de Elastic: [enlaces-oficiales.md](../enlaces-oficiales.md).

CAP, consistencia y disponibilidad del pipeline: [cap-y-consistencia-stack.md](../cap-y-consistencia-stack.md).
