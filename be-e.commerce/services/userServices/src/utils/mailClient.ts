import axios from "axios";

const MAIL_SERVICE_URL =
  process.env.MAIL_SERVICE_URL || "http://localhost:3002";

export const mailClient = {
  sendVerifyEmail: (email: string, name: string, verifyUrl: string) =>
    axios.post(`${MAIL_SERVICE_URL}/verify-email`, {
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
    axios.post(`${MAIL_SERVICE_URL}/reset-password`, {
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
    axios.post(`${MAIL_SERVICE_URL}/send_login_notification_email`, {
      email,
      name,
      otp,
      expiredAt,
    }),
};
