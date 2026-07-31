class TaskController {
  constructor(service) {
    this.service = service;
  }

  list = async (request, response, url) => {
    const tasks = await this.service.list({
      search: url.searchParams.get('search') || '',
      status: url.searchParams.get('status') || 'all',
      sort: url.searchParams.get('sort') || 'newest',
    });
    this.#sendJson(response, 200, { data: tasks });
  };

  get = async (_request, response, _url, id) => {
    const task = await this.service.getById(id);
    this.#sendJson(response, 200, { data: task });
  };

  create = async (request, response) => {
    const input = await this.#readJson(request);
    const task = await this.service.create(input);
    this.#sendJson(response, 201, { data: task });
  };

  update = async (request, response, _url, id) => {
    const input = await this.#readJson(request);
    const task = await this.service.update(id, input);
    this.#sendJson(response, 200, { data: task });
  };

  delete = async (_request, response, _url, id) => {
    await this.service.delete(id);
    response.writeHead(204);
    response.end();
  };

  async #readJson(request) {
    const chunks = [];
    let size = 0;

    for await (const chunk of request) {
      size += chunk.length;
      if (size > 1_000_000) {
        const error = new Error('El cuerpo de la solicitud es demasiado grande.');
        error.statusCode = 413;
        throw error;
      }
      chunks.push(chunk);
    }

    try {
      return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    } catch {
      const error = new Error('El cuerpo de la solicitud debe ser JSON válido.');
      error.statusCode = 400;
      throw error;
    }
  }

  #sendJson(response, statusCode, payload) {
    response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(payload));
  }
}

module.exports = TaskController;
