# Puissance 4 - Jeu avec IA

Un jeu de Puissance 4 interactif avec deux niveaux d'IA, développé avec Node.js et Express. Architecture préparée pour un futur système de vote par téléphone pour le jeu en classe.

## Fonctionnalités

- **2 niveaux d'IA :**
  - **IA Intermédiaire** : Bonne stratégie mais battable, idéale pour s'entraîner
  - **IA Imbattable** : Utilise l'algorithme Minimax avec élagage alpha-bêta, pratiquement impossible à battre

- **Interface moderne et responsive**
- **Animations fluides** pour les pions qui tombent
- **Statistiques de jeu** sauvegardées localement
- **Architecture client-serveur** prête pour extensions multijoueur
- **WebSocket intégré** pour les futures fonctionnalités de vote

## Installation

### Prérequis
- Node.js (version 14 ou supérieure)
- npm ou yarn

### Étapes d'installation

1. Cloner ou télécharger le projet

2. Installer les dépendances :
```bash
npm install
```

## Lancement du jeu

### Mode normal
```bash
npm start
```

### Mode développement (avec rechargement automatique)
```bash
npm run dev
```

Le serveur démarrera sur `http://localhost:3000`

## Comment jouer

1. Ouvrez votre navigateur et accédez à `http://localhost:3000`
2. Choisissez votre niveau de difficulté :
   - **IA Intermédiaire** : Parfait pour commencer et avoir des chances de gagner
   - **IA Imbattable** : Le défi ultime !
3. Cliquez sur une colonne pour placer votre pion (rouge)
4. L'IA joue automatiquement son coup (jaune)
5. Le premier à aligner 4 pions horizontalement, verticalement ou en diagonale gagne !

## Structure du projet

```
puissance-4/
├── server.js           # Serveur Express principal
├── game-engine.js      # Logique du jeu et algorithmes d'IA
├── package.json        # Dépendances du projet
├── public/             # Fichiers frontend
│   ├── index.html      # Interface du jeu
│   ├── style.css       # Styles
│   └── script.js       # Logique client
└── README.md           # Ce fichier
```

## Algorithmes d'IA

### IA Intermédiaire
- Détecte et joue les coups gagnants
- Bloque les coups gagnants de l'adversaire
- Privilégie les colonnes centrales (70% du temps)
- Évite de créer des opportunités pour l'adversaire
- Ajoute une part d'aléatoire pour la rendre battable

### IA Imbattable (Minimax)
- Algorithme Minimax avec élagage alpha-bêta
- Profondeur de recherche : 5 coups
- Fonction d'évaluation sophistiquée :
  - Privilégie le contrôle du centre
  - Évalue les séquences de 2, 3 et 4 pions
  - Détecte et bloque les menaces
  - Maximise ses propres opportunités

## Évolutions prévues

### Système de vote par téléphone (à venir)
Le projet est architecturé pour accueillir un système de vote permettant à une classe entière de jouer contre l'IA :

- Les élèves votent pour la colonne via leur téléphone
- Le vote majoritaire détermine le coup joué
- Affichage en temps réel des votes
- Système de salles pour plusieurs classes simultanées

L'infrastructure WebSocket est déjà en place pour cette fonctionnalité.

## Technologies utilisées

- **Backend** : Node.js, Express, Socket.IO
- **Frontend** : HTML5, CSS3, JavaScript (Vanilla)
- **Architecture** : REST API + WebSocket

## API Endpoints

### POST `/api/game/new`
Crée une nouvelle partie
```json
{
  "difficulty": "intermediate" | "unbeatable"
}
```

### POST `/api/game/:gameId/move`
Effectue un mouvement
```json
{
  "column": 0-6
}
```

## Licence

MIT
