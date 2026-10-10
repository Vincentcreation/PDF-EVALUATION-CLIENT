# PDF-EVALUATION-CLIENT

Formulaire d'évaluation client **Elevate Fitness**, version PDF remplissable.

Le PDF original reste la couche visuelle de référence pour les sections 2 à 9. La section **1. INFORMATIONS DE BASE** est redessinée avec des libellés au-dessus de champs plus aérés (y compris **Date de naissance** et **Âge**). Les champs AcroForm sont alignés sur cette mise en page.

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

Le script redessine la section Informations de base, décale les sections suivantes pour éviter tout chevauchement, puis ajoute les champs AcroForm.
