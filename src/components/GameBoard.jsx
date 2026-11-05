// src/components/GameBoard.jsx
import { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS, formatearPreguntas } from '../config/api';

export default function GameBoard({ mode, filters = {}, onExit, onGameOver }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const peticionEnCurso = useRef(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(mode === 'survival' ? 45 : 0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);

  useEffect(() => {
    const cargarPartida = async () => {
      if (peticionEnCurso.current) {
        console.log("⚠️ [StrictMode] Segunda ejecución bloqueada para evitar Error 429.");
        return;
      }
      peticionEnCurso.current = true;

      try {
        setLoading(true);
        setError(null);

        let miToken = localStorage.getItem('opentdb_token');
        if (miToken) {
          console.log("=== 1. TOKEN REUTILIZADO (LOCALSTORAGE) ===", miToken);
        } else {
          const resToken = await fetch(API_ENDPOINTS.obtenerToken);
          const datosToken = await resToken.json();
          console.log("=== 1. NUEVO TOKEN GENERADO ===", datosToken);
          miToken = datosToken.token;
          localStorage.setItem('opentdb_token', miToken);
        }

        const cantidad = mode === 'daily' ? 1 : mode === 'survival' ? 15 : 10;
        const categoria = mode === 'free' ? filters.category : '';
        const dificultad = mode === 'free' ? filters.difficulty : '';

        const urlTrivia = API_ENDPOINTS.obtenerPreguntas(cantidad, miToken, categoria, dificultad);
        console.log(`🔗 Consultando API para modo [${mode}]:`, urlTrivia);

        const resTrivia = await fetch(urlTrivia);
        if (resTrivia.status === 429) {
          throw new Error('Demasiadas peticiones (Error 429). Espera 5 segundos e intenta de nuevo.');
        }

        const datosTrivia = await resTrivia.json();
        console.log("=== 2. RESPUESTA DE PREGUNTAS ===");
        console.log("Response Code:", datosTrivia.response_code);
        console.log("Preguntas crudas:", datosTrivia.results);

        if (datosTrivia.response_code === 0 && Array.isArray(datosTrivia.results)) {
          console.log("TRADUCIENDO PREGUNTAS AL ESPAÑOL");
          const preguntasListas = await formatearPreguntas(datosTrivia.results);
          console.log("=== 4. PREGUNTAS TRADUCIDAS ===");
          console.log(preguntasListas);
          
          setQuestions(preguntasListas);
        } else if (datosTrivia.response_code === 3 || datosTrivia.response_code === 4) {
          localStorage.removeItem('opentdb_token');
          throw new Error('Tu sesión de preguntas expiró o se agotó. Vuelve al menú e inicia de nuevo.');
        } else {
          throw new Error('No hay suficientes preguntas para esta combinación de filtros.');
        }

        setLoading(false);
      } catch (err) {
        console.error("❌ Error en GameBoard:", err);
        setError(err.message || 'Error al conectar con el servidor de trivias');
        setLoading(false);
      }
    };

    cargarPartida();
  }, [mode, filters.category, filters.difficulty]);

  useEffect(() => {
    if (mode !== 'survival' || loading || error) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, loading, error]);

  useEffect(() => {
    if (mode === 'survival' && !loading && !error && timeLeft === 0) {
      onGameOver({ score, questionsAnswered: currentIndex });
    }
  }, [timeLeft, mode, loading, error, score, currentIndex, onGameOver]);

  if (loading) {
    return (
      <div className="game-container-wrapper">
        <div className="game-board">
          <div className="game-board__content" style={{ textAlign: 'center', padding: '40px' }}>
            <h2>⏳ Cargando desafío desde OpenTDB...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="game-container-wrapper">
        <div className="game-board">
          <div className="game-board__content" style={{ textAlign: 'center', padding: '40px' }}>
            <h2>⚠️ Ups, hubo un problema</h2>
            <p style={{ margin: '16px 0' }}>{error}</p>
            <button className="game-board__exit-btn" onClick={onExit}>⬅ Volver al Menú</button>
          </div>
        </div>
      </div>
    );
  }

  let fogClass = 'game-board__fog--normal';
  if (mode === 'survival') {
    if (timeLeft <= 15) {
      fogClass = 'game-board__fog--danger';
    } else if (timeLeft <= 30) {
      fogClass = 'game-board__fog--warning';
    }
  }

  const currentQ = questions[currentIndex];

  const handleSelectOption = (index) => {
    if (isAnswerLocked) return;
    setIsAnswerLocked(true);
    setSelectedAnswer(index);

    const isCorrect = index === currentQ.correct;
    const nextScore = isCorrect ? score + 100 : score;

    if (isCorrect) {
      setScore(nextScore);
      if (mode === 'survival') setTimeLeft((t) => t + 10);
    } else {
      if (mode === 'survival') setTimeLeft((t) => Math.max(0, t - 5));
    }

    setTimeout(() => {
      setSelectedAnswer(null);
      setIsAnswerLocked(false);

      if (currentIndex + 1 >= questions.length) {
        onGameOver({ score: nextScore, questionsAnswered: currentIndex + 1 });
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 800);
  };

  return (
    <div className="game-container-wrapper">
      <div className={`game-board ${mode === 'survival' ? fogClass : ''}`}>
        {mode === 'survival' && <div className={`game-board__fog ${fogClass}`} />}

        <div className="game-board__content">
          <header className="game-board__header">
            <button className="game-board__exit-btn" onClick={onExit}>🚪 Salir</button>
            <div className="game-board__stats">
              <span className="game-board__score-tag">Puntos: <strong>{score}</strong></span>
              {mode === 'survival' && (
                <span className={`game-board__timer ${timeLeft <= 15 ? 'game-board__timer--danger' : ''}`}>
                  ⏱️ {timeLeft}s
                </span>
              )}
            </div>
          </header>

          <section className="question-card">
            <div className="question-card__meta">
              <span className="question-card__category">📂 {currentQ.category.toUpperCase()}</span>
              <span className="question-card__counter">
                Pregunta #{currentIndex + 1} de {questions.length}
              </span>
            </div>
            <h2 className="question-card__title">{currentQ.question}</h2>
          </section>

          <section className="answers-grid">
            {currentQ.options.map((opt, idx) => {
              const optionLetter = String.fromCharCode(65 + idx);
              
              let statusClass = '';
              if (selectedAnswer !== null) {
                if (idx === currentQ.correct) {
                  statusClass = 'answer-card--correct';
                } else if (idx === selectedAnswer) {
                  statusClass = 'answer-card--wrong';
                }
              }

              return (
                <article 
                  key={idx} 
                  className={`answer-card ${statusClass}`}
                  onClick={() => handleSelectOption(idx)}
                >
                  <div className="answer-card__prefix">{optionLetter}</div>
                  <div className="answer-card__text">{opt}</div>
                </article>
              );
            })}
          </section>
        </div>
      </div>
    </div>
  );
}
