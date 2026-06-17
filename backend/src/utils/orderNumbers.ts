import { randomUUID } from 'crypto';

export function generateUniqueOrderNumber() {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `ORD-${year}-${timestamp}-${suffix}`;
}
