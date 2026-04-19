from __future__ import annotations

from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
BRAND_DIR = ROOT / "assets" / "brand"
FONT_DIR = ROOT / "assets" / "fonts"

PALETTE = {
    "background": "#0a0f14",
    "background_2": "#131c25",
    "panel": "#111922",
    "copper": "#d99255",
    "limestone": "#ede4d4",
    "mist": "#93a7b6",
    "graphite": "#1d2833",
    "slate": "#334554",
}


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_DIR / path), size=size)


def hex_rgba(value: str, alpha: int = 255) -> tuple[int, int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4)) + (alpha,)


def vertical_gradient(size: tuple[int, int], top: str, bottom: str) -> Image.Image:
    image = Image.new("RGBA", size)
    draw = ImageDraw.Draw(image)
    top_rgb = hex_rgba(top)
    bottom_rgb = hex_rgba(bottom)
    for y in range(size[1]):
        ratio = y / max(size[1] - 1, 1)
        color = tuple(int(top_rgb[i] + (bottom_rgb[i] - top_rgb[i]) * ratio) for i in range(4))
        draw.line((0, y, size[0], y), fill=color)
    return image


def add_glow(base: Image.Image, bbox: tuple[int, int, int, int], fill: str, blur: int) -> None:
    glow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse(bbox, fill=hex_rgba(fill, 95))
    glow = glow.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(glow)


