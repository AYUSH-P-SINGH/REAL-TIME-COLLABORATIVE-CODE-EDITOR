const socketConfig = require('../config/socket');
const connection = require('./connection');

const setupSockets = (httpServer) => {
  const io = socketConfig.initSocket(httpServer);
  connection.registerSocketHandlers(io);
  return io;
};

module.exports = { setupSockets };
