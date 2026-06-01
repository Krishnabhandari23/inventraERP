import prisma from '../config/database';

export const createAuditLog = async (data: {
  tenantId: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  meta?: any;
}) => {
  return prisma.audit.create({
    data: {
      ...data,
      meta: data.meta ? JSON.stringify(data.meta) : undefined,
    },
  });
};
