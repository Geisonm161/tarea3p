const path = require('node:path');

module.exports = {
  port: Number(process.env.PORT) || 3000,
  dataFile: process.env.DATA_FILE || path.join(__dirname, '..', 'data', 'tasks.json'),
  publicDirectory: path.join(__dirname, '..', 'public'),
};
