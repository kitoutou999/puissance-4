// Configuration du jeu
const ROWS = 6;
const COLS = 7;
const PLAYER = 1;
const AI = 2;
const EMPTY = 0;

// Variables globales
let board = [];
let currentPlayer = PLAYER;
let gameActive = false;
let difficulty = null;
let stats = {
    playerWins: 0,
    aiWins: 0,
    draws: 0
};

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

// Initialiser le plateau
function initBoard() {
    board = Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
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
function startNewGame() {
    initBoard();
    currentPlayer = PLAYER;
    gameActive = true;

    difficultySelector.style.display = 'none';
    gameContainer.style.display = 'block';
    restartBtn.style.display = 'inline-block';
    changeDifficultyBtn.style.display = 'inline-block';

    updateStatus("À votre tour ! (Rouge)");
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
function handleCellClick(col) {
    if (!gameActive || currentPlayer !== PLAYER) return;

    if (makeMove(col, PLAYER)) {
        if (checkWin(PLAYER)) {
            endGame("Félicitations ! Vous avez gagné ! 🎉");
            stats.playerWins++;
            updateStats();
        } else if (isBoardFull()) {
            endGame("Match nul !");
            stats.draws++;
            updateStats();
        } else {
            currentPlayer = AI;
            updateStatus("L'IA réfléchit...");

            // Délai pour rendre le jeu plus naturel
            setTimeout(() => {
                const aiCol = getAIMove();
                makeMove(aiCol, AI);

                if (checkWin(AI)) {
                    endGame("L'IA a gagné ! Réessayez ! 🤖");
                    stats.aiWins++;
                    updateStats();
                } else if (isBoardFull()) {
                    endGame("Match nul !");
                    stats.draws++;
                    updateStats();
                } else {
                    currentPlayer = PLAYER;
                    updateStatus("À votre tour ! (Rouge)");
                }
            }, 500);
        }
    }
}

// Faire un mouvement
function makeMove(col, player) {
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row][col] === EMPTY) {
            board[row][col] = player;
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            cell.classList.add(player === PLAYER ? 'player' : 'ai');
            return true;
        }
    }
    return false;
}

// Obtenir le mouvement de l'IA
function getAIMove() {
    if (difficulty === 'unbeatable') {
        return getMinimaxMove();
    } else {
        return getIntermediateMove();
    }
}

// IA Imbattable - Minimax avec élagage alpha-bêta
function getMinimaxMove() {
    let bestScore = -Infinity;
    let bestCol = 3; // Colonne centrale par défaut

    for (let col = 0; col < COLS; col++) {
        if (isValidMove(col)) {
            // Simuler le mouvement
            const row = getLowestEmptyRow(col);
            board[row][col] = AI;

            const score = minimax(board, 5, -Infinity, Infinity, false);

            // Annuler le mouvement
            board[row][col] = EMPTY;

            if (score > bestScore) {
                bestScore = score;
                bestCol = col;
            }
        }
    }

    return bestCol;
}

// Algorithme Minimax avec élagage alpha-bêta
function minimax(board, depth, alpha, beta, isMaximizing) {
    // Vérifier les conditions de fin
    if (checkWin(AI)) return 10000 - (5 - depth) * 10;
    if (checkWin(PLAYER)) return -10000 + (5 - depth) * 10;
    if (isBoardFull() || depth === 0) return evaluateBoard();

    if (isMaximizing) {
        let maxScore = -Infinity;
        for (let col = 0; col < COLS; col++) {
            if (isValidMove(col)) {
                const row = getLowestEmptyRow(col);
                board[row][col] = AI;
                const score = minimax(board, depth - 1, alpha, beta, false);
                board[row][col] = EMPTY;
                maxScore = Math.max(maxScore, score);
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break;
            }
        }
        return maxScore;
    } else {
        let minScore = Infinity;
        for (let col = 0; col < COLS; col++) {
            if (isValidMove(col)) {
                const row = getLowestEmptyRow(col);
                board[row][col] = PLAYER;
                const score = minimax(board, depth - 1, alpha, beta, true);
                board[row][col] = EMPTY;
                minScore = Math.min(minScore, score);
                beta = Math.min(beta, score);
                if (beta <= alpha) break;
            }
        }
        return minScore;
    }
}

// Évaluer le plateau (heuristique)
function evaluateBoard() {
    let score = 0;

    // Privilégier le centre
    const centerCol = Math.floor(COLS / 2);
    for (let row = 0; row < ROWS; row++) {
        if (board[row][centerCol] === AI) score += 3;
        if (board[row][centerCol] === PLAYER) score -= 3;
    }

    // Évaluer les séquences
    score += evaluateSequences(AI) - evaluateSequences(PLAYER);

    return score;
}

// Évaluer les séquences de jetons
function evaluateSequences(player) {
    let score = 0;

    // Vérifier toutes les directions
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            // Horizontal
            if (col <= COLS - 4) {
                score += evaluateWindow([board[row][col], board[row][col+1], board[row][col+2], board[row][col+3]], player);
            }
            // Vertical
            if (row <= ROWS - 4) {
                score += evaluateWindow([board[row][col], board[row+1][col], board[row+2][col], board[row+3][col]], player);
            }
            // Diagonale descendante
            if (row <= ROWS - 4 && col <= COLS - 4) {
                score += evaluateWindow([board[row][col], board[row+1][col+1], board[row+2][col+2], board[row+3][col+3]], player);
            }
            // Diagonale montante
            if (row >= 3 && col <= COLS - 4) {
                score += evaluateWindow([board[row][col], board[row-1][col+1], board[row-2][col+2], board[row-3][col+3]], player);
            }
        }
    }

    return score;
}

