import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import './App.css';

function App() {
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');

    socket.on('connect', () => {
      console.log('✅ Conectado ao servidor');
      setConnected(true);
    });

    socket.on('server:message', (data) => {
      setMessage(data.text);
    });

    socket.on('disconnect', () => {
      console.log('❌ Desconectado do servidor');
      setConnected(false);
    });

    return () => socket.disconnect();
  }, []);

  const handleJoin = () => {
    if (username.trim()) {
      const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
      socket.emit('player:join', { username });
    }
  };

  return (
    <div className="App">
      <header className="header">
        <h1>🎮 MMO Econômico</h1>
        <div className={`status ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? '🟢 Online' : '🔴 Offline'}
        </div>
      </header>

      <main className="main">
        {!connected ? (
          <div className="loading">
            <p>Conectando ao servidor...</p>
          </div>
        ) : (
          <div className="login">
            <h2>Bem-vindo ao Jogo</h2>
            <input
              type="text"
              placeholder="Digite seu nome de usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
            />
            <button onClick={handleJoin}>Entrar no Jogo</button>
            {message && <p className="message">{message}</p>}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;