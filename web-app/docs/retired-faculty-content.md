# Retired faculty content

The six faculty information cards and footer links now open the official faculty website in a new tab.
Old public routes redirect to /Recommendpage. Removed Admin routes show the existing not-found screen.
Course management (including TQF/PLO), news, visitors, interests, and accounts are unchanged.

Removed tables (exclusive to the retired feature):
faculty_history_events, faculty_history, faculty_pages, faculty_profiles, faculty_teachers, faculty_structure_images, faculty_structure_image, faculty_structure_nodes, faculty_vision_cards, faculty_vision_image, faculty_vision

Startup and fresh-database initialization no longer create or seed these tables.
The SQL in server/migrations/20260922-retire-faculty-content.sql is manual-only.
Do not run it on production without a verified backup and deployment of the updated backend.
Keep backups outside Git. Uploaded files are intentionally retained for recovery.

Local recovery: restore the SQL dump in backups/ into the same database and restore the previous application version.
Do not use docker compose down -v: that deletes unrelated database volumes.

## Local execution record (2026-09-22)

- Backup: backups/faculty-20260922-e7f1.sql (18,738 bytes; all 11 CREATE TABLE statements and dump completion marker checked).
- SHA256: 39B2E5AC0D07240B9FAA1440013BA209E8A84C9C97EB697D53A5D2A64710D447
- Applied only to local Docker webapp-mysql / university_web, after deploying the updated backend locally.
- Unrelated row counts unchanged: users 4, approved_admins 3, course_info 10, course_details 0, news 1, visitors 11, applications 8.
- No uploaded files deleted. No server migration or Git push performed.
