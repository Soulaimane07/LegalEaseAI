"""Test manuel rapide du moteur RAG avec une VRAIE cle Gemini (sans auth/HTTP).

Usage:
    export GEMINI_API_KEY="..."        # https://aistudio.google.com/apikey
    python try_analyze.py

Si tu as deja ingere des lois (ingest_laws.py), l'analyse sera "grounded"
(grounded=true) et les risques citeront des articles de loi.
"""
import json

from services.legal_analyzer import analyze_contract

SAMPLE_CONTRACT = """CONTRAT DE BAIL COMMERCIAL

Entre le bailleur M. X et le locataire Mme Y.
1. Le locataire s'engage a payer un loyer mensuel de 8000 MAD, payable d'avance.
2. En cas de retard de paiement, une penalite de 15% par jour de retard est appliquee.
3. Le bailleur peut resilier le contrat a tout moment et sans preavis.
4. Le depot de garantie est de 6 mois de loyer, non remboursable.
"""

if __name__ == "__main__":
    result = analyze_contract(SAMPLE_CONTRACT, language="fr")
    print(json.dumps(result, ensure_ascii=False, indent=2))
