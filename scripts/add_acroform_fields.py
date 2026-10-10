#!/usr/bin/env python3
"""Add AcroForm fields on top of the original Elevate Fitness client form.

The original PDF is the visual layer for sections 2-9. Section 1 is redrawn with
labels above boxed fields, then the following sections are shifted so they are
not cropped. Interactive fields are aligned on that layout.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import pymupdf
from pymupdf import mupdf

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "original" / "Elevate_Fitness_Formulaire_Client.pdf"
DEFAULT_OUTPUT = ROOT / "Elevate-Formulaire-Evaluation-Client-remplissable.pdf"

PAGE_W, PAGE_H = 595.276, 841.89
TEXT_SIZE = 9.0
TEXT_COLOR = (0, 0, 0)
CHECK_INSET = 0.2
RADIO_FLAGS = (
    pymupdf.PDF_BTN_FIELD_IS_RADIO | pymupdf.PDF_BTN_FIELD_IS_NO_TOGGLE_TO_OFF
)
MM = 72.0 / 25.4
GOLD = (0.839, 0.631, 0.231)
FIELD_BORDER = (0.66, 0.56, 0.40)
MARGIN_LEFT = 48.52
MARGIN_RIGHT = 546.76
CONTENT_WIDTH = MARGIN_RIGHT - MARGIN_LEFT
FIELD_H = 9.0 * MM
PROFESSION_H = 16.0 * MM
LABEL_BAND = 11.0
LABEL_TO_FIELD = 2.0
ROW_GAP = 9.0
COL_GAP = 8.0
SECTION_GAP = 18.0
SECTION2_SRC_Y0 = 269.23
SECTION3_SRC_Y0 = 514.23
SECTION3_SRC_Y1 = 800.0
PAGE2_SRC_Y0 = 36.54
PAGE2_SRC_Y1 = 486.0
FOOTER_TOP = 811.0
WIDGET_INSET = 0.5


def R(x0: float, y0: float, x1: float, y1: float) -> pymupdf.Rect:
    return pymupdf.Rect(x0, y0, x1, y1)


def square(x0: float, y0: float, x1: float = None, y1: float = None) -> pymupdf.Rect:
    if x1 is None:
        x1 = x0 + 9.07
        y1 = y0 + 9.07
    return pymupdf.Rect(
        x0 + CHECK_INSET,
        y0 + CHECK_INSET,
        x1 - CHECK_INSET,
        y1 - CHECK_INSET,
    )


def scale_box(x0: float, y0: float, x1: float, y1: float) -> pymupdf.Rect:
    """Square-ish hit target centered on a printed 1-10 digit."""
    cx = (x0 + x1) / 2.0
    cy = (y0 + y1) / 2.0
    half_w = max((x1 - x0) / 2.0 + 0.9, 4.55)
    half_h = 4.55
    return pymupdf.Rect(cx - half_w, cy - half_h, cx + half_w, cy + half_h)


def shift_y(y: float, dy: float) -> float:
    return y + dy


def shift_rect(rect: pymupdf.Rect, dy: float) -> pymupdf.Rect:
    return R(rect.x0, rect.y0 + dy, rect.x1, rect.y1 + dy)


def _columns(fractions: list[float]) -> list[tuple[float, float]]:
    usable = CONTENT_WIDTH - COL_GAP * (len(fractions) - 1)
    x = MARGIN_LEFT
    cols = []
    for frac in fractions:
        w = usable * frac
        cols.append((x, x + w))
        x += w + COL_GAP
    return cols


def _draw_label(page: pymupdf.Page, x: float, y: float, text: str) -> None:
    page.insert_text((x, y + 8.5), text, fontsize=8, fontname="hebo", color=(0.12, 0.12, 0.12))


def _field_rect(x0: float, x1: float, y: float, height: float) -> pymupdf.Rect:
    return R(x0, y, x1, y + height)


def _draw_field_box(page: pymupdf.Page, rect: pymupdf.Rect) -> pymupdf.Rect:
    """Draw a print-visible box and return a slightly inset widget hit area."""
    page.draw_rect(rect, color=FIELD_BORDER, fill=(1, 1, 1), width=0.6)
    return R(
        rect.x0 + WIDGET_INSET,
        rect.y0 + WIDGET_INSET,
        rect.x1 - WIDGET_INSET,
        rect.y1 - WIDGET_INSET,
    )


IDENTITY_LABELS_FR = {
    "nom_complet": "Nom complet",
    "courriel": "Courriel",
    "telephone": "Téléphone",
    "date_naissance": "Date de naissance (JJ/MM/AAAA)",
    "age": "Âge",
    "profession": "Profession / rythme de travail",
    "taille": "Taille",
    "poids_actuel": "Poids actuel",
    "poids_vise": "Poids visé (facultatif)",
}


def draw_identity_section(
    page: pymupdf.Page, labels: dict[str, str] | None = None
) -> tuple[dict[str, pymupdf.Rect], float]:
    """Redraw section 1 with labels above boxed fields. Returns widget rects and end y."""
    labels = labels or IDENTITY_LABELS_FR
    y = 178.0
    rects: dict[str, pymupdf.Rect] = {}

    _draw_label(page, MARGIN_LEFT, y, labels["nom_complet"])
    y += LABEL_BAND + LABEL_TO_FIELD
    rects["nom_complet"] = _draw_field_box(page, _field_rect(MARGIN_LEFT, MARGIN_RIGHT, y, FIELD_H))
    y += FIELD_H + ROW_GAP

    _draw_label(page, MARGIN_LEFT, y, labels["courriel"])
    y += LABEL_BAND + LABEL_TO_FIELD
    rects["courriel"] = _draw_field_box(page, _field_rect(MARGIN_LEFT, MARGIN_RIGHT, y, FIELD_H))
    y += FIELD_H + ROW_GAP

    (tel_x0, tel_x1), (dob_x0, dob_x1), (age_x0, age_x1) = _columns([0.42, 0.40, 0.18])
    row_y = y
    _draw_label(page, tel_x0, row_y, labels["telephone"])
    _draw_label(page, dob_x0, row_y, labels["date_naissance"])
    _draw_label(page, age_x0, row_y, labels["age"])
    y += LABEL_BAND + LABEL_TO_FIELD
    rects["telephone"] = _draw_field_box(page, _field_rect(tel_x0, tel_x1, y, FIELD_H))
    rects["date_naissance"] = _draw_field_box(page, _field_rect(dob_x0, dob_x1, y, FIELD_H))
    rects["age"] = _draw_field_box(page, _field_rect(age_x0, age_x1, y, FIELD_H))
    y += FIELD_H + ROW_GAP

    _draw_label(page, MARGIN_LEFT, y, labels["profession"])
    y += LABEL_BAND + LABEL_TO_FIELD
    rects["profession"] = _draw_field_box(
        page, _field_rect(MARGIN_LEFT, MARGIN_RIGHT, y, PROFESSION_H)
    )
    y += PROFESSION_H + ROW_GAP

    (t_x0, t_x1), (p_x0, p_x1), (v_x0, v_x1) = _columns([1 / 3, 1 / 3, 1 / 3])
    row_y = y
    _draw_label(page, t_x0, row_y, labels["taille"])
    _draw_label(page, p_x0, row_y, labels["poids_actuel"])
    _draw_label(page, v_x0, row_y, labels["poids_vise"])
    y += LABEL_BAND + LABEL_TO_FIELD
    rects["taille"] = _draw_field_box(page, _field_rect(t_x0, t_x1, y, FIELD_H))
    rects["poids_actuel"] = _draw_field_box(page, _field_rect(p_x0, p_x1, y, FIELD_H))
    rects["poids_vise"] = _draw_field_box(page, _field_rect(v_x0, v_x1, y, FIELD_H))
    y += FIELD_H + SECTION_GAP
    return rects, y


def identity_section_end() -> float:
    y = 178.0
    standard = LABEL_BAND + LABEL_TO_FIELD + FIELD_H + ROW_GAP
    y += standard * 3
    y += LABEL_BAND + LABEL_TO_FIELD + PROFESSION_H + ROW_GAP
    y += LABEL_BAND + LABEL_TO_FIELD + FIELD_H + SECTION_GAP
    return y


def relayout_pages(doc: pymupdf.Document, source: pymupdf.Document, section1_end: float) -> dict:
    """Keep other sections intact, but move them so section 1 does not overlap."""
    s2_h = SECTION3_SRC_Y0 - SECTION2_SRC_Y0
    s3_h = SECTION3_SRC_Y1 - SECTION3_SRC_Y0
    p2_h = PAGE2_SRC_Y1 - PAGE2_SRC_Y0
    s2_dest = section1_end
    s3_dest = 36.5
    s4_dest = s3_dest + s3_h + 12.0
    if s2_dest + s2_h > FOOTER_TOP:
        raise RuntimeError("Section 2 would overflow page 1")
    if s4_dest + p2_h > FOOTER_TOP:
        raise RuntimeError("Sections 3-4 would overflow page 2")

    page1 = doc[0]
    page1.add_redact_annot(R(0, 174.6, PAGE_W, FOOTER_TOP), fill=(1, 1, 1))
    page1.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE)
    page1.show_pdf_page(
        R(0, s2_dest, PAGE_W, s2_dest + s2_h),
        source,
        0,
        clip=R(0, SECTION2_SRC_Y0, PAGE_W, SECTION3_SRC_Y0),
    )

    page2 = doc[1]
    page2.add_redact_annot(R(0, 0, PAGE_W, FOOTER_TOP), fill=(1, 1, 1))
    page2.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE)
    page2.show_pdf_page(
        R(0, s3_dest, PAGE_W, s3_dest + s3_h),
        source,
        0,
        clip=R(0, SECTION3_SRC_Y0, PAGE_W, SECTION3_SRC_Y1),
    )
    page2.show_pdf_page(
        R(0, s4_dest, PAGE_W, s4_dest + p2_h),
        source,
        1,
        clip=R(0, PAGE2_SRC_Y0, PAGE_W, PAGE2_SRC_Y1),
    )
    return {
        "s2_dy": s2_dest - SECTION2_SRC_Y0,
        "s3_dy": s3_dest - SECTION3_SRC_Y0,
        "p2_dy": s4_dest - PAGE2_SRC_Y0,
    }


def add_text(
    page: pymupdf.Page,
    name: str,
    rect: pymupdf.Rect,
    *,
    multiline: bool = False,
    fontsize: float = TEXT_SIZE,
    tooltip: str | None = None,
    maxlen: int = 0,
    boxed: bool = False,
) -> None:
    widget = pymupdf.Widget()
    widget.field_type = pymupdf.PDF_WIDGET_TYPE_TEXT
    widget.field_name = name
    widget.field_label = tooltip or name
    widget.rect = rect
    widget.field_flags = pymupdf.PDF_TX_FIELD_IS_MULTILINE if multiline else 0
    widget.field_flags |= pymupdf.PDF_TX_FIELD_IS_DO_NOT_SPELL_CHECK
    widget.text_fontsize = fontsize
    widget.text_font = "Helv"
    widget.text_color = TEXT_COLOR
    widget.text_maxlen = maxlen
    if boxed:
        # Page content already draws the print-visible box; keep the widget
        # fill white and a hairline so Acrobat still highlights the field.
        widget.border_width = 0.4
        widget.border_color = FIELD_BORDER
        widget.fill_color = (1, 1, 1)
        widget.border_style = "S"
    else:
        widget.border_width = 0
        widget.border_color = None
        widget.fill_color = None
    widget.field_value = ""
    page.add_widget(widget)


def add_checkbox(
    page: pymupdf.Page,
    name: str,
    rect: pymupdf.Rect,
    *,
    tooltip: str | None = None,
) -> None:
    widget = pymupdf.Widget()
    widget.field_type = pymupdf.PDF_WIDGET_TYPE_CHECKBOX
    widget.field_name = name
    widget.field_label = tooltip or name
    widget.rect = rect
    widget.border_width = 0
    widget.border_color = None
    widget.fill_color = None
    widget.text_color = TEXT_COLOR
    widget.field_value = "Off"
    page.add_widget(widget)


def add_radio_option(
    page: pymupdf.Page,
    groups: dict[str, list[tuple[int, str]]],
    group: str,
    on_value: str,
    rect: pymupdf.Rect,
    *,
    tooltip: str | None = None,
) -> None:
    widget = pymupdf.Widget()
    widget.field_type = pymupdf.PDF_WIDGET_TYPE_CHECKBOX
    widget.field_name = f"__rb.{group}.{on_value}"
    widget.field_label = tooltip or f"{group}={on_value}"
    widget.rect = rect
    widget.border_width = 0
    widget.border_color = None
    widget.fill_color = None
    widget.text_color = TEXT_COLOR
    widget.field_value = "Off"
    annot = page.add_widget(widget)
    groups.setdefault(group, []).append((annot.xref, on_value))


def add_signature(
    page: pymupdf.Page,
    name: str,
    rect: pymupdf.Rect,
    *,
    tooltip: str = "Signature",
) -> None:
    widget = pymupdf.Widget()
    widget.field_type = pymupdf.PDF_WIDGET_TYPE_SIGNATURE
    widget.field_name = name
    widget.field_label = tooltip
    widget.rect = rect
    widget.border_width = 0
    widget.border_color = None
    widget.fill_color = None
    page.add_widget(widget)


def _pdf(doc: pymupdf.Document):
    return pymupdf._as_pdf_document(doc)


def _obj(doc: pymupdf.Document, xref: int):
    return mupdf.pdf_load_object(_pdf(doc), xref)


def _ensure_form_fonts(pdf, form) -> None:
    """Register Helvetica and ZapfDingbats in AcroForm /DR for Acrobat Reader."""
    helv = mupdf.pdf_new_dict(pdf, 4)
    mupdf.pdf_dict_put(helv, mupdf.PDF_ENUM_NAME_Type, mupdf.PDF_ENUM_NAME_Font)
    mupdf.pdf_dict_put(helv, mupdf.PDF_ENUM_NAME_Subtype, mupdf.PDF_ENUM_NAME_Type1)
    mupdf.pdf_dict_put_name(helv, mupdf.PDF_ENUM_NAME_BaseFont, "Helvetica")
    mupdf.pdf_dict_put_name(helv, mupdf.PDF_ENUM_NAME_Encoding, "WinAnsiEncoding")
    helv_ref = mupdf.pdf_add_object(pdf, helv)

    zadb = mupdf.pdf_new_dict(pdf, 3)
    mupdf.pdf_dict_put(zadb, mupdf.PDF_ENUM_NAME_Type, mupdf.PDF_ENUM_NAME_Font)
    mupdf.pdf_dict_put(zadb, mupdf.PDF_ENUM_NAME_Subtype, mupdf.PDF_ENUM_NAME_Type1)
    mupdf.pdf_dict_put_name(zadb, mupdf.PDF_ENUM_NAME_BaseFont, "ZapfDingbats")
    zadb_ref = mupdf.pdf_add_object(pdf, zadb)

    font_dict = mupdf.pdf_new_dict(pdf, 2)
    mupdf.pdf_dict_put(font_dict, mupdf.pdf_new_name("Helv"), helv_ref)
    mupdf.pdf_dict_put(font_dict, mupdf.pdf_new_name("ZaDb"), zadb_ref)
    dr = mupdf.pdf_new_dict(pdf, 1)
    mupdf.pdf_dict_put(dr, mupdf.PDF_ENUM_NAME_Font, font_dict)
    mupdf.pdf_dict_put(form, mupdf.PDF_ENUM_NAME_DR, dr)


def finalize_radio_groups(
    doc: pymupdf.Document, groups: dict[str, list[tuple[int, str]]]
) -> None:
    pdf = _pdf(doc)
    kidset: set[int] = set()
    parent_xrefs: list[int] = []

    for group_name, kids in groups.items():
        if not kids:
            continue
        parent = mupdf.pdf_new_dict(pdf, 8)
        mupdf.pdf_dict_put(parent, mupdf.PDF_ENUM_NAME_FT, mupdf.PDF_ENUM_NAME_Btn)
        mupdf.pdf_dict_put_int(parent, mupdf.PDF_ENUM_NAME_Ff, RADIO_FLAGS)
        mupdf.pdf_dict_put_text_string(parent, mupdf.PDF_ENUM_NAME_T, group_name)
        mupdf.pdf_dict_put_name(parent, mupdf.PDF_ENUM_NAME_V, "Off")
        mupdf.pdf_dict_put_name(parent, mupdf.PDF_ENUM_NAME_DV, "Off")
        kids_arr = mupdf.pdf_new_array(pdf, len(kids))
        for xref, _on in kids:
            mupdf.pdf_array_push(kids_arr, mupdf.pdf_new_indirect(pdf, xref, 0))
        mupdf.pdf_dict_put(parent, mupdf.PDF_ENUM_NAME_Kids, kids_arr)
        parent_ind = mupdf.pdf_add_object(pdf, parent)
        parent_xref = parent_ind.pdf_to_num()
        parent_xrefs.append(parent_xref)

        for xref, on_value in kids:
            obj = _obj(doc, xref)
            ap = mupdf.pdf_dict_get(obj, mupdf.PDF_ENUM_NAME_AP)
            n = mupdf.pdf_dict_get(ap, mupdf.PDF_ENUM_NAME_N)
            yes = mupdf.pdf_dict_gets(n, "Yes")
            mupdf.pdf_dict_dels(n, "Yes")
            mupdf.pdf_dict_puts(n, on_value, yes)
            mupdf.pdf_dict_put(
                obj,
                mupdf.PDF_ENUM_NAME_Parent,
                mupdf.pdf_new_indirect(pdf, parent_xref, 0),
            )
            mupdf.pdf_dict_put_name(obj, mupdf.PDF_ENUM_NAME_AS, "Off")
            for key in ("T", "V", "FT", "Ff"):
                mupdf.pdf_dict_dels(obj, key)
            kidset.add(xref)

    root = mupdf.pdf_dict_get(mupdf.pdf_trailer(pdf), mupdf.PDF_ENUM_NAME_Root)
    form = mupdf.pdf_dict_get(root, mupdf.PDF_ENUM_NAME_AcroForm)
    fields = mupdf.pdf_dict_get(form, mupdf.PDF_ENUM_NAME_Fields)
    new_fields = mupdf.pdf_new_array(pdf, fields.pdf_array_len())
    for i in range(fields.pdf_array_len()):
        item = fields.pdf_array_get(i)
        if item.pdf_to_num() not in kidset:
            mupdf.pdf_array_push(new_fields, item)
    for xref in parent_xrefs:
        mupdf.pdf_array_push(new_fields, mupdf.pdf_new_indirect(pdf, xref, 0))
    mupdf.pdf_dict_put(form, mupdf.PDF_ENUM_NAME_Fields, new_fields)
    mupdf.pdf_dict_put(form, mupdf.pdf_new_name("NeedAppearances"), mupdf.PDF_TRUE)
    mupdf.pdf_dict_put_text_string(form, mupdf.pdf_new_name("DA"), "0 0 0 rg /Helv 9 Tf")
    _ensure_form_fonts(pdf, form)


def add_scale(
    page: pymupdf.Page,
    groups: dict[str, list[tuple[int, str]]],
    group: str,
    digits: list[tuple[str, float, float, float, float]],
    tooltip: str,
    dx: float = 0.0,
) -> None:
    for value, x0, y0, x1, y1 in digits:
        add_radio_option(
            page,
            groups,
            group,
            value,
            scale_box(x0 + dx, y0, x1 + dx, y1),
            tooltip=f"{tooltip} : {value}",
        )


def apply_field_labels(doc: pymupdf.Document, labels: dict[str, str]) -> None:
    """Override widget tooltips/labels after widgets are created."""
    for page in doc:
        for widget in page.widgets() or []:
            name = widget.field_name
            if name in labels:
                widget.field_label = labels[name]
                widget.update()


def build_form(
    source: Path,
    output: Path,
    *,
    identity_labels: dict[str, str] | None = None,
    field_labels: dict[str, str] | None = None,
    scale_dx: dict[str, float] | None = None,
) -> pymupdf.Document:
    source_doc = pymupdf.open(source)
    doc = pymupdf.open(source)
    if doc.page_count != 4:
        raise RuntimeError(f"Expected 4 pages, found {doc.page_count}")
    for page in doc:
        if abs(page.rect.width - PAGE_W) > 1 or abs(page.rect.height - PAGE_H) > 1:
            raise RuntimeError(f"Unexpected page size: {page.rect}")

    groups: dict[str, list[tuple[int, str]]] = {}
    p0, p1, p2, p3 = doc[0], doc[1], doc[2], doc[3]
    scale_dx = scale_dx or {}

    # ------------------------------------------------------------------ page 1 section 1
    shifts = relayout_pages(doc, source_doc, identity_section_end())
    source_doc.close()
    identity, _section1_end = draw_identity_section(p0, labels=identity_labels)
    s2, s3, d2 = shifts["s2_dy"], shifts["s3_dy"], shifts["p2_dy"]
    id_l = identity_labels or IDENTITY_LABELS_FR

    boxed = dict(boxed=True, fontsize=9)
    add_text(p0, "nom_complet", identity["nom_complet"], tooltip=id_l["nom_complet"], **boxed)
    add_text(p0, "courriel", identity["courriel"], tooltip=id_l["courriel"], **boxed)
    add_text(p0, "telephone", identity["telephone"], tooltip=id_l["telephone"], **boxed)
    add_text(
        p0,
        "date_naissance",
        identity["date_naissance"],
        tooltip=id_l["date_naissance"],
        **boxed,
    )
    add_text(p0, "age", identity["age"], tooltip=id_l["age"], **boxed)
    add_text(
        p0,
        "profession",
        identity["profession"],
        multiline=True,
        tooltip=id_l["profession"],
        **boxed,
    )
    add_text(p0, "taille", identity["taille"], tooltip=id_l["taille"], **boxed)
    add_text(p0, "poids_actuel", identity["poids_actuel"], tooltip=id_l["poids_actuel"], **boxed)
    add_text(
        p0,
        "poids_vise",
        identity["poids_vise"],
        tooltip=id_l["poids_vise"],
        **boxed,
    )

    objectifs = [
        ("perte_gras", 48.52, 313.00, "Perte de gras"),
        ("prise_masse", 303.64, 313.00, "Prise de masse musculaire"),
        ("recomposition", 48.52, 332.00, "Recomposition corporelle"),
        ("condition", 303.64, 332.00, "Condition physique"),
        ("force", 48.52, 351.00, "Force"),
        ("performance", 303.64, 351.00, "Performance sportive"),
        ("retour", 48.52, 370.00, "Retour a l'entrainement"),
        ("habitudes", 303.64, 370.00, "Habitudes de vie"),
        ("mobilite", 48.52, 389.00, "Mobilite"),
        ("autre", 303.64, 389.00, "Autre"),
    ]
    for key, x, y, label in objectifs:
        add_checkbox(p0, f"objectif_{key}", square(x, shift_y(y, s2)), tooltip=label)
    add_text(
        p0,
        "objectif_autre_texte",
        shift_rect(R(345.2, 387.35, 430.3, 399.15), s2),
        tooltip="Objectif autre",
    )
    add_text(
        p0,
        "objectif_description",
        shift_rect(R(48.5, 420.2, 502.2, 454.2), s2),
        multiline=True,
        tooltip="Description de l'objectif (3 a 6 mois)",
    )
    add_text(
        p0,
        "objectif_pourquoi",
        shift_rect(R(48.5, 471.2, 502.2, 494.2), s2),
        multiline=True,
        tooltip="Pourquoi cet objectif est important",
    )
    add_scale(
        p0,
        groups,
        "engagement",
        [
            ("1", 177.70, shift_y(497.41, s2), 182.70, shift_y(509.80, s2)),
            ("2", 185.20, shift_y(497.41, s2), 190.21, shift_y(509.80, s2)),
            ("3", 192.71, shift_y(497.41, s2), 197.71, shift_y(509.80, s2)),
            ("4", 200.21, shift_y(497.41, s2), 205.22, shift_y(509.80, s2)),
            ("5", 207.72, shift_y(497.41, s2), 212.72, shift_y(509.80, s2)),
            ("6", 215.23, shift_y(497.41, s2), 220.23, shift_y(509.80, s2)),
            ("7", 222.73, shift_y(497.41, s2), 227.74, shift_y(509.80, s2)),
            ("8", 230.24, shift_y(497.41, s2), 235.24, shift_y(509.80, s2)),
            ("9", 237.74, shift_y(497.41, s2), 242.75, shift_y(509.80, s2)),
            ("10", 245.25, shift_y(497.41, s2), 255.26, shift_y(509.80, s2)),
        ],
        "Niveau d'engagement actuel",
        dx=scale_dx.get("engagement", 0.0),
    )

    add_radio_option(p1, groups, "niveau", "debutant", square(48.52, shift_y(558.00, s3)), tooltip="Debutant")
    add_radio_option(
        p1, groups, "niveau", "intermediaire", square(218.60, shift_y(558.00, s3)), tooltip="Intermediaire"
    )
    add_radio_option(p1, groups, "niveau", "avance", square(388.68, shift_y(558.00, s3)), tooltip="Avance")

    activites = [
        ("musculation", 48.52, 595.00, "Musculation"),
        ("course", 303.64, 595.00, "Course / marche"),
        ("combat", 48.52, 614.00, "Sports de combat"),
        ("equipe", 303.64, 614.00, "Sport d'equipe"),
        ("velo", 48.52, 633.00, "Velo / natation"),
        ("autre", 303.64, 633.00, "Autre"),
    ]
    for key, x, y, label in activites:
        add_checkbox(p1, f"activites_{key}", square(x, shift_y(y, s3)), tooltip=label)
    add_text(
        p1,
        "activites_autre_texte",
        shift_rect(R(345.2, 631.35, 430.3, 643.15), s3),
        tooltip="Activite autre",
    )

    add_radio_option(p1, groups, "jours", "2", square(48.52, shift_y(670.00, s3)), tooltip="2 jours")
    add_radio_option(p1, groups, "jours", "3", square(150.57, shift_y(670.00, s3)), tooltip="3 jours")
    add_radio_option(p1, groups, "jours", "4", square(252.61, shift_y(670.00, s3)), tooltip="4 jours")
    add_radio_option(p1, groups, "jours", "5", square(354.66, shift_y(670.00, s3)), tooltip="5 jours")
    add_radio_option(p1, groups, "jours", "6plus", square(456.71, shift_y(670.00, s3)), tooltip="6 jours ou plus")

    add_radio_option(p1, groups, "duree", "30", square(48.52, shift_y(707.00, s3)), tooltip="30 min")
    add_radio_option(p1, groups, "duree", "45", square(176.08, shift_y(707.00, s3)), tooltip="45 min")
    add_radio_option(p1, groups, "duree", "60", square(303.64, shift_y(707.00, s3)), tooltip="60 min")
    add_radio_option(p1, groups, "duree", "75plus", square(431.20, shift_y(707.00, s3)), tooltip="75 min ou +")

    add_text(
        p1,
        "lieu_equipement",
        shift_rect(R(48.5, 738.2, 502.2, 772.2), s3),
        multiline=True,
        tooltip="Lieu d'entrainement et equipement disponible",
    )

    # ------------------------------------------------------------------ page 2
    safety = [
        (
            "douleur",
            (48.52, 90.31, 57.59, 99.38),
            (303.64, 90.31, 312.71, 99.38),
            R(48.5, 103.55, 502.2, 137.5),
            "Douleur, blessure ou limitation actuelle",
        ),
        (
            "chirurgie",
            (48.52, 164.31, 57.59, 173.38),
            (303.64, 164.31, 312.71, 173.38),
            R(48.5, 177.55, 502.2, 211.5),
            "Chirurgie ou blessure anterieure",
        ),
        (
            "restriction",
            (48.52, 238.31, 57.59, 247.38),
            (303.64, 238.31, 312.71, 247.38),
            R(48.5, 251.55, 502.2, 285.5),
            "Restriction ou recommandation d'un professionnel",
        ),
        (
            "condition",
            (48.52, 312.31, 57.59, 321.38),
            (303.64, 312.31, 312.71, 321.38),
            R(48.5, 325.55, 502.2, 359.5),
            "Condition de sante pertinente",
        ),
        (
            "medicament",
            (48.52, 398.31, 57.59, 407.38),
            (303.64, 403.81, 312.71, 412.88),
            R(48.5, 422.55, 502.2, 456.5),
            "Medicament influençant l'effort",
        ),
    ]
    for key, non_sq, oui_sq, details, label in safety:
        n0, n1, n2, n3 = non_sq
        o0, o1, o2, o3 = oui_sq
        add_radio_option(
            p1,
            groups,
            key,
            "non",
            square(n0, shift_y(n1, d2), n2, shift_y(n3, d2)),
            tooltip=f"{label} : Non",
        )
        add_radio_option(
            p1,
            groups,
            key,
            "oui",
            square(o0, shift_y(o1, d2), o2, shift_y(o3, d2)),
            tooltip=f"{label} : Oui",
        )
        add_text(
            p1,
            f"{key}_details",
            shift_rect(details, d2),
            multiline=True,
            tooltip=f"{label} : precisions",
        )

    # ------------------------------------------------------------------ page 3
    add_radio_option(
        p2, groups, "alimentation", "tres_structuree", square(48.52, 80.31), tooltip="Tres structuree"
    )
    add_radio_option(
        p2,
        groups,
        "alimentation",
        "assez_structuree",
        square(218.60, 80.31),
        tooltip="Assez structuree",
    )
    add_radio_option(
        p2, groups, "alimentation", "variable", square(388.68, 80.31), tooltip="Variable"
    )
    add_radio_option(
        p2, groups, "alimentation", "peu_structuree", square(48.52, 99.31), tooltip="Peu structuree"
    )
    add_radio_option(
        p2,
        groups,
        "alimentation",
        "mieux_guide",
        square(218.60, 99.31),
        tooltip="Je souhaite etre mieux guide(e)",
    )
    add_text(
        p2,
        "allergies",
        R(48.5, 130.55, 502.2, 153.5),
        multiline=True,
        tooltip="Allergies ou intolerances alimentaires",
    )

    prefs = [
        ("aucune", 48.52, 176.31, "Aucune"),
        ("vegetarien", 218.60, 176.31, "Vegetarien"),
        ("vegetalien", 388.68, 176.31, "Vegetalien"),
        ("sans_lactose", 48.52, 195.31, "Sans lactose"),
        ("sans_gluten", 218.60, 195.31, "Sans gluten"),
        ("autre", 388.68, 195.31, "Autre"),
    ]
    for key, x, y, label in prefs:
        add_checkbox(p2, f"restrictions_{key}", square(x, y), tooltip=label)
    add_text(
        p2,
        "restrictions_autre_texte",
        R(430.25, 193.65, 515.32, 205.45),
        tooltip="Restriction alimentaire autre",
    )
    add_text(
        p2,
        "aliments",
        R(48.5, 226.55, 502.2, 260.5),
        multiline=True,
        tooltip="Aliments a conserver / eviter",
    )
    add_text(
        p2,
        "hydratation",
        R(48.5, 270.65, 436.05, 282.45),
        tooltip="Hydratation quotidienne approximative",
    )

    add_radio_option(p2, groups, "sommeil_duree", "lt5", square(48.52, 328.31), tooltip="< 5 h")
    add_radio_option(p2, groups, "sommeil_duree", "5_6", square(150.57, 328.31), tooltip="5-6 h")
    add_radio_option(p2, groups, "sommeil_duree", "6_7", square(252.61, 328.31), tooltip="6-7 h")
    add_radio_option(p2, groups, "sommeil_duree", "7_8", square(354.66, 328.31), tooltip="7-8 h")
    add_radio_option(
        p2, groups, "sommeil_duree", "8plus", square(456.71, 328.31), tooltip="8 h et plus"
    )
    add_scale(
        p2,
        groups,
        "sommeil_qualite",
        [
            ("1", 292.13, 345.72, 297.14, 358.11),
            ("2", 299.64, 345.72, 304.64, 358.11),
            ("3", 307.14, 345.72, 312.15, 358.11),
            ("4", 314.65, 345.72, 319.65, 358.11),
            ("5", 322.16, 345.72, 327.16, 358.11),
            ("6", 329.66, 345.72, 334.67, 358.11),
            ("7", 337.17, 345.72, 342.17, 358.11),
            ("8", 344.67, 345.72, 349.68, 358.11),
            ("9", 352.18, 345.72, 357.18, 358.11),
            ("10", 359.69, 345.72, 369.69, 358.11),
        ],
        "Qualite du sommeil",
        dx=scale_dx.get("sommeil_qualite", 0.0),
    )
    add_scale(
        p2,
        groups,
        "stress",
        [
            ("1", 295.64, 361.72, 300.65, 374.11),
            ("2", 303.15, 361.72, 308.15, 374.11),
            ("3", 310.65, 361.72, 315.66, 374.11),
            ("4", 318.16, 361.72, 323.16, 374.11),
            ("5", 325.67, 361.72, 330.67, 374.11),
            ("6", 333.17, 361.72, 338.18, 374.11),
            ("7", 340.68, 361.72, 345.68, 374.11),
            ("8", 348.18, 361.72, 353.19, 374.11),
            ("9", 355.69, 361.72, 360.69, 374.11),
            ("10", 363.20, 361.72, 373.20, 374.11),
        ],
        "Niveau de stress general",
        dx=scale_dx.get("stress", 0.0),
    )

    add_radio_option(
        p2, groups, "travail", "assis", square(48.52, 397.31), tooltip="Majoritairement assis"
    )
    add_radio_option(
        p2, groups, "travail", "debout", square(218.60, 397.31), tooltip="Majoritairement debout"
    )
    add_radio_option(
        p2, groups, "travail", "actif", square(388.68, 397.31), tooltip="Actif / physiquement actif"
    )
    add_radio_option(
        p2, groups, "travail", "tres_physique", square(48.52, 416.31), tooltip="Tres physique"
    )
    add_radio_option(
        p2, groups, "travail", "variable", square(218.60, 416.31), tooltip="Variable"
    )
    add_radio_option(p2, groups, "travail", "autre", square(388.68, 416.31), tooltip="Autre")
    add_text(p2, "travail_autre", R(430.25, 414.65, 515.32, 426.45), tooltip="Travail / quotidien autre")
    add_text(
        p2,
        "pas_par_jour",
        R(48.5, 440.65, 436.05, 452.45),
        tooltip="Nombre moyen de pas par jour",
    )

    add_radio_option(p2, groups, "deja_tente", "non", square(48.52, 498.31), tooltip="Non")
    add_radio_option(p2, groups, "deja_tente", "oui", square(303.64, 498.31), tooltip="Oui")
    add_text(
        p2,
        "ce_qui_a_fonctionne",
        R(48.5, 529.55, 502.2, 563.5),
        multiline=True,
        tooltip="Ce qui a bien fonctionne",
    )
    add_text(
        p2,
        "ce_qui_a_ete_difficile",
        R(48.5, 580.55, 502.2, 614.5),
        multiline=True,
        tooltip="Ce qui a ete difficile a maintenir",
    )

    obstacles = [
        ("temps", 48.52, 637.31, "Temps"),
        ("motivation", 303.64, 637.31, "Motivation"),
        ("structure", 48.52, 656.31, "Structure"),
        ("nutrition", 303.64, 656.31, "Nutrition"),
        ("stress", 48.52, 675.31, "Stress"),
        ("sommeil", 303.64, 675.31, "Sommeil"),
        ("constance", 48.52, 694.31, "Constance"),
        ("douleur", 303.64, 694.31, "Douleur / limitation"),
        ("horaire", 48.52, 713.31, "Horaire"),
        ("autre", 303.64, 713.31, "Autre"),
    ]
    for key, x, y, label in obstacles:
        add_checkbox(p2, f"obstacle_{key}", square(x, y), tooltip=label)
    add_text(p2, "obstacle_autre_texte", R(345.2, 711.65, 392.5, 723.45), tooltip="Obstacle autre")

    # ------------------------------------------------------------------ page 4
    attentes = [
        ("structure", 48.52, 80.31, "Structure"),
        ("responsabilisation", 303.64, 80.31, "Responsabilisation"),
        ("education", 48.52, 99.31, "Education"),
        ("motivation", 303.64, 99.31, "Motivation"),
        ("ajustements", 48.52, 118.31, "Ajustements reguliers"),
        ("progression", 303.64, 118.31, "Progression mesurable"),
        ("habitudes", 48.52, 137.31, "Meilleures habitudes"),
        ("autre", 303.64, 137.31, "Autre"),
    ]
    for key, x, y, label in attentes:
        add_checkbox(p3, f"attentes_{key}", square(x, y), tooltip=label)
    add_text(p3, "attentes_autre_texte", R(345.2, 135.65, 392.5, 147.45), tooltip="Attente autre")

    add_radio_option(
        p3, groups, "style", "direct", square(48.52, 174.31), tooltip="Direct et exigeant"
    )
    add_radio_option(
        p3,
        groups,
        "style",
        "encourageant",
        square(303.64, 174.31),
        tooltip="Encourageant et progressif",
    )
    add_radio_option(
        p3, groups, "style", "tres_structure", square(48.52, 193.31), tooltip="Tres structure"
    )
    add_radio_option(p3, groups, "style", "flexible", square(303.64, 193.31), tooltip="Flexible")
    add_radio_option(p3, groups, "style", "melange", square(48.52, 212.31), tooltip="Un melange")

    add_text(
        p3,
        "autre_chose",
        R(48.5, 243.55, 502.2, 299.5),
        multiline=True,
        tooltip="Autre chose a savoir pour adapter l'accompagnement",
    )
    add_text(p3, "confirmation_nom", R(75.0, 378.65, 462.5, 390.45), tooltip="Nom")
    add_signature(p3, "signature", R(95.3, 394.8, 482.8, 412.5), tooltip="Signature")
    add_text(p3, "date", R(74.5, 416.65, 462.0, 428.45), tooltip="Date")

    if field_labels:
        apply_field_labels(doc, field_labels)
    finalize_radio_groups(doc, groups)
    output.parent.mkdir(parents=True, exist_ok=True)
    doc.save(output, garbage=4, deflate=True, pretty=False)
    return doc


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    doc = build_form(args.source, args.output)
    counts = [len(list(page.widgets() or [])) for page in doc]
    doc.close()
    print(f"Wrote {args.output}")
    print(f"Widgets per page: {counts} (total {sum(counts)})")


if __name__ == "__main__":
    main()
