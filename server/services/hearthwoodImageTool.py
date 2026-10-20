"""
Hearthwood Dev Studio
Spacemonkey Image Studio V1

Turvallinen kuvankäsittelytyökalu.

Toiminnot:
- inspect: kuvan tietojen lukeminen
- resize: kuvakoon muuttaminen
- png: PNG-version luominen

Alkuperäistä kuvaa ei koskaan muuteta.
"""

import argparse
import json
import secrets
import sys
from pathlib import Path

from PIL import Image, ImageOps, UnidentifiedImageError


PROJECT_ROOT = Path(__file__).resolve().parents[2]

SOURCE_DIRS = [
    PROJECT_ROOT / "src" / "assets",
    PROJECT_ROOT / "public",
]

PREVIEW_DIR = (
    PROJECT_ROOT / ".hearthwood-media" / "previews"
)

SUPPORTED_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
}

MAX_FILE_BYTES = 20 * 1024 * 1024
MAX_PIXELS = 20_000_000
MAX_DIMENSION = 4096

Image.MAX_IMAGE_PIXELS = MAX_PIXELS


def resolve_source(filename):
    source = (PROJECT_ROOT / filename).resolve(
        strict=True
    )

    allowed = any(
        source.is_relative_to(directory.resolve())
        for directory in SOURCE_DIRS
        if directory.exists()
    )

    if not allowed:
        raise ValueError(
            "Kuva ei sijaitse sallitussa Hearthwood-kansiossa."
        )

    if not source.is_file():
        raise ValueError("Kuvatiedostoa ei löydy.")

    if source.suffix.lower() not in SUPPORTED_EXTENSIONS:
        raise ValueError("Kuvatiedostomuotoa ei tueta.")

    if source.stat().st_size > MAX_FILE_BYTES:
        raise ValueError("Kuvatiedosto on liian suuri.")

    return source


def read_image(source):
    with Image.open(source) as original:
        if original.width * original.height > MAX_PIXELS:
            raise ValueError("Kuvan pikselimäärä on liian suuri.")

        original.load()

        image = ImageOps.exif_transpose(original)

        if image.mode not in ("RGB", "RGBA"):
            if "A" in image.getbands():
                image = image.convert("RGBA")
            else:
                image = image.convert("RGB")

        return image.copy()


def image_info(image, source):
    return {
        "success": True,
        "source": str(source.relative_to(PROJECT_ROOT)),
        "width": image.width,
        "height": image.height,
        "mode": image.mode,
        "format": source.suffix.lower(),
    }


def save_preview(image, source):
    PREVIEW_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_name = (
        f"{source.stem}-"
        f"{secrets.token_hex(6)}.png"
    )

    output_path = PREVIEW_DIR / output_name

    image.save(
        output_path,
        format="PNG",
        optimize=True,
    )

    return str(
        output_path.relative_to(PROJECT_ROOT)
    )


def process_image(args):
    source = resolve_source(args.source)
    image = read_image(source)

    if args.action == "inspect":
        return image_info(image, source)

    if args.action == "resize":
        width = args.width
        height = args.height

        if not (
            1 <= width <= MAX_DIMENSION
            and 1 <= height <= MAX_DIMENSION
        ):
            raise ValueError(
                "Kuvakoon pitää olla 1–4096 pikseliä."
            )

        image.thumbnail(
            (width, height),
            Image.Resampling.LANCZOS,
        )

    output = save_preview(image, source)

    return {
        "success": True,
        "action": args.action,
        "source": str(source.relative_to(PROJECT_ROOT)),
        "preview": output,
        "width": image.width,
        "height": image.height,
        "format": "PNG",
        "original_preserved": True,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Spacemonkey Image Studio"
    )

    parser.add_argument(
        "action",
        choices=["inspect", "resize", "png"],
    )

    parser.add_argument("source")

    parser.add_argument(
        "--width",
        type=int,
        default=512,
    )

    parser.add_argument(
        "--height",
        type=int,
        default=512,
    )

    args = parser.parse_args()

    try:
        result = process_image(args)
        print(json.dumps(result, ensure_ascii=False))

    except (
        ValueError,
        OSError,
        UnidentifiedImageError,
        Image.DecompressionBombError,
    ) as error:
        print(
            json.dumps({
                "success": False,
                "error": str(error),
            }, ensure_ascii=False)
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
