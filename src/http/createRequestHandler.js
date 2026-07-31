const fs = require('node:fs/promises');
const path = require('node:path');

const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function createRequestHandler({ taskController, publicDirectory }) {
  return async function requestHandler(request, response) {
    try {
      const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
      const taskMatch = url.pathname.match(/^\/api\/tasks\/([0-9a-f-]+)$/i);

      if (url.pathname === '/api/tasks' && request.method === 'GET') {
        return await taskController.list(request, response, url);
      }
      if (url.pathname === '/api/tasks' && request.method === 'POST') {
        return await taskController.create(request, response, url);
      }
      if (url.pathname === '/api/tasks/export.csv' && request.method === 'GET') {
        return await taskController.export(request, response, url);
      }
      if (taskMatch && request.method === 'GET') {
        return await taskController.get(request, response, url, taskMatch[1]);
      }
      if (taskMatch && request.method === 'PUT') {
        return await taskController.update(request, response, url, taskMatch[1]);
      }
      if (taskMatch && request.method === 'DELETE') {
        return await taskController.delete(request, response, url, taskMatch[1]);
      }
      if (url.pathname.startsWith('/api/')) {
        return sendError(response, 404, 'Ruta no encontrada.');
      }

      return await serveStatic(response, publicDirectory, url.pathname);
    } catch (error) {
      if (!error.statusCode) console.error(error);
      return sendError(
        response,
        error.statusCode || 500,
        error.statusCode ? error.message : 'Ocurrió un error inesperado.',
        error.details,
      );
    }
  };
}

async function serveStatic(response, publicDirectory, pathname) {
  const requestedPath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  const filePath = path.resolve(publicDirectory, requestedPath);
  const publicRoot = `${path.resolve(publicDirectory)}${path.sep}`;

  if (!filePath.startsWith(publicRoot)) return sendError(response, 403, 'Acceso denegado.');

  try {
    const content = await fs.readFile(filePath);
    response.writeHead(200, {
      'Content-Type': CONTENT_TYPES[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    response.end(content);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    sendError(response, 404, 'Recurso no encontrado.');
  }
}

function sendError(response, statusCode, message, details) {
  if (response.headersSent) return response.end();
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify({ error: { message, ...(details && { details }) } }));
}

module.exports = createRequestHandler;
