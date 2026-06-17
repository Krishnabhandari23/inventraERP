import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'acme' },
    update: {},
    create: {
      name: 'Acme Corporation',
      subdomain: 'acme',
    },
  });

  console.log('✅ Created tenant:', tenant.name);

  // Create demo users with hashed passwords
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = [
    {
      email: 'admin@acme.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'owner',
      tenantId: tenant.id,
    },
    {
      email: 'manager@acme.com',
      password: hashedPassword,
      name: 'Manager User',
      role: 'manager',
      tenantId: tenant.id,
    },
    {
      email: 'worker@acme.com',
      password: hashedPassword,
      name: 'Worker User',
      role: 'worker',
      tenantId: tenant.id,
    },
  ];

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email_tenantId: { email: userData.email, tenantId: userData.tenantId } },
      update: {},
      create: userData,
    });
    console.log('✅ Created user:', user.email);
  }

  // Create demo org
  const org = await prisma.org.upsert({
    where: { id: 'demo-org-id' },
    update: {},
    create: {
      id: 'demo-org-id',
      name: 'Main Office',
      tenantId: tenant.id,
    },
  });

  console.log('✅ Created org:', org.name);

  // Create demo subscription
  await prisma.subscription.upsert({
    where: { id: 'demo-sub-id' },
    update: {},
    create: {
      id: 'demo-sub-id',
      tenantId: tenant.id,
      plan: 'growth',
      status: 'active',
    },
  });

  console.log('✅ Created subscription');

  // Create demo production jobs
  const productionJobs = [
    {
      tenantId: tenant.id,
      jobNumber: 'JOB-2026-0001',
      productId: 'PROD-001',
      productName: 'Widget A - Blue',
      quantity: 500,
      status: 'in-progress',
      startDate: new Date('2026-01-06'),
      endDate: new Date('2026-01-20'),
      assignedTo: 'Team A',
      progress: 45,
      materials: JSON.stringify([
        { id: '1', name: 'Raw Material A', quantity: 100, allocated: true },
        { id: '2', name: 'Raw Material B', quantity: 50, allocated: true },
      ]),
      notes: 'Priority order - Quality check after 250 units',
    },
    {
      tenantId: tenant.id,
      jobNumber: 'JOB-2026-0002',
      productId: 'PROD-002',
      productName: 'Component B - Standard',
      quantity: 1000,
      status: 'planned',
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-02-01'),
      assignedTo: 'Team B',
      progress: 0,
      materials: JSON.stringify([
        { id: '3', name: 'Steel Sheet', quantity: 200, allocated: false },
        { id: '4', name: 'Fasteners', quantity: 500, allocated: false },
      ]),
      notes: 'Materials need to be ordered',
    },
    {
      tenantId: tenant.id,
      jobNumber: 'JOB-2026-0003',
      productId: 'PROD-003',
      productName: 'Assembly Unit C',
      quantity: 250,
      status: 'completed',
      startDate: new Date('2025-12-20'),
      endDate: new Date('2026-01-05'),
      assignedTo: 'Team A',
      progress: 100,
      materials: JSON.stringify([]),
      notes: 'Completed ahead of schedule',
    },
  ];

  for (const jobData of productionJobs) {
    await prisma.productionJob.upsert({
      where: { jobNumber: jobData.jobNumber },
      update: {},
      create: jobData,
    });
    console.log('✅ Created production job:', jobData.jobNumber);
  }

  // Create demo orders
  const orders = [
    {
      tenantId: tenant.id,
      orderNumber: 'ORD-2026-0001',
      customer: 'Acme Corp',
      customerEmail: 'orders@acmecorp.com',
      status: 'processing',
      items: JSON.stringify([
        { id: '1', productId: 'PROD-001', productName: 'Widget A - Blue', quantity: 10, price: 45.00, total: 450.00 },
        { id: '2', productId: 'PROD-002', productName: 'Component B', quantity: 20, price: 30.00, total: 600.00 },
      ]),
      subtotal: 1050.00,
      tax: 105.00,
      shipping: 95.50,
      total: 1250.50,
      notes: 'Urgent delivery requested',
    },
    {
      tenantId: tenant.id,
      orderNumber: 'ORD-2026-0002',
      customer: 'Global Industries',
      customerEmail: 'procurement@globalind.com',
      status: 'pending',
      items: JSON.stringify([
        { id: '1', productId: 'PROD-003', productName: 'Assembly Unit C', quantity: 5, price: 120.00, total: 600.00 },
        { id: '2', productId: 'PROD-001', productName: 'Widget A - Blue', quantity: 15, price: 45.00, total: 675.00 },
        { id: '3', productId: 'PROD-004', productName: 'Premium Package', quantity: 3, price: 200.00, total: 600.00 },
      ]),
      subtotal: 1875.00,
      tax: 187.50,
      shipping: 125.00,
      total: 2187.50,
      notes: null,
    },
    {
      tenantId: tenant.id,
      orderNumber: 'ORD-2026-0003',
      customer: 'Tech Solutions Inc',
      customerEmail: 'orders@techsolutions.io',
      status: 'completed',
      items: JSON.stringify([
        { id: '1', productId: 'PROD-002', productName: 'Component B', quantity: 50, price: 30.00, total: 1500.00 },
      ]),
      subtotal: 1500.00,
      tax: 150.00,
      shipping: 0,
      total: 1650.00,
      notes: 'Delivered successfully',
    },
  ];

  for (const orderData of orders) {
    await prisma.order.upsert({
      where: { orderNumber: orderData.orderNumber },
      update: {},
      create: orderData,
    });
    console.log('✅ Created order:', orderData.orderNumber);
  }

  // Create demo invoices
  const invoices = [
    {
      tenantId: tenant.id,
      invoiceNumber: 'INV-2026-0001',
      customer: 'Acme Industries',
      customerEmail: 'billing@acme-ind.com',
      status: 'paid',
      items: JSON.stringify([
        { id: '1', description: 'Widget A (x100)', quantity: 100, unitPrice: 45.00, total: 4500.00 },
        { id: '2', description: 'Service Fee', quantity: 1, unitPrice: 750.00, total: 750.00 },
      ]),
      subtotal: 5250.00,
      tax: 525.00,
      total: 5775.00,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
      paidDate: new Date('2026-01-05'),
      paymentMethod: 'Bank Transfer',
      notes: 'Payment received on time',
    },
    {
      tenantId: tenant.id,
      invoiceNumber: 'INV-2026-0002',
      customer: 'Global Enterprises',
      customerEmail: 'accounts@global-ent.com',
      status: 'pending',
      items: JSON.stringify([
        { id: '1', description: 'Component B (x50)', quantity: 50, unitPrice: 89.00, total: 4450.00 },
        { id: '2', description: 'Installation Service', quantity: 1, unitPrice: 500.00, total: 500.00 },
      ]),
      subtotal: 4950.00,
      tax: 495.00,
      total: 5445.00,
      issueDate: new Date('2026-01-03'),
      dueDate: new Date('2026-02-03'),
      paymentMethod: 'Credit Card',
    },
    {
      tenantId: tenant.id,
      invoiceNumber: 'INV-2026-0003',
      customer: 'Tech Solutions Inc',
      customerEmail: 'finance@techsolutions.io',
      status: 'overdue',
      items: JSON.stringify([
        { id: '1', description: 'Product Suite License', quantity: 1, unitPrice: 12000.00, total: 12000.00 },
      ]),
      subtotal: 12000.00,
      tax: 1200.00,
      total: 13200.00,
      issueDate: new Date('2025-12-15'),
      dueDate: new Date('2026-01-05'),
      notes: 'Follow up required',
    },
  ];

  for (const invoiceData of invoices) {
    await prisma.invoice.upsert({
      where: { invoiceNumber: invoiceData.invoiceNumber },
      update: {},
      create: invoiceData,
    });
    console.log('✅ Created invoice:', invoiceData.invoiceNumber);
  }

  // Create demo inventory items
  const inventoryItems = [
    {
      tenantId: tenant.id,
      sku: 'ITEM-001',
      name: 'Cotton Thread - White',
      description: 'High quality cotton thread for textile production',
      category: 'Raw Materials',
      quantity: 1500,
      unit: 'roll',
      reorderPoint: 500,
      location: 'Warehouse A - Section 1',
      cost: 25.50,
      price: 45.00,
      supplier: 'Textile Supplies Co',
    },
    {
      tenantId: tenant.id,
      sku: 'ITEM-002',
      name: 'Polyester Fabric',
      description: 'Premium polyester fabric roll',
      category: 'Raw Materials',
      quantity: 250,
      unit: 'm',
      reorderPoint: 100,
      location: 'Warehouse A - Section 2',
      cost: 120.00,
      price: 180.00,
      supplier: 'FabricWorld Ltd',
    },
    {
      tenantId: tenant.id,
      sku: 'ITEM-003',
      name: 'Metal Buttons - Silver',
      description: 'Silver colored metal buttons, 15mm',
      category: 'Components',
      quantity: 5000,
      unit: 'pcs',
      reorderPoint: 2000,
      location: 'Warehouse B - Shelf 3',
      cost: 0.50,
      price: 1.20,
      supplier: 'Button Masters',
    },
    {
      tenantId: tenant.id,
      sku: 'ITEM-004',
      name: 'Packaging Boxes',
      description: 'Standard shipping boxes with logo',
      category: 'Packaging',
      quantity: 800,
      unit: 'box',
      reorderPoint: 300,
      location: 'Warehouse C',
      cost: 5.00,
      price: 8.00,
      supplier: 'PackPro Solutions',
    },
    {
      tenantId: tenant.id,
      sku: 'ITEM-005',
      name: 'Zipper - 20cm',
      description: 'Standard zipper 20cm length, various colors',
      category: 'Components',
      quantity: 50,
      unit: 'pcs',
      reorderPoint: 200,
      location: 'Warehouse B - Shelf 5',
      cost: 2.50,
      price: 5.00,
      supplier: 'Zipper Warehouse',
    },
  ];

  for (const itemData of inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: { tenantId_sku: { tenantId: tenant.id, sku: itemData.sku } },
      update: {},
      create: itemData,
    });
    console.log('✅ Created inventory item:', itemData.sku);
  }

  console.log('🎉 Seeding completed!');
  console.log('\n📝 Demo credentials:');
  console.log('  Email: admin@acme.com');
  console.log('  Email: manager@acme.com');
  console.log('  Email: worker@acme.com');
  console.log('  Password: password123');
  console.log('  Store ID: acme');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
