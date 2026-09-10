const { connectDB, disconnectDB } = require('./config/db');
const config = require('./config/env');
const app = require('./app');

const start = async () => {
  try {
    await connectDB(config.mongoUri);
    console.log(`[db] connected: ${config.mongoUri}`);
    app.listen(config.port, () => console.log(`[api] listening on http://localhost:${config.port}`));
  } catch (err) {
    console.error('[db] connection failed:', err.message);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log(`\n${signal} received, shutting down...`);
  try {
    await disconnectDB();
  } finally {
    process.exit(0);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();
