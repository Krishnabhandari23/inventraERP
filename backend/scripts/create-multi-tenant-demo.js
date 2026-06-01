const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function upsertUser({ email, name, role, tenantId, passwordHash }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return prisma.user.update({
      where: { email },
      data: { name, role, tenantId, password: passwordHash },
    });
  }

  return prisma.user.create({
    data: { email, name, role, tenantId, password: passwordHash },
  });
}

async function upsertInventory(item) {
  const existing = await prisma.inventoryItem.findFirst({
    where: { tenantId: item.tenantId, sku: item.sku },
  });

  if (existing) {
    return prisma.inventoryItem.update({
      where: { id: existing.id },
      data: {
        name: item.name,
        description: item.description,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        reorderPoint: item.reorderPoint,
        location: item.location,
        cost: item.cost,
        price: item.price,
        supplier: item.supplier,
      },
    });
  }

  return prisma.inventoryItem.create({ data: item });
}

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const tenants = [
    {
      name: 'Nova Electronics Pvt Ltd',
      subdomain: 'nova',
      users: [
        { email: 'admin@nova.com', name: 'Nova Admin', role: 'owner' },
        { email: 'manager@nova.com', name: 'Nova Manager', role: 'manager' },
        { email: 'worker@nova.com', name: 'Nova Worker', role: 'worker' },
      ],
      inventory: [
        {
          sku: 'NOVA-CAP-100UF',
          name: 'Electrolytic Capacitor 100uF',
          description: 'Radial electrolytic capacitor 100uF 25V',
          category: 'Components',
          quantity: 3200,
          unit: 'pcs',
          reorderPoint: 800,
          location: 'E-Bin A2',
          cost: 0.12,
          price: 0.35,
          supplier: 'VoltCore Supplies',
        },
        {
          sku: 'NOVA-RES-10K',
          name: 'Resistor 10k Ohm',
          description: '1/4W carbon film resistor 10k',
          category: 'Components',
          quantity: 12000,
          unit: 'pcs',
          reorderPoint: 3000,
          location: 'E-Bin A1',
          cost: 0.02,
          price: 0.08,
          supplier: 'OhmLink Traders',
        },
        {
          sku: 'NOVA-PCB-CTRL',
          name: 'Controller PCB Board',
          description: 'Custom 2-layer control board',
          category: 'Assemblies',
          quantity: 450,
          unit: 'pcs',
          reorderPoint: 120,
          location: 'Rack PCB-3',
          cost: 18.5,
          price: 36,
          supplier: 'BoardWorks India',
        },
        {
          sku: 'NOVA-WIRE-22AWG',
          name: 'Copper Wire 22AWG',
          description: 'Insulated hook-up wire spool',
          category: 'Raw Materials',
          quantity: 95,
          unit: 'spool',
          reorderPoint: 25,
          location: 'Cable Shelf C',
          cost: 6.2,
          price: 12.5,
          supplier: 'CableNest',
        },
        {
          sku: 'NOVA-ADPT-12V2A',
          name: 'Power Adapter 12V 2A',
          description: 'SMPS adapter for finished kits',
          category: 'Finished Goods',
          quantity: 780,
          unit: 'pcs',
          reorderPoint: 200,
          location: 'FG Zone 1',
          cost: 3.8,
          price: 8.9,
          supplier: 'PowerBridge',
        },
      ],
    },
    {
      name: 'Zenith Agro Inputs',
      subdomain: 'zenith',
      users: [
        { email: 'admin@zenith.com', name: 'Zenith Admin', role: 'owner' },
        { email: 'manager@zenith.com', name: 'Zenith Manager', role: 'manager' },
        { email: 'worker@zenith.com', name: 'Zenith Worker', role: 'worker' },
      ],
      inventory: [
        {
          sku: 'ZEN-FERT-NPK20',
          name: 'NPK Fertilizer 20-20-20',
          description: 'Water soluble balanced fertilizer',
          category: 'Fertilizers',
          quantity: 540,
          unit: 'bag',
          reorderPoint: 140,
          location: 'Godown F1',
          cost: 21,
          price: 29,
          supplier: 'AgriBlend Co',
        },
        {
          sku: 'ZEN-SEED-MAIZE',
          name: 'Hybrid Maize Seed',
          description: 'High-yield hybrid maize seeds',
          category: 'Seeds',
          quantity: 310,
          unit: 'packet',
          reorderPoint: 90,
          location: 'Seed Vault S2',
          cost: 14.5,
          price: 22,
          supplier: 'CropGene Seeds',
        },
        {
          sku: 'ZEN-PEST-BIOX',
          name: 'BioX Pest Control',
          description: 'Bio pesticide concentrate',
          category: 'Crop Protection',
          quantity: 260,
          unit: 'liter',
          reorderPoint: 70,
          location: 'Chem Store C4',
          cost: 4.2,
          price: 8.8,
          supplier: 'EcoShield Agro',
        },
        {
          sku: 'ZEN-DRIP-16MM',
          name: 'Drip Pipe 16mm',
          description: 'UV resistant irrigation drip pipe',
          category: 'Irrigation',
          quantity: 1250,
          unit: 'meter',
          reorderPoint: 300,
          location: 'Irrigation Yard',
          cost: 0.38,
          price: 0.92,
          supplier: 'FlowFarm Systems',
        },
        {
          sku: 'ZEN-MICRO-ZN',
          name: 'Zinc Micronutrient Mix',
          description: 'Chelated zinc mix for foliar spray',
          category: 'Micronutrients',
          quantity: 190,
          unit: 'kg',
          reorderPoint: 50,
          location: 'Godown M3',
          cost: 3.6,
          price: 7.4,
          supplier: 'NutriField Labs',
        },
      ],
    },
  ];

  const summary = [];

  for (const t of tenants) {
    const tenant = await prisma.tenant.upsert({
      where: { subdomain: t.subdomain },
      update: { name: t.name },
      create: { name: t.name, subdomain: t.subdomain },
    });

    await prisma.org.upsert({
      where: { id: `org-${t.subdomain}` },
      update: { name: `${t.name} HQ`, tenantId: tenant.id },
      create: {
        id: `org-${t.subdomain}`,
        name: `${t.name} HQ`,
        tenantId: tenant.id,
      },
    });

    await prisma.subscription.upsert({
      where: { id: `sub-${t.subdomain}` },
      update: { tenantId: tenant.id, plan: 'starter', status: 'active' },
      create: {
        id: `sub-${t.subdomain}`,
        tenantId: tenant.id,
        plan: 'starter',
        status: 'active',
      },
    });

    for (const u of t.users) {
      await upsertUser({ ...u, tenantId: tenant.id, passwordHash });
    }

    for (const item of t.inventory) {
      await upsertInventory({ ...item, tenantId: tenant.id });
    }

    const invCount = await prisma.inventoryItem.count({ where: { tenantId: tenant.id } });

    summary.push({
      tenantSubdomain: t.subdomain,
      tenantName: t.name,
      users: t.users.map((u) => u.email),
      inventoryCount: invCount,
    });
  }

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
