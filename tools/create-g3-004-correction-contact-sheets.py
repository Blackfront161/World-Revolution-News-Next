"""Render commit-bound before/after contact sheets for WRN-G3-004 correction QA.

Reads only previously captured QA PNGs and writes derived PNGs under the
permitted G3-004 evidence directory. Product and legacy files are untouched.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OLD = "206e75816c6ad0ec2f8c82f9da78f2950a6ab239"
NEW = "31411d114aacd76195af80e5b8025a5d4e60836a"
DATE = "2026-08-24"
RAW = ROOT / "docs/evidence/WRN-G3-004/raw"
OUT = ROOT / "docs/evidence/WRN-G3-004/contact-sheets"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(
        str(Path("C:/Windows/Fonts") / ("arialbd.ttf" if bold else "arial.ttf")), size
    )


def picture(path: Path, width: int) -> Image.Image:
    with Image.open(path) as source:
        image = source.convert("RGB")
    image = image.crop((0, 0, image.width, min(image.height, 900)))
    return image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)


def sheet(title: str, subtitle: str, old_path: Path, new_path: Path, filename: str) -> None:
    margin, gutter, column = 28, 24, 430
    before, after = picture(old_path, column), picture(new_path, column)
    canvas = Image.new("RGB", (margin * 2 + column * 2 + gutter, 176 + max(before.height, after.height)), "#0b1219")
    draw = ImageDraw.Draw(canvas)
    draw.text((margin, 20), title, fill="#f4f7fa", font=font(25, True))
    draw.text((margin, 58), subtitle, fill="#c1ccd6", font=font(14))
    draw.line((margin, 94, canvas.width - margin, 94), fill="#7dd3fc", width=3)
    draw.text((margin, 120), f"VORHER · Kandidat {OLD[:12]}", fill="#facc15", font=font(15, True))
    draw.text((margin + column + gutter, 120), f"NACHHER · Kandidat {NEW[:12]}", fill="#7dd3fc", font=font(15, True))
    draw.text((margin, 144), "unveränderter roter QA-Beleg", fill="#c1ccd6", font=font(12))
    draw.text((margin + column + gutter, 144), "erneuter unabhängiger QA-Beleg", fill="#c1ccd6", font=font(12))
    canvas.paste(before, (margin, 170))
    canvas.paste(after, (margin + column + gutter, 170))
    OUT.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT / filename, optimize=True)


def main() -> None:
    sheet(
        "WRN Mobile · Bottom-Navigation korrigiert",
        "390×844 · Dark / Start · M-001: Navigation ist jetzt am unteren App-Rand verankert",
        RAW / f"{OLD}_mobile-390x844_dark_home_2026-08-24.png",
        RAW / f"{NEW}_mobile-390x844_dark_home_viewport_{DATE}.png",
        f"{NEW}_mobile-bottom-navigation-before-after_{DATE}.png",
    )
    sheet(
        "WRN Website · 800-Pixel-Navigation korrigiert",
        "800×1280 · Dark / Start · H-001: Labels haben eigene vollständige Zielzonen",
        RAW / f"{OLD}_website-800x1280_dark_home_2026-08-24.png",
        RAW / f"{NEW}_website-800x1280_dark_home_viewport_{DATE}.png",
        f"{NEW}_website-800-navigation-before-after_{DATE}.png",
    )
    sheet(
        "WRN Website · 200-%-Reflow nach Korrektur",
        "390×844 · Dark / Gespeichert · H-002 Overflow/Panelbruch geschlossen; sichtbarer Markenreflow separat bewertet",
        RAW / f"{OLD}_website-390x844_dark_saved_reflow-200pct_2026-08-24.png",
        RAW / f"{NEW}_website-390x844_dark_saved_reflow-200pct_viewport_{DATE}.png",
        f"{NEW}_website-reflow-before-after_{DATE}.png",
    )


if __name__ == "__main__":
    main()
