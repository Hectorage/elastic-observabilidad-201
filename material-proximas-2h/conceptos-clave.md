# Conceptos clave (consolidado de clase)

Lectura de referencia durante o entre bloques del [plan de 2 horas](plan-2-horas.md). No sustituye los labs; los enlaza.

---

## Índice clásico vs data stream (`.ds-*`)

### Analogías

| Analogía | Índice (`lab-smoke`) | Data stream (`filebeat-*`) |
|----------|----------------------|----------------------------|
| Buzón | Un solo buzón fijo | Etiqueta «Correo 2026»; el cartero abre sobres nuevos (`.ds-...-000001`, `000002`…) |
| Archivo | Carpeta que creamos a mano | Política «logs de app»: carpetas por rollo/mes; archivera rota y borra |
| Consulta | Apuntas al nombre exacto del índice | Apuntas al nombre lógico; ES elige el backing index activo |

### Por qué existen los data streams

La ingesta de observabilidad es **continua en el tiempo** (logs, métricas). Con un solo índice gigante:

- shards enormes, merges lentos, borrado brusco;
- rotación manual de nombres (`logs-2026.06.01`, `…02`);
- ILM difícil de aplicar de forma uniforme.

Con data stream:

- **nombre estable** para Beats, Kibana y alertas (`filebeat-*`);
- **rollover** automático (backing indices pequeños);
- **ILM** atado al stream (hot → delete).

En el lab conviven ambos modelos (M01-02, M02-03): `lab-smoke` (clásico) + `filebeat-*` (stream).

### Comprobarlo en 30 s

```bash
curl -fsS 'http://localhost:9200/_data_stream?pretty' | grep '"name"'
curl -fsS 'http://localhost:9200/_cat/indices/.ds-filebeat*?v&h=index,docs.count'
curl -fsS 'http://localhost:9200/_cat/indices/lab-*?v&h=index,docs.count'
```

---

## ILM (Index Lifecycle Management)

**Qué es:** políticas que automatizan el ciclo de vida de índices / backing indices (tamaño, edad, fase, borrado).

**Qué hace en la práctica:**

- rollover cuando un índice alcanza tamaño o edad;
- mover datos a fases más baratas (warm/cold);
- borrar al cumplir retención.

**Relación con el lab:** los `.ds-filebeat-*` suelen tener ILM en la plantilla del Beat; no creamos el índice a mano. Profundizamos en **M06**; aquí solo conectamos: *stream = nombre lógico; ILM = qué pasa con cada `.ds-*` por detrás*.

---

## Ritual de arranque (M01-04) — qué va a cada sitio

| Paso | Dónde | Qué comprobamos |
|------|--------|-----------------|
| 1 | Terminal, raíz del repo | Estamos en el proyecto del lab (no «ir al fork» cada día) |
| 2 | Docker Compose | Contenedores `Up`, perfil `beats` |
| 3 | `./scripts/health-check.sh` | ES + ingesta (`filebeat-*` con docs) |
| 4 | Navegador **:5601** | Kibana → Discover → data view `filebeat-*` |
| 5 | Terminal **`localhost:9200`** | API de **Elasticsearch**, no Filebeat ni Kibana |

```bash
curl -fsS 'http://localhost:9200/filebeat-*/_count'
# Esperar ~30 s y repetir: "count" debe subir
```

`filebeat-*` en el `curl` = **patrón del data stream en ES**. Filebeat no expone ese conteo; solo envía documentos al puerto 9200.

`git pull` = opcional al empezar jornada nueva (material del curso), **no** parte del ritual de observabilidad.

---

## Migración Elasticsearch 7 → 8 (visión general)

No es solo cambiar imagen Docker.

1. Pasar por **7.17.latest** si aún no estamos ahí.
2. **Upgrade Assistant** en Kibana → corregir deprecations.
3. **Reindex** de índices muy antiguos (p. ej. creados en 6.x).
4. Snapshot + plan de rollback.
5. Orden típico: nodos ES → Kibana → Beats/Logstash/clientes.
6. Validar: health, ingesta, Discover, alertas.

En **8.x** la seguridad por defecto es más estricta (TLS/RBAC) — en el lab lo dejamos desactivado hasta M09.

Estrategias:

- **Rolling** (multi-nodo, mínimo downtime).
- **Blue/green** (clúster nuevo v8, snapshot/reindex, cambio de tráfico, rollback fácil).

---

## Mapa mental del bloque M02

```text
M02-01  ES solo (:9200, lab-smoke, volumen esdata)
   ↓
M02-02  + Kibana (:5601, Discover, depende de ES)
   ↓
M02-03  + Filebeat/loggen (filebeat-* data stream)
   ↓
M02-04  Fallos + runbook (ES vs UI vs ingesta)
   ↓
M02-05  Shards, réplicas, yellow en single-node vs prod
```
