'use client';

import { AsyncButton } from '@/components/AsyncButton';
import { Tooltip } from '@/components/Tooltip';

export function OrdersHeader() {
  const handleCreateOrder = async () => {
    await new Promise(r => setTimeout(r, 800));
    // Add your order creation logic here
    console.log('Order created!');
  };

  return (
    <header className="flex items-center gap-3 water-in">
      <h1 className="text-xl font-semibold">Orders</h1>
      <div className="flex-1" />
      <Tooltip tip="Creates a simulated order with optimistic UI">
        <AsyncButton onClick={handleCreateOrder}>
          Create Order
        </AsyncButton>
      </Tooltip>
    </header>
  );
}
