import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { createAuditLog } from '../utils/audit';
import { invokeGemini } from '../utils/gemini';
import { generateUniqueOrderNumber } from '../utils/orderNumbers';

// Capability definitions
const INVIS_CAPABILITIES = [
  {
    id: 'show_low_stock',
    name: 'Monitor Low Stock',
    description: 'Check inventory items that are running low and may need reordering',
    example: 'Show low stock items for the next 7 days',
    icon: '📦',
    requiredFields: [
      { name: 'days', type: 'number', description: 'Number of days to look ahead' },
    ],
    optionalFields: [],
  },
  {
    id: 'create_po',
    name: 'Create Purchase Order',
    description: 'Create a new purchase order for materials or products',
    example: 'Create a purchase order for 500 kg cotton yarn from Supplier ABC',
    icon: '🛒',
    requiredFields: [
      { name: 'item', type: 'string', description: 'Item name or description' },
      { name: 'qty', type: 'number', description: 'Quantity needed' },
    ],
    optionalFields: [
      { name: 'supplier', type: 'string', description: 'Supplier name' },
    ],
  },
  {
    id: 'plan_production',
    name: 'Plan Production',
    description: 'Schedule and plan production jobs for manufacturing',
    example: 'Plan production for 100 units over 10 days',
    icon: '🏭',
    requiredFields: [
      { name: 'horizonDays', type: 'number', description: 'Number of days for production' },
    ],
    optionalFields: [
      { name: 'productName', type: 'string', description: 'Product name' },
      { name: 'quantity', type: 'number', description: 'Quantity to produce' },
    ],
  },
  {
    id: 'find_overdue_invoices',
    name: 'Find Overdue Invoices',
    description: 'Identify and view past-due invoices that need follow-up',
    example: 'Find invoices overdue for more than 15 days',
    icon: '📄',
    requiredFields: [
      { name: 'days', type: 'number', description: 'Days overdue threshold' },
    ],
    optionalFields: [],
  },
  {
    id: 'adjust_inventory',
    name: 'Adjust Inventory',
    description: 'Manually adjust inventory quantity for an item',
    example: 'Adjust inventory for widget A by -20',
    icon: '📊',
    requiredFields: [
      { name: 'qtyDelta', type: 'number', description: 'Quantity change (positive or negative)' },
    ],
    optionalFields: [
      { name: 'item', type: 'string', description: 'Item name' },
      { name: 'sku', type: 'string', description: 'Item SKU' },
      { name: 'reason', type: 'string', description: 'Reason for adjustment' },
    ],
  },
  {
    id: 'create_invoice',
    name: 'Create Invoice',
    description: 'Generate a new invoice for a customer and adjust inventory for sold items',
    example: 'Create an invoice for Acme Corp for 100 units of Widget A',
    icon: '💰',
    requiredFields: [
      { name: 'customer', type: 'string', description: 'Customer name' },
      { name: 'productName', type: 'string', description: 'Product or item sold' },
      { name: 'quantity', type: 'number', description: 'Quantity sold' },
    ],
    optionalFields: [
      { name: 'price', type: 'number', description: 'Price per unit' },
      { name: 'total', type: 'number', description: 'Total amount' },
      { name: 'dueDays', type: 'number', description: 'Payment due in days' },
    ],
  },
  {
    id: 'route_approval',
    name: 'Route Approval',
    description: 'Start an approval workflow for a purchase or request',
    example: 'Route approval for a purchase over 1000',
    icon: '✅',
    requiredFields: [
      { name: 'entity', type: 'string', description: 'Entity type (e.g., purchase, request)' },
      { name: 'value', type: 'number', description: 'Value or amount for approval' },
    ],
    optionalFields: [
      { name: 'note', type: 'string', description: 'Additional notes' },
    ],
  },
];

