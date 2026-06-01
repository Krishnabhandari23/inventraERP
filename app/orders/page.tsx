'use client';
import { useEffect, useState } from 'react';
import { AppShell } from "@/components/AppShell";
import { GlassPanel } from "@/components/GlassPanel";
import { BrandButton } from "@/components/BrandButton";
import { Modal } from "@/components/Modal";
import { TextInput, Select } from "@/components/Inputs";
import { ordersService, Order, OrderItem } from '@/lib/api';

type FormData = {
  customer: string;
  customerEmail: string;
  items: OrderItem[];
  tax: string;
  shipping: string;
  notes: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    customer: '',
    customerEmail: '',
    items: [{ id: '1', productId: '', productName: '', quantity: 1, price: 0, total: 0 }],
    tax: '0',
    shipping: '0',
    notes: '',
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await ordersService.getAll();
      setOrders(response.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
      console.error('Failed to load orders:', err);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!formData.customer || formData.items.length === 0 || !formData.items[0].productName) {
      alert('Please fill in customer name and at least one item');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Calculate item totals
      const items = formData.items.map((item, index) => ({
        id: String(index + 1),
        productId: item.productId || `PROD-${Date.now()}-${index}`,
        productName: item.productName,
        quantity: Number(item.quantity),
        price: Number(item.price),
        total: Number(item.quantity) * Number(item.price),
      }));

      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      
      const orderData = {
        customer: formData.customer,
        customerEmail: formData.customerEmail || undefined,
        status: 'pending' as const,
        items,
        subtotal,
        tax: Number(formData.tax),
        shipping: Number(formData.shipping),
        total: subtotal + Number(formData.tax) + Number(formData.shipping),
        notes: formData.notes || undefined,
      };

      await ordersService.create(orderData);
      await loadOrders();
      setOpen(false);
      resetForm();
    } catch (err) {
      console.error('Failed to create order:', err);
      alert('Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await ordersService.updateStatus(orderId, newStatus);
      await loadOrders();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update order status');
    }
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Delete order ${orderNumber}?`)) return;

    try {
      await ordersService.delete(orderId);
      await loadOrders();
    } catch (err) {
      console.error('Failed to delete order:', err);
      alert('Failed to delete order');
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { id: String(formData.items.length + 1), productId: '', productName: '', quantity: 1, price: 0, total: 0 }],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length === 1) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const resetForm = () => {
    setFormData({
      customer: '',
      customerEmail: '',
      items: [{ id: '1', productId: '', productName: '', quantity: 1, price: 0, total: 0 }],
      tax: '0',
      shipping: '0',
      notes: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500';
      case 'processing':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-amber-500';
      case 'shipped':
        return 'bg-purple-500';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
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

  if (error) {
    return (
      <AppShell>
        <header className="flex items-center gap-3 water-in">
          <h1 className="text-xl font-semibold">Orders</h1>
        </header>
        <GlassPanel>
          <div className="text-center py-8">
            <p className="text-rose-400 mb-4">{error}</p>
            <BrandButton onClick={loadOrders}>Retry</BrandButton>
          </div>
        </GlassPanel>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="flex items-center gap-3 water-in">
        <h1 className="text-xl font-semibold">Orders</h1>
        <div className="flex-1" />
        <BrandButton onClick={loadOrders}>Refresh</BrandButton>
        <BrandButton onClick={() => setOpen(true)}>Create Order</BrandButton>
      </header>

      <GlassPanel>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-textc-secondary">
            No orders found. Create your first order to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl p-4 border border-borderc-soft bg-bg-elevated water-in group relative">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-xs text-textc-muted">{order.orderNumber}</div>
                    <div className="text-base font-medium mt-1">{order.customer}</div>
                    <div className="text-sm text-textc-secondary mt-1">
                      Items: {order.items.length} • Total: ${order.total.toFixed(2)}
                    </div>
                    <div className="text-xs text-textc-muted mt-1">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select 
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value as Order['status'])}
                      className="text-xs"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </Select>

                    <button
                      onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-400 hover:text-rose-300 text-xs px-2 py-1 rounded bg-rose-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

      <Modal open={open} onClose={() => { setOpen(false); resetForm(); }} title="New Order">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="small text-textc-secondary mb-1">Customer Name *</div>
              <TextInput 
                placeholder="e.g., Acme Corp" 
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              />
            </div>
            <div>
              <div className="small text-textc-secondary mb-1">Customer Email</div>
              <TextInput 
                type="email"
                placeholder="e.g., orders@acme.com" 
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="small text-textc-secondary">Order Items *</div>
              <button 
                onClick={addItem}
                className="text-xs text-sky-400 hover:text-sky-300"
              >
                + Add Item
              </button>
            </div>
            
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                <div className="col-span-5">
                  <TextInput 
                    placeholder="Product name"
                    value={item.productName}
                    onChange={(e) => updateItem(index, 'productName', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <TextInput 
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                  />
                </div>
                <div className="col-span-3">
                  <TextInput 
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={item.price}
                    onChange={(e) => updateItem(index, 'price', e.target.value)}
                  />
                </div>
                <div className="col-span-2 flex items-center justify-center">
                  {formData.items.length > 1 && (
                    <button 
                      onClick={() => removeItem(index)}
                      className="text-rose-400 hover:text-rose-300 text-xs"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="small text-textc-secondary mb-1">Tax ($)</div>
              <TextInput 
                type="number"
                step="0.01"
                placeholder="0.00" 
                value={formData.tax}
                onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
              />
            </div>
            <div>
              <div className="small text-textc-secondary mb-1">Shipping ($)</div>
              <TextInput 
                type="number"
                step="0.01"
                placeholder="0.00" 
                value={formData.shipping}
                onChange={(e) => setFormData({ ...formData, shipping: e.target.value })}
              />
            </div>
          </div>

          <div>
            <div className="small text-textc-secondary mb-1">Notes</div>
            <textarea 
              className="w-full px-3 py-2 rounded-md border border-borderc-soft bg-bg-base text-sm"
              rows={2}
              placeholder="Add any special instructions..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button 
            onClick={() => { setOpen(false); resetForm(); }}
            className="px-3 py-2 text-sm rounded-md border border-borderc-soft"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            onClick={handleCreateOrder}
            disabled={isSubmitting}
            className="px-3 py-2 text-sm rounded-md text-white bg-[color:var(--color-brand-solid)] quantum-snap disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </Modal>
    </AppShell>
  );
}