def draw_mark(image: Image.Image, bounds: tuple[int, int, int, int]) -> None:
    draw = ImageDraw.Draw(image)
    left, top, right, bottom = bounds
    width = right - left
    height = bottom - top
    radius = int(width * 0.08)

    draw.rounded_rectangle(bounds, radius=radius, fill=hex_rgba(PALETTE["panel"]), outline=hex_rgba(PALETTE["slate"], 170), width=max(2, width // 64))

    add_glow(
        image,
        (
            left + width // 6,
            top + height // 12,
            right - width // 10,
            top + height // 2,
        ),
        PALETTE["copper"],
        blur=max(8, width // 24),
    )

    inner = (
        left + int(width * 0.12),
        top + int(height * 0.12),
        right - int(width * 0.12),
        bottom - int(height * 0.12),
    )

    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    overlay_draw.rounded_rectangle(inner, radius=int(width * 0.05), outline=hex_rgba(PALETTE["mist"], 120), width=max(3, width // 80))
    overlay_draw.arc(
        (
            left - int(width * 0.05),
            top + int(height * 0.08),
            right - int(width * 0.22),
            bottom - int(height * 0.28),
        ),
        start=312,
        end=112,
        fill=hex_rgba(PALETTE["copper"], 255),
        width=max(6, width // 30),
    )
    overlay_draw.arc(
        (
            left + int(width * 0.24),
            top - int(height * 0.04),
            right + int(width * 0.02),
            bottom - int(height * 0.35),
        ),
        start=184,
        end=334,
        fill=hex_rgba(PALETTE["limestone"], 230),
        width=max(4, width // 42),
    )

    # Background-colored cuts carve the symbol into a monolith plus signal line.
    cut_width = max(12, width // 9)
    overlay_draw.line(
        [
            (left + width * 0.46, top + height * 0.18),
            (left + width * 0.48, top + height * 0.42),
            (left + width * 0.44, top + height * 0.72),
            (left + width * 0.60, top + height * 0.88),
        ],
        fill=hex_rgba(PALETTE["background"], 255),
        width=cut_width,
        joint="curve",
    )
    overlay_draw.line(
        [
            (left + width * 0.62, top + height * 0.30),
            (left + width * 0.72, top + height * 0.44),
            (left + width * 0.68, top + height * 0.64),
        ],
        fill=hex_rgba(PALETTE["background"], 255),
        width=max(8, width // 13),
        joint="curve",
    )
    overlay_draw.rounded_rectangle(
        (
            left + width * 0.18,
            top + height * 0.18,
            left + width * 0.32,
            bottom - height * 0.18,
        ),
        radius=int(width * 0.03),
        fill=hex_rgba(PALETTE["graphite"], 125),
    )

    for idx in range(4):
        y = top + int(height * (0.22 + idx * 0.13))
        overlay_draw.line(
            (left + width * 0.16, y, left + width * 0.28, y),
            fill=hex_rgba(PALETTE["mist"], 115),
            width=max(2, width // 120),
        )

    image.alpha_composite(overlay)


def save_png(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=True)


def build_logo_mark() -> None:
    image = vertical_gradient((800, 800), PALETTE["background"], PALETTE["background_2"])
    draw_mark(image, (104, 104, 696, 696))
    save_png(image, BRAND_DIR / "logo-mark.png")


def build_favicon() -> None:
    image = vertical_gradient((256, 256), PALETTE["background"], PALETTE["background_2"])
    draw_mark(image, (28, 28, 228, 228))
    save_png(image, BRAND_DIR / "favicon.png")


def build_apple_touch_icon() -> None:
    image = vertical_gradient((180, 180), PALETTE["background"], PALETTE["background_2"])
    draw_mark(image, (18, 18, 162, 162))
    save_png(image, BRAND_DIR / "apple-touch-icon.png")


def build_logo_wordmark() -> None:
    image = vertical_gradient((1600, 440), PALETTE["background"], PALETTE["background_2"])
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((22, 22, 1578, 418), radius=34, outline=hex_rgba(PALETTE["slate"], 150), width=2)
    draw_mark(image, (54, 54, 362, 386))

    headline = font("Tektur-Medium.ttf", 118)
    subline = font("InstrumentSans-Regular.ttf", 42)
    caption = font("InstrumentSerif-Regular.ttf", 28)

    draw.text((430, 100), "ELEPHANT", font=headline, fill=hex_rgba(PALETTE["limestone"]))
    draw.text((438, 228), "ALPHA", font=headline, fill=hex_rgba(PALETTE["copper"]))
    draw.text((437, 326), "Independent model guide for context, tooling, and workflow fit", font=subline, fill=hex_rgba(PALETTE["mist"]))
    draw.text((1210, 74), "SIGNAL MONOLITH / 2026", font=caption, fill=hex_rgba(PALETTE["mist"], 180))
    save_png(image, BRAND_DIR / "logo-wordmark.png")


def draw_label_row(draw: ImageDraw.ImageDraw, labels: Iterable[str], x: int, y: int, row_font: ImageFont.FreeTypeFont) -> None:
    cursor = x
    for label in labels:
        width = int(draw.textlength(label, font=row_font))
        draw.rounded_rectangle((cursor, y, cursor + width + 28, y + 44), radius=22, fill=hex_rgba(PALETTE["graphite"], 180), outline=hex_rgba(PALETTE["slate"], 170), width=1)
        draw.text((cursor + 14, y + 10), label, font=row_font, fill=hex_rgba(PALETTE["limestone"]))
        cursor += width + 40


def build_social_card() -> None:
    image = vertical_gradient((1600, 900), PALETTE["background"], PALETTE["background_2"])
    draw = ImageDraw.Draw(image)

    add_glow(image, (920, 70, 1530, 520), PALETTE["copper"], 72)
    add_glow(image, (1080, 420, 1580, 860), PALETTE["mist"], 48)

    draw.rounded_rectangle((44, 44, 1556, 856), radius=40, outline=hex_rgba(PALETTE["slate"], 170), width=2)
    draw.rounded_rectangle((72, 72, 910, 828), radius=32, fill=hex_rgba(PALETTE["panel"]), outline=hex_rgba(PALETTE["slate"], 120), width=2)
    draw_mark(image, (970, 138, 1456, 624))

    title = font("Tektur-Medium.ttf", 110)
    body = font("InstrumentSans-Regular.ttf", 40)
    small = font("InstrumentSerif-Regular.ttf", 26)
    chip_font = font("InstrumentSans-Regular.ttf", 24)

    draw.text((132, 156), "ELEPHANT", font=title, fill=hex_rgba(PALETTE["limestone"]))
    draw.text((132, 276), "ALPHA", font=title, fill=hex_rgba(PALETTE["copper"]))
    draw.text(
        (132, 420),
        "An independent guide to Elephant Alpha,\n"
        "a 100B text model with 256K context,\n"
        "32K output, function calling,\n"
        "structured output, and prompt caching.",
        font=body,
        fill=hex_rgba(PALETTE["mist"]),
        spacing=10,
    )
    draw_label_row(draw, ["100B", "256K CONTEXT", "32K OUTPUT"], 132, 668, chip_font)
    draw_label_row(draw, ["FUNCTION CALLING", "STRUCTURED OUTPUT", "PROMPT CACHING"], 132, 726, chip_font)
    draw.text((1220, 772), "elephantalpha.lol", font=small, fill=hex_rgba(PALETTE["limestone"]))
    save_png(image, BRAND_DIR / "social-card.png")


def main() -> None:
    BRAND_DIR.mkdir(parents=True, exist_ok=True)
    build_logo_mark()
    build_favicon()
    build_apple_touch_icon()
    build_logo_wordmark()
    build_social_card()


if __name__ == "__main__":
    main()
