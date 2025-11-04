const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const GameEngine = require('./game-engine');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Stockage des parties en cours
const games = new Map();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API pour créer une nouvelle partie
app.post('/api/game/new', (req, res) => {
    const { difficulty } = req.body;
    const gameId = generateGameId();
    const game = new GameEngine(difficulty);

    games.set(gameId, game);

    res.json({
        gameId,
        board: game.getBoard(),
        currentPlayer: game.getCurrentPlayer(),
        difficulty
    });
});

// API pour faire un mouvement
app.post('/api/game/:gameId/move', (req, res) => {
    const { gameId } = req.params;
    const { column } = req.body;

    const game = games.get(gameId);
    if (!game) {
        return res.status(404).json({ error: 'Partie non trouvée' });
    }

    try {
        // Mouvement du joueur
        const result = game.makeMove(column, 1);

        if (!result.success) {
            return res.status(400).json({ error: 'Mouvement invalide' });
        }

        // Vérifier victoire du joueur
        if (result.winner) {
            return res.json({
                board: game.getBoard(),
                winner: result.winner,
                winningCells: result.winningCells,
                gameOver: true
            });
        }

        // Vérifier égalité
        if (result.draw) {
            return res.json({
                board: game.getBoard(),
                draw: true,
                gameOver: true
            });
        }

        // Mouvement de l'IA
        const aiMove = game.getAIMove();
        const aiResult = game.makeMove(aiMove, 2);

        res.json({
            board: game.getBoard(),
            playerMove: { column, row: result.row },
            aiMove: { column: aiMove, row: aiResult.row },
            winner: aiResult.winner,
            winningCells: aiResult.winningCells,
            draw: aiResult.draw,
            gameOver: aiResult.winner || aiResult.draw
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// WebSocket pour les futures fonctionnalités de vote
io.on('connection', (socket) => {
    console.log('Nouveau client connecté:', socket.id);

    // Pour le système de vote futur
    socket.on('joinVotingRoom', (roomId) => {
        socket.join(roomId);
        console.log(`Client ${socket.id} a rejoint la salle ${roomId}`);
    });

    socket.on('vote', (data) => {
        // Logique de vote à implémenter plus tard
        const { roomId, column } = data;
        io.to(roomId).emit('voteUpdate', data);
    });

    socket.on('disconnect', () => {
        console.log('Client déconnecté:', socket.id);
    });
});

// Fonction utilitaire pour générer un ID de partie
function generateGameId() {
    return Math.random().toString(36).substring(2, 9);
}

// Nettoyer les anciennes parties (toutes les heures)
setInterval(() => {
    const now = Date.now();
    for (const [gameId, game] of games.entries()) {
        if (now - game.createdAt > 3600000) { // 1 heure
            games.delete(gameId);
        }
    }
}, 3600000);

server.listen(PORT, () => {
    console.log(`\n🎮 Serveur Puissance 4 démarré !`);
    console.log(`📡 Serveur disponible sur http://localhost:${PORT}`);
    console.log(`\n💡 Prêt pour le système de vote par téléphone (à implémenter)\n`);
});
