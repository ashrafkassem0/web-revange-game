# TASK_033 — ADVANCED_MAIN_MENU

## Objective
Enhance the main menu (`game/index.html`) with map selection, progress summary, post-completion features, and New Game+ using HTML/CSS/JS (not Pixi.js).

## Detailed Mechanics & User Stories

### Current Menu (Existing)
- Title "الانتقام" with subtitle "قصة أشرف"
- "لعبة جديدة" / "متابعة اللعب" / "الإعدادات" buttons
- Version number bottom
- Red floating CSS particles
- Background image with vignette overlay

### Enhancements

**Map Selection Screen**
- Button "اختيار الخريطة" appears if any map beyond forest is unlocked
- World map visual: vertical path with zone cards
- Each card shows:
  - Emoji icon + name (e.g., 🌲 الغابة)
  - Status badge: ✔️ (completed) / 🔓 (unlocked) / 🔒 (locked)
  - Stats: kills, play time, completion %
  - Click → navigate to that map (if unlocked)

**Progress Summary on Continue**
- Brief overlay before entering game:
  - المستوى X | الخريطة: Y | وقت اللعب: Z
  - "اضغط أي مفتاح للمتابعة"

**Post-Completion Badge**
- Golden trophy icon 🏆 appears if `completedGame = true`
- "🎉 القصة مكتملة!" text pulse animation

**New Buttons (After Completion)**
- "الحملة الجديدة+" — starts NG+ (keeps stats, harder enemies)
- "عرض القصة" — plays all cutscenes sequentially (story movie mode)
- "الإنجازات" — opens achievement screen

**Background Parallax**
- Mouse-follow parallax on title screen background
- `background-position` shifts by `dx * 0.02, dy * 0.02`
- Max offset: 10px

### Edge Cases
- **First Time:** No localStorage → auto-redirect to intro
- **All Saves Deleted:** Keep `completedGame` flag for badge + story mode
- **Guest Player:** Show "سجل الدخول لربط تقدمك" banner (from TASK_037)

## Implementation Hints
- CSS: `background-position` animation via JS `mousemove` listener
- Map selection: HTML overlay with CSS grid, each card a `<div>` with conditional classes
- Badge: CSS `@keyframes pulse` animation on trophy emoji
- All text: Arabic, RTL layout

## Verification & Acceptance Criteria
- [ ] Map selection shows correct unlocked zones with status badges
- [ ] Clicking a zone navigates to it via SceneManager
- [ ] Progress summary shows on "Continue Game"
- [ ] Post-completion trophy badge + "القصة مكتملة!" text
- [ ] "الحملة الجديدة+" button works
- [ ] "عرض القصة" replays all cutscenes
- [ ] Background parallax effect (2px max offset)
- [ ] First-time player redirects to intro
- [ ] Auth banner shown for guest players
