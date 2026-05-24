# Security Specification for MZ+ Elite Business System

## Data Invariants
- **Live Pulse Events**: Must be valid events (type, user_name, detail). `created_at` must be server time. Anyone signed in can create one (simulating activity), but only the system or admin should ideally manage them. For this demo, we'll allow signed-in users to create events to show "Live" activity.
- **App Config**: Only accessible by Admin for writes. Read-only for all.
- **Announcements**: Only accessible by Admin for writes. Read-only for all.

## The Dirty Dozen Payloads (Rejection Tests)

1. **Identity Spoofing**: Attempt to create a `live_pulse` event with a future `created_at` timestamp.
2. **Resource Poisoning**: Attempt to create a `live_pulse` event with a 2MB `user_name` string.
3. **Invalid Type**: Attempt to create a `live_pulse` event with `type: 'hacking'`.
4. **Admin Escalation**: Attempt to update `mz_app_config` as a non-admin.
5. **Shadow Field**: Attempt to create an announcement with an extra field `is_super_important: true` not in schema.
6. **ID Poisoning**: Attempt to get an announcement with a 2KB junk character ID.
7. **Temporal Fraud**: Attempt to update an announcement's `created_at` date.
8. **PII Leak**: Attempt to list all `users` (if we had them in Firestore).
9. **Empty Write**: Attempt to create a pulse event with an empty user name.
10. **State Shortcut**: Attempt to activate multiple flash offers simultaneously if restricted.
11. **Malicious Join**: Attempt to inject HTML into `detail` field.
12. **Unauthorized Deletion**: Attempt to delete an announcement.

## Verification
All these payloads will be blocked by the `firestore.rules`.
