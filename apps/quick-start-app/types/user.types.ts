// 登录接口参数
export interface ILogin {
  username: string;
  password: string;
}

export interface ISingUp {
  username: string;
  password: string;
  email: string;
  phone: string;
  question: string;
  answer: string;
  role?: number;
  confirmPassword?: string;
}

export interface IUserInfo {
  id: number;
  username: string;
  email: string | null;
  phone: string | null;
  question: string | null;
  answer: string | null;
  role: number | null;
}

export interface IUpdateUserInfo {
  email: string;
  phone: string;
  question: string;
  answer: string;
}
