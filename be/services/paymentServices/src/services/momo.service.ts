import crypto from "crypto";

type MomoCreateRequest = {
  requestId: string;
  orderId: string;
  amount: number;
  orderInfo: string;
  redirectUrl: string;
  ipnUrl: string;
  extraData: string;
  lang: string;
  requestType: string;
  autoCapture: boolean;
};

type MomoCreateResponse = Record<string, unknown> & {
  resultCode?: number;
  message?: string;
  payUrl?: string;
  deeplink?: string;
  qrCodeUrl?: string;
};

type MomoIpnPayload = {
  amount: number;
  extraData: string;
  message: string;
  orderId: string;
  orderInfo: string;
  orderType?: string;
  partnerCode: string;
  payType?: string;
  requestId: string;
  responseTime: number;
  resultCode: number;
  signature: string;
  transId: number;
};

const readRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not configured`);
  }

  return value;
};

const sign = (rawSignature: string): string => {
  const secretKey = readRequiredEnv("MOMO_SECRET_KEY");
  return crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");
};

export const getMomoPartnerCode = (): string => readRequiredEnv("MOMO_PARTNER_CODE");

export const createMomoPayment = async (
  payload: MomoCreateRequest,
): Promise<MomoCreateResponse> => {
  const partnerCode = getMomoPartnerCode();
  const accessKey = readRequiredEnv("MOMO_ACCESS_KEY");
  const endpoint = (process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn").replace(
    /\/$/,
    "",
  );
  const createPath = process.env.MOMO_CREATE_PATH || "/v2/gateway/api/create";
  const partnerName = process.env.MOMO_PARTNER_NAME;
  const storeId = process.env.MOMO_STORE_ID;

  const rawSignature =
    `accessKey=${accessKey}` +
    `&amount=${payload.amount}` +
    `&extraData=${payload.extraData}` +
    `&ipnUrl=${payload.ipnUrl}` +
    `&orderId=${payload.orderId}` +
    `&orderInfo=${payload.orderInfo}` +
    `&partnerCode=${partnerCode}` +
    `&redirectUrl=${payload.redirectUrl}` +
    `&requestId=${payload.requestId}` +
    `&requestType=${payload.requestType}`;

  const requestBody = {
    partnerCode,
    accessKey,
    requestId: payload.requestId,
    amount: String(payload.amount),
    orderId: payload.orderId,
    orderInfo: payload.orderInfo,
    redirectUrl: payload.redirectUrl,
    ipnUrl: payload.ipnUrl,
    extraData: payload.extraData,
    requestType: payload.requestType,
    lang: payload.lang,
    autoCapture: payload.autoCapture,
    signature: sign(rawSignature),
    ...(partnerName ? { partnerName } : {}),
    ...(storeId ? { storeId } : {}),
  };

  const response = await fetch(`${endpoint}${createPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const data = (await response.json()) as MomoCreateResponse;

  if (!response.ok) {
    throw new Error(
      (typeof data.message === "string" && data.message) ||
        `MoMo create request failed with status ${response.status}`,
    );
  }

  return data;
};

export const verifyMomoIpnSignature = (payload: MomoIpnPayload): boolean => {
  const accessKey = readRequiredEnv("MOMO_ACCESS_KEY");
  const rawSignature =
    `accessKey=${accessKey}` +
    `&amount=${payload.amount}` +
    `&extraData=${payload.extraData ?? ""}` +
    `&message=${payload.message ?? ""}` +
    `&orderId=${payload.orderId}` +
    `&orderInfo=${payload.orderInfo ?? ""}` +
    `&orderType=${payload.orderType ?? ""}` +
    `&partnerCode=${payload.partnerCode}` +
    `&payType=${payload.payType ?? ""}` +
    `&requestId=${payload.requestId}` +
    `&responseTime=${payload.responseTime}` +
    `&resultCode=${payload.resultCode}` +
    `&transId=${payload.transId}`;

  return sign(rawSignature) === payload.signature;
};
