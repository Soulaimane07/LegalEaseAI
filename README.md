# LegalEase AI ⚖️🤖

> **Rendre le droit accessible, compréhensible et exploitable grâce à l'IA.**

LegalEase AI est une plateforme **LegalTech SaaS** spécialisée dans l’analyse et la simplification de documents juridiques complexes. Notre mission est de lever les barrières linguistiques et techniques pour les PME, les freelances et les particuliers en proposant une analyse bilingue (**Arabe & Français**) de haute précision.

---

## 📋 Table des Matières
* [Vision du Projet](#vision-du-projet)
* [Fonctionnalités Clés](#fonctionnalités-clés)
* [Stack Technique](#stack-technique)
* [Structure du Projet](#structure-du-projet)
* [Installation et Utilisation](#installation-et-utilisation)
* [Équipe Fondatrice](#équipe-fondatrice)
* [Feuille de Route (Roadmap)](#feuille-de-route)

---

## 🎯 Vision du Projet
Dans un environnement où les contrats sont denses et souvent rédigés dans un langage opaque, LegalEase AI utilise l'Intelligence Artificielle pour :
- **Réduire les coûts** juridiques.
- **Minimiser les risques** contractuels.
- **Gagner du temps** lors des processus de signature.

---

## 🧠 Méthodologie IA & Modélisation
Pour garantir un niveau d'expertise Master, le projet repose sur deux piliers techniques :

### 1. Architecture RAG (Retrieval-Augmented Generation)
Le modèle ne génère pas de réponses par "intuition" statistique. Il utilise un processus de récupération :
* **Indexing** : Les codes de lois sont vectorisés avec `multilingual-e5-large`.
* **Retrieval** : Extraction en temps réel des articles de loi pertinents depuis **ChromaDB**.
* **Generation** : Le LLM (GPT-4 ou Mistral) synthétise l'analyse en se basant uniquement sur ces sources vérifiées.

### 2. Fine-Tuning & Traitement NLP
* **Fine-Tuning** : Optimisation de modèles (Llama-3/Mistral) sur la structure des contrats (NDA, Baux).
* **Normalisation** : Pipeline de traitement de l'Arabe juridique et OCR pour les documents scannés.

---

## 📊 Stratégie de Données (Data Purpose)
La section `/data` de ce projet n'est pas un simple stockage, elle constitue le "carburant" de l'intelligence du système :

| Catégorie de fichiers | Rôle & Utilité Technique | Objectif Final |
| :--- | :--- | :--- |
| **Codes Officiels (DOC, Commerce)** | Base de connaissances pour le RAG. | **Éliminer les hallucinations** en ancrant l'IA dans la loi réelle. |
| **Modèles de Contrats (NDA, Travail)** | Dataset pour le Fine-Tuning. | Apprendre à l'IA à **identifier les structures** contractuelles complexes. |
| **Paires de Simplification** | Dataset d'entraînement "Input/Output". | Apprendre à l'IA à **vulgariser le jargon** sans perdre le sens juridique. |
| **Documents Scannés (OCR)** | Données de test "Raw". | Garantir la **robustesse du pipeline** face à des documents de mauvaise qualité. |

---

## ✨ Fonctionnalités Clés
- 📝 **Résumé Automatique** : Synthèse claire des points essentiels d'un contrat.
- 🔍 **Détection de Clauses à Risque** : Identification des points de vigilance (pénalités, clauses abusives).
- 🌍 **Support Bilingue** : Traitement natif des documents en Arabe et en Français.
- 💡 **Explication Pédagogique** : Traduction du jargon juridique en langage courant.
- 📊 **Visualisation** : Dashboard intuitif pour suivre ses obligations contractuelles.

---

## 💻 Stack Technique
Le projet repose sur une architecture moderne assurant sécurité et scalabilité :

* **Backend** : Python 3.9, FastAPI
* **Intelligence Artificielle** : LangChain, OpenAI GPT-4 / Mistral AI (RAG - Retrieval-Augmented Generation)
* **Frontend** : React.js
* **Base de Données** : PostgreSQL
* **Sécurité** : Chiffrement AES-256 pour les documents importés.

---

## 📂 Structure du Projet
```text
/LegalEaseAI
│
├── /docs            # Business Plan, Analyse de Marché
├── /backend         # API et Logique IA (Python)
├── /frontend        # Interface utilisateur (React.js)
├── /data            # Exemples de documents (anonymisés) pour tests
├── .gitignore       # Exclusion des fichiers sensibles
└── README.md        # Documentation principale
```


## 👥 Équipe Fondatrice
- OUHMIDA Soulaimane – CEO | Responsable Technique & IA
- EL MOUHTADI Feirouz – CMO | Stratégie Commerciale & Marketing
- HAIMOUDI Nouaman – CTO | Stratégie, Gestion & Coordination
