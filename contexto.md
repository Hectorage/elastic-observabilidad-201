# Contexto — Elastic Stack Observabilidad Lab First

## Tecnología / alcance

- Stack / productos: Elasticsearch, Kibana, Logstash, Filebeat, Metricbeat, Auditbeat; integraciones con Fluent Bit, Kafka y Prometheus.
- Versiones: **8.17.2** en todos los componentes de la edición actual (`infra/.env` → `STACK_VERSION`). Mantener la misma major/minor en ES, Kibana y Beats.
- Qué NO entra: observabilidad de aplicaciones con APM avanzado y despliegues multi-región productivos.

## Restricciones enterprise (si aplica)

- Red / proxy: posible salida restringida desde entornos corporativos.
- Certificados: considerar TLS y certificados internos para módulos de seguridad.
- Control de accesos: diseño de roles/usuarios y referencia a integración LDAP.

## Referencias

- Links internos: fork del repositorio del curso (base de laboratorios).
- Docs oficiales (URLs actuales en `docs/enlaces-oficiales.md`):
  - https://www.elastic.co/docs
  - https://www.elastic.co/docs/get-started/the-stack
  - https://kind.sigs.k8s.io/

