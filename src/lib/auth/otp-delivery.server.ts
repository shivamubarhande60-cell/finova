async function sendEmailOtp(email: string, otp: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) throw new Error("Email OTP delivery is not configured");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your FINOVA sign-in code",
      text: `Your FINOVA verification code is ${otp}. It expires in 5 minutes.`,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Email OTP delivery failed");
}

async function msg91(path: "" | "verify", params: Record<string, string>) {
  const authKey = process.env.MSG91_AUTH_KEY?.trim();
  if (!authKey) throw new Error("Mobile OTP delivery is not configured");

  const url = new URL(`https://control.msg91.com/api/v5/otp${path ? `/${path}` : ""}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, {
    method: path ? "GET" : "POST",
    headers: { authkey: authKey, accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  const result = (await response.json().catch(() => null)) as { type?: string } | null;
  return response.ok && result?.type?.toLowerCase() === "success";
}

export async function sendPhoneOtp(phoneNumber: string) {
  const templateId = process.env.MSG91_TEMPLATE_ID?.trim();
  if (!templateId) throw new Error("Mobile OTP template is not configured");
  const sent = await msg91("", {
    template_id: templateId,
    mobile: phoneNumber.replace(/\D/g, ""),
  });
  if (!sent) throw new Error("Mobile OTP delivery failed");
}

export function verifyPhoneOtp(phoneNumber: string, code: string) {
  return msg91("verify", {
    mobile: phoneNumber.replace(/\D/g, ""),
    otp: code,
  });
}

export { sendEmailOtp };