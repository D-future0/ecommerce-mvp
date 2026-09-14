const PAYSTACK_BASE = "https://api.paystack.co";

function headers() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

export interface InitializeResult {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export async function initializeTransaction(params: {
  email: string;
  amountKobo: number; // Paystack expects the smallest currency unit
  reference: string;
  callbackUrl: string;
}): Promise<InitializeResult> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      callback_url: params.callbackUrl,
    }),
  });
  return res.json();
}

export interface VerifyResult {
  status: boolean;
  message: string;
  data?: {
    status: "success" | "failed" | "abandoned";
    reference: string;
    amount: number;
    gateway_response: string;
  };
}

export async function verifyTransaction(reference: string): Promise<VerifyResult> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: headers(),
  });
  return res.json();
}
