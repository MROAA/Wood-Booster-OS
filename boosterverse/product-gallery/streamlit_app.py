import streamlit as st

from utils.products import STAGE_ORDER, Product, default_products_dir, load_products

st.set_page_config(
    page_title="Wood-Booster tuotegalleria",
    page_icon=":material/forest:",
    layout="wide",
)

STAGE_COLORS = {
    "Idea": "gray",
    "Suunnittelu": "blue",
    "Materiaalit hankittu": "blue",
    "Valmistus": "orange",
    "Pintakäsittely": "orange",
    "Valokuvaus": "violet",
    "Markkinointi": "violet",
    "Valmis": "green",
}


@st.cache_data(ttl=30, show_spinner="Ladataan tuotteita…")
def get_products(products_dir):
    return load_products(products_dir)


def filter_products(products: list[Product], search: str, categories: list[str]) -> list[Product]:
    result = products
    if categories:
        result = [p for p in result if p.category in categories]
    if search:
        needle = search.strip().lower()
        result = [
            p
            for p in result
            if needle in p.display_name.lower()
            or needle in p.idea.lower()
            or needle in p.category.lower()
        ]
    return result


def render_stage_badge(product: Product) -> None:
    if product.stage:
        st.badge(product.stage, color=STAGE_COLORS.get(product.stage, "gray"))
    else:
        st.caption("Tila ei asetettu")


def render_card(product: Product) -> None:
    with st.container(border=True):
        if product.cover_image:
            st.image(str(product.cover_image), width="stretch")
        else:
            with st.container(height=180, border=True, horizontal_alignment="center"):
                st.markdown(":material/photo_camera:")
                st.caption("Ei kuvia vielä")

        st.markdown(f"**{product.display_name}**")
        st.caption(product.category)
        if product.idea:
            preview = product.idea if len(product.idea) <= 110 else product.idea[:110] + "…"
            st.caption(preview)
        render_stage_badge(product)

        if st.button(
            "Katso lisää",
            key=f"open-{product.slug}",
            icon=":material/arrow_forward:",
            width="stretch",
        ):
            st.session_state.selected_product = product.slug
            st.rerun()


def render_grid(products: list[Product], columns_per_row: int = 3) -> None:
    for start in range(0, len(products), columns_per_row):
        row = products[start : start + columns_per_row]
        columns = st.columns(columns_per_row)
        for column, product in zip(columns, row):
            with column:
                render_card(product)


def render_detail(product: Product) -> None:
    if st.button("Takaisin galleriaan", icon=":material/arrow_back:"):
        st.session_state.selected_product = None
        st.rerun()

    st.title(product.display_name)
    with st.container(horizontal=True, vertical_alignment="center"):
        st.caption(product.category)
        render_stage_badge(product)

    if product.images:
        if len(product.images) > 1:
            tabs = st.tabs([f"Kuva {i + 1}" for i in range(len(product.images))])
            for tab, image_path in zip(tabs, product.images):
                with tab:
                    st.image(str(image_path), width="stretch")
        else:
            st.image(str(product.images[0]), width="stretch")
    else:
        with st.container(border=True, height=240, horizontal_alignment="center"):
            st.markdown(":material/photo_camera:")
            st.caption(f"Ei kuvia vielä — pudota valokuvat kansioon {product.folder / 'images'}")

    if product.idea:
        st.write(product.idea)

    key_facts = [
        ("Käyttötarkoitus", product.use_case),
        ("Asiakas", product.customer),
        ("Puulaji", product.wood_species),
        ("Epoksi", product.epoxy),
        ("Tavoitehinta", product.target_price),
        ("Arvioitu materiaalikustannus", product.estimated_material_cost),
        ("Arvioitu työaika", product.estimated_work_hours),
    ]
    key_facts = [(label, value) for label, value in key_facts if value]
    if product.dimensions:
        dims = ", ".join(f"{label}: {value}" for label, value in product.dimensions.items())
        key_facts.append(("Mitat", dims))

    if key_facts:
        columns = st.columns(min(len(key_facts), 4))
        for i, (label, value) in enumerate(key_facts):
            with columns[i % len(columns)]:
                with st.container(border=True):
                    st.caption(label)
                    st.markdown(f"**{value}**")

    if not product.has_any_detail:
        st.caption("Tämän tuotteen tiedot ovat vielä täyttämättä overview.md-tiedostossa.")

    for label, text in product.docs.items():
        with st.expander(label, icon=":material/description:"):
            st.markdown(text)


if "selected_product" not in st.session_state:
    st.session_state.selected_product = None

products_dir = default_products_dir()
products = get_products(products_dir)

with st.sidebar:
    st.caption("Wood-Booster HQ")
    st.subheader("Tuotegalleria")
    search = st.text_input(
        "Hae tuotteita",
        placeholder="Hae nimellä tai kategorialla",
        icon=":material/search:",
        label_visibility="collapsed",
    )
    categories = sorted({p.category for p in products})
    selected_categories = st.multiselect("Kategoria", categories) if categories else []
    if st.button("Päivitä", icon=":material/refresh:"):
        get_products.clear()
        st.rerun()
    st.caption(f"{len(products)} tuotetta kansiossa {products_dir}")

if not products:
    st.title("Wood-Booster tuotegalleria")
    st.info(
        f"Tuotteita ei löytynyt kansiosta {products_dir}. "
        "Lisää tuote 02-Products-kansioon overview.md-tiedoston kanssa, "
        "niin se ilmestyy tänne automaattisesti.",
        icon=":material/info:",
    )
elif st.session_state.selected_product:
    selected = next(
        (p for p in products if p.slug == st.session_state.selected_product), None
    )
    if selected:
        render_detail(selected)
    else:
        st.session_state.selected_product = None
        st.rerun()
else:
    st.title("Wood-Booster tuotegalleria")
    st.caption("Puun ehdoilla — valmiit ja tulossa olevat tuotteet yhdessä paikassa.")
    filtered = filter_products(products, search, selected_categories)
    if not filtered:
        st.caption("Ei hakuehtoja vastaavia tuotteita.")
    else:
        render_grid(filtered)
