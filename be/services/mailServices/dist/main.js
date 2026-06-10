"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
async function bootstrap() {
    const logger = new common_1.Logger();
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.connectMicroservice({
        transport: microservices_1.Transport.RMQ,
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
