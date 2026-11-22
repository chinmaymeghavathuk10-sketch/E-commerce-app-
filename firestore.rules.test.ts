/**
 * Dirty Dozen adversarial payload test specification for Verve & Loom Firestore Security Rules.
 * Covers all 12 attack vectors listed in security_spec.md against the Eight Pillars.
 */
export interface AdversarialCase {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expected: 'PERMISSION_DENIED';
  description: string;
}

export const DIRTY_DOZEN_CASES: AdversarialCase[] = [
  {
    id: 1,
    name: 'Unverified Email Spoofing',
    collection: 'products',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    description: 'Admin email with email_verified=false cannot create products because isAdmin() requires isVerified().',
  },
  {
    id: 2,
    name: 'Self-Assigned Admin Escalation',
    collection: 'admins',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    description: 'Customer UID cannot write to /admins/{uid} without existing admin privileges.',
  },
  {
    id: 3,
    name: 'PII Cross-User Profile Read',
    collection: 'users',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
    description: 'Customer A cannot getDoc /users/customerB.',
  },
  {
    id: 4,
    name: 'PII Blanket List Scrape',
    collection: 'orders',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
    description: 'Unfiltered orders query without userId == request.auth.uid fails rule-side resource.data check.',
  },
  {
    id: 5,
    name: 'Shadow Field Injection on Product',
    collection: 'products',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    description: 'Customer cannot alter product price alongside stock decrement due to affectedKeys().hasOnly([stock, updatedAt]).',
  },
  {
    id: 6,
    name: 'Stock Inflation Attack',
    collection: 'products',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    description: 'Non-admin cannot increase product stock (incoming.stock < existing.stock required).',
  },
  {
    id: 7,
    name: 'Negative Stock Poisoning',
    collection: 'products',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    description: 'Stock decrement below 0 is rejected by incoming.stock >= 0.',
  },
  {
    id: 8,
    name: 'Order Owner Spoofing',
    collection: 'orders',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    description: 'Order creation with userId != request.auth.uid is rejected.',
  },
  {
    id: 9,
    name: 'Fulfillment State Shortcutting',
    collection: 'orders',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    description: 'Customer cannot set order status to Delivered or paymentStatus to Refunded.',
  },
  {
    id: 10,
    name: 'Premature Return Request',
    collection: 'orders',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    description: 'Customer cannot request return before order status reaches Delivered.',
  },
  {
    id: 11,
    name: 'Backdated Timestamp Forgery',
    collection: 'orders',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    description: 'Client-supplied createdAt != request.time is rejected.',
  },
  {
    id: 12,
    name: 'Orphaned Product Review',
    collection: 'reviews',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    description: 'Review referencing a nonexistent productId fails exists(/products/$(productId)).',
  },
];
