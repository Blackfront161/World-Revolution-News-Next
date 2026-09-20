"""Create deterministic WRN-G3-003 visual acceptance contact sheets.

The script uses only committed baseline screenshots and commit-bound candidate
screenshots. It never opens or modifies either legacy repository.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


BACKGROUND = "#0b1219"
SURFACE = "#18232e"
TEXT = "#f4f7fa"
MUTED = "#c1ccd6"
ACCENT = "#7dd3fc"


@dataclass(frozen=True)
class ComparisonRow:
    label: str
    viewport_height: int
    legacy_path: Path
    candidate_path: Path


def font(size: int, *, bold: bool = False) -> ImageFont.FreeTypeFont:
    filename = "arialbd.ttf" if bold else "arial.ttf"
    return ImageFont.truetype(str(Path("C:/Windows/Fonts") / filename), size)


def crop_viewport(path: Path, viewport_height: int) -> Image.Image:
    with Image.open(path) as source:
        image = source.convert("RGB")
    return image.crop((0, 0, image.width, min(viewport_height, image.height)))


def fit_width(image: Image.Image, maximum_width: int) -> Image.Image:
    if image.width <= maximum_width:
        return image
    height = round(image.height * maximum_width / image.width)
    return image.resize((maximum_width, height), Image.Resampling.LANCZOS)


def draw_title(draw: ImageDraw.ImageDraw, title: str, subtitle: str, width: int) -> int:
    draw.text((32, 24), title, fill=TEXT, font=font(28, bold=True))
    draw.text((32, 62), subtitle, fill=MUTED, font=font(17))
    draw.line((32, 94, width - 32, 94), fill=ACCENT, width=3)
    return 116


def comparison_sheet(
    rows: list[ComparisonRow], output: Path, title: str, revision: str
) -> None:
    column_width = 620
    gutter = 28
    canvas_width = 32 + column_width * 2 + gutter + 32
    rendered: list[tuple[ComparisonRow, Image.Image, Image.Image]] = []
    total_height = 116

    for row in rows:
        legacy = fit_width(crop_viewport(row.legacy_path, row.viewport_height), 600)
        candidate = fit_width(crop_viewport(row.candidate_path, row.viewport_height), 600)
        rendered.append((row, legacy, candidate))
        total_height += 72 + max(legacy.height, candidate.height) + 34

    canvas = Image.new("RGB", (canvas_width, total_height), BACKGROUND)
    draw = ImageDraw.Draw(canvas)
    y = draw_title(
        draw,
        title,
        f"Alt links · neuer lokaler Slice rechts · Kandidat {revision} · 23.08.2026",
        canvas_width,
    )

    for row, legacy, candidate in rendered:
        draw.text((32, y), row.label, fill=ACCENT, font=font(22, bold=True))
        draw.text((32, y + 32), "ALT · unveraenderte Referenz", fill=MUTED, font=font(16))
        draw.text(
            (32 + column_width + gutter, y + 32),
            "NEU · lokale Marken-/Design-Slice-Vorschau",
            fill=MUTED,
            font=font(16),
        )
        y += 66
        canvas.paste(legacy, (32, y))
        canvas.paste(candidate, (32 + column_width + gutter, y))
        y += max(legacy.height, candidate.height) + 34

    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output, format="PNG", optimize=True)


def state_sheet(
    source_dir: Path, output: Path, client: str, revision: str, viewport_height: int = 844
) -> None:
    states = ["loading", "empty", "error", "offline", "optional-absent"]
    labels = ["Laden", "Leer", "Fehler", "Offline", "Ohne Medien"]
    target_width = 220
    gutter = 18
    margin = 28
    images: list[Image.Image] = []

    for state in states:
        path = source_dir / f"{revision}_{client}-390x844_dark-{state}_2026-08-23.png"
        images.append(fit_width(crop_viewport(path, viewport_height), target_width))

    canvas_width = margin * 2 + target_width * len(images) + gutter * (len(images) - 1)
    canvas_height = 146 + max(image.height for image in images) + 28
    canvas = Image.new("RGB", (canvas_width, canvas_height), BACKGROUND)
    draw = ImageDraw.Draw(canvas)
    y = draw_title(
        draw,
        f"{client.capitalize()} · lokale Zustandsmatrix",
        f"Alle Zustaende ohne Livequelle · Kandidat {revision} · Dark · 390×844",
        canvas_width,
    )

    for index, (label, image) in enumerate(zip(labels, images, strict=True)):
        x = margin + index * (target_width + gutter)
        draw.rounded_rectangle(
            (x, y, x + target_width, y + 34), radius=7, fill=SURFACE, outline=ACCENT, width=2
        )
        text_bounds = draw.textbbox((0, 0), label, font=font(16, bold=True))
        text_width = text_bounds[2] - text_bounds[0]
        draw.text(
            (x + (target_width - text_width) / 2, y + 8),
            label,
            fill=TEXT,
            font=font(16, bold=True),
        )
        canvas.paste(image, (x, y + 44))

    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output, format="PNG", optimize=True)


def mobile_web_sheet(source_dir: Path, output: Path, revision: str) -> None:
    """Compare the two new clients at the same mobile viewport without a legacy claim."""
    column_width = 620
    gutter = 28
    canvas_width = 32 + column_width * 2 + gutter + 32
    mobile = fit_width(
        crop_viewport(
            source_dir / f"{revision}_mobile-390x844_dark-ready_2026-08-23.png", 844
        ),
        600,
    )
    website = fit_width(
        crop_viewport(
            source_dir / f"{revision}_website-390x844_dark-ready_2026-08-23.png", 844
        ),
        600,
    )
    canvas_height = 116 + 66 + max(mobile.height, website.height) + 34
    canvas = Image.new("RGB", (canvas_width, canvas_height), BACKGROUND)
    draw = ImageDraw.Draw(canvas)
    y = draw_title(
        draw,
        "WRN · Mobile-vs.-Website",
        f"Gleiche Marke, getrennte Kompositionen · Kandidat {revision} · 23.08.2026",
        canvas_width,
    )
    draw.text((32, y), "Smartphone 390×844 · Dark / Ready", fill=ACCENT, font=font(22, bold=True))
    draw.text((32, y + 32), "MOBILE · App-Vorschau", fill=MUTED, font=font(16))
    draw.text(
        (32 + column_width + gutter, y + 32),
        "WEBSITE · responsive Vorschau",
        fill=MUTED,
        font=font(16),
    )
    y += 66
    canvas.paste(mobile, (32, y))
    canvas.paste(website, (32 + column_width + gutter, y))
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output, format="PNG", optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--revision", required=True)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()

    root = args.root.resolve()
    revision = args.revision
    candidate = root / "docs/evidence/WRN-G3-003/new"
    output = root / "docs/evidence/WRN-G3-003/contact-sheets"

    comparison_sheet(
        [
            ComparisonRow(
                "Mobile · Smartphone 390×844 · Dark / Feed",
                844,
                root / "docs/evidence/WRN-G1-002/app-390x844-feed.png",
                candidate / f"{revision}_mobile-390x844_dark-ready_2026-08-23.png",
            ),
            ComparisonRow(
                "Mobile · Tablet 600×960 · Dark / Feed",
                960,
                root / "docs/evidence/WRN-G1-002/app-600x960-feed.png",
                candidate / f"{revision}_mobile-600x960_dark-ready_2026-08-23.png",
            ),
        ],
        output / f"{revision}_comparison-mobile_2026-08-23.png",
        "WRN Mobile · Alt-vs.-Neu",
        revision,
    )

    comparison_sheet(
        [
            ComparisonRow(
                "Website · Smartphone 390×844 · Dark / Feed",
                844,
                root
                / "docs/evidence/WRN-G1-006/WRN-G1-006_9a59b17_390x844_dark-feed_2026-08-21.png",
                candidate / f"{revision}_website-390x844_dark-ready_2026-08-23.png",
            ),
            ComparisonRow(
                "Website · Tablet 800×1280 · Dark / Feed",
                1280,
                root
                / "docs/evidence/WRN-G1-006/WRN-G1-006_9a59b17_800x1280_dark-feed_2026-08-21.png",
                candidate / f"{revision}_website-800x1280_dark-ready_2026-08-23.png",
            ),
            ComparisonRow(
                "Website · Desktop 1440×900 · Dark / Feed",
                900,
                root
                / "docs/evidence/WRN-G1-006/WRN-G1-006_9a59b17_1440x900_dark-feed-desktop_2026-08-21.png",
                candidate / f"{revision}_website-1440x900_dark-ready_2026-08-23.png",
            ),
        ],
        output / f"{revision}_comparison-website_2026-08-23.png",
        "WRN Website · Alt-vs.-Neu",
        revision,
    )

    mobile_web_sheet(
        candidate,
        output / f"{revision}_mobile-vs-website_2026-08-23.png",
        revision,
    )

    state_sheet(
        candidate,
        output / f"{revision}_states-mobile_2026-08-23.png",
        "mobile",
        revision,
    )
    state_sheet(
        candidate,
        output / f"{revision}_states-website_2026-08-23.png",
        "website",
        revision,
    )


if __name__ == "__main__":
    main()
