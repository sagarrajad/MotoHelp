# Security Specification for MotoLog

## 1. Data Invariants
- A `Vehicle` must have a valid `ownerId` matching the creator's UID.
- `FuelLog`, `Maintenance`, and `Document` records must belong to a vehicle that the user owns (relational sync).
- Odometer readings cannot be negative.
- `createdAt` must be set to the server time during creation and remain immutable.
- A user can only read/write their own data.

## 2. The "Dirty Dozen" Payloads (Anti-Tests)
1. **Identity Spoofing**: Attempt to create a vehicle with an `ownerId` different from `request.auth.uid`.
2. **Resource Poisoning**: Create a document ID that is a 1.5KB string.
3. **Shadow Update**: Add a `verified: true` field to a vehicle during an update.
4. **State Shortcutting**: Change the `ownerId` of a vehicle after it's been created.
5. **PII Leak**: Attempt to list all vehicles in the collection without a user filter (should be blocked by query enforcement).
6. **Orphaned Writes**: Create a `FuelLog` for a `vehicleId` that does not exist.
7. **Denial of Wallet**: Update a vehicle with a 1MB notes string.
8. **Temporal Spoofing**: Set `createdAt` to a date in the past during creation.
9. **Role Escalation**: Attempt to write to a hypothetical `admins` collection.
10. **Unauthenticated Write**: Attempt to create a vehicle without being signed in.
11. **Cross-User Access**: Attempt to read/delete another user's vehicle by ID.
12. **Type Poisoning**: Set `currentOdometer` to a string instead of a number.

## 3. Test Runner
(Tests will be implemented in `firestore.rules.test.ts` if environment supports it, otherwise manually audited.)
