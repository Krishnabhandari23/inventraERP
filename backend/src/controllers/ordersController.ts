import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';
import prisma from '../config/database';
import { generateUniqueOrderNumber } from '../utils/orderNumbers';

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;

    const where: any = {
      tenantId: req.tenantId!,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string, mode: 'insensitive' } },
        { customer: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
    });

    const total = await prisma.order.count({ where });

    // Parse items JSON for each order
    const ordersWithParsedItems = orders.map(order => ({
      ...order,
      items: order.items ? JSON.parse(order.items) : [],
    }));

    return res.json({
      success: true,
      orders: ordersWithParsedItems,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch orders' 
    });
  }
};

export const getOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { 
        id,
        tenantId: req.tenantId!,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Parse items JSON
    const orderWithParsedItems = {
      ...order,
      items: order.items ? JSON.parse(order.items) : [],
    };

    return res.json({ success: true, data: orderWithParsedItems });
  } catch (error) {
    console.error('Get order error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { customer, customerEmail, items, subtotal, tax, shipping, notes } = req.body;

    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer and at least one item are required' 
      });
    }

    // Generate unique order number
    const orderNumber = generateUniqueOrderNumber();

    // Calculate totals
    const calculatedSubtotal = subtotal || items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const calculatedTax = tax || 0;
    const calculatedShipping = shipping || 0;
    const total = calculatedSubtotal + calculatedTax + calculatedShipping;

    const newOrder = await prisma.order.create({
      data: {
        tenantId: req.tenantId!,
        orderNumber,
        customer,
        customerEmail: customerEmail || null,
        status: 'pending',
        items: JSON.stringify(items),
        subtotal: calculatedSubtotal,
        tax: calculatedTax,
        shipping: calculatedShipping,
        total,
        notes: notes || null,
      },
    });

    await createAuditLog({
      tenantId: req.tenantId!,
      actor: req.user!.email,
      action: 'CREATE',
      entity: 'ORDER',
      entityId: newOrder.id,
      meta: { customer, total },
    });

    // Parse items for response
    const orderWithParsedItems = {
      ...newOrder,
      items: JSON.parse(newOrder.items),
    };

    return res.status(201).json({ 
      success: true, 
      message: 'Order created', 
      data: orderWithParsedItems 
    });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create order' });
  }
};

export const updateOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if order exists
    const existingOrder = await prisma.order.findFirst({
      where: { id, tenantId: req.tenantId! },
    });

    if (!existingOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Prepare update data
    const updateData: any = {};
    if (updates.customer) updateData.customer = updates.customer;
    if (updates.customerEmail !== undefined) updateData.customerEmail = updates.customerEmail;
    if (updates.status) updateData.status = updates.status;
    if (updates.items) {
      updateData.items = JSON.stringify(updates.items);
      // Recalculate totals if items changed
      const subtotal = updates.items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);
      updateData.subtotal = subtotal;
      updateData.total = subtotal + (existingOrder.tax || 0) + (existingOrder.shipping || 0);
    }
    if (updates.tax !== undefined) {
      updateData.tax = updates.tax;
      updateData.total = (updates.subtotal || existingOrder.subtotal) + updates.tax + (existingOrder.shipping || 0);
    }
    if (updates.shipping !== undefined) {
      updateData.shipping = updates.shipping;
      updateData.total = (updates.subtotal || existingOrder.subtotal) + (existingOrder.tax || 0) + updates.shipping;
    }
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog({
      tenantId: req.tenantId!,
      actor: req.user!.email,
      action: 'UPDATE',
      entity: 'ORDER',
      entityId: id,
      meta: updates,
    });

    // Parse items for response
    const orderWithParsedItems = {
      ...updatedOrder,
      items: JSON.parse(updatedOrder.items),
    };

    return res.json({ 
      success: true, 
      message: 'Order updated',
      data: orderWithParsedItems 
    });
  } catch (error) {
    console.error('Update order error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update order' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'completed', 'cancelled', 'shipped'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
    });

    await createAuditLog({
      tenantId: req.tenantId!,
      actor: req.user!.email,
      action: 'STATUS_CHANGE',
      entity: 'ORDER',
      entityId: id,
      meta: { status },
    });

    // Parse items for response
    const orderWithParsedItems = {
      ...updatedOrder,
      items: JSON.parse(updatedOrder.items),
    };

    return res.json({ 
      success: true, 
      message: 'Order status updated',
      data: orderWithParsedItems 
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
};

export const deleteOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id, tenantId: req.tenantId! },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await prisma.order.delete({
      where: { id },
    });

    await createAuditLog({
      tenantId: req.tenantId!,
      actor: req.user!.email,
      action: 'DELETE',
      entity: 'ORDER',
      entityId: id,
      meta: { orderNumber: order.orderNumber, customer: order.customer },
    });

    return res.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    console.error('Delete order error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete order' });
  }
};

export const getOrderStats = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { tenantId: req.tenantId! },
    });

    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      completed: orders.filter(o => o.status === 'completed').length,
      revenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0),
    };

    return res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get order stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch order stats' });
  }
};
