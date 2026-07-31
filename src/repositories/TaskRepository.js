const fs = require('node:fs/promises');
const path = require('node:path');

class TaskRepository {
  constructor(filePath) {
    this.filePath = filePath;
    this.writeQueue = Promise.resolve();
  }

  async findAll() {
    return this.#readTasks();
  }

  async findById(id) {
    const tasks = await this.#readTasks();
    return tasks.find((task) => task.id === id) || null;
  }

  async create(task) {
    return this.#update((tasks) => {
      tasks.push(task);
      return task;
    });
  }

  async update(id, changes) {
    return this.#update((tasks) => {
      const index = tasks.findIndex((task) => task.id === id);
      if (index === -1) return null;

      tasks[index] = { ...tasks[index], ...changes };
      return tasks[index];
    });
  }

  async delete(id) {
    return this.#update((tasks) => {
      const index = tasks.findIndex((task) => task.id === id);
      if (index === -1) return null;

      return tasks.splice(index, 1)[0];
    });
  }

  async #readTasks() {
    try {
      const content = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.writeFile(this.filePath, '[]\n', 'utf8');
      return [];
    }
  }

  #update(operation) {
    const pendingWrite = this.writeQueue.then(async () => {
      const tasks = await this.#readTasks();
      const result = operation(tasks);
      await this.#writeTasks(tasks);
      return result;
    });

    this.writeQueue = pendingWrite.catch(() => undefined);
    return pendingWrite;
  }

  async #writeTasks(tasks) {
    const temporaryFile = `${this.filePath}.tmp`;
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(temporaryFile, `${JSON.stringify(tasks, null, 2)}\n`, 'utf8');
    await fs.rename(temporaryFile, this.filePath);
  }
}

module.exports = TaskRepository;
