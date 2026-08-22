import mongoose, { ConnectOptions } from 'mongoose';
// config
import { NODE_ENV,  DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } from '../config.js';
// Utils
import { logger } from '../utils/logger.js';

mongoose.set('strictQuery', true);

// Create the database connection
const options: ConnectOptions = {
  autoIndex: NODE_ENV == "dev" ? true : false,
  autoCreate: NODE_ENV == "dev" ? true : false,
  minPoolSize: 5, // Maintain up to x socket connections
  maxPoolSize: 10, // Maintain up to x socket connections
  connectTimeoutMS: 10 * 1000, // Give up initial connection after 10 seconds
  // socketTimeoutMS: 45 * 1000, // Close sockets after 45 seconds of inactivity
};

const DB_URL = `mongodb://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?authSource=admin`;
// we use top-level await, here
export const conn =  await mongoose.connect(DB_URL, options);

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', () => {
  logger.info('Mongoose default connection open to: ' + DB_URL);
});

// If the connection throws an error
mongoose.connection.on('error', (err) => {
  logger.error(`can't connect to: ${DB_URL}`);
  logger.error('error: ' + err);
  // exit(1) to have PM2 start it again
  process.exit(1);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', () => {
  logger.info('Mongoose default connection disconnected');
});

// If you want to close the connect before terminating the app, use this:
// 
// process.on('SIGINT', async () => {
//   await mongoose.connection.close(true);
//   logger.info(
//     'Mongoose default connection disconnected through app termination',
//   );

//   process.exit(0);
// });

export const connection = mongoose.connection;
