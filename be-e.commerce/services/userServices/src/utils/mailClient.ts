import axios from "axios";

const MAIL_SERVICE_URL =
  process.env.MAIL_SERVICE_URL || "http://localhost:3002";

export const mailClient = {
  sendVerifyEmail: (email: string, name: string, verifyUrl: string) =>
    axios.post(`${MAIL_SERVICE_URL}/test/verify-email`, {
      email,
      name,
      verifyUrl,
    }),

  sendResetPassword: (
    email: string,
    name: string,
    token: string,
    otp: string,
    expiredAt: string,
  ) =>
    axios.post(`${MAIL_SERVICE_URL}/test/reset-password`, {
      email,
      name,
      token,
      otp,
      expiredAt,
    }),

  sendLoginEmail: (
    email: string,
    name: string,
    otp: string,
    expiredAt: string,
  ) =>
    axios.post(`${MAIL_SERVICE_URL}/test/login-notification`, {
      email,
      name,
      otp,
      expiredAt,
    }),
};
