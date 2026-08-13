"""Loads product data from the 02-Products markdown templates.

Each product lives in its own folder (e.g. 02-Products/River-Tables/Aurora-Table/)
with a fixed set of template files: overview.md, materials.md, costs.md,
marketing.md, design.md, work-steps.md, lessons-learned.md. This module reads
those files and turns them into structured Product objects the UI can render,
without requiring every field to be filled in.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass, field
from pathlib import Path

IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")

OVERVIEW_FIELD_MAP = {
    "Tuotteen nimi": "name",
    "Tuotteen idea": "idea",
    "Käyttötarkoitus": "use_case",
    "Asiakas": "customer",
    "Puulaji": "wood_species",
    "Epoksi": "epoxy",
    "Muotoilun pääidea": "design_idea",
    "Tavoitehinta": "target_price",
    "Arvioitu materiaalikustannus": "estimated_material_cost",
    "Arvioitu työaika": "estimated_work_hours",
}

STAGE_ORDER = [
    "Idea",
    "Suunnittelu",
    "Materiaalit hankittu",
    "Valmistus",
    "Pintakäsittely",
    "Valokuvaus",
    "Markkinointi",
    "Valmis",
]

DETAIL_DOCS = {
    "materials.md": "Materiaalit",
    "costs.md": "Kustannukset",
    "design.md": "Suunnittelu",
    "work-steps.md": "Työvaiheet",
    "lessons-learned.md": "Opitut asiat",
    "marketing.md": "Markkinointi",
}


@dataclass
class Product:
    slug: str
    category: str
    folder: Path
    name: str = ""
    idea: str = ""
    use_case: str = ""
    customer: str = ""
    dimensions: dict[str, str] = field(default_factory=dict)
    wood_species: str = ""
    epoxy: str = ""
    design_idea: str = ""
    target_price: str = ""
    estimated_material_cost: str = ""
    estimated_work_hours: str = ""
    stage: str | None = None
    images: list[Path] = field(default_factory=list)
    docs: dict[str, str] = field(default_factory=dict)

    @property
    def display_name(self) -> str:
        return self.name.strip() or self.slug.replace("-", " ")

    @property
    def cover_image(self) -> Path | None:
        return self.images[0] if self.images else None

    @property
    def has_any_detail(self) -> bool:
        return any(
            [
                self.idea,
                self.use_case,
                self.customer,
                self.wood_species,
                self.epoxy,
                self.design_idea,
                self.target_price,
            ]
        )


def _split_sections(text: str) -> dict[str, str]:
    """Splits a template markdown file into {heading: body} on '## ' headings."""
    sections: dict[str, str] = {}
    current_key = None
    buffer: list[str] = []
    for line in text.splitlines():
        match = re.match(r"^##\s+(.*)", line)
        if match:
            if current_key is not None:
                sections[current_key] = "\n".join(buffer).strip()
            current_key = match.group(1).strip()
            buffer = []
        else:
            buffer.append(line)
    if current_key is not None:
        sections[current_key] = "\n".join(buffer).strip()
    return sections


def _parse_dimensions(block: str) -> dict[str, str]:
    dims: dict[str, str] = {}
    for line in block.splitlines():
        match = re.match(r"-\s*([^:]+):\s*(.*)", line.strip())
        if match:
            label, value = match.group(1).strip(), match.group(2).strip()
            if value:
                dims[label] = value
    return dims


def _parse_stage(block: str) -> str | None:
    checked = [
        line.split("]", 1)[1].strip()
        for line in block.splitlines()
        if re.match(r"-\s*\[[xX]\]", line.strip())
    ]
    if not checked:
        return None
    for stage in reversed(STAGE_ORDER):
        if stage in checked:
            return stage
    return checked[-1]


def _load_overview(product: Product, overview_path: Path) -> None:
    text = overview_path.read_text(encoding="utf-8")
    sections = _split_sections(text)

    for heading, attr in OVERVIEW_FIELD_MAP.items():
        value = sections.get(heading, "").strip()
        if value:
            setattr(product, attr, value)

    product.dimensions = _parse_dimensions(sections.get("Mitat", ""))
    product.stage = _parse_stage(sections.get("Projektin tila", ""))


def _load_images(product: Product) -> None:
    images_dir = product.folder / "images"
    if not images_dir.is_dir():
        return
    product.images = sorted(
        p for p in images_dir.iterdir() if p.suffix.lower() in IMAGE_EXTENSIONS
    )


def _load_docs(product: Product) -> None:
    for filename, label in DETAIL_DOCS.items():
        doc_path = product.folder / filename
        if not doc_path.exists():
            continue
        text = doc_path.read_text(encoding="utf-8").strip()
        if text:
            product.docs[label] = text


def default_products_dir() -> Path:
    """Resolves 02-Products in the sibling Wood-Booster-AI repo checkout.

    Overridable via WOOD_BOOSTER_PRODUCTS_DIR since this plugin lives in the
    separate Wood-Booster-OS repo, not inside Wood-Booster-AI itself.
    """
    override = os.environ.get("WOOD_BOOSTER_PRODUCTS_DIR")
    if override:
        return Path(override).expanduser()
    return Path(__file__).resolve().parents[4] / "02-Products"


def load_products(products_dir: Path | None = None) -> list[Product]:
    root = products_dir or default_products_dir()
    if not root.is_dir():
        return []

    products: list[Product] = []
    for category_dir in sorted(p for p in root.iterdir() if p.is_dir()):
        for product_dir in sorted(p for p in category_dir.iterdir() if p.is_dir()):
            overview_path = product_dir / "overview.md"
            if not overview_path.exists():
                continue
            product = Product(
                slug=product_dir.name,
                category=category_dir.name.replace("-", " "),
                folder=product_dir,
            )
            _load_overview(product, overview_path)
            _load_images(product)
            _load_docs(product)
            products.append(product)

    return products
