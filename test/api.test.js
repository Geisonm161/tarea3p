const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const createApp = require('../src/app');

async function createTestServer() {
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'taskflow-api-'));
  const server = createApp({ dataFile: path.join(temporaryDirectory, 'tasks.json') });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    async close() {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
    },
  };
}

test('sirve la aplicación web', async () => {
  const testServer = await createTestServer();
  try {
    const { baseUrl } = testServer;
    const response = await fetch(baseUrl);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /TaskFlow/);
  } finally {
    await testServer.close();
  }
});

test('completa el ciclo CRUD', async () => {
  const testServer = await createTestServer();
  try {
    const { baseUrl } = testServer;
    const createResponse = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Configurar repositorio', description: 'Crear ramas', status: 'pending' }),
    });
    const created = (await createResponse.json()).data;
    assert.equal(createResponse.status, 201);

    const getResponse = await fetch(`${baseUrl}/api/tasks/${created.id}`);
    assert.equal((await getResponse.json()).data.title, 'Configurar repositorio');

    const updateResponse = await fetch(`${baseUrl}/api/tasks/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Configurar repositorio', description: 'Crear ramas', status: 'completed' }),
    });
    assert.equal((await updateResponse.json()).data.status, 'completed');

    const listResponse = await fetch(`${baseUrl}/api/tasks?status=completed`);
    assert.equal((await listResponse.json()).data.length, 1);

    const deleteResponse = await fetch(`${baseUrl}/api/tasks/${created.id}`, { method: 'DELETE' });
    assert.equal(deleteResponse.status, 204);

    const missingResponse = await fetch(`${baseUrl}/api/tasks/${created.id}`);
    assert.equal(missingResponse.status, 404);
  } finally {
    await testServer.close();
  }
});

test('responde con errores de validación estructurados', async () => {
  const testServer = await createTestServer();
  try {
    const { baseUrl } = testServer;
    const response = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '' }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.message, 'Revisa los datos ingresados.');
    assert.ok(body.error.details.title);
  } finally {
    await testServer.close();
  }
});
