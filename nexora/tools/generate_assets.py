#!/usr/bin/env python3
"""Generate NEXORA's original pixel-art assets (avatars + banner).

Every asset is drawn here, pixel by pixel, with Pillow. No fonts, no AI,
no third-party artwork. Re-run with:  python3 tools/generate_assets.py
Deterministic (seeded) so the output is reproducible.
"""
import math
import os
import random

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AV = os.path.join(ROOT, "public", "avatars")
BN = os.path.join(ROOT, "public", "banners")
os.makedirs(AV, exist_ok=True)
os.makedirs(BN, exist_ok=True)

random.seed(1337)

# ---------- palette ----------
OUTLINE = "#0b0e14"
HOOD = "#232c42"
HOOD_HI = "#313d5c"
HOOD_LO = "#161c2c"
VOID = "#10141f"
EYE = "#41d4f4"
EYE_HI = "#c9f4ff"
ORANGE = "#e8843c"
ORANGE_HI = "#f5a25e"
ORANGE_LO = "#b05a24"
CREAM = "#f2e6cf"
INK = "#20262e"
LIME = "#57d99a"
LIME_HI = "#8df0ba"
LIME_LO = "#2ea86d"
STEEL = "#9aa8bd"
STEEL_HI = "#cdd7e6"
STEEL_LO = "#5d6a80"
STEEL_DK = "#3a4457"
GOLD = "#e8c15a"
GOLD_LO = "#a8843a"


def canvas(w: int, h: int) -> Image.Image:
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def upscale(img: Image.Image, scale: int) -> Image.Image:
    return img.resize((img.width * scale, img.height * scale), Image.NEAREST)


def save(img: Image.Image, path: str, scale: int) -> None:
    upscale(img, scale).save(path, "PNG")
    print("wrote", os.path.relpath(path, ROOT), img.size, "x%d" % scale)


# ---------- avatars (drawn at 16x16, scaled x4) ----------

def avatar_hooded() -> Image.Image:
    im = canvas(16, 16)
    d = ImageDraw.Draw(im)
    # hood body (trapezoid-ish blob)
    d.ellipse([2, 1, 13, 12], fill=OUTLINE)
    d.ellipse([3, 2, 12, 11], fill=HOOD)
    d.rectangle([2, 9, 13, 15], fill=OUTLINE)
    d.rectangle([3, 9, 12, 14], fill=HOOD_LO)
    # hood highlight
    d.arc([4, 3, 11, 9], start=200, end=330, fill=HOOD_HI, width=1)
    # face void
    d.ellipse([4, 5, 11, 11], fill=VOID)
    # glowing eyes
    d.rectangle([6, 8, 6, 8], fill=EYE_HI)
    d.rectangle([9, 8, 9, 8], fill=EYE_HI)
    d.rectangle([5, 8, 6, 8], fill=EYE)
    d.rectangle([9, 8, 10, 8], fill=EYE)
    d.point([(5, 9)], fill=EYE)
    d.point([(10, 9)], fill=EYE)
    return im


def avatar_fox() -> Image.Image:
    im = canvas(16, 16)
    d = ImageDraw.Draw(im)
    # ears
    d.polygon([(3, 5), (2, 0), (7, 3)], fill=OUTLINE)
    d.polygon([(13, 5), (14, 0), (9, 3)], fill=OUTLINE)
    d.polygon([(4, 4), (3, 1), (6, 3)], fill=ORANGE)
    d.polygon([(12, 4), (13, 1), (10, 3)], fill=ORANGE)
    # head
    d.ellipse([2, 3, 13, 13], fill=OUTLINE)
    d.ellipse([3, 4, 12, 12], fill=ORANGE)
    # cheek fluff
    d.polygon([(3, 9), (5, 12), (6, 9)], fill=CREAM)
    d.polygon([(13, 9), (11, 12), (10, 9)], fill=CREAM)
    d.rectangle([5, 11, 10, 12], fill=CREAM)
    # muzzle
    d.ellipse([6, 9, 9, 12], fill=CREAM)
    # closed happy eyes
    d.point([(5, 8)], fill=INK)
    d.point([(10, 8)], fill=INK)
    d.rectangle([5, 7, 5, 7], fill=INK)
    d.rectangle([10, 7, 10, 7], fill=INK)
    # nose
    d.point([(7, 11)], fill=INK)
    d.point([(8, 11)], fill=INK)
    # brow highlight
    d.point([(6, 5)], fill=ORANGE_HI)
    d.point([(7, 4)], fill=ORANGE_HI)
    return im


