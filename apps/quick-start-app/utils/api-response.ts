export interface ApiResponse<T> {
  success: boolean; // 请求是否成功
  code: number; // 业务状态码
  message: string; // 描述信息
  data?: T; // 返回的具体数据
  error?: unknown; // 错误信息（仅在失败时存在）
  debug?: DebugInfo; // 调试信息，仅在开发环境返回
}

export interface DebugInfo {
  timestamp: string; // 时间戳
  traceId?: string; // 链路追踪 ID
  stack?: string; // 错误堆栈
}

// 成功响应
export function successResponse<T = undefined>(
  message = 'Success',
  data: T
): ApiResponse<T> {
  return {
    success: true,
    code: 0,
    message,
    data,
  };
}

// 错误响应
export function errorResponse<T = undefined>(
  code: number,
  message: string,
  error?: unknown,
  stack?: string
): ApiResponse<T> {
  const debug: DebugInfo | undefined =
    process.env.NODE_ENV !== 'production'
      ? { timestamp: new Date().toISOString(), stack }
      : undefined;

  return {
    success: false,
    code,
    message,
    error,
    debug,
  };
}
