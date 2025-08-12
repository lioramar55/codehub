import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define format for file logs (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format,
  }),

  // Error log file
  new DailyRotateFile({
    filename: path.join(process.cwd(), 'logs', 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true,
  }),

  // Combined log file
  new DailyRotateFile({
    filename: path.join(process.cwd(), 'logs', 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true,
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: fileFormat,
  transports,
  // Handle uncaught exceptions and unhandled rejections
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(process.cwd(), 'logs', 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(process.cwd(), 'logs', 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),
  ],
});

// Create a stream object for Morgan HTTP logging
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper functions for structured logging
export const logError = (error: Error, context?: string) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
};

export const logInfo = (message: string, meta?: any) => {
  logger.info({
    message,
    ...meta,
    timestamp: new Date().toISOString(),
  });
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn({
    message,
    ...meta,
    timestamp: new Date().toISOString(),
  });
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug({
    message,
    ...meta,
    timestamp: new Date().toISOString(),
  });
};

export const logHttp = (message: string, meta?: any) => {
  logger.http({
    message,
    ...meta,
    timestamp: new Date().toISOString(),
  });
};

// Socket.io specific logging
export const logSocketEvent = (event: string, socketId: string, data?: any) => {
  logger.info({
    message: `Socket Event: ${event}`,
    socketId,
    data,
    type: 'socket',
    timestamp: new Date().toISOString(),
  });
};

export const logSocketError = (
  error: Error,
  socketId: string,
  event?: string
) => {
  logger.error({
    message: `Socket Error: ${error.message}`,
    stack: error.stack,
    socketId,
    event,
    type: 'socket',
    timestamp: new Date().toISOString(),
  });
};

// Database specific logging
export const logDbQuery = (
  query: string,
  params?: any[],
  duration?: number
) => {
  logger.debug({
    message: 'Database Query',
    query,
    params,
    duration: duration ? `${duration}ms` : undefined,
    type: 'database',
    timestamp: new Date().toISOString(),
  });
};

export const logDbError = (error: Error, query?: string, params?: any[]) => {
  logger.error({
    message: `Database Error: ${error.message}`,
    stack: error.stack,
    query,
    params,
    type: 'database',
    timestamp: new Date().toISOString(),
  });
};

export default logger;
