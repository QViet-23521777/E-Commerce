import { Kafka, Producer, logLevel } from "kafkajs";

const kafka = new Kafka({
  clientId: "payment-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
  logLevel: logLevel.WARN,
});

const producer: Producer = kafka.producer();
let connected = false;

export const connectKafkaProducer = async () => {
  if (connected) return;
  await producer.connect();
  connected = true;
  console.log("Kafka producer connected (payment-service)");
};

export const publishActivityEvents = async (
  userId: string,
  items: { inventoryId: string; productId?: string | null; quantity: number }[],
) => {
  if (!connected) await connectKafkaProducer();

  const topic = process.env.KAFKA_ACTIVITY_TOPIC || "payment.activity";

  await producer.send({
    topic,
    messages: items.map((item) => ({
      key: userId,
      value: JSON.stringify({
        userId,
        activity: "buy",
        inventoryId: item.inventoryId,
        productId: item.productId ?? null,
      }),
    })),
  });
};

export const publishSalesEvent = async (
  items: { inventoryId: string; productId?: string | null; quantity: number }[],
) => {
  if (!connected) await connectKafkaProducer();

  const topic = process.env.KAFKA_PAYMENT_COMPLETED_TOPIC || "payment.completed";

  await producer.send({
    topic,
    messages: items.map((item) => ({
      value: JSON.stringify({
        inventoryId: item.inventoryId,
        productId: item.productId ?? null,
        quantity: item.quantity,
      }),
    })),
  });
};
