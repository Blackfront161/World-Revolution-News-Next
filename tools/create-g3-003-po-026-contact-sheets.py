"""Render commit-bound PO-026 QA contact sheets from existing local evidence.

Only the prior local candidate and the independently captured PO-026 evidence
are read. No legacy working tree, product source, or network resource is used.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PREVIOUS_REVISION = "af2fd9920191"
CANDIDATE_REVISION = "0a822398a888a6ffce063c1a8e9d0c4d0ce5a548"
DATE = "2026-08-23"
PREVIOUS = ROOT / "docs/evidence/WRN-G3-003/new"
CANDIDATE = ROOT / "docs/evidence/WRN-G3-003-PO-026/new"
OUTPUT = ROOT / "docs/evidence/WRN-G3-003-PO-026/contact-sheets"

BACKGROUND = "#0b1219"
SURFACE = "#18232e"
TEXT = "#f4f7fa"
MUTED = "#c1ccd6"
ACCENT = "#7dd3fc"


def face(size: int, *, bold: bool = False) -> ImageFont.FreeTypeFont:
    name = "arialbd.ttf" if bold else "arial.ttf"
    return ImageFont.truetype(str(Path("C:/Windows/Fonts") / name), size)


def top_crop(path: Path, height: int) -> Image.Image:
    with Image.open(path) as source:
        image = source.convert("RGB")
    return image.crop((0, 0, image.width, min(height, image.height)))


def bottom_crop(path: Path, height: int) -> Image.Image:
    with Image.open(path) as source:
        image = source.convert("RGB")
    return image.crop((0, max(0, image.height - height), image.width, image.height))


def fit_width(image: Image.Image, width: int) -> Image.Image:
    if image.width == width:
        return image
    return image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)


def header_sheet() -> None:
    widths = (390, 800, 1440)
    crop_heights = {390: 180, 800: 120, 1440: 120}
    column_width = 380
    gutter = 24
    margin = 28
    header = 118
    row_title = 48
    rows: list[tuple[int, Image.Image, Image.Image]] = []
    for width in widths:
        name = f"website-{width}x{844 if width == 390 else 1280 if width == 800 else 900}_dark-ready_{DATE}.png"
        rows.append(
            (
                width,
                fit_width(top_crop(PREVIOUS / f"{PREVIOUS_REVISION}_{name}", crop_heights[width]), column_width),
                fit_width(top_crop(CANDIDATE / f"{CANDIDATE_REVISION}_{name}", crop_heights[width]), column_width),
            )
        )
    image_height = max(max(old.height, new.height) for _, old, new in rows)
    row_height = image_height + 48
    canvas_width = margin * 2 + column_width * 3 + gutter * 2
    canvas_height = header + row_title + row_height * 2 + 96
    canvas = Image.new("RGB", (canvas_width, canvas_height), BACKGROUND)
    draw = ImageDraw.Draw(canvas)
    draw.text((margin, 22), "Website-Header · vorher / nachher", fill=TEXT, font=face(28, bold=True))
    draw.text(
        (margin, 61),
        f"PO-026 · alt {PREVIOUS_REVISION} · neu {CANDIDATE_REVISION} · Dark / Ready · {DATE}",
        fill=MUTED,
        font=face(15),
    )
    draw.line((margin, 98, canvas_width - margin, 98), fill=ACCENT, width=3)
    for index, (width, _, _) in enumerate(rows):
        x = margin + index * (column_width + gutter)
        draw.text((x, header), f"{width} px breit", fill=ACCENT, font=face(18, bold=True))
    for row_index, label in enumerate(("VORHER · Kandidat af2fd9920191", "NACHHER · Kandidat 0a822398…")):
        y = header + row_title + row_index * row_height
        draw.rounded_rectangle((margin, y + 10, margin + 10, y + 34), radius=4, fill=ACCENT)
        draw.text((margin + 18, y + 12), label, fill=TEXT, font=face(15, bold=True))
        for index, (_, old, new) in enumerate(rows):
            x = margin + index * (column_width + gutter)
            canvas.paste((old, new)[row_index], (x, y + 42))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    canvas.save(OUTPUT / f"{CANDIDATE_REVISION}_website-header-before-after_{DATE}.png", optimize=True)


def mobile_links_sheet() -> None:
    names = (
        ("390×844 · Light", "mobile-390x844_light-ready", 450),
        ("390×844 · Dark", "mobile-390x844_dark-ready", 450),
        ("390×844 · 200-%-Reflow · Light", "mobile-reflow-200pct_light-ready", 570),
    )
    images = [
        (label, fit_width(bottom_crop(CANDIDATE / f"{CANDIDATE_REVISION}_{name}_{DATE}.png", crop), 480))
        for label, name, crop in names
    ]
    margin = 28
    gutter = 28
    column_width = 480
    top = 128
    left_height = images[0][1].height
    right_height = images[1][1].height
    reflow = images[2][1]
    canvas_width = margin * 2 + column_width * 2 + gutter
    canvas_height = top + 32 + max(left_height, right_height) + 76 + 32 + reflow.height + 28
    canvas = Image.new("RGB", (canvas_width, canvas_height), BACKGROUND)
    draw = ImageDraw.Draw(canvas)
    draw.text((margin, 22), "Mobile-App · Projekt- und Spendenhinweis", fill=TEXT, font=face(28, bold=True))
    draw.text(
        (margin, 61),
        f"Exakter Projektlink und freiwilliger PayPal-Hinweis · Kandidat {CANDIDATE_REVISION} · {DATE}",
        fill=MUTED,
        font=face(15),
    )
    draw.line((margin, 98, canvas_width - margin, 98), fill=ACCENT, width=3)
    for index, (label, image) in enumerate(images[:2]):
        x = margin + index * (column_width + gutter)
        draw.text((x, top), label, fill=ACCENT, font=face(18, bold=True))
        canvas.paste(image, (x, top + 32))
    reflow_y = top + 32 + max(left_height, right_height) + 76
    draw.text((margin, reflow_y), images[2][0], fill=ACCENT, font=face(18, bold=True))
    canvas.paste(reflow, (margin, reflow_y + 32))
    canvas.save(OUTPUT / f"{CANDIDATE_REVISION}_mobile-project-donation-links_{DATE}.png", optimize=True)


if __name__ == "__main__":
    header_sheet()
    mobile_links_sheet()
