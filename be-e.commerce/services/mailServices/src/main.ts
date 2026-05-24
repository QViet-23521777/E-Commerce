import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe, Logger } from "@nestjs/common";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";

async function bootstrap(): Promise<void> {
  const logger = new Logger();

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || "amqp://localhost:5672"],
      queue: "mail_queue",
      queueOptions: { durable: true },
    },
  });

  await app.listen(3002);
  logger.log("Mail Service running on port 3002");

  app.startAllMicroservices().catch(() => {
    logger.warn("RabbitMQ not available, running HTTP only");
  });
}

bootstrap();
