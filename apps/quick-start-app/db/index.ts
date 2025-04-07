import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

if (
  !process.env.MYSQL_HOST ||
  !process.env.MYSQL_POST ||
  !process.env.MYSQL_USER ||
  !process.env.MYSQL_PASSWORD ||
  !process.env.MYSQL_DATABASE
) {
  throw new Error('no mysql config');
}

// 创建数据库连接池
const poolConnection = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_POST),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = drizzle(poolConnection);
