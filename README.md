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
En tant que projet de **Master en IA Appliquée**, LegalEase AI repose sur un pipeline d'ingénierie rigoureux garantissant la fiabilité des résultats et l'évitement des hallucinations.

### 1. Architecture RAG (Retrieval-Augmented Generation)
Le cœur du système n'est pas une simple génération de texte, mais un système de récupération d'information contextuelle :
* **Indexing** : Les codes juridiques (marocains et français) sont segmentés (*chunking*) et transformés en vecteurs via le modèle `multilingual-e5-large`.
* **Retrieval** : Lors d'une requête, le système extrait les articles de loi les plus pertinents depuis une base vectorielle (**ChromaDB**).
* **Generation** : Le LLM génère l'analyse en s'appuyant exclusivement sur les documents récupérés, garantissant une base légale réelle.

### 2. Fine-Tuning & Alignement Bilingue
Pour traiter les nuances du droit en Arabe et en Français, nous explorons :
* **Adaptation au domaine** : Fine-tuning de modèles Open-Source (**Mistral-7B** ou **Llama-3**) sur un corpus de contrats annotés (jurilinguistique).
* **Instruction Tuning** : Optimisation des prompts pour l'extraction d'entités juridiques et la simplification de termes complexes.

### 3. Pipeline NLP & Prétraitement
* **OCR & Clean-up** : Nettoyage des documents PDF scannés et normalisation du texte pour éliminer le bruit de numérisation.
* **Analyse Sémantique** : Utilisation de techniques de *Cross-lingual Embeddings* pour assurer la cohérence entre les concepts juridiques dans les deux langues.

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
