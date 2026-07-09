# TASK_037 — CLIENT_INTEGRATION

## Objective
Add **`game/js/sync.js`** (+ thin auth helper) and an **HTML auth modal**, then wire **`SaveManager` / `GameState`** to the existing server APIs (TASK_034–036 in `completed/`).

## Architecture (must follow)
- Backend already done: auth + save CRUD + conflict 409
- Client: vanilla `fetch` + `localStorage` tokens
- Auth UI: HTML modal on main menu (and optional pause)
- Offline-first: always write local save; queue server push
- **No Pixi**

## Detailed Mechanics & User Stories

### New files
| File | Role |
|------|------|
| `game/js/auth.js` | login / register / logout / token in localStorage |
| `game/js/sync.js` | push/pull saves, offline queue, online flush |
| Menu modal HTML | tabs تسجيل الدخول / إنشاء حساب |

### Wire SaveManager
- On successful local `SaveManager.save` / `GameState` persist → `SyncService.pushSave(slot, doc)` when logged in
- On load / continue → compare local vs server timestamp; handle **409** with a simple HTML conflict dialog («استخدم المحلي» / «استخدم الخادم»)
- Guest play: local-only; soft prompt to log in (non-blocking)

### Sync indicator (small HTML)
- Synced / syncing / offline states near menu header or HUD

### API (already on server — call these)
- `POST /api/v1/auth/register|login`
- `GET /api/v1/auth/me`
- `GET/PUT/POST` game save routes as implemented in TASK_036

### Edge cases
- `window.online` → `flushQueue`
- Invalid token → logout + toast
- Never block combat loop on network; async only

## Implementation Hints
```javascript
// sync.js sketch
const SyncService = {
  async pushSave(slot, saveData) {
    SaveManager.save(slot, saveData); // local first (or rely on caller)
    if (!Auth.isLoggedIn() || !navigator.onLine) {
      this.enqueue(slot, saveData);
      return;
    }
    // fetch with Bearer token; on 409 → showConflictDialog
  }
};
```

Include scripts from `game/index.html` (and forest if auto-save should sync).

## Verification & Acceptance Criteria
- [ ] `auth.js` + `sync.js` exist and load on menu
- [ ] Login/register modal works against live API
- [ ] Saves upload when online + logged in
- [ ] Offline queue flushes on reconnect
- [ ] 409 shows conflict UI
- [ ] Guest local play still works
- [ ] Zero Pixi
