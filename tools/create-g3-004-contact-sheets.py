"""Build deterministic, commit-bound G3-004 visual QA contact sheets.

The utility reads only archived baseline and independent local QA screenshots.
It never starts a service and never modifies either legacy repository or
product source code.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
REVISION = "206e75816c6ad0ec2f8c82f9da78f2950a6ab239"
DATE = "2026-08-24"
RAW = ROOT / "docs/evidence/WRN-G3-004/raw"
OUT = ROOT / "docs/evidence/WRN-G3-004/contact-sheets"

BACKGROUND = "#0b1219"
SURFACE = "#18232e"
TEXT = "#f4f7fa"
MUTED = "#c1ccd6"
ACCENT = "#7dd3fc"
WARNING = "#facc15"


def font(size: int, *, bold: bool = False) -> ImageFont.FreeTypeFont:
    name = "arialbd.ttf" if bold else "arial.ttf"
    return ImageFont.truetype(str(Path("C:/Windows/Fonts") / name), size)


def read_crop(path: Path, max_height: int, width: int) -> Image.Image:
    with Image.open(path) as source:
        image = source.convert("RGB")
    image = image.crop((0, 0, image.width, min(image.height, max_height)))
    height = round(image.height * width / image.width)
    return image.resize((width, height), Image.Resampling.LANCZOS)


def comparison(title: str, subtitle: str, rows: list[tuple[str, Path, Path]], output: str) -> None:
    margin, gutter, column_width = 28, 24, 460
    rendered = [(label, read_crop(old, 900, column_width), read_crop(new, 900, column_width)) for label, old, new in rows]
    canvas_width = margin * 2 + column_width * 2 + gutter
    canvas_height = 122 + sum(64 + max(old.height, new.height) + 28 for _, old, new in rendered)
    canvas = Image.new("RGB", (canvas_width, canvas_height), BACKGROUND)
    draw = ImageDraw.Draw(canvas)
    draw.text((margin, 20), title, fill=TEXT, font=font(26, bold=True))
    draw.text((margin, 56), subtitle, fill=MUTED, font=font(15))
    draw.line((margin, 94, canvas_width - margin, 94), fill=ACCENT, width=3)
    y = 118
    for label, old, new in rendered:
        draw.text((margin, y), label, fill=ACCENT, font=font(18, bold=True))
        draw.text((margin, y + 26), "ALT · read-only Referenz", fill=MUTED, font=font(13))
        draw.text((margin + column_width + gutter, y + 26), "NEU · lokaler Kandidat", fill=MUTED, font=font(13))
        y += 52
        canvas.paste(old, (margin, y))
        canvas.paste(new, (margin + column_width + gutter, y))
        y += max(old.height, new.height) + 28
    OUT.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT / output, optimize=True)


def reflow_finding() -> None:
    normal = read_crop(RAW / f"{REVISION}_website-390x844_dark_more_{DATE}.png", 844, 420)
    broken = read_crop(RAW / f"{REVISION}_website-390x844_dark_saved_reflow-200pct_{DATE}.png", 844, 420)
    margin, gutter = 28, 24
    canvas = Image.new("RGB", (margin * 2 + 840 + gutter, 1230), BACKGROUND)
    draw = ImageDraw.Draw(canvas)
    draw.text((margin, 20), "QA Finding · Website 390×844 bei 200-%-Reflow", fill=TEXT, font=font(25, bold=True))
    draw.text((margin, 56), f"Kandidat {REVISION} · {DATE} · horizontaler Overflow: 48 CSS-Pixel", fill=MUTED, font=font(14))
    draw.rounded_rectangle((margin, 84, canvas.width - margin, 120), radius=8, fill=SURFACE, outline=WARNING, width=2)
    draw.text((margin + 12, 94), "HIGH: Headerlabels überlappen; Zwischenansicht läuft rechts aus und schneidet die Überschrift ab.", fill=WARNING, font=font(14, bold=True))
    draw.text((margin, 144), "Normaler Smartphone-Zustand · Dark / Mehr", fill=ACCENT, font=font(16, bold=True))
    draw.text((margin + 420 + gutter, 144), "Fehlerzustand · Dark / Gespeichert / 200-%-Reflow", fill=WARNING, font=font(16, bold=True))
    canvas.paste(normal, (margin, 174))
    canvas.paste(broken, (margin + 420 + gutter, 174))
    OUT.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT / f"{REVISION}_website-reflow-high-finding_{DATE}.png", optimize=True)


def main() -> None:
    comparison(
        "WRN Mobile · Alt-vs.-Neu Navigation",
        f"Kandidat {REVISION} · {DATE} · Dark / Start · separate App-Komposition",
        [
            ("Smartphone 390×844", ROOT / "docs/evidence/WRN-G1-002/app-390x844-feed.png", RAW / f"{REVISION}_mobile-390x844_dark_home_{DATE}.png"),
            ("Tablet 600×960", ROOT / "docs/evidence/WRN-G1-002/app-600x960-feed.png", RAW / f"{REVISION}_mobile-600x960_dark_home_{DATE}.png"),
        ],
        f"{REVISION}_comparison-mobile_{DATE}.png",
    )
    comparison(
        "WRN Website · Alt-vs.-Neu Navigation",
        f"Kandidat {REVISION} · {DATE} · Dark / Start · separate Website-Komposition",
        [
            ("Smartphone 390×844", ROOT / "docs/evidence/WRN-G1-006/WRN-G1-006_9a59b17_390x844_dark-feed_2026-08-21.png", RAW / f"{REVISION}_website-390x844_dark_home_{DATE}.png"),
            ("Tablet 800×1280", ROOT / "docs/evidence/WRN-G1-006/WRN-G1-006_9a59b17_800x1280_dark-feed_2026-08-21.png", RAW / f"{REVISION}_website-800x1280_dark_home_{DATE}.png"),
            ("Desktop 1440×900", ROOT / "docs/evidence/WRN-G1-006/WRN-G1-006_9a59b17_1440x900_dark-feed-desktop_2026-08-21.png", RAW / f"{REVISION}_website-1440x900_dark_home_{DATE}.png"),
        ],
        f"{REVISION}_comparison-website_{DATE}.png",
    )
    reflow_finding()


if __name__ == "__main__":
    main()
