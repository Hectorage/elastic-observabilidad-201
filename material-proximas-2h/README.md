# Material — próximas 2 horas (S1, fin M02)

[← Curso](../README.md) · [Labs M02](../labs/M02-despliegue-stack/README.md)

Carpeta de apoyo para la **segunda mitad de la sesión 1** (tras M01) o para cerrar **M02** en ~2 h de trabajo guiado. Incluye conceptos que salieron en clase (ILM, data streams, ritual de arranque, migración 7→8) y un **plan horario** enlazado a los labs del repo.

## Contenido

| Documento | Para qué |
|-----------|----------|
| [conceptos-clave.md](conceptos-clave.md) | ILM, índice vs data stream, `curl` a `:9200`, ritual sin fork, migración ES 7→8 |
| [plan-2-horas.md](plan-2-horas.md) | Bloques de tiempo, labs M02-02 → M02-05, validaciones y cortes |
| [referencia-rapida.md](referencia-rapida.md) | Comandos y URLs que repetimos en el bloque |

## Punto de partida

- **Hecho:** M01-01 … M01-04 (stack completo, ritual de recovery).
- **En curso o siguiente:** [M02-01](../labs/M02-despliegue-stack/M02-01-solo-elasticsearch.md) … [M02-05](../labs/M02-despliegue-stack/M02-05-ha-shards-replicas.md).

```bash
cd <raíz-del-repo>
docker compose -f infra/docker-compose.yml --profile beats up -d
./scripts/health-check.sh
```

## Después de estas 2 h

Siguiente sesión del calendario: **M03 + M04** ([labs/README.md](../labs/README.md)).