def avatar_slime() -> Image.Image:
    im = canvas(16, 16)
    d = ImageDraw.Draw(im)
    # blob body: squashed dome
    d.ellipse([1, 3, 14, 15], fill=OUTLINE)
    d.ellipse([2, 4, 13, 14], fill=LIME)
    d.rectangle([2, 11, 13, 13], fill=LIME)
    d.ellipse([2, 11, 13, 14], fill=LIME)
    d.rectangle([1, 12, 14, 15], fill=(0, 0, 0, 0))  # keep bottom flat-ish
    # shading
    d.ellipse([3, 9, 12, 14], fill=LIME_LO)
    d.ellipse([3, 4, 12, 12], fill=LIME)
    # highlight
    d.ellipse([4, 5, 7, 8], fill=LIME_HI)
    d.point([(5, 6), (6, 6)], fill="#eafff1")
    # eyes
    d.ellipse([5, 8, 6, 10], fill=INK)
    d.ellipse([9, 8, 10, 10], fill=INK)
    d.point([(5, 8), (9, 8)], fill="#ffffff")
    # smile
    d.point([(7, 11), (8, 11)], fill=INK)
    return im


def avatar_knight() -> Image.Image:
    im = canvas(16, 16)
    d = ImageDraw.Draw(im)
    # plume
    d.rectangle([7, 0, 8, 2], fill=EYE)
    d.rectangle([7, 0, 8, 0], fill=EYE_HI)
    # dome
    d.ellipse([2, 2, 13, 12], fill=OUTLINE)
    d.ellipse([3, 3, 12, 11], fill=STEEL)
    d.arc([4, 3, 11, 8], start=180, end=340, fill=STEEL_HI, width=1)
    # visor
    d.rectangle([4, 7, 11, 9], fill=STEEL_DK)
    d.rectangle([5, 8, 10, 8], fill=EYE)
    d.point([(6, 8), (9, 8)], fill=EYE_HI)
    # neck guard + shoulders
    d.rectangle([4, 11, 11, 12], fill=STEEL_LO)
    d.rectangle([2, 12, 13, 15], fill=OUTLINE)
    d.rectangle([3, 12, 12, 14], fill=STEEL_LO)
    d.rectangle([3, 12, 12, 12], fill=STEEL)
    d.rectangle([7, 12, 8, 14], fill=STEEL_DK)
    return im


# ---------- banner (drawn at 240x80, scaled x4) ----------

