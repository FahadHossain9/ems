# EMS Demo Build Task List

## Current Build Order
1. Setup core shell (routing, layout, protected routes)
2. Add localStorage seed + session utilities
3. Build login page with one-click role access
4. Add English/Italian localization and language switcher
5. Build dashboard with role-specific cards
6. Build employees list + detail + create flow
7. Add settings page with demo reset action
8. QA pass for refresh persistence and role guards

## Status
- [x] Task list created
- [ ] Core shell in progress
- [ ] localStorage auth/session
- [ ] One-click login
- [ ] i18n (EN/IT)
- [ ] Dashboard
- [ ] Employees module
- [ ] Settings + reset

## CRUD Coverage Audit (Current Sprint)
- [ ] `/clients` - add/edit/delete controls + row action icons + delete confirm
- [ ] `/employees` - add/edit/delete icon controls + delete confirm modal
- [ ] `/leads` - add/edit/delete icon controls + delete confirm modal
- [ ] `/pipeline` - keep kanban (status move), no direct delete needed
- [ ] `/reports` - add/edit/delete controls + row action icons + delete confirm
- [ ] `/reports/new` - keep form-style create flow
- [ ] `/commissions` - add/edit/delete controls + row action icons + delete confirm
- [ ] `/partners` - add/edit/delete controls + row action icons + delete confirm
- [ ] `/sos-sync` - read-only monitor (no destructive actions)
- [ ] `/tasks` - read-only queue (status actions only)
- [ ] `/profile` - edit-only page (already implemented)
- [ ] `/settings` - reset confirmation (optional hardening)
