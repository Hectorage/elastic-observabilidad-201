# Generador de logs (`loggen`)

[← Índice](README.md)

## Propósito

Utilidad del repositorio que **simula tráfico de aplicación** escribiendo líneas de log en disco. No es parte del Elastic Stack: reproduce el patrón *proceso → fichero de log → agente de shipping* para tener datos de prueba sin desplegar una aplicación real.

En producción, ese rol lo cumple tu servicio, un reverse proxy o el propio runtime (JVM, Node, etc.).

## Rol en el pipeline

```text
  loggen  ──append──►  app.log  ──Filebeat──►  Elasticsearch
     │                    │
  fuente sintética    origen en disco
```

## Modo de despliegue

| | |
|---|---|
| **Alta disponibilidad** | No aplica: utilidad de carga puntual, no componente de producción. |
| **Standalone** | Un proceso/contenedor que escribe en fichero. |
| **En este repositorio** | Contenedor `lab-loggen` (perfil `beats` del compose). |

## Comportamiento

- Contenedor Alpine con un script shell en bucle.
- Escribe en `app.log` con timestamp ISO, nivel (`INFO` / `WARN` / `ERROR`), método HTTP, path, status y latencia.
- Distribución aproximada: 70 % INFO/200, 20 % WARN/404, 10 % ERROR/500.
- Una línea cada ~2 segundos.

Ejemplo:

```text
2026-05-30T10:15:00+00:00 INFO demo-app request_id=42 method=GET path=/api/health status=200 latency_ms=127
```

## Operación y estado

| Área | Qué vigilar |
|------|-------------|
| **Crecimiento del fichero** | Log append-only sin rotación configurada → disco del volumen montado; conviene logrotate o límite en entornos largos. |
| **Estado del generador** | Sin estado entre líneas; reinicio del contenedor solo afecta continuidad temporal del flujo. |
| **Coordinación con Filebeat** | Si el generador para, Filebeat sigue vivo pero deja de haber eventos nuevos; distinguir agente caído vs fuente silenciosa. |
| **Identificación en ES** | Filebeat puede etiquetar con campos custom (`log_source`, etc.) para filtrar este origen en Discover. |

## Señales y comprobaciones

```bash
tail -5 infra/samples/logs/app.log
docker compose -f infra/docker-compose.yml ps loggen
```
