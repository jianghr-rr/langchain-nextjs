/**
 * @file 后端返回的接口的type
 * @author 姜浩然
 */

// 状态码常量定义（1为成功）
const ResponseCode = {
  SUCCESS: 0,
  ERROR: 1,
  ILLEGAL_ARGUMENT: 2,
  NEED_LOGIN: 10,
  BUSINESS_ERROR: 1001,
  DATABASE_ERROR: 2001,
} as const;

// Axios 的响应数据格式，扩展 ApiResponse 类型
interface CustomAxiosResponse<T> {
  code: (typeof ResponseCode)[keyof typeof ResponseCode]; // 状态码（1成功，0失败）
  msg?: string; // 消息，存在表示业务失败
  data?: T | null; // 返回的数据，可能为空
}

export type { CustomAxiosResponse };
export type { ResponseCode };
