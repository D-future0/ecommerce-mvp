import { Resend } from "resend";
import { formatPrice } from "@/lib/format";

const FROM = process.env.RESEND_FROM_EMAIL || "orders@example.com";

let client: Resend | null = null;
function getClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

interface OrderEmailItem {
  title: string;
  variant?: string;
  price: number;
  quantity: number;
}

interface OrderEmailData {
  to: string;
  customerName: string;
  reference: string;
  items: OrderEmailItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  currency: string;
  deliveryMethod?: "store_pickup" | "delivery";
  deliveryType?: "store_pickup" | "door_to_door" | "terminal_pickup";
  shippingAddress: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    lga?: string;
  };
}

function itemsRows(items: OrderEmailItem[], currency: string) {
  return items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #E4E2DC;">
            ${item.title}${item.variant ? ` (${item.variant})` : ""} × ${item.quantity}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #E4E2DC;text-align:right;">
            ${formatPrice(item.price * item.quantity, currency)}
          </td>
        </tr>`
    )
    .join("");
}

function emailShell(title: string, body: string) {
  return `
    <div style="font-family:Georgia,serif;color:#111111;max-width:520px;margin:0 auto;padding:24px;">
      <h1 style="font-size:22px;font-weight:normal;">${title}</h1>
      ${body}
    </div>
  `;
}

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  const resend = getClient();
  if (!resend) return;

  const body = `
    <p>Hi ${data.customerName || "there"}, thanks for your order — we've received your payment and we're getting it ready.</p>
    <p style="color:#8A8578;font-size:13px;">Reference: ${data.reference}</p>

    <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
      ${itemsRows(data.items, data.currency)}
    </table>

    <table style="width:100%;font-size:14px;margin-top:8px;">
      <tr><td style="color:#8A8578;">Subtotal</td><td style="text-align:right;">${formatPrice(data.subtotal, data.currency)}</td></tr>
      <tr><td style="color:#8A8578;">Shipping</td><td style="text-align:right;">${formatPrice(data.shippingFee, data.currency)}</td></tr>
      <tr><td style="font-size:16px;padding-top:8px;">Total</td><td style="text-align:right;font-size:16px;padding-top:8px;">${formatPrice(data.total, data.currency)}</td></tr>
    </table>

    <p style="margin-top:24px;font-size:14px;color:#8A8578;">${data.deliveryMethod === "store_pickup" || data.deliveryType === "store_pickup" ? "Pickup from store" : "Shipping to"}</p>
    <p style="font-size:14px;">
      ${data.deliveryMethod === "store_pickup" || data.deliveryType === "store_pickup" ? "MVP Store pickup desk, Lagos, Nigeria" : `${data.shippingAddress.line1}${data.shippingAddress.line2 ? `, ${data.shippingAddress.line2}` : ""}<br/>${data.shippingAddress.city}, ${data.shippingAddress.state}${data.shippingAddress.lga ? `, ${data.shippingAddress.lga}` : ""}, ${data.shippingAddress.country}`}
    </p>
  `;

  await resend.emails.send({
    from: FROM,
    to: data.to,
    subject: `Order confirmed — ${data.reference}`,
    html: emailShell("Order confirmed", body),
  });
}

export async function sendShippingUpdateEmail(params: {
  to: string;
  customerName: string;
  reference: string;
  status: "shipped" | "delivered";
}) {
  const resend = getClient();
  if (!resend) return;

  const copy =
    params.status === "shipped"
      ? "Your order is on its way."
      : "Your order has been marked as delivered — we hope you love it.";

  const body = `
    <p>Hi ${params.customerName || "there"}, ${copy}</p>
    <p style="color:#8A8578;font-size:13px;">Reference: ${params.reference}</p>
  `;

  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: params.status === "shipped" ? `Your order has shipped — ${params.reference}` : `Order delivered — ${params.reference}`,
    html: emailShell(params.status === "shipped" ? "Order shipped" : "Order delivered", body),
  });
}
