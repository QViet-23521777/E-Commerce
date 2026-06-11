import CircuitBreaker from "opossum";

const breakers = new Map<string, CircuitBreaker>();

async function doFetch(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 4500);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
    return res;
  } finally {
    clearTimeout(id);
  }
}

export function getBreaker(serviceName: string): CircuitBreaker {
  if (breakers.has(serviceName)) return breakers.get(serviceName)!;

  const breaker = new CircuitBreaker(doFetch, {
    timeout: 5000,                 // sau 5s không trả lời → thất bại
    errorThresholdPercentage: 50,  // 50% request lỗi trong window → trip
    resetTimeout: 30000,           // sau 30s tự thử lại (HALF-OPEN)
    volumeThreshold: 5,            // cần ít nhất 5 request mới tính tỉ lệ lỗi
  });

  breaker.on("open",     () => console.error(`[CircuitBreaker] 🔴 ${serviceName} OPEN — fail fast`));
  breaker.on("halfOpen", () => console.warn(`[CircuitBreaker]  🟡 ${serviceName} HALF-OPEN — thử lại`));
  breaker.on("close",    () => console.log(`[CircuitBreaker]  🟢 ${serviceName} CLOSED — hoạt động bình thường`));

  breakers.set(serviceName, breaker);
  return breaker;
}