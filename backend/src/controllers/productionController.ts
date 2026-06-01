import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';
import prisma from '../config/database';

export const getProductionOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { status, startDate, endDate } = req.query;

    const where: any = {
      tenantId: req.tenantId!,
    };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate as string);
      if (endDate) where.startDate.lte = new Date(endDate as string);
    }

    const jobs = await prisma.productionJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Parse materials JSON for each job
    const jobsWithParsedMaterials = jobs.map(job => ({
      ...job,
      materials: job.materials ? JSON.parse(job.materials) : [],
    }));

    return res.json({
      success: true,
      data: jobsWithParsedMaterials,
    });
  } catch (error) {
    console.error('Get production orders error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch production orders' });
  }
};

export const getProductionOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const job = await prisma.productionJob.findFirst({
      where: { 
        id,
        tenantId: req.tenantId!,
      },
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Production job not found' });
    }

    // Parse materials JSON
    const jobWithParsedMaterials = {
      ...job,
      materials: job.materials ? JSON.parse(job.materials) : [],
    };

    return res.json({ success: true, data: jobWithParsedMaterials });
  } catch (error) {
    console.error('Get production order error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch production order' });
  }
};

export const createProductionOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, productName, quantity, startDate, endDate, assignedTo, materials, notes } = req.body;

    if (!productId || !productName || !quantity || !startDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID, product name, quantity, and start date are required' 
      });
    }

    // Generate job number
    const count = await prisma.productionJob.count({
      where: { tenantId: req.tenantId! },
    });
    const jobNumber = `JOB-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const newJob = await prisma.productionJob.create({
      data: {
        tenantId: req.tenantId!,
        jobNumber,
        productId,
        productName,
        quantity: Number(quantity),
        status: 'planned',
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        assignedTo: assignedTo || null,
        materials: materials ? JSON.stringify(materials) : null,
        notes: notes || null,
        progress: 0,
      },
    });

    await createAuditLog({
      tenantId: req.tenantId!,
      actor: req.user!.email,
      action: 'CREATE',
      entity: 'PRODUCTION_JOB',
      entityId: newJob.id,
      meta: { productName, quantity },
    });

    // Parse materials for response
    const jobWithParsedMaterials = {
      ...newJob,
      materials: newJob.materials ? JSON.parse(newJob.materials) : [],
    };

    return res.status(201).json({ 
      success: true, 
      message: 'Production job created', 
      data: jobWithParsedMaterials 
    });
  } catch (error) {
    console.error('Create production order error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create production order' });
  }
};

export const updateProductionOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if job exists
    const existingJob = await prisma.productionJob.findFirst({
      where: { id, tenantId: req.tenantId! },
    });

    if (!existingJob) {
      return res.status(404).json({ success: false, message: 'Production job not found' });
    }

    // Prepare update data
    const updateData: any = {};
    if (updates.productName) updateData.productName = updates.productName;
    if (updates.quantity) updateData.quantity = Number(updates.quantity);
    if (updates.status) updateData.status = updates.status;
    if (updates.startDate) updateData.startDate = new Date(updates.startDate);
    if (updates.endDate) updateData.endDate = new Date(updates.endDate);
    if (updates.assignedTo !== undefined) updateData.assignedTo = updates.assignedTo;
    if (updates.materials) updateData.materials = JSON.stringify(updates.materials);
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.progress !== undefined) updateData.progress = Number(updates.progress);

    const updatedJob = await prisma.productionJob.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog({
      tenantId: req.tenantId!,
      actor: req.user!.email,
      action: 'UPDATE',
      entity: 'PRODUCTION_JOB',
      entityId: id,
      meta: updates,
    });

    // Parse materials for response
    const jobWithParsedMaterials = {
      ...updatedJob,
      materials: updatedJob.materials ? JSON.parse(updatedJob.materials) : [],
    };

    return res.json({ 
      success: true, 
      message: 'Production job updated',
      data: jobWithParsedMaterials 
    });
  } catch (error) {
    console.error('Update production order error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update production order' });
  }
};

export const updateProductionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, progress } = req.body;

    const validStatuses = ['planned', 'in-progress', 'completed', 'on-hold', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (progress !== undefined) updateData.progress = Number(progress);

    const updatedJob = await prisma.productionJob.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog({
      tenantId: req.tenantId!,
      actor: req.user!.email,
      action: 'STATUS_CHANGE',
      entity: 'PRODUCTION_JOB',
      entityId: id,
      meta: { status, progress },
    });

    // Parse materials for response
    const jobWithParsedMaterials = {
      ...updatedJob,
      materials: updatedJob.materials ? JSON.parse(updatedJob.materials) : [],
    };

    return res.json({ 
      success: true, 
      message: 'Production status updated',
      data: jobWithParsedMaterials 
    });
  } catch (error) {
    console.error('Update production status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update production status' });
  }
};

export const getProductionSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {
      tenantId: req.tenantId!,
    };

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate as string);
      if (endDate) where.startDate.lte = new Date(endDate as string);
    }

    const jobs = await prisma.productionJob.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });

    // Group jobs by date
    const schedule: Record<string, any[]> = {};
    jobs.forEach((job) => {
      const dateKey = job.startDate.toISOString().split('T')[0];
      if (!schedule[dateKey]) {
        schedule[dateKey] = [];
      }
      schedule[dateKey].push({
        ...job,
        materials: job.materials ? JSON.parse(job.materials) : [],
      });
    });

    // Convert to array format
    const scheduleArray = Object.entries(schedule).map(([date, jobs]) => ({
      date,
      jobs,
      capacity: 100, // Mock capacity
      utilized: jobs.reduce((sum, job) => sum + (job.progress || 0), 0) / jobs.length || 0,
    }));

    return res.json({ success: true, data: scheduleArray });
  } catch (error) {
    console.error('Get production schedule error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch production schedule' });
  }
};

export const deleteProductionJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const job = await prisma.productionJob.findFirst({
      where: { id, tenantId: req.tenantId! },
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Production job not found' });
    }

    await prisma.productionJob.delete({
      where: { id },
    });

    await createAuditLog({
      tenantId: req.tenantId!,
      actor: req.user!.email,
      action: 'DELETE',
      entity: 'PRODUCTION_JOB',
      entityId: id,
      meta: { jobNumber: job.jobNumber, productName: job.productName },
    });

    return res.json({ success: true, message: 'Production job deleted' });
  } catch (error) {
    console.error('Delete production job error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete production job' });
  }
};
