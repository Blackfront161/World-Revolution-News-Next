#!/usr/bin/env python3
"""Create labelled PNG contact sheets from local WRN-G3-005 screenshots.

Pillow is bundled with the approved local runtime. The script never accesses a
network, modifies product files, or depends on downloaded tooling.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "arial.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--title", required=True)
    parser.add_argument("images", nargs="+", type=Path)
    args = parser.parse_args()

    cell_width, image_height, label_height, gutter, header = 420, 270, 46, 24, 92
    columns = 2
    rows = (len(args.images) + columns - 1) // columns
    width = columns * cell_width + (columns + 1) * gutter
    height = header + rows * (image_height + label_height + gutter) + gutter
    sheet = Image.new("RGB", (width, height), "#0d1017")
    draw = ImageDraw.Draw(sheet)
    draw.text((gutter, 18), args.title, fill="#ffffff", font=font(22, bold=True))
    draw.text(
        (gutter, 52),
        f"{len(args.images)} beschriftete lokale Belege",
        fill="#b9c4dd",
        font=font(14),
    )
    for index, image_path in enumerate(args.images):
        x = gutter + (index % columns) * (cell_width + gutter)
        y = header + gutter + (index // columns) * (image_height + label_height + gutter)
        draw.rounded_rectangle(
            (x, y, x + cell_width, y + image_height + label_height),
            radius=10,
            fill="#171b26",
            outline="#7f8ba6",
        )
        with Image.open(image_path) as source:
            preview = source.convert("RGB")
            preview.thumbnail((cell_width - 16, image_height - 16))
            offset_x = x + (cell_width - preview.width) // 2
            offset_y = y + 8
            sheet.paste(preview, (offset_x, offset_y))
        label = image_path.stem.split("_", 1)[-1]
        draw.text((x + 10, y + image_height + 12), label, fill="#f4f6fb", font=font(11))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(args.output, format="PNG", optimize=True)


if __name__ == "__main__":
    main()
