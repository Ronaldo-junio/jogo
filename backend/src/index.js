const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST']
  }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// ==================== DADOS EM MEMÓRIA ====================
const players = {};
const inventory = {};
const market = [];

// ==================== ROTAS HTTP ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.get('/api/players', (req, res) => {
  res.json(Object.values(players));
});

app.get('/api/market', (req, res) => {
  res.json(market);
});

// ==================== WEBSOCKET EVENTS ====================
io.on('connection', (socket) => {
  console.log(`🎮 Jogador conectado: ${socket.id}`);

  // Jogador entra no jogo
  socket.on('player:join', (data) => {
    const { username } = data;
    
    players[socket.id] = {
      id: socket.id,
      username: username,
      coins: 1000,
      level: 1,
      experience: 0,
      inventory: {
        wood: 10,
        stone: 5,
        gold: 0
      }
    };

    inventory[socket.id] = players[socket.id].inventory;

    console.log(`✅ ${username} entrou no jogo!`);
    
    // Notificar todos os jogadores
    io.emit('player:joined', {
      message: `${username} entrou no jogo!`,
      players: Object.values(players),
      totalPlayers: Object.keys(players).length
    });

    socket.emit('game:start', {
      player: players[socket.id],
      message: '🎉 Bem-vindo ao MMO Econômico!'
    });
  });

  // Minerar recurso
  socket.on('game:mine', (data) => {
    if (players[socket.id]) {
      const player = players[socket.id];
      const mineReward = {
        stone: Math.floor(Math.random() * 5) + 3,
        gold: Math.random() > 0.8 ? 1 : 0
      };

      player.inventory.stone += mineReward.stone;
      player.coins += mineReward.stone * 2;

      if (mineReward.gold > 0) {
        player.inventory.gold += mineReward.gold;
        player.coins += mineReward.gold * 50;
      }

      player.experience += 10;

      io.emit('game:mining', {
        playerId: socket.id,
        username: player.username,
        reward: mineReward,
        playerStats: player
      });
    }
  });

  // Cortar madeira
  socket.on('game:chop', (data) => {
    if (players[socket.id]) {
      const player = players[socket.id];
      const chopReward = Math.floor(Math.random() * 8) + 5;

      player.inventory.wood += chopReward;
      player.coins += chopReward;
      player.experience += 5;

      io.emit('game:chopping', {
        playerId: socket.id,
        username: player.username,
        woodGained: chopReward,
        playerStats: player
      });
    }
  });

  // Vender no mercado
  socket.on('market:sell', (data) => {
    if (players[socket.id]) {
      const { item, quantity, pricePerUnit } = data;
      const player = players[socket.id];

      if (player.inventory[item] >= quantity) {
        player.inventory[item] -= quantity;
        player.coins += quantity * pricePerUnit;

        market.push({
          id: Date.now(),
          seller: player.username,
          item,
          quantity,
          pricePerUnit,
          totalPrice: quantity * pricePerUnit,
          timestamp: new Date()
        });

        io.emit('market:updated', {
          message: `${player.username} vendeu ${quantity}x ${item}`,
          market,
          playerStats: player
        });
      }
    }
  });

  // Comprar do mercado
  socket.on('market:buy', (data) => {
    if (players[socket.id]) {
      const { listingId } = data;
      const player = players[socket.id];
      const listing = market.find(m => m.id === listingId);

      if (listing && player.coins >= listing.totalPrice) {
        player.coins -= listing.totalPrice;
        player.inventory[listing.item] = (player.inventory[listing.item] || 0) + listing.quantity;

        // Remover do mercado
        market.splice(market.indexOf(listing), 1);

        io.emit('market:updated', {
          message: `${player.username} comprou ${listing.quantity}x ${listing.item}`,
          market,
          playerStats: player
        });
      }
    }
  });

  // Jogador sai
  socket.on('disconnect', () => {
    if (players[socket.id]) {
      const username = players[socket.id].username;
      delete players[socket.id];
      delete inventory[socket.id];

      console.log(`❌ ${username} saiu do jogo`);
      
      io.emit('player:left', {
        message: `${username} saiu do jogo`,
        totalPlayers: Object.keys(players).length,
        players: Object.values(players)
      });
    }
  });
});

// ==================== INICIAR SERVIDOR ====================
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 ${PORT === 10000 ? 'Render Deploy' : 'Local Development'}`);
});

module.exports = { app, io };
