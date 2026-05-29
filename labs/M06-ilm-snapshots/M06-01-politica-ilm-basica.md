# Laboratorio M06-01 — Política ILM básica

[▲ Módulo M06](README.md) · [Siguiente →](M06-02-rollover-alias.md)

> ⏱️ ~35 min

**Objetivo:** crear y revisar la política `lab-hot-warm-delete` con fases aceleradas para laboratorio.

---

### Paso 1 — Aplicar script del repo

```bash
./scripts/setup-ilm-lab.sh
curl -fsS 'http://localhost:9200/_ilm/policy/lab-hot-warm-delete?pretty'
```

---

### Paso 2 — UI de ILM

Kibana → **Stack Management** → **Index Lifecycle Policies** → abre `lab-hot-warm-delete`.

Compara hot (rollover 1gb/7d) vs warm (1 min en lab) vs delete (5 min).

---

### Paso 3 — Explicación operativa

Anota qué fase usarías en **producción** (días/semanas) vs este lab (minutos).

---

## Validación

- [ ] Política visible en API y UI.
- [ ] Entiendes hot/warm/delete.

---

## Antes de seguir

ILM en data streams de Beats suele venir por integración; aquí practicamos con índice clásico controlado.
