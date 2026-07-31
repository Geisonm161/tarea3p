const { randomUUID } = require('node:crypto');
const AppError = require('../errors/AppError');

const VALID_STATUSES = new Set(['pending', 'in-progress', 'completed']);
const VALID_PRIORITIES = new Set(['low', 'medium', 'high']);

class TaskService {
  constructor(repository) {
    this.repository = repository;
  }

  async list({ search = '', status = 'all' } = {}) {
    if (status !== 'all' && !VALID_STATUSES.has(status)) {
      throw new AppError('El estado indicado no es válido.', 400);
    }

    const normalizedSearch = search.trim().toLocaleLowerCase('es');
    const tasks = await this.repository.findAll();

    return tasks
      .filter((task) => status === 'all' || task.status === status)
      .filter((task) => {
        if (!normalizedSearch) return true;
        return `${task.title} ${task.description}`
          .toLocaleLowerCase('es')
          .includes(normalizedSearch);
      })
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
  }

  async getById(id) {
    const task = await this.repository.findById(id);
    if (!task) throw new AppError('La tarea no existe.', 404);
    return task;
  }

  async create(input) {
    const values = this.#validate(input);
    const now = new Date().toISOString();
    return this.repository.create({
      id: randomUUID(),
      ...values,
      createdAt: now,
      updatedAt: now,
    });
  }

  async update(id, input) {
    await this.getById(id);
    const values = this.#validate(input);
    return this.repository.update(id, {
      ...values,
      updatedAt: new Date().toISOString(),
    });
  }

  async delete(id) {
    const deletedTask = await this.repository.delete(id);
    if (!deletedTask) throw new AppError('La tarea no existe.', 404);
    return deletedTask;
  }

  #validate(input = {}) {
    const title = typeof input.title === 'string' ? input.title.trim() : '';
    const description = typeof input.description === 'string' ? input.description.trim() : '';
    const status = typeof input.status === 'string' ? input.status : 'pending';
    const priority = typeof input.priority === 'string' ? input.priority : 'medium';
    const details = {};

    if (title.length < 3 || title.length > 80) {
      details.title = 'El título debe tener entre 3 y 80 caracteres.';
    }
    if (description.length > 300) {
      details.description = 'La descripción no puede exceder 300 caracteres.';
    }
    if (!VALID_STATUSES.has(status)) {
      details.status = 'Selecciona un estado válido.';
    }
    if (!VALID_PRIORITIES.has(priority)) {
      details.priority = 'Selecciona una prioridad válida.';
    }
    if (Object.keys(details).length > 0) {
      throw new AppError('Revisa los datos ingresados.', 400, details);
    }

    return { title, description, status, priority };
  }
}

module.exports = TaskService;
