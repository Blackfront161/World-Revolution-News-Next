"""Create a final, candidate-bound contact sheet for WRN-G3-004 QA.

This consumes only final QA screenshots and writes one derived evidence PNG.
It does not inspect or alter product, legacy, or earlier QA evidence files.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
CANDIDATE = "3d89fbc05c5349aed4f7caff11099d40b26febb2"
DATE = "2026-08-24"
RAW = ROOT / "docs/evidence/WRN-G3-004/raw"
OUT = ROOT / "docs/evidence/WRN-G3-004/contact-sheets"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    name = "arialbd.ttf" if bold else "arial.ttf"
    return ImageFont.truetype(str(Path("C:/Windows/Fonts") / name), size)


def preview(path: Path, width: int, height: int) -> Image.Image:
    with Image.open(path) as source:
        image = source.convert("RGB")
    image.thumbnail((width, height), Image.Resampling.LANCZOS)
    panel = Image.new("RGB", (width, height), "#111827")
    panel.paste(image, ((width - image.width) // 2, 0))
    return panel


def main() -> None:
    tiles = [
        (
            "Website 390×844 · Light · Start",
            "Normalansicht: kompakter Header ohne Regression",
            RAW / f"{CANDIDATE}_website-390x844_light_home_viewport_{DATE}.png",
        ),
        (
            "Website 390×844 · Dark · Gespeichert · 200 %",
            "M-002 geschlossen: Marke vollstaendig, kein Overflow, getrennte Theme-Schaltflaeche",
            RAW / f"{CANDIDATE}_website-390x844_dark_saved_reflow-200pct_viewport_{DATE}.png",
        ),
        (
            "Website 800×1280 · Dark · Start",
            "H-001 geschlossen: vollstaendige, nicht ueberlappende Zielbeschriftungen",
            RAW / f"{CANDIDATE}_website-800x1280_dark_home_viewport_{DATE}.png",
        ),
        (
            "Mobile 320×568 · Light · Start",
            "M-001 geschlossen: fuenf 44-px-Ziele am unteren App-Rand",
            RAW / f"{CANDIDATE}_mobile-320x568_light_home_viewport_{DATE}.png",
        ),
    ]
    margin, gutter, width, image_height = 32, 28, 500, 500
    header, caption_height = 110, 86
    canvas = Image.new(
        "RGB",
        (margin * 2 + width * 2 + gutter, header + (image_height + caption_height) * 2 + gutter),
        "#08111c",
    )
    draw = ImageDraw.Draw(canvas)
    draw.text((margin, 22), "WRN-G3-004 · Finale visuelle QA", fill="#f8fafc", font=font(28, True))
    draw.text(
        (margin, 62),
        f"Kandidat {CANDIDATE} · {DATE} · unabhängige lokale Belege",
        fill="#b9c6d4",
        font=font(15),
    )
    draw.line((margin, 96, canvas.width - margin, 96), fill="#4dd9e8", width=3)

    for index, (title, caption, path) in enumerate(tiles):
        column, row = index % 2, index // 2
        x = margin + column * (width + gutter)
        y = header + row * (image_height + caption_height + gutter)
        canvas.paste(preview(path, width, image_height), (x, y))
        draw.rectangle((x, y, x + width, y + image_height), outline="#4dd9e8", width=2)
        draw.text((x, y + image_height + 12), title, fill="#f8fafc", font=font(16, True))
        draw.multiline_text((x, y + image_height + 38), caption, fill="#b9c6d4", font=font(13), spacing=3)

    OUT.mkdir(parents=True, exist_ok=True)
    canvas.save(
        OUT / f"{CANDIDATE}_final-navigation-and-reflow_{DATE}.png",
        optimize=True,
    )


if __name__ == "__main__":
    main()
