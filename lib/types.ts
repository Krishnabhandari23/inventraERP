export type InvisIntent =
  | { type: 'SHOW_LOW_STOCK'; days: number }
  | { type: 'CREATE_PO'; item: string; qty: number; supplier?: string }
  | { type: 'PLAN_PRODUCTION'; horizonDays: number }
  | { type: 'FIND_OVERDUE_INVOICES'; days: number }
  | { type: 'ROUTE_APPROVAL'; entity: string; value: number };

export type InvisCapability = {
  id: string;
  name: string;
  description: string;
  example: string;
  icon: string;
  requiredFields: Array<{ name: string; type: 'number' | 'string' | 'date'; description: string }>;
  optionalFields?: Array<{ name: string; type: 'number' | 'string' | 'date'; description: string }>;
};

export type InvisReply =
  | { kind: 'TEXT'; text: string }
  | { kind: 'SUGGESTION'; title: string; details?: string }
  | { kind: 'CAPABILITY'; capabilities: InvisCapability[] }
  | { kind: 'DETAIL_REQUEST'; action: string; missingFields: Array<{ name: string; type: string; description: string }>; extractedData: Record<string, any> }
  | { kind: 'ACTION_DRAFT'; summary: string; payload: Record<string, any>; missingFields?: Array<{ name: string; type: string; description: string }> }
  | { kind: 'ACTION_EXECUTED'; summary: string; details?: string; payload?: Record<string, any> }
  | { kind: 'ERROR'; message: string };

export type InvisContext = {
  orgId: string;
  userId: string;
  role: 'owner'|'manager'|'finance'|'production'|'worker';
  preferences?: Record<string, any>;
};
