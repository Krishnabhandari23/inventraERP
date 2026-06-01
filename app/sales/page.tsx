'use client';

import { AppShell } from "@/components/AppShell";
import { GlassPanel } from "@/components/GlassPanel";
import { TextInput, Select } from "@/components/Inputs";
import { BrandButton } from "@/components/BrandButton";
import { ToastProvider, useToast } from "@/components/Toast";
import { Modal } from "@/components/Modal";
import { useState, useEffect } from "react";
import { salesService, Invoice, InvoiceItem } from "@/lib/api/services/sales.service";

function SalesPageContent() {
  const { push } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Fetch invoices
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await salesService.getInvoices(
        statusFilter ? { status: statusFilter } : undefined
      );
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      push({ 
        title: "Error", 
        description: "Failed to load invoices", 
        tone: "error" 
      });
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  // Delete invoice
  const handleDelete = async (id: string, invoiceNumber: string) => {
    if (!confirm(`Delete invoice ${invoiceNumber}?`)) return;
    
    try {
      await salesService.deleteInvoice(id);
      push({ 
        title: "Deleted", 
        description: `Invoice ${invoiceNumber} deleted`, 
        tone: "success" 
      });
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      push({ 
        title: "Error", 
        description: "Failed to delete invoice", 
        tone: "error" 
      });
    }
  };

  // Update status
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await salesService.updateInvoiceStatus(id, newStatus);
      push({ 
        title: "Updated", 
        description: `Status changed to ${newStatus}`, 
        tone: "success" 
      });
      fetchInvoices();
    } catch (error) {
      console.error('Error updating status:', error);
      push({ 
        title: "Error", 
        description: "Failed to update status", 
        tone: "error" 
      });
    }
  };

  // Open modal for creating/editing
  const openModal = (invoice?: Invoice) => {
    setEditingInvoice(invoice || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingInvoice(null);
  };

  const handleSave = () => {
    closeModal();
    fetchInvoices();
  };

  // Parse items (they're stored as JSON string)
  const parseItems = (itemsString: string | InvoiceItem[]): InvoiceItem[] => {
    if (Array.isArray(itemsString)) return itemsString;
    try {
      return JSON.parse(itemsString as string);
    } catch {
      return [];
    }
  };

  return (
    <AppShell>
      <header className="flex items-center justify-between water-in">
        <h1 className="text-xl font-semibold">Sales & Invoices</h1>
        <BrandButton onClick={() => openModal()}>Create Invoice</BrandButton>
      </header>

        {/* Filters */}
        <div className="mt-4 flex gap-3">
          <Select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            style={{ width: '200px' }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>

        {/* Invoices List */}
        <div className="mt-4 space-y-3">
          {loading ? (
            <GlassPanel>
              <div className="text-center py-8 text-textc-secondary">Loading invoices...</div>
            </GlassPanel>
          ) : invoices.length === 0 ? (
            <GlassPanel>
              <div className="text-center py-8 text-textc-secondary">
                No invoices found. Create your first invoice!
              </div>
            </GlassPanel>
          ) : (
            invoices.map((invoice) => {
              const items = parseItems(invoice.items);
              return (
                <div key={invoice.id} className="group relative">
                  <GlassPanel>
                    <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{invoice.invoiceNumber}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${
                          invoice.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                          invoice.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          invoice.status === 'overdue' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-textc-secondary space-y-1">
                        <div><strong>Customer:</strong> {invoice.customer}</div>
                        {invoice.customerEmail && (
                          <div><strong>Email:</strong> {invoice.customerEmail}</div>
                        )}
                        <div><strong>Items:</strong> {items.length} item(s)</div>
                        <div><strong>Issue Date:</strong> {new Date(invoice.issueDate).toLocaleDateString()}</div>
                        <div><strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}</div>
                        {invoice.paidDate && (
                          <div><strong>Paid Date:</strong> {new Date(invoice.paidDate).toLocaleDateString()}</div>
                        )}
                      </div>
                      
                      <div className="mt-3 text-lg font-semibold text-brand-primary">
                        Total: ₹{invoice.total.toLocaleString()}
                      </div>
                      
                      {invoice.notes && (
                        <div className="mt-2 text-xs text-textc-tertiary italic">
                          Note: {invoice.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                      <div className="flex gap-2">
                        <BrandButton 
                          onClick={() => openModal(invoice)}
                          className="text-xs"
                        >
                          Edit
                        </BrandButton>
                        
                        <button
                          onClick={() => handleDelete(invoice.id, invoice.invoiceNumber)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-3 py-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        >
                          Delete
                        </button>
                      </div>

                      {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                        <Select
                          value={invoice.status}
                          onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                          className="text-xs"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                          <option value="cancelled">Cancelled</option>
                        </Select>
                      )}
                    </div>
                  </div>
                </GlassPanel>
                </div>
              );
            })
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <InvoiceModal
            invoice={editingInvoice}
            onClose={closeModal}
            onSave={handleSave}
            pushToast={push}
          />
        )}
      </AppShell>
  );
}

export default function SalesPage() {
  return (
    <ToastProvider>
      <SalesPageContent />
    </ToastProvider>
  );
}

// Invoice Modal Component
function InvoiceModal({ 
  invoice, 
  onClose, 
  onSave,
  pushToast
}: { 
  invoice: Invoice | null; 
  onClose: () => void; 
  onSave: () => void;
  pushToast: (toast: { title: string; description: string; tone: 'success' | 'error' | 'warning' }) => void;
}) {
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    customer: invoice?.customer || '',
    customerEmail: invoice?.customerEmail || '',
    dueDate: invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
    paymentMethod: invoice?.paymentMethod || '',
    notes: invoice?.notes || '',
    status: invoice?.status || 'pending',
  });

  const [items, setItems] = useState<InvoiceItem[]>(() => {
    if (invoice?.items) {
      if (Array.isArray(invoice.items)) return invoice.items;
      try {
        return JSON.parse(invoice.items as any);
      } catch {
        return [];
      }
    }
    return [{ description: '', quantity: 1, unitPrice: 0, total: 0 }];
  });

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  // Add new item
  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  // Remove item
  const removeItem = (index: number) => {
    if (items.length === 1) {
      pushToast({ title: "Error", description: "At least one item required", tone: "error" });
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // Update item
  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate total for this item
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = field === 'quantity' ? parseFloat(value) || 0 : newItems[index].quantity;
      const price = field === 'unitPrice' ? parseFloat(value) || 0 : newItems[index].unitPrice;
      newItems[index].total = qty * price;
    }
    
    setItems(newItems);
  };

  // Submit
  const handleSubmit = async () => {
    // Validation
    if (!form.customer.trim()) {
      pushToast({ title: "Error", description: "Customer name is required", tone: "error" });
      return;
    }

    if (items.some(item => !item.description.trim())) {
      pushToast({ title: "Error", description: "All items must have a description", tone: "error" });
      return;
    }

    if (!form.dueDate) {
      pushToast({ title: "Error", description: "Due date is required", tone: "error" });
      return;
    }

    setLoading(true);
    try {
      const data = {
        customer: form.customer,
        customerEmail: form.customerEmail || undefined,
        items,
        subtotal,
        tax,
        total,
        dueDate: form.dueDate,
        paymentMethod: form.paymentMethod || undefined,
        notes: form.notes || undefined,
        status: form.status,
      };

      if (invoice) {
        await salesService.updateInvoice(invoice.id, data);
        pushToast({ 
          title: "Success", 
          description: "Invoice updated successfully", 
          tone: "success" 
        });
      } else {
        await salesService.createInvoice(data);
        pushToast({ 
          title: "Success", 
          description: "Invoice created successfully", 
          tone: "success" 
        });
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving invoice:', error);
      pushToast({ 
        title: "Error", 
        description: "Failed to save invoice", 
        tone: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={invoice ? "Edit Invoice" : "Create Invoice"}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-textc-secondary mb-1 block">Customer *</label>
            <TextInput
              value={form.customer}
              onChange={e => setForm({ ...form, customer: e.target.value })}
              placeholder="e.g., Acme Corp"
            />
          </div>
          <div>
            <label className="text-sm text-textc-secondary mb-1 block">Email</label>
            <TextInput
              value={form.customerEmail}
              onChange={e => setForm({ ...form, customerEmail: e.target.value })}
              placeholder="customer@example.com"
              type="email"
            />
          </div>
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-textc-secondary">Invoice Items *</label>
            <button
              onClick={addItem}
              className="text-xs text-brand-primary hover:underline"
            >
              + Add Item
            </button>
          </div>
          
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <TextInput
                    value={item.description}
                    onChange={e => updateItem(index, 'description', e.target.value)}
                    placeholder="Description"
                  />
                </div>
                <div className="col-span-2">
                  <TextInput
                    value={item.quantity}
                    onChange={e => updateItem(index, 'quantity', e.target.value)}
                    placeholder="Qty"
                    type="number"
                    min="0"
                  />
                </div>
                <div className="col-span-2">
                  <TextInput
                    value={item.unitPrice}
                    onChange={e => updateItem(index, 'unitPrice', e.target.value)}
                    placeholder="Price"
                    type="number"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-2 text-sm text-textc-secondary">
                  ₹{item.total.toFixed(2)}
                </div>
                <div className="col-span-1">
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-surface-secondary/30 p-3 rounded space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-textc-secondary">Subtotal:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-textc-secondary">Tax (10%):</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold border-t border-border-primary pt-2 mt-2">
            <span>Total:</span>
            <span className="text-brand-primary">₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Additional Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-textc-secondary mb-1 block">Due Date *</label>
            <TextInput
              value={form.dueDate}
              onChange={e => setForm({ ...form, dueDate: e.target.value })}
              type="date"
            />
          </div>
          <div>
            <label className="text-sm text-textc-secondary mb-1 block">Payment Method</label>
            <TextInput
              value={form.paymentMethod}
              onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
              placeholder="e.g., Bank Transfer"
            />
          </div>
        </div>

        {invoice && (
          <div>
            <label className="text-sm text-textc-secondary mb-1 block">Status</label>
            <Select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value as 'pending' | 'paid' | 'overdue' | 'cancelled' })}
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
        )}

        <div>
          <label className="text-sm text-textc-secondary mb-1 block">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="Additional notes..."
            className="w-full px-3 py-2 rounded bg-surface-secondary border border-border-primary text-textc-primary focus:border-brand-primary outline-none resize-none"
            rows={3}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border-primary">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded text-textc-secondary hover:bg-surface-secondary"
          disabled={loading}
        >
          Cancel
        </button>
        <BrandButton onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : invoice ? 'Update Invoice' : 'Create Invoice'}
        </BrandButton>
      </div>
    </Modal>
  );
}
