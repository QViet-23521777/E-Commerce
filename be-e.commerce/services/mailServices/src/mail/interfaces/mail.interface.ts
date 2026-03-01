export interface MailInterface {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface VerifyEmailInterface {
  name: string;
  email: string;
  verifyUrl: string;
}

export interface ResetPasswordEmailInterface {
  name: string;
  email: string;
  token: string;
  expriedAt: Date;
  OTP: string;
}

export interface MailResultInterface {
  success: boolean;
  message: string;
}
