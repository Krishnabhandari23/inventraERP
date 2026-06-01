# Backend-Frontend Integration Guide

## 🚀 Setup Complete!

Your InventraERP frontend is now connected to the backend API. All API services have been created and are ready to use.

## 📂 Project Structure

```
lib/
├── api/
│   ├── client.ts                    # Main API client with fetch wrapper
│   ├── index.ts                     # Central export file
│   └── services/
│       ├── auth.service.ts          # Authentication
│       ├── inventory.service.ts     # Inventory management
│       ├── orders.service.ts        # Order management
│       ├── production.service.ts    # Production jobs
│       ├── sales.service.ts         # Sales & customers
│       ├── approvals.service.ts     # Approval workflows
│       ├── audit.service.ts         # Audit logs
│       ├── billing.service.ts       # Billing & subscriptions
│       ├── usage.service.ts         # Usage tracking
│       ├── inbox.service.ts         # Messaging
│       ├── integrations.service.ts  # Third-party integrations
│       └── webhooks.service.ts      # Webhook management
└── hooks/
    ├── useAuth.tsx                  # Authentication hook & context
    └── useApi.ts                    # Generic API hook for mutations
```

## 🔧 Environment Variables

Created `.env.local` with:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 📝 Usage Examples

### 1. Using API Services Directly

```typescript
import { inventoryService } from '@/lib/api';

// In a component or server action
const items = await inventoryService.getAll();
const item = await inventoryService.getById('item-id');
const newItem = await inventoryService.create({ name: 'Widget', sku: 'WID-001', ... });
```

### 2. Using the useAuth Hook

```typescript
'use client';

import { useAuth } from '@/lib/hooks/useAuth';

export function MyComponent() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  
  if (!isAuthenticated) {
    return <button onClick={() => login('user@example.com', 'password')}>Login</button>;
  }

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 3. Using the useApi Hook

```typescript
'use client';

import { ordersService } from '@/lib/api';
import { useApi } from '@/lib/hooks/useApi';

export function OrdersList() {
  const { data, error, isLoading, execute } = useApi(ordersService.getAll, {
    onSuccess: (orders) => console.log('Loaded orders:', orders),
    onError: (err) => console.error('Failed:', err),
  });

  useEffect(() => {
    execute(); // Fetch orders
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* Render orders */}</div>;
}
```

### 4. Complete Page Example

```typescript
'use client';

import { useEffect, useState } from 'react';
import { inventoryService, InventoryItem } from '@/lib/api';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const data = await inventoryService.getAll();
      setItems(data);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const newItem = await inventoryService.create({
        name: 'New Item',
        sku: 'SKU-001',
        quantity: 100,
        unit: 'pcs',
      });
      setItems((prev) => [...prev, newItem]);
    } catch (err) {
      console.error('Failed to create:', err);
    }
  };

  // Render your UI...
}
```

## 🎯 Available Services

### Auth Service
- `login(credentials)` - Authenticate user
- `register(userData)` - Register new user
- `logout()` - Sign out
- `getCurrentUser()` - Get current user
- `refreshToken()` - Refresh auth token

### Inventory Service
- `getAll(params?)` - Get all items
- `getById(id)` - Get single item
- `create(item)` - Create new item
- `update(id, item)` - Update item
- `delete(id)` - Delete item
- `getLowStock()` - Get low stock items
- `getStats()` - Get inventory statistics
- `adjustQuantity(id, adjustment, reason?)` - Adjust quantity

### Orders Service
- `getAll(params?)` - Get all orders
- `getById(id)` - Get single order
- `create(order)` - Create new order
- `update(id, order)` - Update order
- `updateStatus(id, status)` - Update order status
- `delete(id)` - Delete order
- `getStats()` - Get order statistics
- `exportCSV(params?)` - Export to CSV

### Production Service
- `getJobs(params?)` - Get production jobs
- `getJobById(id)` - Get single job
- `createJob(job)` - Create new job
- `updateJob(id, job)` - Update job
- `updateJobStatus(id, status)` - Update job status
- `updateJobProgress(id, progress)` - Update progress
- `getSchedule(params?)` - Get production schedule
- `deleteJob(id)` - Delete job

### Approvals Service
- `getAll(params?)` - Get all approvals
- `getPending()` - Get pending approvals
- `getById(id)` - Get single approval
- `create(approval)` - Create approval request
- `approve(id, notes?)` - Approve request
- `reject(id, reason)` - Reject request
- `getByUser(userId)` - Get user's approvals

### Audit Service
- `getLogs(params?)` - Get audit logs
- `getByEntity(entity, entityId)` - Get logs for entity
- `getByActor(actor)` - Get logs by actor
- `exportLogs(params?)` - Export logs

### Billing Service
- `getSubscription()` - Get current subscription
- `createCheckout(plan)` - Create checkout session
- `createPortal()` - Create customer portal
- `getInvoices()` - Get all invoices
- `updateSubscription(plan)` - Update plan
- `cancelSubscription()` - Cancel subscription

## 🔐 Authentication Flow

1. User logs in via `authService.login()`
2. Token is stored in localStorage
3. All subsequent API calls include token in Authorization header
4. If 401 received, user is redirected to /login
5. Token persists across page reloads via useAuth hook

## 🏃 Running the Application

### Start Backend (Terminal 1)
```bash
cd backend
npm install
npm run dev
# Backend runs on http://localhost:3001
```

### Start Frontend (Terminal 2)
```bash
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

## 📊 Example Components

See these example components for reference:
- `components/examples/InventoryPageConnected.tsx` - Full inventory integration
- `components/examples/OrdersPageConnected.tsx` - Full orders integration

## 🐛 Troubleshooting

### CORS Errors
Make sure backend `.env` has:
```
CORS_ORIGIN=http://localhost:3000
```

### 401 Unauthorized
- Check if token exists: `localStorage.getItem('auth_token')`
- Verify backend JWT_SECRET is set
- Check if token is expired

### Connection Refused
- Verify backend is running on port 3001
- Check `NEXT_PUBLIC_API_URL` environment variable
- Ensure no firewall blocking localhost

## 🎨 TypeScript Types

All services include full TypeScript types for:
- Request payloads
- Response data
- Error handling
- Function parameters

This provides excellent autocomplete and type safety throughout your application.

## ✅ Next Steps

1. Update backend controllers to implement actual business logic
2. Add React Query or SWR for better data fetching/caching
3. Implement proper error boundaries
4. Add loading states and skeleton screens
5. Create forms for data entry
6. Add real-time updates with WebSockets
7. Implement proper authentication in backend

Your frontend is now fully connected to the backend! 🎉
