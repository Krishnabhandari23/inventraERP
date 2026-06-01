import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';

export const getIntegrations = async (req: AuthRequest, res: Response) => {
  try {
    // Mock available integrations
    const mockIntegrations = [
      {
        id: 'quickbooks',
        name: 'QuickBooks',
        description: 'Sync accounting data with QuickBooks',
        category: 'accounting',
        status: 'available',
        isConnected: false,
        icon: '/icons/quickbooks.svg',
      },
      {
        id: 'shopify',
        name: 'Shopify',
        description: 'Connect your Shopify store for order sync',
        category: 'ecommerce',
        status: 'available',
        isConnected: false,
        icon: '/icons/shopify.svg',
      },
      {
        id: 'stripe',
        name: 'Stripe',
        description: 'Payment processing and invoicing',
        category: 'payment',
        status: 'connected',
        isConnected: true,
        connectedAt: new Date('2025-01-10'),
        icon: '/icons/stripe.svg',
      },
      {
        id: 'slack',
        name: 'Slack',
        description: 'Get notifications in Slack',
        category: 'communication',
        status: 'connected',
        isConnected: true,
        connectedAt: new Date('2025-01-15'),
        icon: '/icons/slack.svg',
      },
    ];

    return res.json({ success: true, data: mockIntegrations });
  } catch (error) {
    console.error('Get integrations error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch integrations' });
  }
};

export const connectIntegration = async (req: AuthRequest, res: Response) => {
  try {
    const { integrationId, config } = req.body;

    if (!integrationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Integration ID is required' 
      });
    }

    // Mock connection
    const connection = {
      integrationId,
      status: 'connected',
      connectedAt: new Date(),
      config: config || {},
      tenantId: req.tenantId,
    };

    await createAuditLog({
      tenantId: req.tenantId!,
      actor: req.user!.email,
      action: 'CONNECT',
      entity: 'INTEGRATION',
      entityId: integrationId,
      meta: { integrationId },
    });

    return res.status(201).json({ 
      success: true, 
      message: 'Integration connected', 
      data: connection 
    });
  } catch (error) {
    console.error('Connect integration error:', error);
    return res.status(500).json({ success: false, message: 'Failed to connect integration' });
  }
};

export const disconnectIntegration = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await createAuditLog({
      tenantId: req.tenantId!,
      actor: req.user!.email,
      action: 'DISCONNECT',
      entity: 'INTEGRATION',
      entityId: id,
    });

    return res.json({ success: true, message: 'Integration disconnected' });
  } catch (error) {
    console.error('Disconnect integration error:', error);
    return res.status(500).json({ success: false, message: 'Failed to disconnect integration' });
  }
};

export const syncIntegration = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Mock sync process
    const syncResult = {
      integrationId: id,
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      recordsSynced: 127,
      errors: 0,
    };

    await createAuditLog({
      tenantId: req.tenantId!,
      actor: req.user!.email,
      action: 'SYNC',
      entity: 'INTEGRATION',
      entityId: id,
      meta: syncResult,
    });

    return res.json({ 
      success: true, 
      message: 'Sync completed', 
      data: syncResult 
    });
  } catch (error) {
    console.error('Sync integration error:', error);
    return res.status(500).json({ success: false, message: 'Failed to sync integration' });
  }
};
