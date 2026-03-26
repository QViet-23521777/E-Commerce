"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kafkaConsumerService = void 0;
const kafkajs_1 = require("kafkajs");
const config_1 = require("../config");
const ACTIVITY_WEIGHT = {
    view: 1,
    search: 2,
    click: 3,
    buy: 5,
};
class KafkaConsumerService {
    constructor() {
        this.kafka = new kafkajs_1.Kafka({
            clientId: "inventory-service",
            brokers: [config_1.config.kafkaBroker],
            logLevel: kafkajs_1.logLevel.WARN,
        });
        this.consumer = this.kafka.consumer({
            groupId: "inventory-group",
        });
    }
    async connect() {
        await this.consumer.connect();
        await this.consumer.subscribe({
            topic: config_1.config.kafkaTopic,
            fromBeginning: false,
        });
        await this.consumer.run({
            eachMessage: async ({ message }) => {
                try {
                    const batch = JSON.parse(message.value?.toString() || "{}");
                    const { userId, events, totalEvents } = batch;
                    if (!userId || !events || !Array.isArray(events))
                        return;
                    console.log(`📦 Nhận batch ${totalEvents} events từ user: ${userId}`);
                }
                catch (error) {
                    console.error("❌ Kafka message error:", error);
                }
            },
        });
        console.log("✅ Kafka consumer connected");
    }
    async disconnect() {
        await this.consumer.disconnect();
    }
}
exports.kafkaConsumerService = new KafkaConsumerService();
//# sourceMappingURL=kafkaConsumer.service.js.map