# Security Specification — Verve & Loom E-Commerce

## 1. Data Invariants
1. **Admin Authority**: Only the bootstrapped verified admin (`umapathijbdvt71@gmail.com`) or users listed in `/admins/{uid}` can create, edit, or delete products, view all orders/users, advance fulfillment statuses, or approve/refund returns.
2. **PII Isolation**: User profile documents (`/users/{userId}`) and orders (`/orders/{orderId}`) contain email, phone, and physical addresses and are readable/listable ONLY by the owning `userId` or an admin.
3. **Cart Isolation**: `/carts/{userId}` can only be read or mutated by the owning `userId`.
4. **Order Integrity & Payment Verification**: Customers can only create orders with `userId == request.auth.uid`, `status == 'Confirmed'`, `paymentStatus == 'Paid'`, `returnStatus == 'None'`, and `createdAt == request.time`. Customers cannot arbitrarily escalate order status to `'Delivered'` or `'Refunded'`.
5. **Inventory Protection**: Non-admin customers updating `/products/{productId}` may ONLY decrement `stock` (`incoming().stock < existing().stock && incoming().stock >= 0`) and update `updatedAt == request.time`. Price, name, category, and image are strictly immutable for non-admins.
6. **Return Window**: Customers may request a return (`returnStatus: 'Requested'`) ONLY when the order belongs to them, `existing().status == 'Delivered'`, and `existing().returnStatus == 'None'`.
7. **Review Integrity**: Reviews must reference an existing product (`/products/{productId}`), have `userId == request.auth.uid`, and `rating` between 1 and 5.

## 2. Dirty Dozen Attack Payloads (All Must Yield PERMISSION_DENIED)
1. **Unverified Email Spoofing**: Admin email with `email_verified: false` attempting `create` on `/products/p1`.
2. **Self-Assigned Admin**: Regular customer attempting `set` on `/admins/{myUid}`.
3. **PII Scraping (`get`)**: User A reading `/users/userB`.
4. **PII Scraping (`list`)**: User A listing `/users` or listing `/orders` without `userId == request.auth.uid`.
5. **Shadow Field Injection on Product**: Non-admin updating `/products/p1` with `{ stock: 4, price: 1, updatedAt: serverTimestamp() }`.
6. **Stock Inflation**: Non-admin updating `/products/p1` with `{ stock: 9999, updatedAt: serverTimestamp() }` where `existing().stock == 10`.
7. **Negative Stock**: Non-admin updating `/products/p1` with `{ stock: -1, updatedAt: serverTimestamp() }`.
8. **Order Spoofing**: User A creating `/orders/o1` with `userId: 'userB'`.
9. **State Shortcutting**: User A updating their own order from `Confirmed` directly to `Delivered` or `paymentStatus: 'Refunded'`.
10. **Premature Return Request**: User A setting `returnStatus: 'Requested'` while order `status == 'Shipped'`.
11. **Timestamp Forgery**: User A creating an order with a backdated `createdAt` (`2020-01-01`) instead of `request.time`.
12. **Orphaned Review / Impersonation**: User A creating `/reviews/r1` referencing nonexistent `productId: 'fake_999'` or setting `userId: 'userB'`.
