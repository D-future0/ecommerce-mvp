import { connectToDatabase, prisma } from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { parseOrderAddress, parseOrderItems } from "@/lib/order-data";
import { Prisma } from "@prisma/client";

export async function markOrderPaid(reference: string) {
  await connectToDatabase();

  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({ where: { paystackReference: reference } });
    if (!current) return { order: null, newlyPaid: false };

    const transition = await tx.order.updateMany({
      where: { id: current.id, status: { notIn: ["paid", "processing"] } },
      data: { status: "paid", paidAt: new Date() },
    });
    if (transition.count === 0) return { order: current, newlyPaid: false };

    const items = parseOrderItems(current.items);
    for (const item of items) {
      if (item.variant) {
        await tx.$executeRaw(Prisma.sql`
          UPDATE "Product" AS product
          SET variants = (
            SELECT jsonb_agg(
              CASE
                WHEN variant->>'value' = ${item.variant}
                THEN jsonb_set(
                  variant,
                  '{stock}',
                  to_jsonb(COALESCE((variant->>'stock')::integer, 0) - ${item.quantity}),
                  TRUE
                )
                ELSE variant
              END
              ORDER BY ordinal
            )
            FROM jsonb_array_elements(product.variants) WITH ORDINALITY AS entry(variant, ordinal)
          ),
          "soldCount" = product."soldCount" + ${item.quantity}
          WHERE product."_id" = ${item.product}
            AND EXISTS (
              SELECT 1
              FROM jsonb_array_elements(product.variants) AS entry(variant)
              WHERE variant->>'value' = ${item.variant}
            )
        `);
      } else {
        await tx.product.updateMany({
          where: { id: item.product },
          data: {
            stock: { decrement: item.quantity },
            soldCount: { increment: item.quantity },
          },
        });
      }
    }

    await tx.cartItem.deleteMany({ where: { cart: { user: current.user } } });
    return {
      order: await tx.order.findUnique({ where: { id: current.id } }),
      newlyPaid: true,
    };
  });

  const { order } = result;
  if (!order) return null;
  if (!result.newlyPaid) return order;

  const user = await prisma.user.findUnique({
    where: { id: order.user },
    select: { name: true, email: true },
  });
  if (user?.email) {
    sendOrderConfirmationEmail({
      to: user.email,
      customerName: user.name,
      reference: order.paystackReference,
      items: parseOrderItems(order.items),
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      total: order.total,
      currency: order.currency,
      deliveryMethod:
        order.deliveryMethod === "store_pickup" || order.deliveryMethod === "delivery"
          ? order.deliveryMethod
          : undefined,
      deliveryType:
        order.deliveryType === "store_pickup" ||
        order.deliveryType === "door_to_door" ||
        order.deliveryType === "terminal_pickup"
          ? order.deliveryType
          : undefined,
      shippingAddress: parseOrderAddress(order.shippingAddress),
    }).catch((err) => console.error("Order confirmation email failed", err));
  }

  return order;
}
