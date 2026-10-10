#!/usr/bin/env python3
"""Build the English fillable Elevate Fitness client assessment PDF.

Starts from the original French visual, replaces visible copy with English,
then applies the same spacious identity layout and AcroForm overlay as the
French fillable form.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from add_acroform_fields import (  # noqa: E402
    DEFAULT_SOURCE,
    PAGE_W,
    build_form,
)

DEFAULT_OUTPUT = ROOT / "Elevate_Fitness_Client_Assessment_EN.pdf"

IDENTITY_LABELS_EN = {
    "nom_complet": "Full name",
    "courriel": "Email",
    "telephone": "Phone",
    "date_naissance": "Date of birth (DD/MM/YYYY)",
    "age": "Age",
    "profession": "Occupation / work schedule",
    "taille": "Height",
    "poids_actuel": "Current weight",
    "poids_vise": "Target weight (optional)",
}

FIELD_LABELS_EN = {
    "nom_complet": "Full name",
    "courriel": "Email",
    "telephone": "Phone",
    "date_naissance": "Date of birth (DD/MM/YYYY)",
    "age": "Age",
    "profession": "Occupation / work schedule",
    "taille": "Height",
    "poids_actuel": "Current weight",
    "poids_vise": "Target weight (optional)",
    "objectif_perte_gras": "Fat loss",
    "objectif_prise_masse": "Muscle gain",
    "objectif_recomposition": "Body recomposition",
    "objectif_condition": "Physical conditioning",
    "objectif_force": "Strength",
    "objectif_performance": "Athletic performance",
    "objectif_retour": "Return to training",
    "objectif_habitudes": "Lifestyle habits",
    "objectif_mobilite": "Mobility",
    "objectif_autre": "Other",
    "objectif_autre_texte": "Other goal",
    "objectif_description": "Describe your goal (3 to 6 months)",
    "objectif_pourquoi": "Why this goal is important",
    "activites_musculation": "Strength training",
    "activites_course": "Running / walking",
    "activites_combat": "Combat sports",
    "activites_equipe": "Team sport",
    "activites_velo": "Cycling / swimming",
    "activites_autre": "Other",
    "activites_autre_texte": "Other activity",
    "lieu_equipement": "Training location and available equipment",
    "douleur_details": "Current pain, injury or limitation: details",
    "chirurgie_details": "Previous surgery or injury: details",
    "restriction_details": "Professional restriction or recommendation: details",
    "condition_details": "Relevant health condition: details",
    "medicament_details": "Medication affecting effort: details",
    "allergies": "Relevant food allergies or intolerances",
    "restrictions_aucune": "None",
    "restrictions_vegetarien": "Vegetarian",
    "restrictions_vegetalien": "Vegan",
    "restrictions_sans_lactose": "Lactose-free",
    "restrictions_sans_gluten": "Gluten-free",
    "restrictions_autre": "Other",
    "restrictions_autre_texte": "Other food restriction",
    "aliments": "Foods to keep / avoid",
    "hydratation": "Approximate daily hydration",
    "travail_autre": "Work / daily life other",
    "pas_par_jour": "Average steps per day",
    "ce_qui_a_fonctionne": "What has worked well",
    "ce_qui_a_ete_difficile": "What has been difficult to maintain",
    "obstacle_temps": "Time",
    "obstacle_motivation": "Motivation",
    "obstacle_structure": "Structure",
    "obstacle_nutrition": "Nutrition",
    "obstacle_stress": "Stress",
    "obstacle_sommeil": "Sleep",
    "obstacle_constance": "Consistency",
    "obstacle_douleur": "Pain / limitation",
    "obstacle_horaire": "Schedule",
    "obstacle_autre": "Other",
    "obstacle_autre_texte": "Other obstacle",
    "attentes_structure": "Structure",
    "attentes_responsabilisation": "Accountability",
    "attentes_education": "Education",
    "attentes_motivation": "Motivation",
    "attentes_ajustements": "Regular adjustments",
    "attentes_progression": "Measurable progress",
    "attentes_habitudes": "Better habits",
    "attentes_autre": "Other",
    "attentes_autre_texte": "Other expectation",
    "autre_chose": "Anything else to tailor coaching",
    "confirmation_nom": "Name",
    "signature": "Signature",
    "date": "Date",
    "__rb.engagement.1": "Current commitment level: 1",
    "__rb.engagement.2": "Current commitment level: 2",
    "__rb.engagement.3": "Current commitment level: 3",
    "__rb.engagement.4": "Current commitment level: 4",
    "__rb.engagement.5": "Current commitment level: 5",
    "__rb.engagement.6": "Current commitment level: 6",
    "__rb.engagement.7": "Current commitment level: 7",
    "__rb.engagement.8": "Current commitment level: 8",
    "__rb.engagement.9": "Current commitment level: 9",
    "__rb.engagement.10": "Current commitment level: 10",
    "__rb.niveau.debutant": "Beginner",
    "__rb.niveau.intermediaire": "Intermediate",
    "__rb.niveau.avance": "Advanced",
    "__rb.jours.2": "2 days",
    "__rb.jours.3": "3 days",
    "__rb.jours.4": "4 days",
    "__rb.jours.5": "5 days",
    "__rb.jours.6plus": "6 days or more",
    "__rb.duree.30": "30 min",
    "__rb.duree.45": "45 min",
    "__rb.duree.60": "60 min",
    "__rb.duree.75plus": "75 min or more",
    "__rb.douleur.non": "Current pain, injury or limitation: No",
    "__rb.douleur.oui": "Current pain, injury or limitation: Yes",
    "__rb.chirurgie.non": "Previous surgery or injury: No",
    "__rb.chirurgie.oui": "Previous surgery or injury: Yes",
    "__rb.restriction.non": "Professional restriction or recommendation: No",
    "__rb.restriction.oui": "Professional restriction or recommendation: Yes",
    "__rb.condition.non": "Relevant health condition: No",
    "__rb.condition.oui": "Relevant health condition: Yes",
    "__rb.medicament.non": "Medication affecting effort: No",
    "__rb.medicament.oui": "Medication affecting effort: Yes",
    "__rb.alimentation.tres_structuree": "Very structured",
    "__rb.alimentation.assez_structuree": "Fairly structured",
    "__rb.alimentation.variable": "Variable",
    "__rb.alimentation.peu_structuree": "Not very structured",
    "__rb.alimentation.mieux_guide": "I would like more guidance",
    "__rb.sommeil_duree.lt5": "< 5 h",
    "__rb.sommeil_duree.5_6": "5-6 h",
    "__rb.sommeil_duree.6_7": "6-7 h",
    "__rb.sommeil_duree.7_8": "7-8 h",
    "__rb.sommeil_duree.8plus": "8 h or more",
    "__rb.sommeil_qualite.1": "Sleep quality: 1",
    "__rb.sommeil_qualite.2": "Sleep quality: 2",
    "__rb.sommeil_qualite.3": "Sleep quality: 3",
    "__rb.sommeil_qualite.4": "Sleep quality: 4",
    "__rb.sommeil_qualite.5": "Sleep quality: 5",
    "__rb.sommeil_qualite.6": "Sleep quality: 6",
    "__rb.sommeil_qualite.7": "Sleep quality: 7",
    "__rb.sommeil_qualite.8": "Sleep quality: 8",
    "__rb.sommeil_qualite.9": "Sleep quality: 9",
    "__rb.sommeil_qualite.10": "Sleep quality: 10",
    "__rb.stress.1": "General stress level: 1",
    "__rb.stress.2": "General stress level: 2",
    "__rb.stress.3": "General stress level: 3",
    "__rb.stress.4": "General stress level: 4",
    "__rb.stress.5": "General stress level: 5",
    "__rb.stress.6": "General stress level: 6",
    "__rb.stress.7": "General stress level: 7",
    "__rb.stress.8": "General stress level: 8",
    "__rb.stress.9": "General stress level: 9",
    "__rb.stress.10": "General stress level: 10",
    "__rb.travail.assis": "Mostly sitting",
    "__rb.travail.debout": "Mostly standing",
    "__rb.travail.actif": "Active / physically active",
    "__rb.travail.tres_physique": "Very physical",
    "__rb.travail.variable": "Variable",
    "__rb.travail.autre": "Other",
    "__rb.deja_tente.non": "No",
    "__rb.deja_tente.oui": "Yes",
    "__rb.style.direct": "Direct and demanding",
    "__rb.style.encourageant": "Encouraging and progressive",
    "__rb.style.tres_structure": "Very structured",
    "__rb.style.flexible": "Flexible",
    "__rb.style.melange": "A mix",
}

# Exact original line text -> English. Underscore-only lines are left untouched.
LINE_EN = {
    "ELEVATE FITNESS - Formulaire d'evaluation client - Page 1": "ELEVATE FITNESS - Client assessment form - Page 1",
    "ELEVATE FITNESS - Formulaire d'evaluation client - Page 2": "ELEVATE FITNESS - Client assessment form - Page 2",
    "ELEVATE FITNESS - Formulaire d'evaluation client - Page 3": "ELEVATE FITNESS - Client assessment form - Page 3",
    "ELEVATE FITNESS - Formulaire d'evaluation client - Page 4": "ELEVATE FITNESS - Client assessment form - Page 4",
    "FORMULAIRE D'EVALUATION CLIENT": "CLIENT ASSESSMENT FORM",
    "ELEVATE FITNESS - Performance - Sante - Discipline": "ELEVATE FITNESS - Performance - Health - Discipline",
    "Ce formulaire recueille uniquement les informations pertinentes pour adapter ton accompagnement et ton entrainement de facon securitaire. Ne": (
        "This form collects only the information needed to tailor your coaching and training safely. Do not"
    ),
    "fournis pas de renseignements medicaux qui ne sont pas utiles a ton coaching.": (
        "provide medical details that are not useful for your coaching."
    ),
    "1. INFORMATIONS DE BASE": "1. BASIC INFORMATION",
    "2. OBJECTIFS": "2. GOALS",
    "Objectif principal :": "Main goal:",
    "Perte de gras": "Fat loss",
    "Prise de masse musculaire": "Muscle gain",
    "Recomposition corporelle": "Body recomposition",
    "Condition physique": "Physical conditioning",
    "Force": "Strength",
    "Performance sportive": "Athletic performance",
    "Retour a l'entrainement": "Return to training",
    "Habitudes de vie": "Lifestyle habits",
    "Mobilite": "Mobility",
    "Autre : __________________": "Other: __________________",
    "Decris ton objectif et ce que tu aimerais accomplir dans les 3 a 6 prochains mois.": (
        "Describe your goal and what you would like to accomplish in the next 3 to 6 months."
    ),
    "Pourquoi cet objectif est-il important pour toi?": "Why is this goal important to you?",
    "Niveau d'engagement actuel : 1 2 3 4 5 6 7 8 9 10": "Current commitment level: 1 2 3 4 5 6 7 8 9 10",
    "3. ENTRAINEMENT": "3. TRAINING",
    "Niveau actuel :": "Current level:",
    "Debutant": "Beginner",
    "Intermediaire": "Intermediate",
    "Avance": "Advanced",
    "Activites pratiquees actuellement :": "Activities currently practiced:",
    "Musculation": "Strength training",
    "Course / marche": "Running / walking",
    "Sports de combat": "Combat sports",
    "Sport d'equipe": "Team sport",
    "Velo / natation": "Cycling / swimming",
    "Jours disponibles par semaine :": "Days available per week:",
    "Duree realiste par seance :": "Realistic session duration:",
    "75 min ou +": "75 min or more",
    "Lieu d'entrainement et equipement disponible :": "Training location and available equipment:",
    "4. SECURITE, DOULEURS ET LIMITATIONS": "4. SAFETY, PAIN AND LIMITATIONS",
    "Cette section vise uniquement les elements pouvant influencer la securite ou l'adaptation de ton entrainement.": (
        "This section covers only factors that may affect the safety or adaptation of your training."
    ),
    "As-tu actuellement une douleur, une blessure ou une limitation physique qui pourrait affecter ton entrainement?": (
        "Do you currently have any pain, injury, or physical limitation that could affect your training?"
    ),
    "Non": "No",
    "Oui - precise uniquement ce qui est pertinent :": "Yes - specify only what is relevant:",
    "As-tu subi une chirurgie ou une blessure anterieure qui limite encore certains mouvements ou activites?": (
        "Have you had surgery or a previous injury that still limits certain movements or activities?"
    ),
    "Un professionnel de la sante t'a-t-il recommande d'eviter ou de modifier certains exercices ou niveaux d'effort?": (
        "Has a health professional advised you to avoid or modify certain exercises or effort levels?"
    ),
    "Oui - precise la restriction ou recommandation :": "Yes - specify the restriction or recommendation:",
    "Y a-t-il une condition de sante que ton coach devrait connaitre pour adapter ton entrainement de facon securitaire?": (
        "Is there a health condition your coach should know about to adapt your training safely?"
    ),
    "Oui - indique uniquement l'information pertinente :": "Yes - provide only the relevant information:",
    "Prends-tu un medicament dont tu sais qu'il peut influencer ta tolerance a l'effort, ton rythme cardiaque, ta vigilance,": (
        "Do you take any medication you know may affect your exercise tolerance, heart rate, alertness,"
    ),
    "ton equilibre ou ta recuperation?": "balance, or recovery?",
    "Oui - indique seulement l'effet pertinent ou la precaution": "Yes - indicate only the relevant effect or",
    "recommandee :": "recommended precaution:",
    "Important : Elevate Fitness ne demande pas ton dossier medical complet, la liste detaillee de tes diagnostics ni la liste complete de tes": (
        "Important: Elevate Fitness does not ask for your complete medical file, a detailed list of diagnoses, or a complete list of your"
    ),
    "medicaments.": "medications.",
    "5. NUTRITION": "5. NUTRITION",
    "Comment decrirais-tu actuellement ton alimentation?": "How would you currently describe your eating habits?",
    "Tres structuree": "Very structured",
    "Assez structuree": "Fairly structured",
    "Peu structuree": "Not very structured",
    "Je souhaite etre mieux guide(e)": "I would like more guidance",
    "Allergies ou intolerances alimentaires pertinentes a ton accompagnement :": (
        "Food allergies or intolerances relevant to your coaching:"
    ),
    "Preferences ou restrictions alimentaires :": "Food preferences or restrictions:",
    "Aucune": "None",
    "Vegetarien": "Vegetarian",
    "Vegetalien": "Vegan",
    "Sans lactose": "Lactose-free",
    "Sans gluten": "Gluten-free",
    "Aliments que tu souhaites conserver / eviter :": "Foods you want to keep / avoid:",
    "Hydratation quotidienne approximative :": "Approximate daily hydration:",
    "6. MODE DE VIE ET RECUPERATION": "6. LIFESTYLE AND RECOVERY",
    "Sommeil moyen :": "Average sleep:",
    "8 h et plus": "8 h or more",
    "Qualite du sommeil (1 = tres mauvaise, 10 = excellente) : 1 2 3 4 5 6 7 8 9 10": (
        "Sleep quality (1 = very poor, 10 = excellent): 1 2 3 4 5 6 7 8 9 10"
    ),
    "Niveau de stress general (1 = tres faible, 10 = tres eleve) : 1 2 3 4 5 6 7 8 9 10": (
        "General stress level (1 = very low, 10 = very high): 1 2 3 4 5 6 7 8 9 10"
    ),
    "Travail / quotidien :": "Work / daily life:",
    "Majoritairement assis": "Mostly sitting",
    "Majoritairement debout": "Mostly standing",
    "Actif / physiquement actif": "Active / physically active",
    "Tres physique": "Very physical",
    "Nombre moyen de pas par jour, si connu :": "Average steps per day, if known:",
    "7. HISTORIQUE ET OBSTACLES": "7. HISTORY AND OBSTACLES",
    "As-tu deja tente d'atteindre cet objectif?": "Have you already tried to reach this goal?",
    "Oui": "Yes",
    "Qu'est-ce qui a bien fonctionne pour toi?": "What has worked well for you?",
    "Qu'est-ce qui a ete difficile a maintenir?": "What has been difficult to maintain?",
    "Principal obstacle actuel :": "Main current obstacle:",
    "Temps": "Time",
    "Sommeil": "Sleep",
    "Constance": "Consistency",
    "Douleur / limitation": "Pain / limitation",
    "Horaire": "Schedule",
    "Autre : __________": "Other: __________",
    "8. COACHING ET COMMUNICATION": "8. COACHING AND COMMUNICATION",
    "Qu'attends-tu principalement de ton accompagnement?": "What do you mainly expect from your coaching?",
    "Responsabilisation": "Accountability",
    "Education": "Education",
    "Ajustements reguliers": "Regular adjustments",
    "Progression mesurable": "Measurable progress",
    "Meilleures habitudes": "Better habits",
    "Style d'encadrement prefere :": "Preferred coaching style:",
    "Direct et exigeant": "Direct and demanding",
    "Encourageant et progressif": "Encouraging and progressive",
    "Tres structure": "Very structured",
    "Un melange": "A mix",
    "Y a-t-il autre chose que je devrais savoir pour mieux adapter ton accompagnement?": (
        "Is there anything else I should know to better tailor your coaching?"
    ),
    "9. CONFIRMATION DU CLIENT": "9. CLIENT CONFIRMATION",
    "Je confirme que les renseignements fournis sont exacts au meilleur de ma connaissance et qu'ils sont transmis afin de permettre a": (
        "I confirm that the information provided is accurate to the best of my knowledge and is shared so that"
    ),
    "Elevate Fitness d'adapter mon accompagnement.": "Elevate Fitness can tailor my coaching.",
    "Je reconnais egalement avoir pris connaissance des modalites de consentement et de confidentialite presentees lors de mon inscription a Elevate": (
        "I also acknowledge that I have reviewed the consent and confidentiality terms presented at my registration with Elevate"
    ),
    "Nom : __________________________________________________________________________________": (
        "Name: __________________________________________________________________________________"
    ),
    "Signature : __________________________________________________________________________________": (
        "Signature: __________________________________________________________________________________"
    ),
    "Date : __________________________________________________________________________________": (
        "Date: __________________________________________________________________________________"
    ),
}

# Scale lines whose digits must stay at the original x positions.
SCALE_PREFIX = {
    "Niveau d'engagement actuel : 1 2 3 4 5 6 7 8 9 10": (
        "Current commitment level:",
        [177.70, 185.20, 192.71, 200.21, 207.72, 215.23, 222.73, 230.24, 237.74, 245.25],
        ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
        "engagement",
    ),
    "Qualite du sommeil (1 = tres mauvaise, 10 = excellente) : 1 2 3 4 5 6 7 8 9 10": (
        "Sleep quality (1 = very poor, 10 = excellent):",
        [292.13, 299.64, 307.14, 314.65, 322.16, 329.66, 337.17, 344.67, 352.18, 359.69],
        ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
        "sommeil_qualite",
    ),
    "Niveau de stress general (1 = tres faible, 10 = tres eleve) : 1 2 3 4 5 6 7 8 9 10": (
        "General stress level (1 = very low, 10 = very high):",
        [295.64, 303.15, 310.65, 318.16, 325.67, 333.17, 340.68, 348.18, 355.69, 363.20],
        ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
        "stress",
    ),
}

CENTERED = {
    "FORMULAIRE D'EVALUATION CLIENT",
    "ELEVATE FITNESS - Performance - Sante - Discipline",
    "ELEVATE FITNESS - Formulaire d'evaluation client - Page 1",
    "ELEVATE FITNESS - Formulaire d'evaluation client - Page 2",
    "ELEVATE FITNESS - Formulaire d'evaluation client - Page 3",
    "ELEVATE FITNESS - Formulaire d'evaluation client - Page 4",
}


def _is_fill_line(text: str) -> bool:
    stripped = text.replace(" ", "")
    return bool(stripped) and set(stripped) <= {"_"}


def _line_text(line: dict) -> str:
    return "".join(span["text"] for span in line["spans"]).rstrip()


def _rgb(color_int: int) -> tuple[float, float, float]:
    r = ((color_int >> 16) & 255) / 255
    g = ((color_int >> 8) & 255) / 255
    b = (color_int & 255) / 255
    return (r, g, b)


def render_english_source(source: Path) -> pymupdf.Document:
    """Copy the original design and replace French copy with English."""
    doc = pymupdf.open(source)
    pending: list[tuple] = []
    scale_dx: dict[str, float] = {}

    for page_index, page in enumerate(doc):
        blocks = page.get_text("dict")["blocks"]
        for block in blocks:
            if block.get("type") != 0:
                continue
            for line in block.get("lines", []):
                text = _line_text(line).strip()
                if not text or _is_fill_line(text):
                    continue
                spans = line["spans"]
                y0 = min(s["bbox"][1] for s in spans)
                # Section 1 body is redrawn later; leave it (it will be redacted).
                if page_index == 0 and 174.6 < y0 < 269.0:
                    continue
                english = LINE_EN.get(text)
                if english is None or english == text:
                    continue
                x0 = min(s["bbox"][0] for s in spans)
                x1 = max(s["bbox"][2] for s in spans)
                y1 = max(s["bbox"][3] for s in spans)
                size = spans[0]["size"]
                bold = "Bold" in spans[0]["font"]
                color = _rgb(spans[0]["color"])
                # Cover the original ink without eating neighbouring checkboxes.
                redact = pymupdf.Rect(x0 - 0.4, y0 - 0.4, max(x1, x0 + 2) + 0.8, y1 + 0.4)
                # Widen enough to hide leftover French when English is shorter.
                redact.x1 = min(page.rect.width - 8, max(redact.x1, x0 + pymupdf.get_text_length(
                    english, fontname="hebo" if bold else "helv", fontsize=size
                ) + 2))
                page.add_redact_annot(redact, fill=(1, 1, 1))
                pending.append(
                    (page_index, x0, y0, size, bold, color, text, english)
                )

    for page in doc:
        page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE)

    for page_index, x0, y0, size, bold, color, french, english in pending:
        page = doc[page_index]
        fontname = "hebo" if bold else "helv"
        baseline = y0 + size * 0.80
        if french in SCALE_PREFIX:
            label, digit_xs, digits, group = SCALE_PREFIX[french]
            page.insert_text(
                (x0, baseline), label, fontsize=size, fontname=fontname, color=color
            )
            label_w = pymupdf.get_text_length(label + " ", fontname=fontname, fontsize=size)
            dx = (x0 + label_w) - digit_xs[0]
            scale_dx[group] = dx
            for orig_x, digit in zip(digit_xs, digits):
                page.insert_text(
                    (orig_x + dx, baseline),
                    digit,
                    fontsize=size,
                    fontname=fontname,
                    color=color,
                )
            continue
        if french in CENTERED:
            width = pymupdf.get_text_length(english, fontname=fontname, fontsize=size)
            x0 = (PAGE_W - width) / 2.0
        page.insert_text((x0, baseline), english, fontsize=size, fontname=fontname, color=color)

    return doc, scale_dx


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    visual, scale_dx = render_english_source(args.source)
    visual_path = args.output.parent / ".english_visual_source.pdf"
    visual.save(visual_path, garbage=4, deflate=True)
    visual.close()

    doc = build_form(
        visual_path,
        args.output,
        identity_labels=IDENTITY_LABELS_EN,
        field_labels=FIELD_LABELS_EN,
        scale_dx=scale_dx,
    )
    counts = [len(list(page.widgets() or [])) for page in doc]
    doc.close()
    visual_path.unlink(missing_ok=True)
    print(f"Wrote {args.output}")
    print(f"Widgets per page: {counts} (total {sum(counts)})")


if __name__ == "__main__":
    main()
