export class PlayerInput {
  forward = false;
  backward = false;
  left = false;
  right = false;
  run = false;
  jump = false;
  jumpPressed = false;

  private keys = new Set<string>();

  constructor() {
    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));
  }

  private onKey(e: KeyboardEvent, down: boolean) {
    const k = e.key.toLowerCase();
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

  getMoveVector(): { x: number; z: number } {
    let x = 0;
    let z = 0;
    if (this.forward) z -= 1;
    if (this.backward) z += 1;
    if (this.left) x -= 1;
    if (this.right) x += 1;
    const len = Math.hypot(x, z);
    if (len > 0) {
      x /= len;
      z /= len;
    }
    return { x, z };
  }

  consumeJump(): boolean {
    if (this.jumpPressed) {
      this.jumpPressed = false;
      return true;
    }
    return false;
  }
}
