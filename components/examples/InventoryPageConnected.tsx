'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { GlassPanel } from '@/components/GlassPanel';
import { BrandButton } from '@/components/BrandButton';
import { inventoryService, InventoryItem } from '@/lib/api';
import { useApi } from '@/lib/hooks/useApi';

export default function InventoryPageConnected() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch inventory items on mount
  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await inventoryService.getAll();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
      console.error('Failed to load inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Using the useApi hook for mutations
  const { execute: createItem, isLoading: isCreating } = useApi(
    inventoryService.create,
    {
      onSuccess: (newItem) => {
        setItems((prev) => [...prev, newItem]);
      },
    }
  );

  const handleReceiveStock = async () => {
    try {
      await createItem({
        name: 'New Item',
        sku: `SKU-${Date.now()}`,
        quantity: 100,
        unit: 'pcs',
        reorderPoint: 50,
      });
    } catch (err) {
      console.error('Failed to create item:', err);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <p className="text-sm text-textc-secondary">Loading inventory...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <GlassPanel>
          <div className="text-center py-8">
            <p className="text-rose-400 mb-4">{error}</p>
            <BrandButton onClick={loadInventory}>Retry</BrandButton>
          </div>
        </GlassPanel>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="flex items-center gap-3 water-in">
        <h1 className="text-xl font-semibold">Inventory Command Center</h1>
        <div className="flex-1" />
        <BrandButton onClick={handleReceiveStock} disabled={isCreating}>
          {isCreating ? 'Adding...' : 'Receive Stock'}
        </BrandButton>
        <BrandButton onClick={loadInventory}>
          Refresh
        </BrandButton>
      </header>

      <GlassPanel>
        {items.length === 0 ? (
          <div className="text-center py-8 text-textc-secondary">
            No inventory items found. Add your first item to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-textc-secondary">
                  <th className="py-2">SKU</th>
                  <th className="py-2">Item</th>
                  <th className="py-2">Unit</th>
                  <th className="py-2">On Hand</th>
                  <th className="py-2">Reorder Point</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isLowStock = item.reorderPoint && item.quantity <= item.reorderPoint;
                  return (
                    <tr key={item.id} className="border-t border-borderc-soft">
                      <td className="py-2 font-mono text-xs">{item.sku}</td>
                      <td className="py-2">{item.name}</td>
                      <td className="py-2">{item.unit}</td>
                      <td className="py-2 font-semibold">{item.quantity.toLocaleString()}</td>
                      <td className="py-2 text-textc-secondary">
                        {item.reorderPoint?.toLocaleString() || '-'}
                      </td>
                      <td className="py-2">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-1 text-xs text-rose-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            In Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>
    </AppShell>
  );
}
