// null   = critical service — không thể fake, báo lỗi thẳng cho client
// object = warning/info service — trả giá trị mặc định, hệ thống vẫn chạy được
export const SERVICE_FALLBACKS: Record<string, object | null> = {
  "user-service":      null,
  "inventory-service": null,
  "payment-service":   null,

  "promotion-service": {
    success: true,
    data: { discount: 0, promotions: [], message: "Khuyến mãi tạm thời không khả dụng" },
  },
  "activity-service": {
    success: true,
    data: { activities: [], recommendations: [], message: "Gợi ý tạm thời không khả dụng" },
  },
  "chat-service": {
    success: true,
    data: { messages: [], unread: 0, message: "Chat tạm thời không khả dụng" },
  },
  "mail-service": {
    success: true,
    data: { queued: true, message: "Email sẽ được gửi khi hệ thống phục hồi" },
  },
};