"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startHealthMonitor = startHealthMonitor;
exports.stopHealthMonitor = stopHealthMonitor;
exports.getHealthStatus = getHealthStatus;
const axios_1 = __importDefault(require("axios"));
const SERVICES = [
    {
        name: "user-service",
        url: `${process.env.USER_SERVICE_URL}/health` ||
            "http://localhost:3001/health",
    },
    {
        name: "mail-service",
        url: `${process.env.MAIL_SERVICE_URL}/health` ||
            "http://localhost:3002/health",
    },
    {
        name: "inventory-service",
        url: `${process.env.INVENTORY_SERVICE_URL || process.env.PRODUCT_SERVICE_URL}/health` ||
            "http://localhost:3003/health",
    },
    {
        name: "activity-service",
        url: `${process.env.ACTIVITY_SERVICE_URL}/health` ||
            "http://localhost:3004/health",
    },
];
const PING_INTERVAL_MS = 30000;
const PING_TIMEOUT_MS = 5000;
const RETRY_DELAY_MS = 5000;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || "";
// ─── Severity theo từng service ──────────────────────────────────────────────
// critical  → alert ngay, ảnh hưởng mua hàng
// warning   → alert nhẹ, hệ thống vẫn chạy được
// info      → chỉ log, không alert
const SERVICE_SEVERITY = {
    "user-service": "critical",
    "inventory-service": "critical",
    "mail-service": "info",
    "activity-service": "warning",
};
const serviceStatuses = new Map(SERVICES.map((s) => [
    s.name,
    {
        name: s.name,
        url: s.url,
        status: "unknown",
        lastChecked: new Date(),
        lastHealthyAt: new Date(),
        failCount: 0,
        alerted: false,
    },
]));
async function pingService(url) {
    try {
        const res = await axios_1.default.get(url, { timeout: PING_TIMEOUT_MS });
        const bodyOk = res.data?.status == "ok" ||
            res.data?.status == "healthy" ||
            res.data?.status == "OK";
        return {
            ok: res.status == 200 && (bodyOk || res.data?.status == "undefined"),
            status: res.status,
        };
    }
    catch (err) {
        const reason = err.code === "ECONNABORTED"
            ? `Timeout sau ${PING_TIMEOUT_MS}ms`
            : err.code === "ECONNREFUSED"
                ? "Connection refused"
                : err.message || "Unknown error";
        return { ok: false, reason };
    }
}
async function sendSlackAlert(state, reason) {
    if (!SLACK_WEBHOOK_URL) {
        console.warn("[Alert] SLACK_WEBHOOK_URL chưa được cấu hình");
        return;
    }
    const serverity = SERVICE_SEVERITY[state.name] || "warning";
    const emoji = serverity === "critical" ? "🚨" : serverity === "warning" ? "⚠️" : "ℹ️";
    const downSince = state.lastHealthyAt
        ? `Down từ: ${state.lastHealthyAt.toISOString()}`
        : "Chưa từng healthy trong session này";
    const impact = {
        "user-service": "Người dùng KHÔNG thể đăng nhập / đăng ký",
        "inventory-service": "Buyer KHÔNG thể xem / mua hàng",
        "mail-service": "Email OTP và thông báo bị gián đoạn",
        "activity-service": "Gợi ý sản phẩm tạm dừng — mua hàng vẫn OK",
    };
    const payload = {
        text: `${emoji} *[${serverity.toUpperCase()}] ${state.name} DOWN*`,
        blocks: [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: `${emoji} ${state.name} không phản hồi`,
                },
            },
            {
                type: "section",
                fields: [
                    { type: "mrkdwn", text: `*Service:*\n\`${state.name}\`` },
                    { type: "mrkdwn", text: `*Mức độ:*\n${serverity.toUpperCase()}` },
                    { type: "mrkdwn", text: `*Lý do:*\n${reason}` },
                    { type: "mrkdwn", text: `*Thời gian:*\n${new Date().toISOString()}` },
                    { type: "mrkdwn", text: `*Tình trạng:*\n${downSince}` },
                    {
                        type: "mrkdwn",
                        text: `*Ảnh hưởng:*\n${impact[state.name] || "Không xác định"}`,
                    },
                ],
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*Hành động:* Kiểm tra logs → \`docker logs ${state.name}\`\nRestart → \`docker restart ${state.name}\``,
                },
            },
        ],
    };
    try {
        await axios_1.default.post(SLACK_WEBHOOK_URL, payload, { timeout: 5000 });
        console.log(`[Alert] Đã gửi Slack alert cho ${state.name}`);
    }
    catch (err) {
        console.error(`[Alert] Gửi Slack thất bại: ${err.message}`);
    }
}
async function sendRecoveryAlert(serviceName) {
    if (!SLACK_WEBHOOK_URL)
        return;
    try {
        await axios_1.default.post(SLACK_WEBHOOK_URL, {
            text: `✅ *[RECOVERED] ${serviceName}* đã hoạt động trở lại lúc ${new Date().toISOString()}`,
        }, { timeout: 5000 });
    }
    catch { }
}
async function dispatchAlert(state, reason) {
    const severity = SERVICE_SEVERITY[state.name] || "warning";
    if (severity === "info") {
        console.log(`[HealthMonitor] INFO: ${state.name} down — ${reason} (không alert)`);
        return;
    }
    await sendSlackAlert(state, reason);
}
async function handlePingResult(svc, ok, reason) {
    const state = serviceStatuses.get(svc.name);
    if (!state)
        return;
    state.lastChecked = new Date();
    if (ok) {
        const wasDown = state.status === "down" || state.status === "degraded";
        state.status = "healthy";
        state.lastHealthyAt = new Date();
        state.failCount = 0;
        if (wasDown && state.alerted) {
            console.log(`[HealthMonitor] ✅ ${svc.name} đã phục hồi`);
            await sendRecoveryAlert(svc.name);
            state.alerted = false;
        }
        return;
    }
    console.warn(`[HealthMonitor] ⚠ ${svc.name} fail lần 1 — ${reason}. Retry sau ${RETRY_DELAY_MS}ms...`);
    await delay(RETRY_DELAY_MS);
    const retry = await pingService(svc.url);
    if (retry.ok) {
        console.log(`[HealthMonitor] ✅ ${svc.name} đã phục hồi sau retry`);
        state.status = "healthy";
        state.lastHealthyAt = new Date();
        state.failCount = 0;
        return;
    }
    state.status = "down";
    state.failCount += 1;
    const finalReason = retry.reason || reason || "Unknown";
    console.error(`[HealthMonitor] 🚨 ${svc.name} DOWN (fail ${state.failCount} lần) — ${finalReason}`);
    if (!state.alerted) {
        state.alerted = true;
        await dispatchAlert(state, finalReason);
    }
    else {
        console.log(`[HealthMonitor] ${svc.name} vẫn down — alert đã gửi trước đó, bỏ qua`);
    }
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function checkAllServices() {
    console.log(`[HealthMonitor] Ping ${SERVICES.length} services lúc ${new Date().toISOString()}`);
    await Promise.allSettled(SERVICES.map(async (svc) => {
        const { ok, reason } = await pingService(svc.url);
        await handlePingResult(svc, ok, reason);
    }));
}
let monitorInterval = null;
function startHealthMonitor() {
    console.log(`[HealthMonitor] Bắt đầu — ping mỗi ${PING_INTERVAL_MS / 1000}s`);
    checkAllServices(); // Ping ngay khi start
    monitorInterval = setInterval(checkAllServices, PING_INTERVAL_MS);
}
function stopHealthMonitor() {
    if (monitorInterval) {
        clearInterval(monitorInterval);
        monitorInterval = null;
        console.log(`[HealthMonitor] Đã dừng`);
    }
}
function getHealthStatus() {
    const status = {};
    for (const [name, svc] of serviceStatuses) {
        status[name] = {
            status: svc.status,
            lastChecked: svc.lastChecked,
            lastHealthyAt: svc.lastHealthyAt,
            failCount: svc.failCount,
            severity: SERVICE_SEVERITY[name] || "warning",
        };
    }
    return status;
}
