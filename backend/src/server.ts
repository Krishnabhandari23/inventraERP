import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import authRoutes from './routes/auth';
import inventoryRoutes from './routes/inventory';
import ordersRoutes from './routes/orders';
import productionRoutes from './routes/production';
import salesRoutes from './routes/sales';
import approvalsRoutes from './routes/approvals';
import webhooksRoutes from './routes/webhooks';
import billingRoutes from './routes/billing';
import auditRoutes from './routes/audit';
import usageRoutes from './routes/usage';
import inboxRoutes from './routes/inbox';
import notificationsRoutes from './routes/notifications';
import integrationsRoutes from './routes/integrations';
import invisRoutes from './routes/invis';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Security & Performance Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));

// CORS Configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/approvals', approvalsRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/invis', invisRoutes);

// Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 InventraERP Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
});

export default app;
