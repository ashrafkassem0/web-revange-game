# نماذج الأشجار

| الملف | الوصف |
|-------|--------|
| `tree-1.glb` | شجرة واقعية 1 |
| `tree-2.glb` | شجرة واقعية 2 |
| `Tree-Pack-of-2-Free.blend` | المصدر الأصلي (Blender) |
| `textures/` | خامات اللحاء والأوراق |

## إعادة التصدير

```bash
blender game/assets/models/trees/Tree-Pack-of-2-Free.blend --background --python scripts/export-trees.py
```

المشهد يحمّل `tree-1.glb` و `tree-2.glb` تلقائياً في `TreeLoader.ts`، مع بديل إجرائي عند فشل التحميل.
