/**
 * 请求返回的封装类
 */
import type { TFunction } from 'i18next';

export type ResponseCodeType = {
  code: ResponseCodeCodes;
  desc: (t: TFunction) => string;
};

export type ServerResponseType<T> = {
  code: ResponseCodeCodes;
  data?: T;
  msg?: string;
};

export const ResponseCodeEnum = {
  SUCCESS: { code: 0, desc: (t: TFunction) => t('success') },
  ERROR: { code: 1, desc: (t: TFunction) => t('error') },
  NEED_LOGIN: { code: 10, desc: (t: TFunction) => t('needLogin') },
  ILLEGAL_ARGUMENT: { code: 2, desc: (t: TFunction) => t('illegalArgument') },
  BUSINESS_ERROR: { code: 1001, desc: (t: TFunction) => t('businessError') },
  DATABASE_ERROR: { code: 2001, desc: (t: TFunction) => t('databaseError') },
} as const; // 使用 `as const` 使对象的字段值成为字面量类型

export class ResponseCode {
  static SUCCESS: ResponseCodeType = ResponseCodeEnum.SUCCESS;
  static ERROR: ResponseCodeType = ResponseCodeEnum.ERROR;
  static NEED_LOGIN: ResponseCodeType = ResponseCodeEnum.NEED_LOGIN;
  static ILLEGAL_ARGUMENT: ResponseCodeType = ResponseCodeEnum.ILLEGAL_ARGUMENT;
  static BUSINESS_ERROR: ResponseCodeType = ResponseCodeEnum.BUSINESS_ERROR;
  static DATABASE_ERROR: ResponseCodeType = ResponseCodeEnum.DATABASE_ERROR;

  // 静态方法可以访问所有枚举值
  static getAllCodes(): ResponseCodeType[] {
    return [
      ResponseCode.SUCCESS,
      ResponseCode.ERROR,
      ResponseCode.NEED_LOGIN,
      ResponseCode.ILLEGAL_ARGUMENT,
      ResponseCode.BUSINESS_ERROR,
      ResponseCode.DATABASE_ERROR,
    ];
  }

  // 根据 code 获取描述
  static getDescByCode(code: number, t: TFunction): string | undefined {
    const entry = this.getAllCodes().find((item) => item.code === code);
    return entry ? entry.desc(t) : undefined;
  }
}

export default ResponseCode;

// 动态提取 code 的联合类型
export type ResponseCodeCodes =
  (typeof ResponseCodeEnum)[keyof typeof ResponseCodeEnum]['code'];
