const http = require('node:http');
const config = require('./config');
const TaskRepository = require('./repositories/TaskRepository');
const TaskService = require('./services/TaskService');
const TaskController = require('./controllers/TaskController');
const createRequestHandler = require('./http/createRequestHandler');

function createApp(options = {}) {
  const repository = new TaskRepository(options.dataFile || config.dataFile);
  const service = new TaskService(repository);
  const controller = new TaskController(service);
  const handler = createRequestHandler({
    taskController: controller,
    publicDirectory: options.publicDirectory || config.publicDirectory,
  });

  return http.createServer(handler);
}

module.exports = createApp;