const ACTION_PROMPT = `You are Invis, the InventraERP assistant. Translate the user's request into a single supported action and return only valid JSON.
Supported actions:
- SHOW_LOW_STOCK: {"days": number}
- CREATE_PO: {"item": string, "qty": number, "supplier"?: string}
- PLAN_PRODUCTION: {"horizonDays": number, "productName"?: string, "quantity"?: number}
- FIND_OVERDUE_INVOICES: {"days": number}
- ADJUST_INVENTORY: {"item"?: string, "sku"?: string, "qtyDelta": number, "reason"?: string}
- CREATE_INVOICE: {"customer": string, "items": [{"name": string, "quantity": number, "price": number}], "total"?: number, "dueDays"?: number}
- ROUTE_APPROVAL: {"entity": string, "value": number, "note"?: string}

Return exactly one JSON object with no surrounding text.
If the user asks about stock levels, use SHOW_LOW_STOCK.
If the user asks to create or schedule work for manufacturing or production, use PLAN_PRODUCTION.
If the user asks to purchase materials, create a purchase order with CREATE_PO.
If the user asks for overdue invoices, use FIND_OVERDUE_INVOICES.
If the user asks to adjust inventory, use ADJUST_INVENTORY.
If the user asks to bill a customer, use CREATE_INVOICE.
If the user asks to start or route an approval, use ROUTE_APPROVAL.
If you cannot map the request to one of these actions, return {"action":"NONE","params":{}}.

Examples:
User request: "Show low stock items for the next 7 days"
{"action":"SHOW_LOW_STOCK","params":{"days":7}}

User request: "Create a purchase order for 500 kg cotton yarn"
{"action":"CREATE_PO","params":{"item":"cotton yarn","qty":500}}

User request: "Plan production for the next 10 days"
{"action":"PLAN_PRODUCTION","params":{"horizonDays":10}}

User request: "Find overdue invoices older than 15 days"
{"action":"FIND_OVERDUE_INVOICES","params":{"days":15}}

User request: "Adjust inventory for widget A by -20"
{"action":"ADJUST_INVENTORY","params":{"item":"widget A","qtyDelta":-20}}

User request: "Create an invoice for Acme Corp"
{"action":"CREATE_INVOICE","params":{"customer":"Acme Corp","items":[{"name":"Service Fee","quantity":1,"price":100}]}}

User request: "Route approval for a purchase over 1000"
{"action":"ROUTE_APPROVAL","params":{"entity":"purchase","value":1000}}`;

type ParsedGeminiIntent = {
  action: string;
  params: Record<string, any>;
};

type InvisReply =
  | { kind: 'TEXT'; text: string }
  | { kind: 'SUGGESTION'; title: string; details?: string }
  | { kind: 'CAPABILITY'; capabilities: typeof INVIS_CAPABILITIES }
  | { kind: 'DETAIL_REQUEST'; action: string; missingFields: Array<{ name: string; type: string; description: string }>; extractedData: Record<string, any> }
  | { kind: 'ACTION_EXECUTED'; summary: string; details?: string; payload?: Record<string, any> }
  | { kind: 'ERROR'; message: string };

