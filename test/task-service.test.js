const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const TaskRepository = require('../src/repositories/TaskRepository');
const TaskService = require('../src/services/TaskService');

async function createTestService() {
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'taskflow-service-'));
    const repository = new TaskRepository(path.join(temporaryDirectory, 'tasks.json'));
  return { service: new TaskService(repository), temporaryDirectory };
}

test('crea y consulta una tarea', async () => {
  const { service, temporaryDirectory } = await createTestService();
  try {
    const created = await service.create({
      title: 'Preparar exposición',
      description: 'Repasar los conceptos de Git Flow',
      status: 'pending',
    });

    assert.match(created.id, /^[0-9a-f-]{36}$/);
    assert.equal(created.title, 'Preparar exposición');
    assert.equal(created.priority, 'medium');
    assert.deepEqual(await service.list(), [created]);
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test('valida los datos antes de crear', async () => {
  const { service, temporaryDirectory } = await createTestService();
  try {
    await assert.rejects(
      service.create({ title: 'x', status: 'unknown' }),
      (error) => error.statusCode === 400
        && Boolean(error.details.title)
        && Boolean(error.details.status),
    );
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test('valida y conserva la prioridad de una tarea', async () => {
  const { service, temporaryDirectory } = await createTestService();
  try {
    const task = await service.create({ title: 'Corregir incidencia', priority: 'high' });
    assert.equal(task.priority, 'high');
    await assert.rejects(
      service.create({ title: 'Prioridad inválida', priority: 'urgent' }),
      (error) => Boolean(error.details.priority),
    );
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test('filtra por texto y estado', async () => {
  const { service, temporaryDirectory } = await createTestService();
  try {
    await service.create({ title: 'Diseñar interfaz', description: 'Crear estilos', status: 'in-progress' });
    await service.create({ title: 'Probar API', description: 'Validar endpoints', status: 'completed' });

    const bySearch = await service.list({ search: 'API' });
    const byStatus = await service.list({ status: 'in-progress' });

    assert.equal(bySearch.length, 1);
    assert.equal(bySearch[0].title, 'Probar API');
    assert.equal(byStatus.length, 1);
    assert.equal(byStatus[0].title, 'Diseñar interfaz');
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test('ordena las tareas por prioridad', async () => {
  const { service, temporaryDirectory } = await createTestService();
  try {
    await service.create({ title: 'Tarea de prioridad baja', priority: 'low' });
    await service.create({ title: 'Tarea de prioridad alta', priority: 'high' });
    const tasks = await service.list({ sort: 'priority' });

    assert.equal(tasks[0].priority, 'high');
    assert.equal(tasks[1].priority, 'low');
    await assert.rejects(service.list({ sort: 'unknown' }), (error) => error.statusCode === 400);
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test('actualiza y elimina una tarea', async () => {
  const { service, temporaryDirectory } = await createTestService();
  try {
    const task = await service.create({ title: 'Tarea inicial', status: 'pending' });
    const updated = await service.update(task.id, {
      title: 'Tarea actualizada',
      description: '',
      status: 'completed',
    });

    assert.equal(updated.status, 'completed');
    assert.equal((await service.delete(task.id)).id, task.id);
    await assert.rejects(service.getById(task.id), (error) => error.statusCode === 404);
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
});
