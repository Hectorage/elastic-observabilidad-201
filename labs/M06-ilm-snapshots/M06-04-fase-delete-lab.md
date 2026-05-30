# Laboratorio M06-04 — Observar fase delete (lab acelerado)

[▲ Módulo M06](README.md) · [← Anterior](M06-03-snapshot-repositorio.md) · [Siguiente módulo →](../M07-enriquecimiento-eventos/M07-01-grok-access-logs.md)

> ⏱️ ~35 min · ⏳ Espera ~5–10 min

**Objetivo:** ver cómo ILM mueve y **borra** índices con `min_age` corto del script de lab.

> **Advertencia operativa:** en este ejercicio los índices **desaparecen**. Es el comportamiento esperado de ILM delete. Por eso M06-03 creó snapshot: sin copia, no hay vuelta atrás.

---

### Paso 1 — Estado ILM

Toma una «foto» inicial antes de esperar. Anota hora y qué índices existen.

```bash
curl -fsS 'http://localhost:9200/_cat/indices/lab-ilm-demo*?v'
curl -fsS 'http://localhost:9200/lab-ilm-demo-*/_ilm/explain?pretty' | grep -E '"phase"|"action"|"step"' | head -20
```

En paralelo puedes refrescar **Index Management** filtrando `lab-ilm-demo` (columna *Lifecycle phase*): [captura de referencia](../../docs/imagenes/kibana/kibana-index-management-ilm-indices.png).

**Secuencia típica en lab (no exacta al segundo)**

```text
hot (write) → warm (shrink) → delete → índice ausente en _cat/indices
```

Si un índice lleva minutos en la misma fase, revisa `_ilm/explain` por `failed_step` (p. ej. shard sin asignar en nodo único).

---

### Paso 2 — Esperar fase delete

ILM evalúa políticas en intervalos del clúster; no es instantáneo. Observa **cambio de estado**, no un reloj fijo.

```bash
# Repite cada 2 min hasta ver índices eliminados o en delete
watch -n 120 'curl -fsS http://localhost:9200/_cat/indices/lab-ilm-demo*?v'
# Ctrl+C cuando veas cambios
```

En Codespaces, 5–10 min suele bastar según `setup-ilm-lab.sh`.

**Mientras esperas, anota**

| Minuto aprox. | Índices visibles | Fase en explain |
|---------------|------------------|-----------------|
| 0 | | |
| +5 | | |
| +10 | | |

**En producción** los `min_age` serían días o meses; aquí compruebas que el **mecanismo** funciona. El error clásico en prod es poner delete a 30 d sin snapshot ni ticket de cambio.

---

### Paso 3 — Recuperación desde snapshot (opcional)

Si el índice desapareció y tienes snapshot de M06-03, simula recuperación post-incidente:

```bash
curl -fsS -X POST 'http://localhost:9200/_snapshot/lab_fs/snap-lab-ilm-1/_restore' \
  -H 'Content-Type: application/json' \
  -d '{"indices":"lab-ilm-demo-*","rename_pattern":"(.+)","rename_replacement":"restored-$1"}'
```

Los documentos reaparecen bajo nombres `restored-lab-ilm-demo-000001`, etc. — **no** reviven el índice original. En un incidente real documentarías: qué snapshot, qué rename, quién autorizó restore.

Solo ejecuta si el snapshot del ejercicio anterior existe (`curl .../_snapshot/lab_fs/_all`).

---

## Validación

- [ ] Viste transición de fase en `_ilm/explain` o desaparición de índices viejos.
- [ ] Tienes snapshot de respaldo del paso M06-03.
- [ ] Puedes explicar la diferencia entre «delete ILM» y «recuperar desde snapshot».

---

## Antes de seguir

En producción: alarga `min_age`, automatiza snapshots (SLM), prueba restore **antes** de necesitarlo y alinea delete con legal/compliance. ILM delete sin snapshot es una bomba de tiempo.
