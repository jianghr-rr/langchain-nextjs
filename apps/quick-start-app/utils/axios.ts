/* eslint-disable @typescript-eslint/no-unsafe-call */
import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from 'axios';
import type { CustomAxiosResponse } from '~types/request.types';

export const instanceCRUD = axios.create({
  baseURL: '/api/',
  withCredentials: true,
});

// 添加请求拦截器
instanceCRUD.interceptors.request.use(
  (config) => {
    // 可以在这里添加通用的请求处理逻辑，例如设置 token
    return config;
  },
  (error) => {
    // 处理请求错误
    return Promise.reject(error);
  }
);

// 添加响应拦截器
instanceCRUD.interceptors.response.use(
  <T>(
    response: AxiosResponse<CustomAxiosResponse<T>>
  ): AxiosResponse<CustomAxiosResponse<T>> | Promise<never> => {
    const { code, msg } = response.data;
    // 如果是自定义的业务逻辑错误
    if (code !== 0) {
      return Promise.reject(new Error(msg ?? '业务逻辑错误'));
    }
    // 返回正常响应
    return response;
  },
  (error: AxiosError): Promise<never> => {
    const { response } = error;

    // 如果有响应错误，处理具体的 HTTP 状态码
    if (response) {
      const status = response.status;
      switch (status) {
        case 400:
          console.error('请求错误 (400)');
          break;
        case 401:
          console.error('未授权，请登录 (401)');
          break;
        case 403:
          console.error('拒绝访问 (403)');
          break;
        case 404:
          console.error('请求地址出错 (404)');
          break;
        case 500:
          console.error('服务器内部错误 (500)');
          break;
        default:
          console.error(`连接错误 (${status})`);
      }
    } else {
      // 无响应错误，可能是网络问题
      console.error('网络连接错误，请稍后重试');
    }
    return Promise.reject(error); // 抛出错误供调用方捕获
  }
);

// 封装 post 请求，使其返回 CustomAxiosResponse 类型
export const postInstanceCRUD = <T = undefined, D = unknown>(
  url: string,
  data?: T, // 允许传递请求体（POST 请求）
  config?: AxiosRequestConfig // 允许传递其他配置项
): Promise<AxiosResponse<CustomAxiosResponse<D>>> => {
  console.log('postInstanceCRUD', url, data, config);
  return instanceCRUD.post(url, data, config);
};
