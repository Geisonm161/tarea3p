# TaskFlow

TaskFlow es una aplicación CRUD para administrar tareas. El proyecto demuestra una separación clara entre interfaz, controlador HTTP, lógica de negocio y persistencia, sin requerir dependencias externas.

## Funcionalidades

- Crear tareas con título, descripción y estado.
- Asignar prioridad baja, media o alta a cada tarea.
- Consultar y buscar tareas por título o descripción.
- Filtrar tareas por estado.
- Ordenar tareas por fecha o prioridad.
- Editar datos y marcar tareas como completadas.
- Eliminar tareas mediante un diálogo de confirmación.
- Interfaz responsive con estados de carga, error y listado vacío.
- Persistencia local en JSON con escrituras serializadas y atómicas.

## Requisitos

- Node.js 18 o posterior.

## Ejecución

```bash
npm start
```

Luego visita `http://localhost:3000`.

Durante el desarrollo se puede usar recarga automática:

```bash
npm run dev
```

## Pruebas

```bash
npm test
```

Las pruebas cubren la lógica de creación, consulta, filtrado, actualización y eliminación, además del ciclo CRUD completo sobre la API.

## Arquitectura

```text
public/                  Interfaz web
src/
├── controllers/         Adaptación de solicitudes y respuestas HTTP
├── errors/              Errores controlados de la aplicación
├── http/                Enrutamiento y archivos estáticos
├── repositories/        Acceso y persistencia de datos
├── services/            Validación y reglas de negocio
├── app.js               Composición de dependencias
└── server.js            Punto de entrada
data/                    Almacenamiento local
test/                    Pruebas unitarias y de integración
```

## API

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/tasks` | Lista tareas; acepta `search`, `status` y `sort` |
| `GET` | `/api/tasks/:id` | Consulta una tarea |
| `POST` | `/api/tasks` | Crea una tarea |
| `PUT` | `/api/tasks/:id` | Actualiza una tarea |
| `DELETE` | `/api/tasks/:id` | Elimina una tarea |

Ejemplo del cuerpo para creación o actualización:

```json
{
  "title": "Preparar exposición",
  "description": "Repasar los conceptos principales",
  "status": "pending"
}
```

Los estados admitidos son `pending`, `in-progress` y `completed`.

## Estrategia Git Flow para la tarea

Las ramas permanentes son `main`, `dev` y `qa`. Las cinco ramas de trabajo propuestas son:

1. `feature/project-foundation`
2. `feature/create-task`
3. `feature/task-list-filters`
4. `feature/edit-task-status`
5. `hotfix/delete-confirmation`

Según el requisito particular de la asignación, cada rama de trabajo debe originar un PR hacia `dev`, otro hacia `qa` y otro hacia `main`, para un total de 15 PR cerrados o fusionados. Esto difiere del Git Flow habitual, donde una rama feature normalmente se integra en `dev`; se conserva aquí porque es un criterio explícito de evaluación.

Antes de entregar, se debe comprobar en GitHub que las tres ramas permanentes contienen el resultado final, las cinco ramas de trabajo son visibles, los 15 PR están cerrados y el repositorio es público.

## Persistencia

Las tareas se guardan en `data/tasks.json`. Para usar otra ubicación se puede definir `DATA_FILE`. El puerto se configura mediante `PORT`.

## Licencia

MIT
