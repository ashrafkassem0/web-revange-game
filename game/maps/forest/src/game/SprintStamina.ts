/** إعدادات الحركة الافتراضية */
export const MovementConfig = {
  /** سرعة المشي العادية */
  walkSpeedMps: 2.5,
  /** سرعة الجري */
  runSpeedMps: 5,
  /** أقصى مسافة جري متواصلة (متر) قبل التعب */
  sprintMaxM: 50,
  /** سرعة استعادة طاقة الجري عند التوقف أو المشي (متر/ث) */
  sprintRecoverMps: 12
} as const;

export class SprintStamina {
  private remainingM: number;

  constructor(private readonly maxM = MovementConfig.sprintMaxM) {
    this.remainingM = maxM;
  }

  /** نسبة الطاقة المتبقية 0–1 */
  get ratio(): number {
    return this.remainingM / this.maxM;
  }

  get exhausted(): boolean {
    return this.remainingM <= 0;
  }

  /**
   * يحدّد السرعة الفعلية ويحدّث مخزون الجري.
   * @returns sprinting — هل يجري فعلاً الآن؟
   * @returns speedMps — السرعة الأفقية بالمتر/ث
   */
  update(delta: number, wantsSprint: boolean, isMoving: boolean): { sprinting: boolean; speedMps: number } {
    const canSprint = wantsSprint && isMoving && this.remainingM > 0;

    if (canSprint) {
      this.remainingM = Math.max(0, this.remainingM - MovementConfig.runSpeedMps * delta);
      return { sprinting: true, speedMps: MovementConfig.runSpeedMps };
    }

    if (this.remainingM < this.maxM) {
      this.remainingM = Math.min(
        this.maxM,
        this.remainingM + MovementConfig.sprintRecoverMps * delta
      );
    }

    return {
      sprinting: false,
      speedMps: isMoving ? MovementConfig.walkSpeedMps : 0
    };
  }
}
