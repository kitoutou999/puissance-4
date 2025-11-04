class GameEngine {
    constructor(difficulty = 'intermediate') {
        this.ROWS = 6;
        this.COLS = 7;
        this.PLAYER = 1;
        this.AI = 2;
        this.EMPTY = 0;

        this.board = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(this.EMPTY));
        this.currentPlayer = this.PLAYER;
        this.difficulty = difficulty;
        this.createdAt = Date.now();
    }

    getBoard() {
        return this.board;
    }

    getCurrentPlayer() {
        return this.currentPlayer;
    }

    // Faire un mouvement
    makeMove(col, player) {
        if (!this.isValidMove(col)) {
            return { success: false, error: 'Colonne invalide ou pleine' };
        }

        const row = this.getLowestEmptyRow(col);
        this.board[row][col] = player;

        const winner = this.checkWin(player);
        const draw = !winner && this.isBoardFull();

        return {
            success: true,
            row,
            col,
            winner: winner ? player : null,
            winningCells: winner ? this.lastWinningCells : null,
            draw
        };
    }

    // Obtenir le mouvement de l'IA
    getAIMove() {
        if (this.difficulty === 'unbeatable') {
            return this.getMinimaxMove();
        } else {
            return this.getIntermediateMove();
        }
    }

    // IA Imbattable - Minimax avec élagage alpha-bêta
    getMinimaxMove() {
        let bestScore = -Infinity;
        let bestCol = 3; // Colonne centrale par défaut

        for (let col = 0; col < this.COLS; col++) {
            if (this.isValidMove(col)) {
                const row = this.getLowestEmptyRow(col);
                this.board[row][col] = this.AI;

                const score = this.minimax(5, -Infinity, Infinity, false);

                this.board[row][col] = this.EMPTY;

                if (score > bestScore) {
                    bestScore = score;
                    bestCol = col;
                }
            }
        }

        return bestCol;
    }

    // Algorithme Minimax avec élagage alpha-bêta
    minimax(depth, alpha, beta, isMaximizing) {
        if (this.checkWin(this.AI)) return 10000 - (5 - depth) * 10;
        if (this.checkWin(this.PLAYER)) return -10000 + (5 - depth) * 10;
        if (this.isBoardFull() || depth === 0) return this.evaluateBoard();

        if (isMaximizing) {
            let maxScore = -Infinity;
            for (let col = 0; col < this.COLS; col++) {
                if (this.isValidMove(col)) {
                    const row = this.getLowestEmptyRow(col);
                    this.board[row][col] = this.AI;
                    const score = this.minimax(depth - 1, alpha, beta, false);
                    this.board[row][col] = this.EMPTY;
                    maxScore = Math.max(maxScore, score);
                    alpha = Math.max(alpha, score);
                    if (beta <= alpha) break;
                }
            }
            return maxScore;
        } else {
            let minScore = Infinity;
            for (let col = 0; col < this.COLS; col++) {
                if (this.isValidMove(col)) {
                    const row = this.getLowestEmptyRow(col);
                    this.board[row][col] = this.PLAYER;
                    const score = this.minimax(depth - 1, alpha, beta, true);
                    this.board[row][col] = this.EMPTY;
                    minScore = Math.min(minScore, score);
                    beta = Math.min(beta, score);
                    if (beta <= alpha) break;
                }
            }
            return minScore;
        }
    }

    // Évaluer le plateau
    evaluateBoard() {
        let score = 0;

        // Privilégier le centre
        const centerCol = Math.floor(this.COLS / 2);
        for (let row = 0; row < this.ROWS; row++) {
            if (this.board[row][centerCol] === this.AI) score += 3;
            if (this.board[row][centerCol] === this.PLAYER) score -= 3;
        }

        score += this.evaluateSequences(this.AI) - this.evaluateSequences(this.PLAYER);

        return score;
    }

    // Évaluer les séquences de jetons
    evaluateSequences(player) {
        let score = 0;

        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (col <= this.COLS - 4) {
                    score += this.evaluateWindow([
                        this.board[row][col],
                        this.board[row][col+1],
                        this.board[row][col+2],
                        this.board[row][col+3]
                    ], player);
                }
                if (row <= this.ROWS - 4) {
                    score += this.evaluateWindow([
                        this.board[row][col],
                        this.board[row+1][col],
                        this.board[row+2][col],
                        this.board[row+3][col]
                    ], player);
                }
                if (row <= this.ROWS - 4 && col <= this.COLS - 4) {
                    score += this.evaluateWindow([
                        this.board[row][col],
                        this.board[row+1][col+1],
                        this.board[row+2][col+2],
                        this.board[row+3][col+3]
                    ], player);
                }
                if (row >= 3 && col <= this.COLS - 4) {
                    score += this.evaluateWindow([
                        this.board[row][col],
                        this.board[row-1][col+1],
                        this.board[row-2][col+2],
                        this.board[row-3][col+3]
                    ], player);
                }
            }
        }

        return score;
    }

    // Évaluer une fenêtre de 4 cellules
    evaluateWindow(window, player) {
        let score = 0;
        const opponent = player === this.AI ? this.PLAYER : this.AI;

        const playerCount = window.filter(cell => cell === player).length;
        const emptyCount = window.filter(cell => cell === this.EMPTY).length;
        const opponentCount = window.filter(cell => cell === opponent).length;

        if (playerCount === 4) score += 100;
        else if (playerCount === 3 && emptyCount === 1) score += 5;
        else if (playerCount === 2 && emptyCount === 2) score += 2;

        if (opponentCount === 3 && emptyCount === 1) score -= 4;

        return score;
    }

    // IA Intermédiaire
    getIntermediateMove() {
        // 1. Vérifier si l'IA peut gagner
        for (let col = 0; col < this.COLS; col++) {
            if (this.isValidMove(col)) {
                const row = this.getLowestEmptyRow(col);
                this.board[row][col] = this.AI;
                if (this.checkWin(this.AI)) {
                    this.board[row][col] = this.EMPTY;
                    return col;
                }
                this.board[row][col] = this.EMPTY;
            }
        }

        // 2. Bloquer le joueur
        for (let col = 0; col < this.COLS; col++) {
            if (this.isValidMove(col)) {
                const row = this.getLowestEmptyRow(col);
                this.board[row][col] = this.PLAYER;
                if (this.checkWin(this.PLAYER)) {
                    this.board[row][col] = this.EMPTY;
                    return col;
                }
                this.board[row][col] = this.EMPTY;
            }
        }

        // 3. Jouer stratégiquement (70% du temps)
        if (Math.random() < 0.7) {
            const preferredCols = [3, 2, 4, 1, 5, 0, 6];
            for (let col of preferredCols) {
                if (this.isValidMove(col)) {
                    const row = this.getLowestEmptyRow(col);
                    this.board[row][col] = this.AI;
                    let givesOpponentWin = false;

                    if (row > 0) {
                        this.board[row-1][col] = this.PLAYER;
                        if (this.checkWin(this.PLAYER)) {
                            givesOpponentWin = true;
                        }
                        this.board[row-1][col] = this.EMPTY;
                    }

                    this.board[row][col] = this.EMPTY;

                    if (!givesOpponentWin) {
                        return col;
                    }
                }
            }
        }

        // 4. Jouer aléatoirement
        const validCols = [];
        for (let col = 0; col < this.COLS; col++) {
            if (this.isValidMove(col)) validCols.push(col);
        }
        return validCols[Math.floor(Math.random() * validCols.length)];
    }

    // Vérifier si un mouvement est valide
    isValidMove(col) {
        return col >= 0 && col < this.COLS && this.board[0][col] === this.EMPTY;
    }

    // Obtenir la rangée la plus basse disponible
    getLowestEmptyRow(col) {
        for (let row = this.ROWS - 1; row >= 0; row--) {
            if (this.board[row][col] === this.EMPTY) {
                return row;
            }
        }
        return -1;
    }

    // Vérifier la victoire
    checkWin(player) {
        // Horizontal
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS - 3; col++) {
                if (this.board[row][col] === player &&
                    this.board[row][col + 1] === player &&
                    this.board[row][col + 2] === player &&
                    this.board[row][col + 3] === player) {
                    this.lastWinningCells = [[row, col], [row, col + 1], [row, col + 2], [row, col + 3]];
                    return true;
                }
            }
        }

        // Vertical
        for (let row = 0; row < this.ROWS - 3; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.board[row][col] === player &&
                    this.board[row + 1][col] === player &&
                    this.board[row + 2][col] === player &&
                    this.board[row + 3][col] === player) {
                    this.lastWinningCells = [[row, col], [row + 1, col], [row + 2, col], [row + 3, col]];
                    return true;
                }
            }
        }

        // Diagonale descendante
        for (let row = 0; row < this.ROWS - 3; row++) {
            for (let col = 0; col < this.COLS - 3; col++) {
                if (this.board[row][col] === player &&
                    this.board[row + 1][col + 1] === player &&
                    this.board[row + 2][col + 2] === player &&
                    this.board[row + 3][col + 3] === player) {
                    this.lastWinningCells = [[row, col], [row + 1, col + 1], [row + 2, col + 2], [row + 3, col + 3]];
                    return true;
                }
            }
        }

        // Diagonale montante
        for (let row = 3; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS - 3; col++) {
                if (this.board[row][col] === player &&
                    this.board[row - 1][col + 1] === player &&
                    this.board[row - 2][col + 2] === player &&
                    this.board[row - 3][col + 3] === player) {
                    this.lastWinningCells = [[row, col], [row - 1, col + 1], [row - 2, col + 2], [row - 3, col + 3]];
                    return true;
                }
            }
        }

        return false;
    }

    // Vérifier si le plateau est plein
    isBoardFull() {
        return this.board[0].every(cell => cell !== this.EMPTY);
    }
}

module.exports = GameEngine;
