// src/App.jsx
import { useState } from 'react';
import Menu from './components/Menu';
import FreeModeConfig from './components/FreeModeConfig';
import GameBoard from './components/GameBoard';
import GameOver from './components/GameOver';
import './App.css';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('menu'); // 'menu', 'free-config', 'game', 'results'
  const [gameMode, setGameMode] = useState(null); // 'daily', 'survival', 'free'
  const [gameFilters, setGameFilters] = useState({ category: '', difficulty: '' });
  const [finalStats, setFinalStats] = useState({ score: 0, questionsAnswered: 0 });

  // Recibe el modo y, opcionalmente, los filtros seleccionados
  const handleStartGame = (mode, filters = { category: '', difficulty: '' }) => {
    setGameMode(mode);
    setGameFilters(filters);
    setCurrentScreen('game');
  };

  const handleGameOver = (stats) => {
    setFinalStats(stats);
    setCurrentScreen('results');
  };

  return (
    <main className="trivia-app">
      {currentScreen === 'menu' && (
        <Menu
          onStartGame={handleStartGame}
          onOpenFreeConfig={() => setCurrentScreen('free-config')}
        />
      )}

      {currentScreen === 'free-config' && (
        <FreeModeConfig
          onStartCustomGame={(filters) => handleStartGame('free', filters)}
          onBack={() => setCurrentScreen('menu')}
        />
      )}

      {currentScreen === 'game' && (
        <GameBoard
          mode={gameMode}
          filters={gameFilters}
          onExit={() => setCurrentScreen('menu')}
          onGameOver={handleGameOver}
        />
      )}

      {currentScreen === 'results' && (
        <GameOver
          stats={finalStats}
          onRestart={() => setCurrentScreen('menu')}
        />
      )}
    </main>
  );
}