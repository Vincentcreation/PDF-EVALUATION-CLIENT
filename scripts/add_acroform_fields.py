#!/usr/bin/env python3
"""Add AcroForm fields on top of the original Elevate Fitness client form.

The original PDF is kept as the visual layer. This script overlays interactive
fields aligned on the printed lines, squares and 1-10 scales, and inserts the
Date de naissance / Age row into section 1 so those fields are visible.
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


LABEL_SIZE = 8.5
LABEL_BASELINE_OFFSET = 9.06  # Helvetica-Bold 8.5 vs original span y0


def _cover(page: pymupdf.Page, rect: pymupdf.Rect) -> None:
    page.draw_rect(rect, color=None, fill=(1, 1, 1), width=0)


def _insert_label(page: pymupdf.Page, x: float, span_y0: float, text: str) -> float:
    baseline = span_y0 + LABEL_BASELINE_OFFSET
    page.insert_text(
        (x, baseline),
        text,
        fontsize=LABEL_SIZE,
        fontname="hebo",
        color=(0, 0, 0),
    )
    return pymupdf.get_text_length(text, fontname="hebo", fontsize=LABEL_SIZE)


def _insert_underscores(page: pymupdf.Page, x0: float, x1: float, span_y0: float) -> None:
    baseline = span_y0 + LABEL_BASELINE_OFFSET
    width = max(0.0, x1 - x0)
    char_w = pymupdf.get_text_length("_", fontname="helv", fontsize=LABEL_SIZE)
    count = max(1, int(width / char_w))
    page.insert_text(
        (x0, baseline),
        "_" * count,
        fontsize=LABEL_SIZE,
        fontname="helv",
        color=(0, 0, 0),
    )


def insert_birthdate_age_row(page: pymupdf.Page) -> None:
    """Add visible Date de naissance / Age labels on the unused profession-label line.

    Profession stays on the line below, now in the same label+underline pattern as
    Nom complet / Courriel / Telephone.
    """
    page.add_redact_annot(pymupdf.Rect(48.4, 226.3, 175.0, 239.6), fill=(1, 1, 1))
    page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE)
    _cover(page, pymupdf.Rect(48.4, 237.2, 438.0, 251.0))

    dob_y0 = 227.44
    w_dob = _insert_label(page, 48.52, dob_y0, "Date de naissance :")
    dob_line_x0 = 48.52 + w_dob + 4.0
    dob_line_x1 = 338.0
    _insert_underscores(page, dob_line_x0, dob_line_x1, 227.40)

    age_x = 352.0
    w_age = _insert_label(page, age_x, dob_y0, "Âge :")
    age_line_x0 = age_x + w_age + 8.0
    age_line_x1 = 531.0
    _insert_underscores(page, age_line_x0, age_line_x1, 227.40)

    prof_y0 = 238.44
    w_prof = _insert_label(page, 48.52, prof_y0, "Profession / rythme de travail :")
    _insert_underscores(page, 48.52 + w_prof + 4.0, 497.45, 238.40)


def add_text(
    page: pymupdf.Page,
    name: str,
    rect: pymupdf.Rect,
    *,
    multiline: bool = False,
    fontsize: float = TEXT_SIZE,
    tooltip: str | None = None,
    maxlen: int = 0,
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
) -> None:
    for value, x0, y0, x1, y1 in digits:
        add_radio_option(
            page,
            groups,
            group,
            value,
            scale_box(x0, y0, x1, y1),
            tooltip=f"{tooltip} : {value}",
        )


def build_form(source: Path, output: Path) -> pymupdf.Document:
    doc = pymupdf.open(source)
    if doc.page_count != 4:
        raise RuntimeError(f"Expected 4 pages, found {doc.page_count}")
    for page in doc:
        if abs(page.rect.width - PAGE_W) > 1 or abs(page.rect.height - PAGE_H) > 1:
            raise RuntimeError(f"Unexpected page size: {page.rect}")

    groups: dict[str, list[tuple[int, str]]] = {}
    p0, p1, p2, p3 = doc[0], doc[1], doc[2], doc[3]

    # ------------------------------------------------------------------ page 1
    insert_birthdate_age_row(p0)
    add_text(p0, "nom_complet", R(109.9, 176.35, 497.5, 188.15), tooltip="Nom complet")
    add_text(p0, "courriel", R(88.7, 193.35, 476.2, 205.15), tooltip="Courriel")
    add_text(p0, "telephone", R(98.6, 210.35, 486.1, 222.15), tooltip="Telephone")
    add_text(
        p0,
        "date_naissance",
        R(131.9, 227.35, 338.0, 239.15),
        tooltip="Date de naissance",
    )
    add_text(p0, "age", R(376.1, 227.35, 531.0, 239.15), tooltip="Âge")
    add_text(
        p0,
        "profession",
        R(176.8, 238.35, 497.5, 250.15),
        tooltip="Profession / rythme de travail",
    )
    add_text(p0, "taille", R(77.8, 255.35, 172.3, 267.15), tooltip="Taille")
    add_text(p0, "poids_actuel", R(239.4, 255.35, 333.9, 267.15), tooltip="Poids actuel")
    add_text(
        p0,
        "poids_vise",
        R(436.4, 255.35, 531.0, 267.15),
        tooltip="Poids vise (facultatif)",
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
        add_checkbox(p0, f"objectif_{key}", square(x, y), tooltip=label)
    add_text(p0, "objectif_autre_texte", R(345.2, 387.35, 430.3, 399.15), tooltip="Objectif autre")
    add_text(
        p0,
        "objectif_description",
        R(48.5, 420.2, 502.2, 454.2),
        multiline=True,
        tooltip="Description de l'objectif (3 a 6 mois)",
    )
    add_text(
        p0,
        "objectif_pourquoi",
        R(48.5, 471.2, 502.2, 494.2),
        multiline=True,
        tooltip="Pourquoi cet objectif est important",
    )
    add_scale(
        p0,
        groups,
        "engagement",
        [
            ("1", 177.70, 497.41, 182.70, 509.80),
            ("2", 185.20, 497.41, 190.21, 509.80),
            ("3", 192.71, 497.41, 197.71, 509.80),
            ("4", 200.21, 497.41, 205.22, 509.80),
            ("5", 207.72, 497.41, 212.72, 509.80),
            ("6", 215.23, 497.41, 220.23, 509.80),
            ("7", 222.73, 497.41, 227.74, 509.80),
            ("8", 230.24, 497.41, 235.24, 509.80),
            ("9", 237.74, 497.41, 242.75, 509.80),
            ("10", 245.25, 497.41, 255.26, 509.80),
        ],
        "Niveau d'engagement actuel",
    )

    add_radio_option(p0, groups, "niveau", "debutant", square(48.52, 558.00), tooltip="Debutant")
    add_radio_option(
        p0, groups, "niveau", "intermediaire", square(218.60, 558.00), tooltip="Intermediaire"
    )
    add_radio_option(p0, groups, "niveau", "avance", square(388.68, 558.00), tooltip="Avance")

    activites = [
        ("musculation", 48.52, 595.00, "Musculation"),
        ("course", 303.64, 595.00, "Course / marche"),
        ("combat", 48.52, 614.00, "Sports de combat"),
        ("equipe", 303.64, 614.00, "Sport d'equipe"),
        ("velo", 48.52, 633.00, "Velo / natation"),
        ("autre", 303.64, 633.00, "Autre"),
    ]
    for key, x, y, label in activites:
        add_checkbox(p0, f"activites_{key}", square(x, y), tooltip=label)
    add_text(p0, "activites_autre_texte", R(345.2, 631.35, 430.3, 643.15), tooltip="Activite autre")

    add_radio_option(p0, groups, "jours", "2", square(48.52, 670.00), tooltip="2 jours")
    add_radio_option(p0, groups, "jours", "3", square(150.57, 670.00), tooltip="3 jours")
    add_radio_option(p0, groups, "jours", "4", square(252.61, 670.00), tooltip="4 jours")
    add_radio_option(p0, groups, "jours", "5", square(354.66, 670.00), tooltip="5 jours")
    add_radio_option(p0, groups, "jours", "6plus", square(456.71, 670.00), tooltip="6 jours ou plus")

    add_radio_option(p0, groups, "duree", "30", square(48.52, 707.00), tooltip="30 min")
    add_radio_option(p0, groups, "duree", "45", square(176.08, 707.00), tooltip="45 min")
    add_radio_option(p0, groups, "duree", "60", square(303.64, 707.00), tooltip="60 min")
    add_radio_option(p0, groups, "duree", "75plus", square(431.20, 707.00), tooltip="75 min ou +")

    add_text(
        p0,
        "lieu_equipement",
        R(48.5, 738.2, 502.2, 772.2),
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
        add_radio_option(p1, groups, key, "non", square(*non_sq), tooltip=f"{label} : Non")
        add_radio_option(p1, groups, key, "oui", square(*oui_sq), tooltip=f"{label} : Oui")
        add_text(p1, f"{key}_details", details, multiline=True, tooltip=f"{label} : precisions")

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