function extractJson(raw: string): ParsedGeminiIntent {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON object found in Gemini response');
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as ParsedGeminiIntent;
    if (!parsed.action || typeof parsed.params !== 'object') {
      throw new Error('Invalid intent payload');
    }
    return parsed;
  } catch (error) {
    throw new Error(`Unable to parse Gemini JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Validate and detect missing required fields
function getMissingFields(action: string, params: Record<string, any>) {
  const capabilityDef = INVIS_CAPABILITIES.find(c => c.id === action.toLowerCase().replace(/_/g, '_'));
  if (!capabilityDef) return [];

  return capabilityDef.requiredFields.filter(field => {
    const value = params[field.name];
    return value === undefined || value === null || value === '' || (typeof value === 'number' && isNaN(value));
  });
}

function getLocalFallback(message: string): ParsedGeminiIntent {
  const t = message.toLowerCase();
  const numbers = Array.from(message.matchAll(/(\d+)/g)).map((m) => Number(m[1]));

  if (/\b(low|low-stock|stock level|stock levels|inventory level|inventory levels)\b/.test(t) && /\b(stock|inventory|items?)\b/.test(t)) {
    const days = numbers.length > 0 ? numbers[0] : 7;
    return { action: 'SHOW_LOW_STOCK', params: { days } };
  }

  if (/(create|place|make)\s+(a\s+)?(purchase order|po|order)/.test(t) || /purchase order/.test(t)) {
    const qty = Number(message.match(/(\d+[\d,]*)\s*(kg|kgs|units|pcs|pieces|m)/i)?.[1]?.replace(/,/g, '')) || 1000;
    const item = message.match(/for\s+([\w\s\-]+?)(?:\s+\d|$)/i)?.[1]?.trim() || message.match(/order\s+([\w\s\-]+)/i)?.[1]?.trim() || 'Raw materials';
    const supplier = message.match(/to\s+([\w\s&.-]+)/i)?.[1]?.trim();
    return { action: 'CREATE_PO', params: { item, qty, supplier } };
  }

  if (/(plan|schedule|create)\s+(production|production job|manufacturing|manufacture)/.test(t) || /production job/.test(t)) {
    const horizonDays = numbers.length > 0 ? numbers[0] : 7;
    const productName = message.match(/(?:for|of|to produce)\s+([\w\s\-]+)/i)?.[1]?.trim() || 'Production Batch';
    const quantity = Number(message.match(/(\d+[\d,]*)\s*(units|pcs|pieces|kg|kgs|m)/i)?.[1]?.replace(/,/g, '')) || 100;
    return { action: 'PLAN_PRODUCTION', params: { horizonDays, productName, quantity } };
  }

  if (/(overdue|past due|late|unpaid)\s+invoice/.test(t) || /invoice.*(overdue|past due|late|unpaid)/.test(t)) {
    const days = numbers.length > 0 ? numbers[0] : 20;
    return { action: 'FIND_OVERDUE_INVOICES', params: { days } };
  }

  if (/(adjust|update|increase|decrease|change)\s+(inventory|stock)/.test(t)) {
    const qtyDelta = Number(message.match(/by\s+(-?\d+)/i)?.[1] || message.match(/(-?\d+)/)?.[1] || 0);
    const item = message.match(/for\s+([\w\s\-]+?)\s+by\b/i)?.[1]?.trim() || message.match(/for\s+([\w\s\-]+)/i)?.[1]?.trim() || message.match(/inventory\s+of\s+([\w\s\-]+)/i)?.[1]?.trim();
    return { action: 'ADJUST_INVENTORY', params: { item, qtyDelta, reason: 'Invis inventory adjustment' } };
  }

  if (/(create|issue|generate|send)\s+(an?\s+)?invoice/.test(t) || /invoice for/.test(t)) {
    const customer = message.match(/invoice\s+for\s+([\w\s\-]+?)(?:\s+for\b|\s+of\b|\s+with\b|\s+at\b|$)/i)?.[1]?.trim() || 'Unknown customer';
    const productName = message.match(/(?:for|of)\s+([\w\s\-]+?)\s*(?:at|with|qty|quantity|units|pcs|pieces|$)/i)?.[1]?.trim();
    const quantity = Number(message.match(/(\d+)\s*(?:units|pcs|pieces|kg|kgs|m|each)?/i)?.[1] || 0);
    const params: Record<string, any> = { customer };
    if (productName) params.productName = productName;
    if (quantity > 0) params.quantity = quantity;
    return { action: 'CREATE_INVOICE', params };
  }

  if (/(route|request|send).*approval/.test(t) || /(approval).*(request|route|send|start)/.test(t)) {
    const entity = message.match(/approval\s+for\s+([\w\s\-]+)/i)?.[1]?.trim() || 'request';
    const value = numbers.length > 0 ? numbers[0] : 0;
    return { action: 'ROUTE_APPROVAL', params: { entity, value } };
  }

  return { action: 'NONE', params: {} };
}

async function parseIntent(message: string): Promise<ParsedGeminiIntent> {
  const localIntent = getLocalFallback(message);
  if (localIntent.action !== 'NONE') {
    return localIntent;
  }

  try {
    const response = await invokeGemini(`${ACTION_PROMPT}\nUser request: \"${message}\"`);
    const parsed = extractJson(response);
    if (parsed.action === 'NONE' || typeof parsed.params !== 'object') {
      return getLocalFallback(message);
    }
    return parsed;
  } catch (error) {
    console.warn('Gemini intent parse failed, falling back to local parser:', error);
    return getLocalFallback(message);
  }
}

