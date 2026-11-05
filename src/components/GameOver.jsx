// src/components/GameOver.jsx

export default function GameOver({ stats, onRestart }) {
  return (
    <div className="trivia-menu">
      <h2 className="trivia-menu__title">¡Juego <span>Terminado</span>!</h2>
      <p className="trivia-menu__subtitle">Preguntas acertadas: {stats.score}</p>
      <button className="trivia-menu__btn" onClick={onRestart} style={{ justifyContent: 'center' }}>
        🔄 Volver al Menú Principal
      </button>
    </div>
  );
}