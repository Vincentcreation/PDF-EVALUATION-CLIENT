# PDF-EVALUATION-CLIENT

Formulaire d'évaluation client **Elevate Fitness**, versions PDF remplissables (français et anglais).

Le PDF original reste la couche visuelle de référence pour les sections 2 à 9. La section **1. INFORMATIONS DE BASE** / **1. BASIC INFORMATION** est redessinée avec des libellés au-dessus de champs plus aérés (y compris **Date de naissance / Date of birth** et **Âge / Age**). Les champs AcroForm sont alignés sur cette mise en page.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `original/Elevate_Fitness_Formulaire_Client.pdf` | PDF original (design, texte, mise en page) |
| `Elevate-Formulaire-Evaluation-Client-remplissable.pdf` | Version française à envoyer aux clients |
| `Elevate_Fitness_Client_Assessment_EN.pdf` | Version anglaise à envoyer aux clients |
| `scripts/add_acroform_fields.py` | Génère le PDF français remplissable |
| `scripts/build_english_form.py` | Traduit le visuel puis génère le PDF anglais remplissable |

## Utilisation

Envoyer le PDF de la langue voulue aux clients. Ils peuvent le remplir dans **Adobe Acrobat Reader**, l'enregistrer, puis le retourner.

## Régénérer les PDF remplissables

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/add_acroform_fields.py
python scripts/build_english_form.py
```

Le script français redessine la section Informations de base, décale les sections suivantes pour éviter tout chevauchement, puis ajoute les champs AcroForm. Le script anglais part du même original, remplace le texte par une traduction professionnelle, puis applique la même mise en page et les mêmes champs interactifs.
