# Laboratorio M11-01 — Fluent Bit hacia Elasticsearch

[▲ Módulo M11](README.md) · [Siguiente →](M11-02-kafka-redpanda-buffer.md)

> ⏱️ ~45 min

**Objetivo:** ingerir `access-lab.log` con Fluent Bit al índice `lab-fluent-bit`.

> **Fluent Bit vs Filebeat:** ambos son shippers ligeros. Filebeat integra profundo con Elastic Agent/Fleet; **Fluent Bit** brilla en Kubernetes (DaemonSet), edge IoT y contenedores con huella mínima. Mismo destino ES — distinto ecosistema.

---

### Paso 1 — Levantar integraciones

Perfil `integrations` añade Fluent Bit sin sustituir Beats del lab principal.

```bash
docker compose -f infra/docker-compose.yml \
  -f infra/docker-compose.integrations.yml \
  --profile integrations up -d
docker logs lab-fluent-bit --tail 20
```

Busca errores de conexión a `:9200` o parser. Config en `infra/fluent-bit/fluent-bit.conf`.

| Componente | Rol |
|------------|-----|
| `[INPUT] tail` | Lee `access-lab.log` |
| `[FILTER] parser` | Parseo (ver `parsers.conf`) |
| `[OUTPUT] es` | Bulk a índice `lab-fluent-bit` |

---

### Paso 2 — Contar documentos

```bash
sleep 30
curl -fsS 'http://localhost:9200/lab-fluent-bit/_count?pretty'
```

Si 0: Fluent Bit no arrancó, parser falló, o ES rechazó bulk — logs del contenedor primero.

---

### Paso 3 — Discover

Data view `lab-fluent-bit` → `log_source : "fluent-bit-lab"`.

Compara con M07: mismos logs de acceso, distinto shipper. ¿Campos parseados iguales? Si no — unifica con ingest pipeline `lab-enrich-completo` en ES.

---

### Paso 4 — Añadir línea (tiempo real)

Simula tráfico nuevo en el fichero vigilado:

```bash
echo '198.51.100.99 - - [29/May/2026:11:00:00 +0000] "GET /test HTTP/1.1" 200 10 "-" "curl/8.0"' >> infra/samples/logs/access-lab.log
sleep 15
curl -fsS 'http://localhost:9200/lab-fluent-bit/_search?size=1&sort=@timestamp:desc&pretty'
```

Latencia tail → ES debería ser <30 s en lab.

---

## Validación

- [ ] `_count` > 0.
- [ ] Nueva línea visible con `@timestamp` reciente.
- [ ] Una frase: cuándo elegirías Fluent Bit vs Filebeat en K8s.

---

## Antes de seguir

Fluent Bit es común como DaemonSet; Elastic Agent unifica muchos casos Beats en despliegues 100 % Elastic. Conviven en empresas híbridas.
