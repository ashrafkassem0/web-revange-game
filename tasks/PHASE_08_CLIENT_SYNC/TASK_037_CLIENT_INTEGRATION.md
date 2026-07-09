# TASK_037 — CLIENT_INTEGRATION

## Objective
Wire the frontend GameState to the backend API with offline support, sync-on-connect, conflict UI, and auth-aware game menu.

## New Module: `game/js/sync.js`

```javascript
const SyncService = {
  _queue: [],
  _syncing: false,
  _lastSync: null,

  async pushSave(slot, saveData) {
    // Always save locally first
    GameState.saveToLocal(slot, saveData);

    if (navigator.onLine && Auth.isLoggedIn()) {
      try {
        const res = await fetch(`/api/v1/game/saves/${slot}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${Auth.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...saveData, timestamp: new Date().toISOString() })
        });
        if (res.status === 409) {
          const serverSave = await res.json();
          showConflictDialog(slot, saveData, serverSave.save);
        }
      } catch {
        this._queue.push({ slot, data: saveData, timestamp: Date.now() });
        this._persistQueue();
      }
    } else {
      this._queue.push({ slot, data: saveData, timestamp: Date.now() });
      this._persistQueue();
    }
  },

  async loadFromServer(slot) {
    if (!Auth.isLoggedIn()) return null;
    try {
      const res = await fetch(`/api/v1/game/saves/${slot}`, {
        headers: { 'Authorization': `Bearer ${Auth.token}` }
      });
      if (res.ok) return (await res.json()).save;
    } catch { /* fall through */ }
    return null;
  },

  async flushQueue() {
    if (this._queue.length === 0) return;
    this._syncing = true;
    showToast("⏳ جاري مزامنة التقدم...");
    const kept = [];
    for (const item of this._queue) {
      try {
        await this.pushSave(item.slot, item.data);
      } catch { kept.push(item); }
    }
    this._queue = kept;
    this._persistQueue();
    this._syncing = false;
    if (kept.length === 0) showToast("✅ تمت المزامنة");
  },

  _persistQueue() {
    localStorage.setItem('revenge_sync_queue', JSON.stringify(this._queue));
  },
  _loadQueue() {
    this._queue = JSON.parse(localStorage.getItem('revenge_sync_queue') || '[]');
  }
};

// Online/Offline listeners
window.addEventListener('online', () => SyncService.flushQueue());
window.addEventListener('offline', () => showToast("⚠️ لا يوجد اتصال بالإنترنت"));
```

## Auth Client Module: `game/js/auth.js`
```javascript
const Auth = {
  token: localStorage.getItem('revenge_auth_token'),
  user: JSON.parse(localStorage.getItem('revenge_auth_user') || 'null'),

  async login(email, password) {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const data = await res.json();
    this.token = data.token;
    this.user = data.user;
    localStorage.setItem('revenge_auth_token', this.token);
    localStorage.setItem('revenge_auth_user', JSON.stringify(this.user));
    return data;
  },

  async register(username, email, password) { /* ... similar */ },

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('revenge_auth_token');
    localStorage.removeItem('revenge_auth_user');
  },

  isLoggedIn() { return !!this.token; },

  async validate() {
    if (!this.token) return false;
    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      return res.ok;
    } catch { return false; }
  }
};
```

## Load Priority (on game start)
1. If logged in → `loadFromServer(slot)` 
2. If server data newer → use server data
3. If local newer → push local to server
4. If both same timestamp → use local (faster)
5. If offline/not logged in → load from localStorage

## In-Game Sync Indicator (HTML/CSS HUD)
- ☁️ White = synced
- ☁️ Yellow = syncing
- ☁️ Red X = offline
- ☁️ Blue arrow = pending saves
- Small fixed element over the canvas, updated by SyncService state

## Auth Modal (HTML overlay)
- Tabs: "تسجيل الدخول" / "إنشاء حساب"
- Form fields with Arabic labels + inline validation
- On success: close, update header, trigger sync
- Guest hint: "يمكنك اللعب كضيف — لن يتم حفظ تقدمك على الخادم"

## Verification & Acceptance Criteria
- [ ] Logged-in player's auto-saves persist to server
- [ ] Offline saves queue locally and flush when online
- [ ] Loading game on a new device restores from server
- [ ] Conflict dialog appears when local and server diverge (409)
- [ ] Guest play works without auth (periodic login prompt)
- [ ] Sync indicator shows correct state (synced/syncing/offline/pending)
- [ ] Token refresh works transparently
- [ ] Clear browser data + login → restore from server
- [ ] Online/offline events trigger flush/notification
