import { NextRequest, NextResponse } from "next/server";

const GATEWAY = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const CREATION_CODE = process.env.ADMIN_CREATION_CODE;

export async function POST(request: NextRequest) {
  if (!CREATION_CODE) {
    return NextResponse.json(
      { success: false, message: "SERVER_MISCONFIGURED" },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const { name, email, secretCode } = body as Record<string, string>;

  if (!secretCode || secretCode !== CREATION_CODE) {
    return NextResponse.json(
      { success: false, message: "INVALID_SECRET" },
      { status: 403 },
    );
  }

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json(
      { success: false, message: "Name and email are required" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(`${GATEWAY}/api/admin/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, message: "GATEWAY_UNREACHABLE" },
      { status: 502 },
    );
  }
}
