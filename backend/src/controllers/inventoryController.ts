import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '../utils/audit';

const prisma = new PrismaClient();

/**
 * Get all inventory items for tenant
 */
export const getInventoryItems = async (req: AuthRequest, res: Response) => {
  try {
    const { category, search, lowStock } = req.query;
    
    const where: any = {
      tenantId: req.tenantId,
    };
    
    if (category) {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    let items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    
    // Filter low stock items if requested
    if (lowStock === 'true') {
      items = items.filter(item => 
        item.reorderPoint !== null && item.quantity <= item.reorderPoint
      );
    }
    
    return res.json({ success: true, data: items });
  } catch (error) {
    console.error('Get inventory items error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch inventory items',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get single inventory item by ID
 */
export const getInventoryItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
    });
    
    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inventory item not found' 
      });
    }
    
    return res.json({ success: true, data: item });
  } catch (error) {
    console.error('Get inventory item error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch inventory item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Create new inventory item
 */
export const createInventoryItem = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      sku, 
      name, 
      description,
      category,
      quantity, 
      unit, 
      reorderPoint,
      location, 
      cost, 
      price,
      supplier
    } = req.body;
    
    // Validation
    if (!sku || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'SKU and name are required' 
      });
    }
    
    // Check if SKU already exists for this tenant
    const existing = await prisma.inventoryItem.findFirst({
      where: {
        tenantId: req.tenantId!,
        sku,
      },
    });
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'SKU already exists' 
      });
    }
    
    const item = await prisma.inventoryItem.create({
      data: {
        tenantId: req.tenantId!,
        sku,
        name,
        description,
        category,
        quantity: quantity || 0,
        unit: unit || 'pcs',
        reorderPoint,
        location,
        cost,
        price,
        supplier,
      },
    });
    
    await createAuditLog({
      tenantId: req.tenantId!,
      actor: req.user!.email,
      action: 'CREATE',
      entity: 'INVENTORY_ITEM',
      entityId: item.id,
      meta: JSON.stringify({ sku: item.sku, name: item.name }),
    });
    
    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error('Create inventory item error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to create inventory item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update existing inventory item
 */
export const updateInventoryItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      sku,
      name, 
      description,
      category,
      quantity, 
      unit, 
      reorderPoint,
      location, 
      cost, 
      price,
      supplier
    } = req.body;
    
    const existing = await prisma.inventoryItem.findFirst({
      where: { id, tenantId: req.tenantId },
    });
    
    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inventory item not found' 
      });
    }
    
    // Check SKU uniqueness if being changed
    if (sku && sku !== existing.sku) {
      const skuExists = await prisma.inventoryItem.findFirst({
        where: {
          tenantId: req.tenantId!,
          sku,
        },
      });
      
      if (skuExists) {
        return res.status(400).json({ 
          success: false, 
          message: 'SKU already exists' 
        });
      }
    }
    
    const updateData: any = {};
    
    if (sku !== undefined) updateData.sku = sku;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (unit !== undefined) updateData.unit = unit;
    if (reorderPoint !== undefined) updateData.reorderPoint = reorderPoint;
    if (location !== undefined) updateData.location = location;
    if (cost !== undefined) updateData.cost = cost;
    if (price !== undefined) updateData.price = price;
    if (supplier !== undefined) updateData.supplier = supplier;
    
    const item = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
    });
    
    await createAuditLog({
      tenantId: req.tenantId!,
      actor: req.user!.email,
      action: 'UPDATE',
      entity: 'INVENTORY_ITEM',
      entityId: item.id,
      meta: JSON.stringify({ sku: item.sku }),
    });
    
    return res.json({ success: true, data: item });
  } catch (error) {
    console.error('Update inventory item error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update inventory item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Adjust inventory quantity (add or subtract)
 */
export const adjustInventory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { adjustment, reason } = req.body;
    
    if (adjustment === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Adjustment amount is required' 
      });
    }
    
    const existing = await prisma.inventoryItem.findFirst({
      where: { id, tenantId: req.tenantId },
    });
    
    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inventory item not found' 
      });
    }
    
    const newQuantity = existing.quantity + adjustment;
    
    if (newQuantity < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient inventory quantity' 
      });
    }
    
    const item = await prisma.inventoryItem.update({
      where: { id },
      data: { quantity: newQuantity },
    });
    
    await createAuditLog({
      tenantId: req.tenantId!,
      actor: req.user!.email,
      action: 'ADJUST',
      entity: 'INVENTORY_ITEM',
      entityId: item.id,
      meta: JSON.stringify({ 
        sku: item.sku, 
        oldQuantity: existing.quantity,
        adjustment,
        newQuantity,
        reason 
      }),
    });
    
    return res.json({ success: true, data: item });
  } catch (error) {
    console.error('Adjust inventory error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to adjust inventory',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete inventory item
 */
export const deleteInventoryItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.inventoryItem.findFirst({
      where: { id, tenantId: req.tenantId },
    });
    
    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inventory item not found' 
      });
    }
    
    await prisma.inventoryItem.delete({
      where: { id },
    });
    
    await createAuditLog({
      tenantId: req.tenantId!,
      actor: req.user!.email,
      action: 'DELETE',
      entity: 'INVENTORY_ITEM',
      entityId: id,
      meta: JSON.stringify({ sku: existing.sku, name: existing.name }),
    });
    
    return res.json({ 
      success: true, 
      message: 'Inventory item deleted successfully' 
    });
  } catch (error) {
    console.error('Delete inventory item error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to delete inventory item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get inventory statistics
 */
export const getInventoryStats = async (req: AuthRequest, res: Response) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      where: { tenantId: req.tenantId },
    });
    
    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => 
      sum + (item.cost || 0) * item.quantity, 0
    );
    
    const lowStockItems = items.filter(item => 
      item.reorderPoint !== null && item.quantity <= item.reorderPoint
    );
    
    const outOfStockItems = items.filter(item => item.quantity === 0);
    
    const stats = {
      totalItems,
      totalValue,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      lowStockItems: lowStockItems.map(item => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        reorderPoint: item.reorderPoint,
      })),
    };
    
    return res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get inventory stats error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch inventory statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
