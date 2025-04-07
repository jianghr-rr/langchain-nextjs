import type { TFunction } from 'i18next';
import {
  ResponseCode,
  type ServerResponseType,
  type ResponseCodeCodes,
} from '~types/response.types';

export class ServerResponse<T> {
  private code: ResponseCodeCodes;
  private msg?: string;
  private data?: T;
  private static t: TFunction;

  private constructor(code: ResponseCodeCodes, msg?: string, data?: T) {
    this.code = code;
    this.msg = msg;
    this.data = data;
  }

  // 检查是否成功
  isSuccess(): boolean {
    return this.code === ResponseCode.SUCCESS.code;
  }

  getCode(): ResponseCodeCodes {
    return this.code;
  }

  getData(): T | undefined {
    return this.data;
  }

  getMsg(): string | undefined {
    return this.msg;
  }

  static setT(t: TFunction): void {
    this.t = t;
  }

  // 静态工厂方法
  // createSuccess 重载
  static createSuccess<T>(msg: string, data: T): ServerResponseType<T>;
  static createSuccess<T>(data?: T): ServerResponseType<T>;
  static createSuccess<T>(msg: string): ServerResponseType<T>;

  // createSuccess 实现
  static createSuccess<T = undefined>(
    param1?: string | T,
    param2?: T
  ): ServerResponseType<T> {
    if (typeof param1 === 'string' && param2 !== undefined) {
      // 成功：msg 和 data
      const serverRes = new ServerResponse<T>(
        ResponseCode.SUCCESS.code,
        param1,
        param2
      );
      return {
        code: serverRes.getCode(),
        msg: serverRes.getMsg(),
        data: serverRes.getData(),
      };
    } else if (typeof param1 === 'string') {
      // 成功：只有 msg
      const serverRes = new ServerResponse<T>(
        ResponseCode.SUCCESS.code,
        param1
      );
      return {
        code: serverRes.getCode(),
        msg: serverRes.getMsg(),
      };
    } else {
      // 成功：只有 data 或无参数
      const serverRes = new ServerResponse<T>(
        ResponseCode.SUCCESS.code,
        undefined,
        param1
      );
      return {
        code: serverRes.getCode(),
        data: serverRes.getData(),
      };
    }
  }

  // createError 重载
  static createError<T = undefined>(msg?: string): ServerResponseType<T>;
  static createError<T = undefined>(
    errorCode: ResponseCodeCodes,
    errorMsg?: string
  ): ServerResponseType<T>;
  // createError 实现
  static createError<T = undefined>(
    param1?: string | ResponseCodeCodes,
    param2?: string
  ): ServerResponseType<T> {
    if (typeof param1 === 'number') {
      // 错误：errorCode 和 errorMsg
      const serverRes = new ServerResponse<T>(
        param1,
        param2 ? String(param2) : ResponseCode.getDescByCode(param1, this.t)
      );
      return {
        code: serverRes.getCode(),
        msg: serverRes.getMsg(),
      };
    } else {
      // 错误：只有 msg 或无参数
      const serverRes = new ServerResponse<T>(
        ResponseCode.ERROR.code,
        param1
          ? String(param1)
          : ResponseCode.getDescByCode(ResponseCode.ERROR.code, this.t)
      );
      return {
        code: serverRes.getCode(),
        msg: serverRes.getMsg(),
      };
    }
  }
}
