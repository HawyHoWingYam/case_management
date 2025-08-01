import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const createLoggerConfig = () => {
  const logLevel = process.env.LOG_LEVEL || 'info';
  const nodeEnv = process.env.NODE_ENV || 'development';

  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context, stack }) => {
          const contextStr = context ? `[${context}] ` : '';
          const stackStr = stack ? `\n${stack}` : '';
          return `${timestamp} ${level}: ${contextStr}${message}${stackStr}`;
        }),
      ),
    }),
  ];

  // Add file transports in production
  if (nodeEnv === 'production') {
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      }),
    );
  }

  return WinstonModule.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    transports,
  });
};