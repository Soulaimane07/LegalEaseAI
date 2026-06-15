# 🧪 Guide de test local — LegalEase AI (branche RAG + Subscription)

Ce guide permet de lancer **toute l'app sur ta propre machine** (frontend + backend),
sur **n'importe quel réseau**. Tout tourne en **localhost** : pas besoin d'être sur le
même réseau que l'auteur de la branche.

## ✅ Prérequis
- **Python 3.10+** · **Node.js 20+** · **git**
- Une **clé Gemini gratuite** (sans carte) : https://aistudio.google.com/apikey

---

## 1. Cloner la branche de test
```bash
git clone -b test/rag-subscription https://github.com/Soulaimane07/LegalEaseAI.git
cd LegalEaseAI
```

## 2. Backend (FastAPI + SQLite + RAG)
```bash
cd src/backend

# Recréer un venv PROPRE (celui du repo n'est pas inclus)
python3 -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configurer les variables d'environnement
cp .env.example .env
#  -> ouvre .env et colle TA clé dans GEMINI_API_KEY=...
#     (FIREBASE_PROJECT_ID est déjà rempli)

# Lancer
uvicorn main:app --host 0.0.0.0 --port 8010
```
Vérif : ouvrir http://localhost:8010/api/health → doit afficher `{"status":"ok","engine":"sqlite"}`.

> ℹ️ Pas besoin de `serviceAccountKey.json` ni de Firestore : les tokens sont
> vérifiés via les certificats publics de Google (auth sans clé privée).

## 3. Frontend (React + Vite)
Dans un **2ᵉ terminal** :
```bash
cd src/frontend

# Config Firebase (fichier gitignored -> à créer depuis le template)
cp src/redux/slices/firebase.example.js src/redux/slices/firebase.js

npm install
npm run dev
```
Ouvre l'URL affichée (ex. **http://localhost:5173/**).

> Le frontend pointe par défaut sur `http://localhost:8010/api` (même machine).
> Pour viser un backend distant, crée `src/frontend/.env.local` avec :
> `VITE_API_BASE_URL=http://<ip-backend>:8010/api`

## 4. (Optionnel) Analyse ancrée sur la loi
Pour que les analyses citent des articles de loi :
```bash
cd src/backend && source venv/bin/activate
python ingest_laws.py "../../docs/Lois et Décrets.pdf" --reset --max-chunks 60
```

---

## 🔑 Connexion & abonnement
- Clique **Sign in** → connecte-toi avec **ton propre compte Google**.
  (On réutilise le même projet Firebase ; chaque compte a ses **propres données**.)
- Plan **gratuit = 3 analyses de contrat**. Au-delà → modal **Pro** (clic « Passer au Pro »
  pour débloquer l'illimité en mode démo).

## 📄 Contrats de test
Dossier **`test_documents/`** (bail piégé, NDA, contrat de travail, etc.) — à joindre
via le bouton **📎** dans le chat, puis **⚖️ Analyser le contrat**.

## 🩺 Dépannage
| Problème | Cause / solution |
|---|---|
| `GEMINI_API_KEY manquante` | Remplir `GEMINI_API_KEY` dans `src/backend/.env` |
| Login Google bloqué | Tester sur `localhost` (domaine autorisé par défaut dans Firebase) |
| `Failed to fetch` côté chat | Le backend (port 8010) n'est pas lancé, ou `VITE_API_BASE_URL` incorrect |
| `vite: not found` | Relancer `npm install` dans `src/frontend` |
| Réponses sans articles de loi | Lancer l'ingestion (étape 4) |
