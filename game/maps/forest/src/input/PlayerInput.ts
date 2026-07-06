export class PlayerInput {
  forward = false;
  backward = false;
  left = false;
  right = false;
  run = false;
  jump = false;
  jumpPressed = false;

  private keys = new Set<string>();
  private rightMouseDown = false;
  private cameraDeltaX = 0;
  private cameraDeltaY = 0;
  private zoomSteps = 0;

  private static readonly GAME_KEYS = new Set([
    'w', 'a', 's', 'd', ' ', 'shift', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'
  ]);

  constructor(canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
        this.rightMouseDown = true;
        e.preventDefault();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 2) this.rightMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.rightMouseDown) return;
      this.cameraDeltaX += e.movementX;
      this.cameraDeltaY += e.movementY;
    });

    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        if (e.deltaY < 0) this.zoomSteps += 1;
        else if (e.deltaY > 0) this.zoomSteps -= 1;
      },
      { passive: false }
    );
  }

  private onKey(e: KeyboardEvent, down: boolean) {
    const k = e.key.toLowerCase();
    if (PlayerInput.GAME_KEYS.has(k)) {
      e.preventDefault();
    }
    if (down) this.keys.add(k);
    else this.keys.delete(k);

    this.forward = this.keys.has('w') || this.keys.has('arrowup');
    this.backward = this.keys.has('s') || this.keys.has('arrowdown');
    this.left = this.keys.has('a') || this.keys.has('arrowleft');
    this.right = this.keys.has('d') || this.keys.has('arrowright');
    this.run = this.keys.has('shift');

    if (down && k === ' ') {
      this.jump = true;
      this.jumpPressed = true;
    }
    if (!down && k === ' ') this.jump = false;
  }

  getAxes(): { forward: number; strafe: number } {
    let forward = 0;
    let strafe = 0;
    if (this.forward) forward += 1;
    if (this.backward) forward -= 1;
    if (this.right) strafe += 1;
    if (this.left) strafe -= 1;
    const len = Math.hypot(forward, strafe);
    if (len > 0) {
      forward /= len;
      strafe /= len;
    }
    return { forward, strafe };
  }

  consumeCameraDelta(): { dx: number; dy: number } {
    const delta = { dx: this.cameraDeltaX, dy: this.cameraDeltaY };
    this.cameraDeltaX = 0;
    this.cameraDeltaY = 0;
    return delta;
  }

  consumeZoomSteps(): number {
    const steps = this.zoomSteps;
    this.zoomSteps = 0;
    return steps;
  }

  consumeJump(): boolean {
    if (this.jumpPressed) {
      this.jumpPressed = false;
      return true;
    }
    return false;
  }
}
