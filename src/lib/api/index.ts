import { PropertyService } from './propertyService';
import { TenantService } from './tenantService';
import { OwnerService } from './ownerService';
import { TransactionService } from './transactionService';

// Export service instances for easy consumption
export const propertyService = new PropertyService();
export const tenantService = new TenantService();
export const ownerService = new OwnerService();
export const transactionService = new TransactionService();

// Export service classes for direct use if needed
export { PropertyService } from './propertyService';
export { TenantService } from './tenantService';
export { OwnerService } from './ownerService';
export { TransactionService } from './transactionService';
