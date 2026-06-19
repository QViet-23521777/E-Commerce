import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe, Logger } from "@nestjs/common";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";

async function bootstrap(): Promise<void> {
  const logger = new Logger();

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: "mail-service",
        brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
      },
      consumer: {
        groupId: "mail-service-consumer",
      },
    },
  });

  await app.listen(3002);
  logger.log("Mail Service running on port 3002");

  app.startAllMicroservices().catch(() => {
    logger.warn("Kafka not available, running HTTP only");
  });
}

bootstrap();
