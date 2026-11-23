import Phaser from "phaser";
import { VIEW_W, VIEW_H, WALK_SPEED, TILE } from "./constants";
import { PLAZA } from "./maps/plaza";
import { parseMap, type ParsedMap } from "./maps/types";
import { paintZone, tryMove, regionAt } from "./render";
import { paintAvatarFrame, shirtColors, WALK_FRAMES, AVATAR_W, AVATAR_H, type Facing } from "./art/avatar";
import { PAL, px, type Ctx } from "./art/draw";

export interface WorldInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export interface WorldGameOpts {
  container: HTMLElement;
  /** Accent color — tints the kid's shirt (spec §6). */
  accent: string;
  displayName: string;
  reducedMotion: boolean;
  /** Shared mutable input flags (keyboard OR touch d-pad). */
  input: WorldInput;
  onRegion: (regionId: string) => void;
}

/**
 * Slice 3a — Plaza & movement (spec §13). Single Phaser scene: pre-rendered
 * zone texture, one player sprite, tile collision, camera follow. Multiplayer
 * sync arrives in Slice 3b; there are deliberately NO fake players.
 */
export function createWorldGame(opts: WorldGameOpts): Phaser.Game {
  const map: ParsedMap = parseMap(PLAZA);

  class ZoneScene extends Phaser.Scene {
    private player!: Phaser.GameObjects.Sprite;
    private label!: Phaser.GameObjects.Text;
    private facing: Facing = "down";
    private walkPhase = 0;
    private lastRegion: string | null = null;
    private keys!: Record<string, Phaser.Input.Keyboard.Key>;
    private frameKey = "";

    constructor() {
      super("zone");
    }

    create() {
      // 1. zone ground texture (code-drawn, one canvas)
      const zoneTex = this.textures.createCanvas("zone", map.width * TILE, map.height * TILE);
      if (zoneTex) {
        paintZone(zoneTex.context as Ctx, map);
        zoneTex.refresh();
        this.add.image(0, 0, "zone").setOrigin(0);
      }

      // 2. avatar frames (accent-tinted kid)
      const colors = shirtColors(opts.accent);
      for (const facing of ["down", "up", "left", "right"] as Facing[]) {
        for (const frame of [0, 1, 2]) {
          const key = `av-${facing}-${frame}`;
          const tex = this.textures.createCanvas(key, AVATAR_W, AVATAR_H);
          if (tex) {
            paintAvatarFrame(tex.context as Ctx, facing, frame, colors);
            tex.refresh();
          }
        }
      }

      // 3. player + name label
      this.player = this.add.sprite(map.spawnPx.x, map.spawnPx.y, "av-down-0");
      this.label = this.add
        .text(map.spawnPx.x, map.spawnPx.y - 14, opts.displayName, {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#f4f7fb",
          backgroundColor: "#22303cdd",
          padding: { x: 4, y: 2 },
        })
        .setOrigin(0.5, 1)
        .setDepth(10);

      // 4. camera
      this.cameras.main.setBounds(0, 0, map.width * TILE, map.height * TILE);
      this.cameras.main.startFollow(this.player, true, 0.15, 0.15);
      this.cameras.main.setBackgroundColor("#0d1017");

      // 5. keyboard (d-pad feeds the same input object from React)
      this.keys = (this.input.keyboard?.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.UP,
        down: Phaser.Input.Keyboard.KeyCodes.DOWN,
        left: Phaser.Input.Keyboard.KeyCodes.LEFT,
        right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        w: Phaser.Input.Keyboard.KeyCodes.W,
        a: Phaser.Input.Keyboard.KeyCodes.A,
        s: Phaser.Input.Keyboard.KeyCodes.S,
        d: Phaser.Input.Keyboard.KeyCodes.D,
      }) ?? {}) as Record<string, Phaser.Input.Keyboard.Key>;

      // 6. fountain sparkle (2-frame sprite flip, banner-style; skipped for reduced motion)
      if (!opts.reducedMotion) {
        const sparkle = this.textures.createCanvas("sparkle", 8, 8);
        if (sparkle) {
          const c = sparkle.context as Ctx;
          px(c, 2, 0, 2, 8, PAL.sparkle);
          px(c, 0, 2, 8, 2, PAL.sparkle);
          sparkle.refresh();
          const s = this.add.image(24 * TILE, 16 * TILE, "sparkle").setDepth(5).setScale(1.5);
          this.time.addEvent({
            delay: 520,
            loop: true,
            callback: () => s.setVisible(!s.visible),
          });
        }
      }
    }

    update(_time: number, delta: number) {
      const k = this.keys;
      const i = opts.input;
      const dxRaw = (k.right?.isDown || i.right ? 1 : 0) - (k.left?.isDown || i.left ? 1 : 0);
      const dyRaw = (k.down?.isDown || i.down ? 1 : 0) - (k.up?.isDown || i.up ? 1 : 0);

      let moved = 0;
      if (dxRaw !== 0 || dyRaw !== 0) {
        const len = Math.hypot(dxRaw, dyRaw);
        const step = (WALK_SPEED * delta) / 1000;
        const before = { x: this.player.x, y: this.player.y };
        const after = tryMove(
          map,
          { x: this.player.x, y: this.player.y },
          (dxRaw / len) * step,
          (dyRaw / len) * step
        );
        moved = Math.hypot(after.x - before.x, after.y - before.y);
        this.player.setPosition(after.x, after.y);

        if (dxRaw !== 0) this.facing = dxRaw > 0 ? "right" : "left";
        else this.facing = dyRaw > 0 ? "down" : "up";
      }

      this.label.setPosition(this.player.x, this.player.y - 14);

      // walk cycle by distance traveled
      this.walkPhase += moved;
      const frame = moved > 0 ? WALK_FRAMES[Math.floor(this.walkPhase / 9) % WALK_FRAMES.length] : 0;
      const key = `av-${this.facing}-${frame}`;
      if (key !== this.frameKey) {
        this.frameKey = key;
        this.player.setTexture(key);
      }

      // region events (throttled by enter/leave state)
      const region = regionAt(map, this.player.x, this.player.y + 11);
      if (region && region !== this.lastRegion) opts.onRegion(region);
      this.lastRegion = region;
    }
  }

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: opts.container,
    width: VIEW_W,
    height: VIEW_H,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: "#0d1017",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [ZoneScene],
  });
}
