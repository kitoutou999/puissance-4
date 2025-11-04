// Configuration
const ROWS = 6;
const COLS = 7;

// Variables globales
let currentGameId = null;
let gameActive = false;
let difficulty = null;
let stats = {
    playerWins: 0,
    aiWins: 0,
    draws: 0
};

// Connexion WebSocket (pour le système de vote futur)
const socket = io();

// Éléments DOM
const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const restartBtn = document.getElementById('restart-btn');
const changeDifficultyBtn = document.getElementById('change-difficulty-btn');
const difficultySelector = document.getElementById('difficulty-selector');
const gameContainer = document.getElementById('game-container');
const playerWinsElement = document.getElementById('player-wins');
const aiWinsElement = document.getElementById('ai-wins');
const drawsElement = document.getElementById('draws');

// Initialisation
document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        difficulty = btn.dataset.difficulty;
        startNewGame();
    });
});

restartBtn.addEventListener('click', startNewGame);
changeDifficultyBtn.addEventListener('click', showDifficultySelector);

// Charger les statistiques depuis localStorage
loadStats();

// Initialiser le plateau
function initBoard() {
    boardElement.innerHTML = '';

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', () => handleCellClick(col));
            boardElement.appendChild(cell);
        }
    }
}

// Démarrer une nouvelle partie
async function startNewGame() {
    try {
        updateStatus("Création de la partie...");

        const response = await fetch('/api/game/new', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ difficulty })
        });

        const data = await response.json();
        currentGameId = data.gameId;

        initBoard();
        gameActive = true;

        difficultySelector.style.display = 'none';
        gameContainer.style.display = 'block';
        restartBtn.style.display = 'inline-block';
        changeDifficultyBtn.style.display = 'inline-block';

        updateStatus("À votre tour ! (Rouge)");
    } catch (error) {
        console.error('Erreur lors de la création de la partie:', error);
        updateStatus("Erreur lors de la création de la partie");
    }
}

// Afficher le sélecteur de difficulté
function showDifficultySelector() {
    difficultySelector.style.display = 'block';
    gameContainer.style.display = 'none';
    restartBtn.style.display = 'none';
    changeDifficultyBtn.style.display = 'none';
    gameActive = false;
    updateStatus("Sélectionnez un niveau de difficulté");
}

// Gérer le clic sur une cellule
async function handleCellClick(col) {
    if (!gameActive) return;

    try {
        // Désactiver les clics pendant le traitement
        gameActive = false;
        updateStatus("Traitement du coup...");

        const response = await fetch(`/api/game/${currentGameId}/move`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ column: col })
        });

        const data = await response.json();

        if (!response.ok) {
            updateStatus(data.error || "Mouvement invalide");
            gameActive = true;
            return;
        }

        // Afficher le coup du joueur
        if (data.playerMove) {
            updateCell(data.playerMove.row, data.playerMove.column, 'player');
        }

        // Petit délai pour l'animation
        await new Promise(resolve => setTimeout(resolve, 600));

        // Afficher le coup de l'IA
        if (data.aiMove) {
            updateStatus("L'IA joue...");
            await new Promise(resolve => setTimeout(resolve, 400));
            updateCell(data.aiMove.row, data.aiMove.column, 'ai');
        }

        // Vérifier la fin de partie
        if (data.gameOver) {
            await new Promise(resolve => setTimeout(resolve, 300));

            if (data.winner === 1) {
                stats.playerWins++;
                updateStats();
                highlightWinningCells(data.winningCells);
                updateStatus("Félicitations ! Vous avez gagné ! 🎉");
            } else if (data.winner === 2) {
                stats.aiWins++;
                updateStats();
                highlightWinningCells(data.winningCells);
                updateStatus("L'IA a gagné ! Réessayez ! 🤖");
            } else if (data.draw) {
                stats.draws++;
                updateStats();
                updateStatus("Match nul !");
            }

            disableAllCells();
        } else {
            gameActive = true;
            updateStatus("À votre tour ! (Rouge)");
        }

    } catch (error) {
        console.error('Erreur lors du coup:', error);
        updateStatus("Erreur lors du coup");
        gameActive = true;
    }
}

// Mettre à jour une cellule
function updateCell(row, col, player) {
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (cell) {
        cell.classList.add(player);
    }
}

// Mettre en surbrillance les cellules gagnantes
function highlightWinningCells(cells) {
    if (!cells) return;

    cells.forEach(([row, col]) => {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add('winning');
        }
    });
}

// Désactiver toutes les cellules
function disableAllCells() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.add('disabled');
    });
}

// Mettre à jour le statut
function updateStatus(message) {
    statusElement.textContent = message;
}

// Mettre à jour les statistiques
function updateStats() {
    playerWinsElement.textContent = stats.playerWins;
    aiWinsElement.textContent = stats.aiWins;
    drawsElement.textContent = stats.draws;
    saveStats();
}

// Sauvegarder les statistiques
function saveStats() {
    localStorage.setItem('puissance4Stats', JSON.stringify(stats));
}

// Charger les statistiques
function loadStats() {
    const saved = localStorage.getItem('puissance4Stats');
    if (saved) {
        stats = JSON.parse(saved);
        updateStats();
    }
}

// WebSocket - Préparation pour le système de vote
socket.on('connect', () => {
    console.log('Connecté au serveur WebSocket');
});

socket.on('voteUpdate', (data) => {
    // À implémenter pour le système de vote
    console.log('Vote reçu:', data);
});
