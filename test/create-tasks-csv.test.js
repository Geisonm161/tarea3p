const assert = require('node:assert/strict');
const { test } = require('node:test');
const createTasksCsv = require('../src/utils/createTasksCsv');

test('escapa comas, comillas y saltos de línea en CSV', () => {
  const csv = createTasksCsv([{
    title: 'Revisar "Git, Flow"',
    description: 'Primera línea\nSegunda línea',
    status: 'pending',
    priority: 'high',
    createdAt: '2026-07-31T10:00:00.000Z',
    updatedAt: '2026-07-31T10:00:00.000Z',
  }]);

  assert.match(csv, /"Revisar ""Git, Flow"""/);
  assert.match(csv, /"Primera línea\nSegunda línea"/);
});
