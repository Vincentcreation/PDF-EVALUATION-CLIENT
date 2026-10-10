# PDF-EVALUATION-CLIENT

Formulaire d'évaluation client **Elevate Fitness**, version PDF remplissable.

Le PDF original reste la couche visuelle de référence. Les champs AcroForm sont superposés sur les lignes, cases et échelles déjà présentes. La rangée **Date de naissance** et **Âge** est ajoutée dans la section Informations de base.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `original/Elevate_Fitness_Formulaire_Client.pdf` | PDF original (design, texte, mise en page) |
| `Elevate-Formulaire-Evaluation-Client-remplissable.pdf` | Version à envoyer aux clients |
| `scripts/add_acroform_fields.py` | Script qui ajoute les champs interactifs |

## Utilisation

Envoyer `Elevate-Formulaire-Evaluation-Client-remplissable.pdf` aux clients. Ils peuvent le remplir dans **Adobe Acrobat Reader**, l'enregistrer, puis le retourner.

## Régénérer le PDF remplissable

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/add_acroform_fields.py
```

Le script ouvre le PDF original, insère les libellés Date de naissance / Âge, puis ajoute les champs AcroForm.
