import amqplib from "amqplib";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";

async function publish(pattern: string, data: object): Promise<void> {
  const conn = await amqplib.connect(RABBITMQ_URL);
  const channel = await conn.createChannel();
  await channel.assertQueue("mail_queue", { durable: true });

  const message = JSON.stringify({ pattern, data });
  channel.sendToQueue("mail_queue", Buffer.from(message), { persistent: true });

  await channel.close();
  await conn.close();
}

export const mailClient = {
  sendVerifyEmail: (email: string, name: string, verifyUrl: string) =>
    publish("send_verification_email", { email, name, verifyUrl }),

  sendResetPassword: (
    email: string,
    name: string,
    token: string,
    otp: string,
    expiredAt: string,
  ) => publish("send_reset_password_email", { email, name, token, otp, expiredAt }),

  sendLoginEmail: (
    email: string,
    name: string,
    otp: string,
    expiredAt: string,
  ) => publish("send_login_notification_email", { email, name, otp, expiredAt }),

  sendSellerAccountVerificationEmail: (
    email: string,
    otp: string,
    expiredAt: string,
  ) => publish("send_seller_account_verification_email", { email, otp, expiredAt }),

  sendAdminAccountVerificationEmail: (
    email: string,
    token: string,
    expiredAt: string,
  ) => publish("send_admin_account_email", { email, token, expiredAt }),
};