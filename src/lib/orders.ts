import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { Cart } from "@/models/Cart";
import { User } from "@/models/User";
import { sendOrderConfirmationEmail } from "@/lib/email";

/**
 * Marks an order paid and applies the side effects (stock decrement, sold
 * count, cart clear). Safe to call more than once for the same order —
 * Paystack webhooks can be retried, and we also call this from the
 * checkout-return page as a fallback in case the webhook is delayed.
 */
export async function markOrderPaid(reference: string) {
  await connectToDatabase();

  const order = await Order.findOne({ paystackReference: reference });
  if (!order) return null;
  if (order.status === "paid" || order.status === "processing") return order; // already applied

  order.status = "paid";
  order.paidAt = new Date();
  await order.save();

  for (const item of order.items) {
    const variantFilter = item.variant
      ? { _id: item.product, "variants.value": item.variant }
      : { _id: item.product };
    const update = item.variant
      ? { $inc: { "variants.$.stock": -item.quantity, soldCount: item.quantity } }
      : { $inc: { stock: -item.quantity, soldCount: item.quantity } };
    await Product.updateOne(variantFilter, update);
  }

  await Cart.findOneAndUpdate({ user: order.user }, { $set: { items: [] } });

  const user = await User.findById(order.user).select("name email").lean();
  if (user?.email) {
    // Best-effort — a failed confirmation email should never fail the order.
    sendOrderConfirmationEmail({
      to: user.email,
      customerName: user.name,
      reference: order.paystackReference,
      items: order.items,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      total: order.total,
      currency: order.currency,
      deliveryMethod: order.deliveryMethod,
      deliveryType: order.deliveryType,
      shippingAddress: order.shippingAddress,
    }).catch((err) => console.error("Order confirmation email failed", err));
  }

  return order;
}