def banner_field() -> Image.Image:
    W, H = 240, 80
    im = canvas(W, H)
    d = ImageDraw.Draw(im)

    # sky: banded gradient (flat steps read as pixel-art banding)
    sky = ["#0a1020", "#0d1428", "#111a33", "#16203c", "#1c2745", "#232f50", "#2a365a"]
    band = 8
    for i, c in enumerate(sky):
        y0 = i * band
        if y0 >= 44:
            break
        d.rectangle([0, y0, W, min(y0 + band, 44)], fill=c)

    # stars
    rng = random.Random(20261123)
    for _ in range(110):
        x = rng.randrange(0, W)
        y = rng.randrange(0, 40)
        r = rng.random()
        col = "#ffffff" if r > 0.75 else ("#9fd8f0" if r > 0.4 else "#5a6f96")
        d.point((x, y), fill=col)

    # moon (pixel disc + crater cuts)
    d.ellipse([188, 6, 212, 30], fill="#e8e4cf")
    d.ellipse([184, 6, 208, 30], fill=sky[0])  # crescent carve-out
    d.ellipse([196, 12, 200, 16], fill="#c9c5b0")

    # far mountains
    d.polygon([(0, 44), (38, 26), (70, 44)], fill="#141b30")
    d.polygon([(30, 44), (78, 20), (120, 44)], fill="#171f38")
    d.polygon([(96, 44), (140, 28), (188, 44)], fill="#131a2e")
    d.polygon([(160, 44), (214, 24), (240, 44)], fill="#171f38")

    # mid hills
    d.ellipse([-50, 34, 130, 84], fill="#16241f")
    d.ellipse([90, 38, 300, 88], fill="#14201c")

    # ground bands
    ground = ["#17251d", "#1a2a20", "#1e3025", "#223729"]
    for i, c in enumerate(ground):
        d.rectangle([0, 48 + i * 9, W, H], fill=c)

    # colossal broken sword, tilted, stuck in the field
    cx, base_y = 118, 66
    blade = [(cx - 4, base_y - 62), (cx - 3, base_y - 20), (cx + 4, base_y - 16), (cx + 5, base_y - 58), (cx + 2, base_y - 66)]
    d.polygon([(x + 2, y + 2) for x, y in blade], fill="#04060c")  # drop shadow
    d.polygon(blade, fill=STEEL)
    d.polygon([(cx - 4, base_y - 62), (cx - 1, base_y - 20), (cx + 1, base_y - 18), (cx - 2, base_y - 60)], fill=STEEL_HI)
    d.polygon([(cx + 3, base_y - 17), (cx + 5, base_y - 58), (cx + 4, base_y - 40)], fill=STEEL_LO)
    # broken tip notch
    d.polygon([(cx - 4, base_y - 62), (cx, base_y - 55), (cx + 5, base_y - 58), (cx + 2, base_y - 66)], fill=STEEL_DK)
    # crossguard
    d.rectangle([cx - 14, base_y - 20, cx + 15, base_y - 16], fill=OUTLINE)
    d.rectangle([cx - 13, base_y - 19, cx + 14, base_y - 17], fill=GOLD)
    d.point([(cx - 13, base_y - 18), (cx + 14, base_y - 18)], fill=GOLD_LO)
    # grip + pommel
    d.rectangle([cx - 3, base_y - 15, cx + 4, base_y - 8], fill=OUTLINE)
    d.rectangle([cx - 2, base_y - 14, cx + 3, base_y - 9], fill="#4a3524")
    d.rectangle([cx - 1, base_y - 13, cx + 2, base_y - 12], fill="#6b5136")
    d.ellipse([cx - 4, base_y - 9, cx + 5, base_y - 4], fill=OUTLINE)
    d.ellipse([cx - 3, base_y - 8, cx + 4, base_y - 5], fill=GOLD_LO)

    # grass tufts + field texture
    for _ in range(180):
        x = rng.randrange(0, W)
        y = rng.randrange(50, H)
        shade = rng.choice(["#2c4632", "#243a2b", "#1c2f24"])
        d.point((x, y), fill=shade)
        if rng.random() < 0.3:
            d.point((x, y - 1), fill=shade)
    # fireflies near the sword
    for _ in range(9):
        x = rng.randrange(cx - 60, cx + 70)
        y = rng.randrange(34, 62)
        d.point((x, y), fill="#ffe98a")

    # vignette corners
    for i in range(10):
        a = i * 3
        d.line([(0, i), (a, 0)], fill="#05070d")
        d.line([(W - 1, i), (W - 1 - a, 0)], fill="#05070d")

    return im


def main() -> None:
    save(avatar_hooded(), os.path.join(AV, "hooded.png"), 4)
    save(avatar_fox(), os.path.join(AV, "fox.png"), 4)
    save(avatar_slime(), os.path.join(AV, "slime.png"), 4)
    save(avatar_knight(), os.path.join(AV, "knight.png"), 4)
    save(banner_field(), os.path.join(BN, "field.png"), 4)


if __name__ == "__main__":
    main()
