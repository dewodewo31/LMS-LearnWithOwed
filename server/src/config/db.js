const mongoose = require('mongoose');

const connectDB = async (uri) => {
  // express-mongo-sanitize handles operator injection at the request boundary
  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  return conn;
};

const disconnectDB = async () => {
  await mongoose.disconnect();
};

module.exports = { connectDB, disconnectDB };
