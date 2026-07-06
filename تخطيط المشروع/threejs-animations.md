# Three.js — الأنيمiشن (Mixamo → GLB)

## 1. Mixamo

1. [mixamo.com](https://www.mixamo.com) → اختر شخصية
2. حمّل: **Idle**, **Walking**, **Running**, **Jump**
3. Without Skin فقط للأنيمiشن الثاني+ (أو With Skin لكل ملف)

## 2. Blender

1. Import FBX
2. File → Export → **glTF 2.0 (.glb)**
3. ✅ Animation

## 3. المشروع

```
game/assets/models/hero.glb
```

## 4. ربط الـ clips

في `characters.js`:

```javascript
animations: {
  idle: 'Idle',
  walk: 'Walking',
  run: 'Running',
  jump: 'Jump'
}
```

## 5. AnimationController

- `idle` → speed ≈ 0
- `walk` → WASD
- `run` → Shift + حركة
- `jump` → Space
- **crossfade 0.25s** بين الحالات

## 6. بدون GLB

مجسم بديل (صندوق + رأس) + حركة إجرائية في `AnimatedCharacter.ts`
