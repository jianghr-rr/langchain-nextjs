import type { ResponseCode } from '~/types/request.types';

class CustomError {
  msg: string;
  code: (typeof ResponseCode)[keyof typeof ResponseCode];

  constructor(
    msg: string,
    statusCode: (typeof ResponseCode)[keyof typeof ResponseCode] = 1001 as (typeof ResponseCode)[keyof typeof ResponseCode]
  ) {
    this.msg = msg;
    this.code = statusCode;
  }
}

export default CustomError;
export { CustomError };
