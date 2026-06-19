import { Kafka, Producer, logLevel } from "kafkajs";

const kafka = new Kafka({
  clientId: "user-service-mail-producer",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
  logLevel: logLevel.WARN,
});

let producer: Producer | null = null;

async function getProducer(): Promise<Producer> {
  if (!producer) {
    producer = kafka.producer();
    await producer.connect();
  }
  return producer;
}

async function publish(topic: string, data: object): Promise<void> {
  try {
    const p = await getProducer();
    await p.send({
      topic,
      messages: [{ value: JSON.stringify(data) }],
    });
  } catch (err) {
    console.error(`[MailClient] Failed to publish to topic "${topic}":`, err);
  }
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
