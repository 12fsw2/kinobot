import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

const logLevel = process.env.LOG_LEVEL || 'info';
const logsDir = path.join(process.cwd(), 'logs');

const fileRotateTransport = new (winston.transports as any).DailyRotateFile({
  filename: path.join(logsDir, 'bot-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  level: logLevel,
});

const errorFileTransport = new (winston.transports as any).DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
});

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `[${timestamp}] ${level}: ${message} ${metaStr}`;
        })
      ),
    }),
    fileRotateTransport,
    errorFileTransport,
  ],
});

export default logger;
