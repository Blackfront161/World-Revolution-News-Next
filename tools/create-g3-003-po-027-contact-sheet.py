"""Render the commit-bound PO-027 mobile footer QA contact sheet.

This utility reads only the independently captured local screenshots for the
specified candidate and writes one derived evidence image.  It does not read
or modify legacy repositories, product files, or network resources.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
CANDIDATE = "f54a2993e1eca52b75c1af3ddefd48ca434716b1"
DATE = "2026-08-24"
EVIDENCE = ROOT / "docs/evidence/WRN-G3-003-PO-027/new"
OUTPUT = ROOT / "docs/evidence/WRN-G3-003-PO-027/contact-sheets"

BACKGROUND = "#0b1219"
SURFACE = "#18232e"
TEXT = "#f4f7fa"
MUTED = "#c1ccd6"
ACCENT = "#7dd3fc"


def font(size: int, *, bold: bool = False) -> ImageFont.FreeTypeFont:
    name = "arialbd.ttf" if bold else "arial.ttf"
    return ImageFont.truetype(str(Path("C:/Windows/Fonts") / name), size)


def bottom_crop(path: Path, height: int) -> Image.Image:
    with Image.open(path) as source:
        image = source.convert("RGB")
    return image.crop((0, max(0, image.height - height), image.width, image.height))


def fit_width(image: Image.Image, width: int) -> Image.Image:
    if image.width == width:
        return image
    return image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)


def main() -> None:
    specimens = (
        ("390 x 844 · Hell", "mobile-390x844_light-ready", 510),
        ("390 x 844 · Dunkel", "mobile-390x844_dark-ready", 510),
        ("390 x 844 · 200-%-Reflow · Hell", "mobile-reflow-200pct_light-ready", 900),
    )
    columns = [
        (
            label,
            fit_width(bottom_crop(EVIDENCE / f"{CANDIDATE}_{name}_{DATE}.png", crop), 350),
        )
        for label, name, crop in specimens
    ]

    margin = 28
    gutter = 22
    column_width = 350
    header_height = 170
    labels_height = 34
    body_height = max(image.height for _, image in columns)
    canvas = Image.new(
        "RGB",
        (margin * 2 + column_width * len(columns) + gutter * (len(columns) - 1), header_height + labels_height + body_height + 30),
        BACKGROUND,
    )
    draw = ImageDraw.Draw(canvas)
    draw.text((margin, 22), "Mobile-App · neutraler Spendenhinweis", fill=TEXT, font=font(27, bold=True))
    draw.text(
        (margin, 61),
        "PO-027 · sichtbarer Link: Unterstuetzen · kein sichtbares PayPal",
        fill=MUTED,
        font=font(15),
    )
    draw.text(
        (margin, 84),
        f"Kandidat {CANDIDATE} · {DATE} · keine Links aktiviert / keine externen Requests",
        fill=MUTED,
        font=font(14),
    )
    draw.rounded_rectangle((margin, 112, canvas.width - margin, 144), radius=8, fill=SURFACE)
    draw.text(
        (margin + 12, 120),
        "Pruefkriterium: neutraler Leaving-App-Hinweis vollstaendig lesbar, kein Anbietername sichtbar.",
        fill=ACCENT,
        font=font(14, bold=True),
    )

    for index, (label, image) in enumerate(columns):
        x = margin + index * (column_width + gutter)
        draw.text((x, header_height), label, fill=ACCENT, font=font(16, bold=True))
        canvas.paste(image, (x, header_height + labels_height))

    OUTPUT.mkdir(parents=True, exist_ok=True)
    canvas.save(
        OUTPUT / f"{CANDIDATE}_mobile-neutral-donation-copy_{DATE}.png",
        optimize=True,
    )


if __name__ == "__main__":
    main()
