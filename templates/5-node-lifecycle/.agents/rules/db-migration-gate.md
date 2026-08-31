# Conditional DBA & Schema Migration Gate

## Protocol:
1. **Detection**:
   - Before requesting Git approval, check if any database schema, migration, or declarative SQL files were added or modified:
     ```bash
     git diff --name-only | grep -E '(migrations|schema\.prisma|drizzle|schema\.sql)'
     ```
2. **Schema-Touching Releases (BLOCKING)**:
   - If migration files are detected:
     - Review Row Level Security (RLS) policies.
     - Verify index coverage for foreign keys and filter queries.
     - Validate idempotency and rollback safety.
     - Author `handoffs/<feature>/04_dba_audit_report.md` before prompting user for Git commit.
3. **UI/Logic-Only Releases (NON-BLOCKING)**:
   - If no migration files were modified, note DBA status as *Awareness Only (Non-blocking)* and proceed directly to Git gate.
