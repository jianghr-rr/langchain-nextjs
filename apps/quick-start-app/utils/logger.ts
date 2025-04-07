import path from 'path';
import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logDir = '../logs'; // 日志存储目录 部署后的地址 /app/logs

const logger = createLogger({
  level: 'info',
  format: format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new DailyRotateFile({
      dirname: logDir, // 日志存储目录
      filename: 'application-%DATE%.log', // 文件名格式
      datePattern: 'YYYY-MM-DD', // 按日期轮转
      maxSize: '20m', // 单个日志文件大小限制
      maxFiles: '14d', // 最长保留 14 天的日志
    }),
    //
    // - Write all logs with importance level of `error` or higher to `error.log`
    //   (i.e., error, fatal, but not other levels)
    //
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),
    //
    // - Write all logs with importance level of `info` or higher to `combined.log`
    //   (i.e., fatal, error, warn, and info, but not trace)
    //
    new transports.File({ filename: path.join(logDir, 'combined.log') }),
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.simple(),
    })
  );
}

export default logger;
export { logger };