async function executeAction(intent: ParsedGeminiIntent, req: AuthRequest): Promise<InvisReply[]> {
  const tenantId = req.tenantId!;
  const actor = req.user!.email;

  switch (intent.action) {
    case 'SHOW_LOW_STOCK': {
      const days = Number(intent.params.days) || 3;
      const items = await prisma.inventoryItem.findMany({
        where: {
          tenantId,
          OR: [
            { reorderPoint: { not: null, lte: days } },
            { quantity: { lte: days * 10 } },
          ],
        },
        orderBy: { quantity: 'asc' },
        take: 10,
      });

      if (items.length === 0) {
        return [{ kind: 'TEXT', text: `No low-stock items were found with a ${days}-day threshold.` }];
      }

      const itemSummary = items
        .map((item) => `• ${item.name} (${item.quantity} ${item.unit}, reorderPoint ${item.reorderPoint ?? 'n/a'})`)
        .join('\n');

      return [
        { kind: 'TEXT', text: `Found ${items.length} items under the low-stock threshold:` },
        { kind: 'TEXT', text: itemSummary },
        { kind: 'SUGGESTION', title: 'Create a purchase order for a low-stock item', details: 'Use the item details above to place a PO.' },
      ];
    }

    case 'CREATE_PO': {
      const item = String(intent.params.item || 'Raw materials');
      const qty = Number(intent.params.qty || 1000);
      const supplier = String(intent.params.supplier || 'Preferred Supplier');

      const orderNumber = generateUniqueOrderNumber();
      const orderItems = [
        {
          name: item,
          sku: item.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50),
          quantity: qty,
          price: 0,
        },
      ];

      const newOrder = await prisma.order.create({
        data: {
          tenantId,
          orderNumber,
          customer: supplier,
          customerEmail: null,
          status: 'pending',
          items: JSON.stringify(orderItems),
          subtotal: 0,
          tax: 0,
          shipping: 0,
          total: 0,
          notes: `Created by Invis: purchase order for ${qty} of ${item}`,
        },
      });

      await createAuditLog({
        tenantId,
        actor,
        action: 'CREATE',
        entity: 'ORDER',
        entityId: newOrder.id,
        meta: { orderNumber: newOrder.orderNumber, item, qty, supplier },
      });

      // Create approval for the purchase order
      await prisma.approval.create({
        data: {
          tenantId,
          type: 'purchase_order',
          status: 'pending',
          requestedBy: actor,
          entityId: newOrder.id,
          entityType: 'purchase_order',
          notes: `Purchase order for ${qty} x ${item} from ${supplier}`,
        },
      });

      return [
        { kind: 'ACTION_EXECUTED', summary: `Created purchase order ${orderNumber}` },
        { kind: 'TEXT', text: `Purchase order ${orderNumber} for ${qty} x ${item} has been created for ${supplier}.` },
      ];
    }

    case 'PLAN_PRODUCTION': {
      const horizonDays = Number(intent.params.horizonDays || 7);
      const productName = String(intent.params.productName || 'Production Batch');
      const quantity = Number(intent.params.quantity || 100);
      const startDate = new Date();
      const endDate = new Date(Date.now() + horizonDays * 24 * 60 * 60 * 1000);

      let attempt = 1;
      let jobNumber = '';
      while (true) {
        jobNumber = `JOB-${new Date().getFullYear()}-${String(attempt).padStart(4, '0')}`;
        const existing = await prisma.productionJob.findUnique({ where: { jobNumber } });
        if (!existing) break;
        attempt += 1;
        if (attempt > 9999) {
          throw new Error('Unable to generate a unique production job number');
        }
      }

      const job = await prisma.productionJob.create({
        data: {
          tenantId,
          jobNumber,
          productId: productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40),
          productName,
          quantity,
          status: 'planned',
          startDate,
          endDate,
          assignedTo: req.user!.role === 'production' ? req.user!.id : null,
          materials: JSON.stringify([{ name: productName, quantity }]),
          notes: `Auto-planned by Invis for ${horizonDays} days`,
          progress: 0,
        },
      });

      await createAuditLog({
        tenantId,
        actor,
        action: 'CREATE',
        entity: 'PRODUCTION_JOB',
        entityId: job.id,
        meta: { jobNumber, productName, quantity, horizonDays },
      });

      // Create approval for the job
      await prisma.approval.create({
        data: {
          tenantId,
          type: 'job_creation',
          status: 'pending',
          requestedBy: actor,
          entityId: job.id,
          entityType: 'job',
          notes: `Production job for ${quantity} units of ${productName}`,
        },
      });

      return [
        { kind: 'ACTION_EXECUTED', summary: `Created production job ${jobNumber}` },
        { kind: 'TEXT', text: `Scheduled production job ${jobNumber} for ${quantity} units of ${productName} across ${horizonDays} days.` },
      ];
    }

    case 'FIND_OVERDUE_INVOICES': {
      const days = Number(intent.params.days || 20);
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const invoices = await prisma.invoice.findMany({
        where: {
          tenantId,
          dueDate: { lt: cutoff },
          status: { in: ['overdue', 'pending'] },
        },
        orderBy: { dueDate: 'asc' },
      });

      if (invoices.length === 0) {
        return [{ kind: 'TEXT', text: `No overdue invoices older than ${days} days were found.` }];
      }

      const invoiceSummary = invoices
        .slice(0, 8)
        .map((invoice) => `• ${invoice.invoiceNumber}: ${invoice.customer} — ₹${Number(invoice.total).toFixed(2)} due ${invoice.dueDate.toISOString().slice(0, 10)}`)
        .join('\n');

      return [
        { kind: 'TEXT', text: `Found ${invoices.length} overdue or late invoices:` },
        { kind: 'TEXT', text: invoiceSummary },
      ];
    }

    case 'ADJUST_INVENTORY': {
      const qtyDelta = Number(intent.params.qtyDelta || 0);
      if (!qtyDelta) {
        return [{ kind: 'ERROR', message: 'Inventory adjustment delta must be a non-zero number.' }];
      }

      const itemFilter = intent.params.sku
        ? { sku: String(intent.params.sku) }
        : intent.params.item
        ? { name: { contains: String(intent.params.item) } }
        : null;

      if (!itemFilter) {
        return [{ kind: 'ERROR', message: 'Inventory adjustment requires an item name or SKU.' }];
      }

      const inventoryItem = await prisma.inventoryItem.findFirst({
        where: { tenantId, ...itemFilter },
      });

      if (!inventoryItem) {
        return [{ kind: 'ERROR', message: 'Could not find matching inventory item to adjust.' }];
      }

      const updated = await prisma.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: { quantity: inventoryItem.quantity + qtyDelta },
      });

      await createAuditLog({
        tenantId,
        actor,
        action: 'UPDATE',
        entity: 'INVENTORY_ITEM',
        entityId: updated.id,
        meta: { adjustedBy: qtyDelta, reason: intent.params.reason || 'invis adjustment' },
      });

      return [
        { kind: 'ACTION_EXECUTED', summary: `Adjusted inventory for ${updated.name}` },
        { kind: 'TEXT', text: `${updated.name} quantity changed by ${qtyDelta} and is now ${updated.quantity} ${updated.unit}.` },
      ];
    }

    case 'CREATE_INVOICE': {
      const customer = String(intent.params.customer || 'Unknown customer');
      const items = Array.isArray(intent.params.items) ? intent.params.items : [];
      const productName = String(intent.params.productName || '');
      const quantity = Number(intent.params.quantity || 0);
      const price = Number(intent.params.price || 100);

      const normalizedItems = items.length
        ? items
        : [
            {
              name: productName || 'Service item',
              quantity: quantity > 0 ? quantity : 1,
              price: price,
            },
          ];

      const subtotal = normalizedItems.reduce((sum: number, item: any) => sum + (item.quantity || 0) * (item.price || 0), 0);
      const total = Number(intent.params.total ?? subtotal);
      const dueDays = Number(intent.params.dueDays || 30);

      let attempt = 1;
      let invoiceNumber = '';
      while (true) {
        invoiceNumber = `INV-${new Date().getFullYear()}-${String(attempt).padStart(4, '0')}`;
        const existingInvoice = await prisma.invoice.findUnique({ where: { invoiceNumber } });
        if (!existingInvoice) break;
        attempt += 1;
        if (attempt > 9999) {
          throw new Error('Unable to generate a unique invoice number');
        }
      }

      if (!items.length && (!productName || quantity <= 0)) {
        return [{ kind: 'ERROR', message: 'Invoice creation requires a product name and a positive quantity.' }];
      }

      const invoice = await prisma.invoice.create({
        data: {
          tenantId,
          invoiceNumber,
          customer,
          customerEmail: null,
          status: 'pending',
          items: JSON.stringify(normalizedItems),
          subtotal,
          tax: 0,
          total: total || subtotal,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000),
          paymentMethod: null,
          notes: items.length
            ? 'Created by Invis'
            : `Created by Invis for ${normalizedItems[0].quantity} x ${normalizedItems[0].name}`,
        },
      });

      const adjustmentMessages: string[] = [];
      for (const item of normalizedItems) {
        if (!item.name || !item.quantity) continue;
        const inventoryItem = await prisma.inventoryItem.findFirst({
          where: {
            tenantId,
            name: { contains: String(item.name) },
          },
        });

        if (!inventoryItem) continue;

        const newQuantity = Math.max(0, inventoryItem.quantity - Number(item.quantity));
        const updatedItem = await prisma.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: { quantity: newQuantity },
        });

        adjustmentMessages.push(`${updatedItem.name} inventory reduced to ${updatedItem.quantity}`);

        await createAuditLog({
          tenantId,
          actor,
          action: 'UPDATE',
          entity: 'INVENTORY_ITEM',
          entityId: updatedItem.id,
          meta: {
            adjustedBy: -Number(item.quantity),
            source: 'Invoice created by Invis',
            invoiceNumber,
          },
        });
      }

      await createAuditLog({
        tenantId,
        actor,
        action: 'CREATE',
        entity: 'INVOICE',
        entityId: invoice.id,
        meta: { invoiceNumber, customer, total: Number(invoice.total) },
      });

      // Create approval for the invoice
      await prisma.approval.create({
        data: {
          tenantId,
          type: 'invoice',
          status: 'pending',
          requestedBy: actor,
          entityId: invoice.id,
          entityType: 'invoice',
          notes: `Invoice for ${customer}: ${normalizedItems.map((item: any) => `${item.quantity}x ${item.name}`).join(', ')}`,
        },
      });

      const inventoryUpdateText = adjustmentMessages.length > 0 ? ` Inventory updated: ${adjustmentMessages.join('; ')}.` : '';
      const invoiceTotal = Number(invoice.total);
      return [
        { kind: 'ACTION_EXECUTED', summary: `Created invoice ${invoice.invoiceNumber}` },
        { kind: 'TEXT', text: `Invoice ${invoice.invoiceNumber} created for ${customer} with total ₹${invoiceTotal.toFixed(2)}.${inventoryUpdateText}` },
      ];
    }

    case 'ROUTE_APPROVAL': {
      await createAuditLog({
        tenantId,
        actor,
        action: 'REQUEST_APPROVAL',
        entity: 'APPROVAL',
        entityId: `REQ-${Date.now()}`,
        meta: { entity: intent.params.entity, value: intent.params.value, note: intent.params.note },
      });

      return [
        { kind: 'TEXT', text: `Approval flow initialized for ${intent.params.entity} at value ₹${Number(intent.params.value || 0).toFixed(2)}.` },
        { kind: 'SUGGESTION', title: 'Review approval request in the approvals dashboard', details: `Entity: ${intent.params.entity}` },
      ];
    }

    default:
      return [{ kind: 'ERROR', message: 'I could not map your request to a supported action yet. Try a different phrase.' }];
  }
}

export const processInvisMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const intent = await parseIntent(message);
    if (intent.action === 'NONE') {
      return res.json({
        success: true,
        replies: [
          { kind: 'TEXT', text: 'I could not map that request to a supported workflow. Try something like “Show low stock items”, “Create PO for 500 kg yarn”, or “Find overdue invoices over 15 days.”' },          { kind: 'CAPABILITY', capabilities: INVIS_CAPABILITIES },
        ],
      });
    }

    // Check for missing required fields
    const missingFields = getMissingFields(intent.action, intent.params);
    if (missingFields.length > 0) {
      return res.json({
        success: true,
        replies: [
          { 
            kind: 'DETAIL_REQUEST', 
            action: intent.action,
            missingFields: missingFields,
            extractedData: intent.params,
          },        ],
      });
    }

    const replies = await executeAction(intent, req);
    return res.json({ success: true, replies });
  } catch (error) {
    console.error('Invis controller error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process Invis request',
    });
  }
};

export const getInvisCapabilities = (req: AuthRequest, res: Response) => {
  try {
    return res.json({
      success: true,
      capabilities: INVIS_CAPABILITIES,
    });
  } catch (error) {
    console.error('Get capabilities error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch capabilities',
    });
  }
};
