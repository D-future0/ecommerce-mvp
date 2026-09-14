export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { formatPrice } from "@/lib/format";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;

  await connectToDatabase();
  const order = await Order.findById(id).populate("user", "name email").lean();
  if (!order) notFound();

  const user = order.user as unknown as { name: string; email: string } | null;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm text-ink">{order.paystackReference}</h2>
          <p className="mt-1 text-xs text-stone">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <OrderStatusSelect orderId={order._id.toString()} status={order.status} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-8 text-sm">
        <div>
          <p className="text-xs text-stone">Customer</p>
          <p className="mt-1">{user?.name}</p>
          <p className="text-stone">{user?.email}</p>
        </div>
        <div>
          <p className="text-xs text-stone">Shipping address</p>
          <p className="mt-1">
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
          </p>
          <p>
            {order.shippingAddress.city}, {order.shippingAddress.state}, {order.shippingAddress.country}
          </p>
          <p className="text-stone">{order.shippingAddress.phone}</p>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-xs text-stone">Items</p>
        <div className="mt-2 divide-y divide-line border-y border-line">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between py-3 text-sm">
              <span>
                {item.title}
                {item.variant ? ` (${item.variant})` : ""} × {item.quantity}
              </span>
              <span>{formatPrice(item.price * item.quantity, order.currency)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between text-sm">
          <span className="text-stone">Subtotal</span>
          <span>{formatPrice(order.subtotal, order.currency)}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm">
          <span className="text-stone">Shipping</span>
          <span>{formatPrice(order.shippingFee, order.currency)}</span>
        </div>
        <div className="mt-2 flex justify-between text-lg">
          <span>Total</span>
          <span>{formatPrice(order.total, order.currency)}</span>
        </div>
      </div>
    </div>
  );
}
