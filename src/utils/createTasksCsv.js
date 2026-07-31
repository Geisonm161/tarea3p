const HEADERS = ['Título', 'Descripción', 'Estado', 'Prioridad', 'Creada', 'Actualizada'];

function escapeCell(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function createTasksCsv(tasks) {
  const rows = tasks.map((task) => [
    task.title,
    task.description,
    task.status,
    task.priority || 'medium',
    task.createdAt,
    task.updatedAt,
  ]);

  return `\uFEFF${[HEADERS, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n')}\n`;
}

module.exports = createTasksCsv;