// Évaluer une fenêtre de 4 cellules
function evaluateWindow(window, player) {
    let score = 0;
    const opponent = player === AI ? PLAYER : AI;

    const playerCount = window.filter(cell => cell === player).length;
    const emptyCount = window.filter(cell => cell === EMPTY).length;
    const opponentCount = window.filter(cell => cell === opponent).length;

    if (playerCount === 4) score += 100;
    else if (playerCount === 3 && emptyCount === 1) score += 5;
    else if (playerCount === 2 && emptyCount === 2) score += 2;

    if (opponentCount === 3 && emptyCount === 1) score -= 4;

    return score;
}

// IA Intermédiaire - Stratégie semi-aléatoire intelligente
function getIntermediateMove() {
    // 1. Vérifier si l'IA peut gagner
    for (let col = 0; col < COLS; col++) {
        if (isValidMove(col)) {
            const row = getLowestEmptyRow(col);
            board[row][col] = AI;
            if (checkWin(AI)) {
                board[row][col] = EMPTY;
                return col;
            }
            board[row][col] = EMPTY;
        }
    }

    // 2. Bloquer le joueur s'il peut gagner
    for (let col = 0; col < COLS; col++) {
        if (isValidMove(col)) {
            const row = getLowestEmptyRow(col);
            board[row][col] = PLAYER;
            if (checkWin(PLAYER)) {
                board[row][col] = EMPTY;
                return col;
            }
            board[row][col] = EMPTY;
        }
    }

    // 3. 70% du temps, jouer stratégiquement (préférer centre et créer des opportunités)
    if (Math.random() < 0.7) {
        // Privilégier les colonnes centrales
        const preferredCols = [3, 2, 4, 1, 5, 0, 6];
        for (let col of preferredCols) {
            if (isValidMove(col)) {
                // Vérifier que ce mouvement ne donne pas une victoire au joueur au prochain coup
                const row = getLowestEmptyRow(col);
                board[row][col] = AI;
                let givesOpponentWin = false;

                // Vérifier si le joueur peut gagner juste au-dessus
                if (row > 0) {
                    board[row-1][col] = PLAYER;
                    if (checkWin(PLAYER)) {
                        givesOpponentWin = true;
                    }
                    board[row-1][col] = EMPTY;
                }

                board[row][col] = EMPTY;

                if (!givesOpponentWin) {
                    return col;
                }
            }
        }
    }

    // 4. 30% du temps ou si pas de bon coup, jouer aléatoirement
    const validCols = [];
    for (let col = 0; col < COLS; col++) {
        if (isValidMove(col)) validCols.push(col);
    }
    return validCols[Math.floor(Math.random() * validCols.length)];
}

// Vérifier si un mouvement est valide
function isValidMove(col) {
    return board[0][col] === EMPTY;
}

// Obtenir la rangée la plus basse disponible
function getLowestEmptyRow(col) {
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row][col] === EMPTY) {
            return row;
        }
    }
    return -1;
}

// Vérifier la victoire
function checkWin(player) {
    // Horizontal
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS - 3; col++) {
            if (board[row][col] === player &&
                board[row][col + 1] === player &&
                board[row][col + 2] === player &&
                board[row][col + 3] === player) {
                highlightWinningCells([[row, col], [row, col + 1], [row, col + 2], [row, col + 3]]);
                return true;
            }
        }
    }

    // Vertical
    for (let row = 0; row < ROWS - 3; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col] === player &&
                board[row + 1][col] === player &&
                board[row + 2][col] === player &&
                board[row + 3][col] === player) {
                highlightWinningCells([[row, col], [row + 1, col], [row + 2, col], [row + 3, col]]);
                return true;
            }
        }
    }

    // Diagonale descendante
    for (let row = 0; row < ROWS - 3; row++) {
        for (let col = 0; col < COLS - 3; col++) {
            if (board[row][col] === player &&
                board[row + 1][col + 1] === player &&
                board[row + 2][col + 2] === player &&
                board[row + 3][col + 3] === player) {
                highlightWinningCells([[row, col], [row + 1, col + 1], [row + 2, col + 2], [row + 3, col + 3]]);
                return true;
            }
        }
    }

    // Diagonale montante
    for (let row = 3; row < ROWS; row++) {
        for (let col = 0; col < COLS - 3; col++) {
            if (board[row][col] === player &&
                board[row - 1][col + 1] === player &&
                board[row - 2][col + 2] === player &&
                board[row - 3][col + 3] === player) {
                highlightWinningCells([[row, col], [row - 1, col + 1], [row - 2, col + 2], [row - 3, col + 3]]);
                return true;
            }
        }
    }

    return false;
}

// Mettre en surbrillance les cellules gagnantes
function highlightWinningCells(cells) {
    cells.forEach(([row, col]) => {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('winning');
    });
}

// Vérifier si le plateau est plein
function isBoardFull() {
    return board[0].every(cell => cell !== EMPTY);
}

// Terminer le jeu
function endGame(message) {
    gameActive = false;
    updateStatus(message);

    // Désactiver toutes les cellules
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
}
