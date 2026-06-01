import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '../utils/audit';

const prisma = new PrismaClient();

/**
 * Get all invoices for tenant
 */
export const getInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const { status, customer, startDate, endDate } = req.query;
    
    const where: any = {
      tenantId: req.tenantId,
    };
    
    if (status) {
      where.status = status;
    }
    
    if (customer) {
      where.customer = {
        contains: customer as string,
        mode: 'insensitive',
      };
    }
    
    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) where.issueDate.gte = new Date(startDate as string);
      if (endDate) where.issueDate.lte = new Date(endDate as string);
    }
    
    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    
    return res.json({ success: true, data: invoices });
  } catch (error) {
    console.error('Get invoices error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch invoices',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get single invoice by ID
 */
export const getInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
    });
    
    if (!invoice) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invoice not found' 
      });
    }
    
    return res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Get invoice error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch invoice',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Create new invoice
 */
export const createInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      customer, 
      customerEmail, 
      items, 
      subtotal, 
      tax, 
      total,
      dueDate,
      paymentMethod,
      notes 
    } = req.body;
    
    // Validation
    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer and items are required' 
      });
    }
    
    // Generate invoice number
    const count = await prisma.invoice.count({
      where: { tenantId: req.tenantId },
    });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: req.tenantId!,
        invoiceNumber,
        customer,
        customerEmail,
        items: JSON.stringify(items),
        subtotal: subtotal || 0,
        tax: tax || 0,
        total: total || subtotal || 0,
        status: 'pending',
        issueDate: new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        paymentMethod,
        notes,
      },
    });
    
    await createAuditLog({
      tenantId: req.tenantId!,
      actor: req.user!.email,
      action: 'CREATE',
      entity: 'INVOICE',
      entityId: invoice.id,
      meta: JSON.stringify({ invoiceNumber: invoice.invoiceNumber, customer }),
    });
    
    return res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    console.error('Create invoice error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to create invoice',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update existing invoice
 */
export const updateInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      customer, 
      customerEmail, 
      items, 
      subtotal, 
      tax, 
      total,
      status,
      dueDate,
      paidDate,
      paymentMethod,
      notes 
    } = req.body;
    
    const existing = await prisma.invoice.findFirst({
      where: { id, tenantId: req.tenantId },
    });
    
    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invoice not found' 
      });
    }
    
    const updateData: any = {};
    
    if (customer !== undefined) updateData.customer = customer;
    if (customerEmail !== undefined) updateData.customerEmail = customerEmail;
    if (items !== undefined) updateData.items = JSON.stringify(items);
    if (subtotal !== undefined) updateData.subtotal = subtotal;
    if (tax !== undefined) updateData.tax = tax;
    if (total !== undefined) updateData.total = total;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (paidDate !== undefined) updateData.paidDate = new Date(paidDate);
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (notes !== undefined) updateData.notes = notes;
    
    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
    });
    
    await createAuditLog({
      tenantId: req.tenantId!,
      actor: req.user!.email,
      action: 'UPDATE',
      entity: 'INVOICE',
      entityId: invoice.id,
      meta: JSON.stringify({ invoiceNumber: invoice.invoiceNumber }),
    });
    
    return res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Update invoice error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update invoice',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update invoice status
 */
export const updateInvoiceStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, paidDate } = req.body;
    
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status is required' 
      });
    }
    
    const existing = await prisma.invoice.findFirst({
      where: { id, tenantId: req.tenantId },
    });
    
    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invoice not found' 
      });
    }
    
    const updateData: any = { status };
    
    // If marked as paid, set paidDate
    if (status === 'paid' && !existing.paidDate) {
      updateData.paidDate = paidDate ? new Date(paidDate) : new Date();
    }
    
    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
    });
    
    await createAuditLog({
      tenantId: req.tenantId!,
      actor: req.user!.email,
      action: 'UPDATE',
      entity: 'INVOICE',
      entityId: invoice.id,
      meta: JSON.stringify({ 
        invoiceNumber: invoice.invoiceNumber, 
        oldStatus: existing.status,
        newStatus: status 
      }),
    });
    
    return res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Update invoice status error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update invoice status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete invoice
 */
export const deleteInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.invoice.findFirst({
      where: { id, tenantId: req.tenantId },
    });
    
    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invoice not found' 
      });
    }
    
    await prisma.invoice.delete({
      where: { id },
    });
    
    await createAuditLog({
      tenantId: req.tenantId!,
      actor: req.user!.email,
      action: 'DELETE',
      entity: 'INVOICE',
      entityId: id,
      meta: JSON.stringify({ invoiceNumber: existing.invoiceNumber }),
    });
    
    return res.json({ 
      success: true, 
      message: 'Invoice deleted successfully' 
    });
  } catch (error) {
    console.error('Delete invoice error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to delete invoice',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get revenue statistics
 */
export const getRevenueStats = async (req: AuthRequest, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId: req.tenantId },
    });
    
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const pendingRevenue = invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const overdueRevenue = invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const stats = {
      totalRevenue,
      pendingRevenue,
      overdueRevenue,
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter(inv => inv.status === 'paid').length,
      pendingInvoices: invoices.filter(inv => inv.status === 'pending').length,
      overdueInvoices: invoices.filter(inv => inv.status === 'overdue').length,
    };
    
    return res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get revenue stats error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch revenue statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get top customers by revenue
 */
export const getTopCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 5 } = req.query;
    
    const invoices = await prisma.invoice.findMany({
      where: { 
        tenantId: req.tenantId,
        status: 'paid',
      },
    });
    
    // Group by customer and sum totals
    const customerMap = new Map<string, number>();
    
    invoices.forEach(invoice => {
      const current = customerMap.get(invoice.customer) || 0;
      customerMap.set(invoice.customer, current + invoice.total);
    });
    
    // Convert to array and sort
    const topCustomers = Array.from(customerMap.entries())
      .map(([customer, total]) => ({ customer, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, Number(limit));
    
    return res.json({ success: true, data: topCustomers });
  } catch (error) {
    console.error('Get top customers error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch top customers',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
