# InventraERP Backend

Complete Node.js + Express backend for the InventraERP system.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Set Up Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Set Up Database
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations (if needed)
npm run prisma:migrate
```

### 4. Run Development Server
```bash
npm run dev
```

The server will start on `http://localhost:3001`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Database and configuration
│   ├── middleware/      # Authentication, validation, error handling
│   ├── routes/          # API route definitions
│   ├── controllers/     # Business logic
│   ├── utils/           # Helper functions
│   └── server.ts        # Express app entry point
├── .env.example         # Environment variables template
├── package.json
├── tsconfig.json
└── nodemon.json
```

## 🔐 Authentication

The backend uses JWT-based authentication with the following flow:
1. User logs in via `/api/auth/login`
2. Server returns JWT token (stored in httpOnly cookie)
3. Protected routes verify token via `authenticate` middleware
4. Role-based access control via `authorize` middleware

### User Roles
- `owner` - Full access
- `manager` - Management operations
- `finance` - Financial operations
- `production` - Production management
- `worker` - Limited read access

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Get current session
- `POST /api/auth/refresh` - Refresh token

### Inventory
- `GET /api/inventory` - List inventory items
- `GET /api/inventory/:id` - Get item details
- `POST /api/inventory` - Create item
- `PUT /api/inventory/:id` - Update item
- `DELETE /api/inventory/:id` - Delete item
- `GET /api/inventory/low-stock/alert` - Low stock alerts
- `POST /api/inventory/:id/adjust` - Adjust stock

### Orders
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order
- `PATCH /api/orders/:id/status` - Update status
- `GET /api/orders/stats/summary` - Order statistics

### Production
- `GET /api/production` - List production orders
- `GET /api/production/:id` - Get production order
- `POST /api/production` - Create production order
- `PUT /api/production/:id` - Update production order
- `PATCH /api/production/:id/status` - Update status
- `GET /api/production/schedule/view` - Production schedule

### Sales
- `GET /api/sales` - List sales orders
- `GET /api/sales/:id` - Get sales order
- `POST /api/sales` - Create sales order
- `PUT /api/sales/:id` - Update sales order
- `GET /api/sales/stats/revenue` - Revenue statistics
- `GET /api/sales/stats/top-customers` - Top customers

### Approvals
- `GET /api/approvals` - List approvals
- `GET /api/approvals/:id` - Get approval details
- `POST /api/approvals` - Create approval request
- `PATCH /api/approvals/:id/approve` - Approve request
- `PATCH /api/approvals/:id/reject` - Reject request
- `GET /api/approvals/pending/my` - My pending approvals

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook (public)
- `POST /api/webhooks/inventra` - Inventra webhook (public)
- `GET /api/webhooks` - List webhooks
- `POST /api/webhooks/register` - Register webhook
- `PUT /api/webhooks/:id` - Update webhook
- `DELETE /api/webhooks/:id` - Delete webhook
- `GET /api/webhooks/logs` - Webhook logs

### Billing
- `GET /api/billing/subscription` - Get subscription
- `POST /api/billing/checkout` - Create checkout session
- `POST /api/billing/portal` - Create portal session
- `GET /api/billing/usage` - Usage metrics
- `POST /api/billing/upgrade` - Upgrade plan

### Audit
- `GET /api/audit` - List audit logs
- `GET /api/audit/:id` - Get audit log
- `GET /api/audit/entity/:entityId` - Entity audit trail

### Usage
- `POST /api/usage/track` - Track usage event
- `GET /api/usage/report` - Usage report

### Inbox
- `GET /api/inbox` - List inbox items
- `GET /api/inbox/:id` - Get inbox item
- `PATCH /api/inbox/:id/read` - Mark as read
- `PATCH /api/inbox/:id/archive` - Archive item
- `DELETE /api/inbox/:id` - Delete item

### Integrations
- `GET /api/integrations` - List integrations
- `POST /api/integrations/connect` - Connect integration
- `DELETE /api/integrations/:id` - Disconnect integration
- `POST /api/integrations/:id/sync` - Sync integration

## 🔒 Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- JWT authentication
- Role-based access control
- Input validation
- SQL injection protection (Prisma)
- XSS prevention

## 🗄️ Database

The backend uses Prisma ORM with SQLite (development) or PostgreSQL (production).

### Tenant Isolation
All data queries are automatically filtered by `tenantId` via middleware to ensure multi-tenant isolation.

## 📊 Audit Logging

All critical operations are automatically logged to the `Audit` table:
- User actions
- Entity changes
- Approvals
- Integrations

## 🧪 Testing the API

You can test the API using curl, Postman, or any HTTP client:

```bash
# Health check
curl http://localhost:3001/health

# Login (mock - no password validation yet)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get orders (with auth token)
curl http://localhost:3001/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚧 Development Notes

### Mock Data
Controllers currently return mock data since additional database models need to be added to Prisma schema:
- Inventory items
- Production orders
- Sales orders
- Approvals
- Inbox notifications

### To Add Real Data:
1. Update `prisma/schema.prisma` with new models
2. Run `npm run prisma:migrate`
3. Update controllers to use real Prisma queries

### Password Authentication
The User model needs a password field. Update the schema and add bcrypt hashing in the auth controller.

## 🔧 Environment Variables

Required environment variables (see `.env.example`):
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `DATABASE_URL` - Database connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRY` - Token expiration time
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `CORS_ORIGIN` - Allowed frontend origin

## 📦 Production Deployment

### Build
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Recommended Setup
- Use PostgreSQL instead of SQLite
- Set strong JWT_SECRET
- Enable HTTPS
- Configure proper CORS origins
- Set up monitoring and logging
- Use environment-specific configs
- Enable database backups

## 🤝 Integration with Frontend

The backend is designed to work with the Next.js frontend in the parent directory:
1. Frontend runs on `http://localhost:3000`
2. Backend runs on `http://localhost:3001`
3. CORS is configured to allow cross-origin requests
4. JWT tokens are stored in httpOnly cookies

## 📝 License

Part of the InventraERP project.
