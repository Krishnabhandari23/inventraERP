'use client';

import { AppShell } from "@/components/AppShell";
import { GlassPanel } from "@/components/GlassPanel";
import { TextInput, Select } from "@/components/Inputs";
import { BrandButton } from "@/components/BrandButton";
import { ToastProvider, useToast } from "@/components/Toast";
import { Modal } from "@/components/Modal";
import { useState, useEffect } from "react";
import { inventoryService, InventoryItem } from "@/lib/api/services/inventory.service";

function InventoryPageContent() {
  const { push } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Fetch inventory items
  const fetchItems = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (categoryFilter) params.category = categoryFilter;
      if (searchFilter) params.search = searchFilter;
      
      const data = await inventoryService.getAll(Object.keys(params).length > 0 ? params : undefined);
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      push({ 
        title: "Error", 
        description: "Failed to load inventory items", 
        tone: "error" 
      });
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [categoryFilter]);

  // Delete item
  const handleDelete = async (id: string, sku: string) => {
    if (!confirm(`Delete item ${sku}?`)) return;
    
    try {
      await inventoryService.delete(id);
      push({ 
        title: "Deleted", 
        description: `Item ${sku} deleted`, 
        tone: "success" 
      });
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      push({ 
        title: "Error", 
        description: "Failed to delete item", 
        tone: "error" 
      });
    }
  };

  // Open modal for creating/editing
  const openModal = (item?: InventoryItem) => {
    setEditingItem(item || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleSave = () => {
    closeModal();
    fetchItems();
  };

  // Open adjust modal
  const openAdjustModal = (item: InventoryItem) => {
    setAdjustingItem(item);
    setShowAdjustModal(true);
  };

  const closeAdjustModal = () => {
    setShowAdjustModal(false);
    setAdjustingItem(null);
  };

  const handleAdjustSave = () => {
    closeAdjustModal();
    fetchItems();
  };

  // Get unique categories
  const categories = Array.from(new Set(items.map(item => item.category).filter(Boolean)));

  return (
    <AppShell>
      <header className="flex items-center justify-between water-in">
        <h1 className="text-xl font-semibold">Inventory</h1>
        <BrandButton onClick={() => openModal()}>Add Item</BrandButton>
      </header>

      {/* Filters */}
      <div className="mt-4 flex gap-3">
        <TextInput
          value={searchFilter}
          onChange={e => setSearchFilter(e.target.value)}
          placeholder="Search by name, SKU, or description..."
          style={{ flex: 1 }}
          onKeyDown={e => e.key === 'Enter' && fetchItems()}
        />
        <Select 
          value={categoryFilter} 
          onChange={e => setCategoryFilter(e.target.value)}
          style={{ width: '200px' }}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </Select>
        <BrandButton onClick={fetchItems}>Search</BrandButton>
      </div>

      {/* Items List */}
      <div className="mt-4 space-y-3">
        {loading ? (
          <GlassPanel>
            <div className="text-center py-8 text-textc-secondary">Loading inventory...</div>
          </GlassPanel>
        ) : items.length === 0 ? (
          <GlassPanel>
            <div className="text-center py-8 text-textc-secondary">
              No items found. Add your first inventory item!
            </div>
          </GlassPanel>
        ) : (
          items.map((item) => {
            const isLowStock = item.reorderPoint && item.quantity <= item.reorderPoint;
            const isOutOfStock = item.quantity === 0;
            return (
              <div key={item.id} className="group relative">
                <GlassPanel>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{item.name}</h3>
                        <span className="text-xs font-mono text-textc-secondary">{item.sku}</span>
                        {isOutOfStock ? (
                          <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">
                            Low Stock
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                            In Stock
                          </span>
                        )}
                        {item.category && (
                          <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                            {item.category}
                          </span>
                        )}
                      </div>
                      
                      {item.description && (
                        <div className="text-sm text-textc-secondary mb-2">
                          {item.description}
                        </div>
                      )}
                      
                      <div className="text-sm text-textc-secondary space-y-1">
                        <div className="flex gap-4">
                          <div><strong>Quantity:</strong> {item.quantity} {item.unit}</div>
                          {item.reorderPoint && (
                            <div><strong>Reorder Point:</strong> {item.reorderPoint} {item.unit}</div>
                          )}
                          {item.location && <div><strong>Location:</strong> {item.location}</div>}
                        </div>
                        <div className="flex gap-4">
                          {item.cost && <div><strong>Cost:</strong> ₹{item.cost.toFixed(2)}</div>}
                          {item.price && <div><strong>Price:</strong> ₹{item.price.toFixed(2)}</div>}
                          {item.supplier && <div><strong>Supplier:</strong> {item.supplier}</div>}
                        </div>
                      </div>
                      
                      {item.cost && (
                        <div className="mt-3 text-sm font-semibold text-brand-primary">
                          Total Value: ₹{(item.cost * item.quantity).toLocaleString()}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                      <div className="flex gap-2">
                        <BrandButton 
                          onClick={() => openAdjustModal(item)}
                          className="text-xs"
                        >
                          Adjust Qty
                        </BrandButton>
                        
                        <BrandButton 
                          onClick={() => openModal(item)}
                          className="text-xs"
                        >
                          Edit
                        </BrandButton>
                        
                        <button
                          onClick={() => handleDelete(item.id, item.sku)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-3 py-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        >
                          Delete
                        </button>
                      </div>
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
        <ItemModal
          item={editingItem}
          onClose={closeModal}
          onSave={handleSave}
          pushToast={push}
        />
      )}

      {/* Adjust Quantity Modal */}
      {showAdjustModal && adjustingItem && (
        <AdjustModal
          item={adjustingItem}
          onClose={closeAdjustModal}
          onSave={handleAdjustSave}
          pushToast={push}
        />
      )}
    </AppShell>
  );
}

export default function InventoryPage() {
  return (
    <ToastProvider>
      <InventoryPageContent />
    </ToastProvider>
  );
}

// Item Modal Component
function ItemModal({ 
  item, 
  onClose, 
  onSave,
  pushToast
}: { 
  item: InventoryItem | null; 
  onClose: () => void; 
  onSave: () => void;
  pushToast: (toast: { title: string; description: string; tone: 'success' | 'error' | 'warning' }) => void;
}) {
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    sku: item?.sku || '',
    name: item?.name || '',
    description: item?.description || '',
    category: item?.category || '',
    quantity: item?.quantity || 0,
    unit: item?.unit || 'pcs',
    reorderPoint: item?.reorderPoint || '',
    location: item?.location || '',
    cost: item?.cost || '',
    price: item?.price || '',
    supplier: item?.supplier || '',
  });

  // Submit
  const handleSubmit = async () => {
    // Validation
    if (!form.sku.trim()) {
      pushToast({ title: "Error", description: "SKU is required", tone: "error" });
      return;
    }

    if (!form.name.trim()) {
      pushToast({ title: "Error", description: "Name is required", tone: "error" });
      return;
    }

    setLoading(true);
    try {
      const data: any = {
        sku: form.sku,
        name: form.name,
        description: form.description || undefined,
        category: form.category || undefined,
        quantity: Number(form.quantity),
        unit: form.unit,
        reorderPoint: form.reorderPoint ? Number(form.reorderPoint) : undefined,
        location: form.location || undefined,
        cost: form.cost ? Number(form.cost) : undefined,
        price: form.price ? Number(form.price) : undefined,
        supplier: form.supplier || undefined,
      };

      if (item) {
        await inventoryService.update(item.id, data);
        pushToast({ 
          title: "Success", 
          description: "Item updated successfully", 
          tone: "success" 
        });
      } else {
        await inventoryService.create(data);
        pushToast({ 
          title: "Success", 
          description: "Item created successfully", 
          tone: "success" 
        });
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving item:', error);
      pushToast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to save item", 
        tone: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={item ? "Edit Item" : "Add Item"}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-textc-secondary mb-1 block">SKU *</label>
            <TextInput
              value={form.sku}
              onChange={e => setForm({ ...form, sku: e.target.value })}
              placeholder="e.g., ITEM-001"
              disabled={!!item}
            />
          </div>
          <div>
            <label className="text-sm text-textc-secondary mb-1 block">Name *</label>
            <TextInput
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Item name"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-textc-secondary mb-1 block">Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Item description..."
            className="w-full px-3 py-2 rounded bg-surface-secondary border border-border-primary text-textc-primary focus:border-brand-primary outline-none resize-none"
            rows={2}
          />
        </div>

        {/* Quantity & Category */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-textc-secondary mb-1 block">Category</label>
            <TextInput
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              placeholder="e.g., Raw Materials"
            />
          </div>
          <div>
            <label className="text-sm text-textc-secondary mb-1 block">Quantity</label>
            <TextInput
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value as any })}
              type="number"
              min="0"
            />
          </div>
          <div>
            <label className="text-sm text-textc-secondary mb-1 block">Unit</label>
            <Select
              value={form.unit}
              onChange={e => setForm({ ...form, unit: e.target.value })}
            >
              <option value="pcs">Pieces</option>
              <option value="kg">Kilograms</option>
              <option value="m">Meters</option>
              <option value="l">Liters</option>
              <option value="box">Boxes</option>
              <option value="roll">Rolls</option>
            </Select>
          </div>
        </div>

        {/* Reorder & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-textc-secondary mb-1 block">Reorder Point</label>
            <TextInput
              value={form.reorderPoint}
              onChange={e => setForm({ ...form, reorderPoint: e.target.value })}
              type="number"
              min="0"
              placeholder="Minimum quantity"
            />
          </div>
          <div>
            <label className="text-sm text-textc-secondary mb-1 block">Location</label>
            <TextInput
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              placeholder="e.g., Warehouse A"
            />
          </div>
        </div>

        {/* Cost, Price & Supplier */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-textc-secondary mb-1 block">Cost (₹)</label>
            <TextInput
              value={form.cost}
              onChange={e => setForm({ ...form, cost: e.target.value })}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="text-sm text-textc-secondary mb-1 block">Price (₹)</label>
            <TextInput
              value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="text-sm text-textc-secondary mb-1 block">Supplier</label>
            <TextInput
              value={form.supplier}
              onChange={e => setForm({ ...form, supplier: e.target.value })}
              placeholder="Supplier name"
            />
          </div>
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
          {loading ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
        </BrandButton>
      </div>
    </Modal>
  );
}

// Adjust Quantity Modal Component
function AdjustModal({ 
  item, 
  onClose, 
  onSave,
  pushToast
}: { 
  item: InventoryItem; 
  onClose: () => void; 
  onSave: () => void;
  pushToast: (toast: { title: string; description: string; tone: 'success' | 'error' | 'warning' }) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [adjustment, setAdjustment] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const handleSubmit = async () => {
    const adj = Number(adjustment);
    if (isNaN(adj) || adj === 0) {
      pushToast({ title: "Error", description: "Enter a valid adjustment amount", tone: "error" });
      return;
    }

    setLoading(true);
    try {
      await inventoryService.adjust(item.id, adj, reason || undefined);
      pushToast({ 
        title: "Success", 
        description: `Quantity ${adj > 0 ? 'increased' : 'decreased'} by ${Math.abs(adj)}`, 
        tone: "success" 
      });
      onSave();
    } catch (error) {
      console.error('Error adjusting quantity:', error);
      pushToast({ 
        title: "Error", 
        description: "Failed to adjust quantity", 
        tone: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  const newQuantity = item.quantity + (Number(adjustment) || 0);

  return (
    <Modal open onClose={onClose} title="Adjust Quantity">
      <div className="space-y-4">
        <div>
          <div className="text-sm text-textc-secondary mb-2">
            Current quantity: <strong className="text-textc-primary">{item.quantity} {item.unit}</strong>
          </div>
        </div>

        <div>
          <label className="text-sm text-textc-secondary mb-1 block">
            Adjustment (use + to add, - to subtract)
          </label>
          <TextInput
            value={adjustment}
            onChange={e => setAdjustment(e.target.value)}
            type="number"
            placeholder="e.g., +50 or -20"
            autoFocus
          />
          <div className="text-xs text-textc-tertiary mt-1">
            New quantity will be: <strong>{newQuantity}</strong> {item.unit}
          </div>
        </div>

        <div>
          <label className="text-sm text-textc-secondary mb-1 block">Reason (optional)</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g., Stock received, Damaged goods, etc."
            className="w-full px-3 py-2 rounded bg-surface-secondary border border-border-primary text-textc-primary focus:border-brand-primary outline-none resize-none"
            rows={2}
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
          {loading ? 'Adjusting...' : 'Adjust Quantity'}
        </BrandButton>
      </div>
    </Modal>
  );
}
