"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("../config");
class RedisServices {
    constructor() {
        this.eventQueue = new Map();
        this.client = new ioredis_1.default(config_1.config.redisUrl);
        this.client.on("connect", () => console.log("✅ Redis recommend connected"));
        this.client.on("error", (err) => console.error("❌ Redis recommend error:", err));
    }
    addToQueue(userId, event) {
        if (!this.eventQueue.has(userId)) {
            this.eventQueue.set(userId, []);
        }
        const queue = this.eventQueue.get(userId);
        if (!queue) {
            return;
        }
        queue.push(event);
    }
    getQueue(userId) {
        return this.eventQueue.get(userId) || [];
    }
    clearQueue(userId) {
        this.eventQueue.delete(userId);
    }
    async addRecommend(userId, productId) {
        const key = `Recommend:${userId}`;
        await this.client.lpush(key, productId);
        await this.client.ltrim(key, 0, 49);
        await this.client.expire(key, 60 * 60 * 24 * 15);
    }
    async getRecentRecommend(userId) {
        return await this.client.lrange(`Recommend:${userId}`, 0, 49);
    }
    async setRecommendationData(userId, data) {
        await this.client.setex(`recommend:${userId}`, 60 * 60 * 24, JSON.stringify(data));
    }
    async getRecommendation(userId) {
        const data = await this.client.get(`recommend:${userId}`);
        return data ? JSON.parse(data) : null;
    }
    async disconnect() {
        await this.client.quit();
    }
}
exports.redisService = new RedisServices();
//# sourceMappingURL=redis.service.js.map