'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { GlassPanel } from '@/components/GlassPanel';
import { BrandButton } from '@/components/BrandButton';
import { ordersService, Order, OrderStatus } from '@/lib/api';

export default function OrdersPageConnected() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const params = filter !== 'all' ? { status: filter } : undefined;
      const response = await ordersService.getAll(params);
      setOrders(response.orders);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await ordersService.updateStatus(orderId, newStatus);
      // Update local state
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-300';
      case 'processing':
        return 'bg-blue-500/20 text-blue-300';
      case 'pending':
        return 'bg-amber-500/20 text-amber-300';
      case 'cancelled':
        return 'bg-rose-500/20 text-rose-300';
      case 'shipped':
        return 'bg-purple-500/20 text-purple-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <p className="text-sm text-textc-secondary">Loading orders...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="flex items-center gap-3 water-in">
        <h1 className="text-xl font-semibold">Orders Dashboard</h1>
        <div className="flex-1" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as OrderStatus | 'all')}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm backdrop-blur-sm"
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <BrandButton onClick={loadOrders}>Refresh</BrandButton>
      </header>

      <GlassPanel>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-textc-secondary">
            No orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-textc-secondary">
                  <th className="py-2">Order #</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Items</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-borderc-soft">
                    <td className="py-2 font-mono text-xs">{order.orderNumber}</td>
                    <td className="py-2">{order.customer}</td>
                    <td className="py-2 text-textc-secondary">{order.items.length}</td>
                    <td className="py-2 font-semibold">${order.total.toFixed(2)}</td>
                    <td className="py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2 text-textc-secondary">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusUpdate(order.id, e.target.value as OrderStatus)
                        }
                        className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>
    </AppShell>
  );
}
