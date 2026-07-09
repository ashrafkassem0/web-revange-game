# TASK_036 — GAME_STATE_API

## Objective
Provide CRUD endpoints for saving, loading, and merging game save data per authenticated user.

## API Endpoints

| Method | Path | Auth | Body / Params | Response |
|--------|------|------|---------------|----------|
| GET | `/api/v1/game/saves` | Yes | — | `{ saves: [{ slot, heroLevel, currentMap, updatedAt }] }` |
| GET | `/api/v1/game/saves/:slot` | Yes | — | `{ save: { ...full } }` |
| POST | `/api/v1/game/saves/:slot` | Yes | Full save JSON | `{ save: { ... } }` |
| DELETE | `/api/v1/game/saves/:slot` | Yes | — | `{ message: "تم الحذف" }` |
| POST | `/api/v1/game/sync` | Yes | `{ saves: [{ slot, data, timestamp }] }` | `{ saves: [{ slot, data }] }` |

## Save Payload (POST /game/saves/:slot)
```json
{
  "heroStats": { "hp": 85, "maxHp": 100, "attack": 25, "defense": 20, "skills": { "sword": 3, "bow": 2 }, "absorbedAttack": 12, "absorbedDefense": 8 },
  "inventory": { "resources": { "stick": 15, "stone": 8 }, "equipment": { "weapon": "ironSword", "armor": "leatherArmor" }, "tools": { "axe": true }, "coins": 45, "questItems": [] },
  "progress": { "completedForest": true, "completedCity": false, "currentMap": "city", "positionX": 1200.5, "positionY": 800.3 },
  "worldState": { "forest": { "choppedTrees": [3, 7, 12], "deadEnemies": ["wolf_1"] } },
  "meta": { "totalPlayMs": 1823000, "totalKills": 15, "totalDistance": 4800.0, "achievements": ["first_kill"] },
  "timestamp": "2026-07-08T15:30:00.000Z"
}
```

## Conflict Resolution ("Last Write Wins")
```javascript
async function saveGame(req, res) {
  const { slot } = req.params;
  const data = req.body;
  const existing = await GameSave.query().where({ user_id: req.user.sub, slot }).first();

  if (existing && new Date(data.timestamp) < new Date(existing.updated_at)) {
    return res.status(409).json({
      error: 'توجد نسخة أحدث على الخادم',
      save: existing
    });
  }

  // Upsert
  const save = await GameSave.query().insert({ ... });
  res.json({ save });
}
```

## Bulk Sync (POST /game/sync)
```javascript
async function sync(req, res) {
  const results = [];
  for (const { slot, data, timestamp } of req.body.saves) {
    const existing = await GameSave.getSlot(req.user.sub, slot);
    if (!existing || new Date(timestamp) >= new Date(existing.updated_at)) {
      await GameSave.upsert(req.user.sub, slot, data);
    }
    results.push({ slot, data: existing || data });
  }
  res.json({ saves: results });
}
```

## Edge Cases
- **First Save:** Upsert via `INSERT OR REPLACE` (SQLite) or `ON CONFLICT DO UPDATE`
- **Save Size Limit:** Reject payloads > 1MB (413 Payload Too Large)
- **Unhealthy Data:** Validate `heroStats.hp` is a number, `inventory` is an object, etc.
- **Missing Field:** Accept partial saves — merge with existing data rather than replace entirely

## Verification & Acceptance Criteria
- [ ] Save creates/updates the correct slot for authenticated user
- [ ] Load returns full save data
- [ ] List returns summary of all 3 slots
- [ ] Delete removes save from database
- [ ] Conflict detection: 409 when server has newer save
- [ ] 409 response includes server save data for client merge dialog
- [ ] Bulk sync merges multiple saves at once
- [ ] Save size limit: 413 for payloads > 1MB
- [ ] Unauthenticated requests return 401 for all endpoints
