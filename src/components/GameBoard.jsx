
import { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS, apiRequest } from '../config/api';

export default function GameBoard({
    mode,
    filters = {},
    onExit,
    onGameOver
}) {
    // ESTADOS
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [correctAnswer, setCorrectAnswer] = useState(null);
    const [isAnswerLocked, setIsAnswerLocked] = useState(false);

    const [timeLeft, setTimeLeft] = useState(
        mode === 'survival' ? 45 : 0
    );

    const [session, setSession] = useState(null);

    const [totalQuestions, setTotalQuestions] = useState(
        mode === 'daily' ? 1 : mode === 'survival' ? 15 : 10
    );
    // Evita solicitudes duplicadas durante la carga.
    const peticionEnCurso = useRef(false);
    // Evita finalizar dos veces la partida.
    const partidaFinalizada = useRef(false);

    // CARGAR PREGUNTA ACTUAL
    const cargarPregunta = async (partidaId, indiceDestino) => {

        const datos = await apiRequest(
            API_ENDPOINTS.obtenerPreguntaActual(partidaId)
        );

        // La API puede devolver la pregunta directamente
        // o dentro de una propiedad llamada pregunta.
        const pregunta = datos?.pregunta ?? datos;

        if (!pregunta || typeof pregunta !== 'object') {
            throw new Error("No se pudo obtener la pregunta actual.");
        }

        const opciones = pregunta.options ?? pregunta.opciones;

        if (!Array.isArray(opciones) || opciones.length === 0) {
            throw new Error("La pregunta no contiene opciones válidas.");
        }

        const preguntaFormateada = {
            id: pregunta.id ?? pregunta.preguntaId,
            category: pregunta.category ?? pregunta.categoria ?? "General",
            question: pregunta.question ?? pregunta.texto ?? pregunta.enunciado,
            options: opciones
        };

        if (!preguntaFormateada.question) {
            throw new Error("La pregunta recibida no contiene su texto.");
        }

        setQuestions(prev => {
            const nuevas = [...prev];
            nuevas[indiceDestino] = preguntaFormateada;
            return nuevas;
        });

        return preguntaFormateada;
    };

    // CREAR PARTIDA EN EL SERVIDOR
    useEffect(() => {

        if (peticionEnCurso.current) {
            return;
        }

        peticionEnCurso.current = true;
        partidaFinalizada.current = false;

        const crearPartida = async () => {

            try {
                setLoading(true);
                setError(null);
                setQuestions([]);
                setCurrentIndex(0);
                setScore(0);
                setSelectedAnswer(null);
                setCorrectAnswer(null);
                setIsAnswerLocked(false);

                const cantidad =
                    mode === 'daily' ? 1 :
                    mode === 'survival' ? 15 : 10;

                setTotalQuestions(cantidad);

                setTimeLeft(mode === 'survival' ? 45 : 0);

                const nombre =
                    localStorage.getItem('nombreJugador') || 'Jugador';

                console.log("Creando partida en Spring Boot...");
                const resultado = await apiRequest(
                    API_ENDPOINTS.crearPartida,
                    {
                        method: 'POST',
                        body: {
                            nombre: nombre,
                            tipo: 'INDIVIDUAL',
                            totalPreguntas: cantidad
                        }
                    }
                );

                console.log("Partida creada:", resultado);
                if (!resultado?.token || !resultado?.partida?.id) {
                    throw new Error(
                        "El servidor no devolvió el código de partida y el token."
                    );
                }

                const nuevaSesion = {
                    id: resultado.partida.id,
                    jugadorId: resultado.jugadorId,
                    token: resultado.token
                };

                setSession(nuevaSesion);
                // Cargar la primera pregunta.
                const datosPregunta = await apiRequest(
                    API_ENDPOINTS.obtenerPreguntaActual(nuevaSesion.id)
                );

                const pregunta = datosPregunta?.pregunta ?? datosPregunta;

                if (!pregunta || typeof pregunta !== 'object') {
                    throw new Error("No se recibió la primera pregunta.");
                }
                const opciones = pregunta.options ?? pregunta.opciones;
                if (!Array.isArray(opciones) || opciones.length === 0) {
                    throw new Error("La primera pregunta no tiene opciones.");
                }

                setQuestions([{
                    id: pregunta.id ?? pregunta.preguntaId,
                    category: pregunta.category ?? pregunta.categoria ?? "General",
                    question: pregunta.question ?? pregunta.texto ?? pregunta.enunciado,
                    options: opciones
                }]);

                setLoading(false);
                console.log("Primera pregunta cargada correctamente.");
            } catch (err) {
                console.error("Error al crear partida:", err);
                setError(
                    err.message || "No se pudo iniciar la partida."
                );
                setLoading(false);
                peticionEnCurso.current = false;
            }
        };

        crearPartida();
        return () => {
            // No cancelamos la petición porque puede estar creando
            // una partida en el servidor.
        };
    }, [mode]);
    // TEMPORIZADOR DEL MODO SUPERVIVENCIA
    useEffect(() => {

        if (mode !== 'survival' || loading || error || partidaFinalizada.current) {
            return;
        }

        const timer = setInterval(() => {

            setTimeLeft(prev => {

                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }

                return prev - 1;
            });

        }, 1000);

        return () => clearInterval(timer);

    }, [mode, loading, error]);

    // FINALIZAR POR TIEMPO
    useEffect(() => {
        if (
            mode === 'survival' &&
            !loading &&
            !error &&
            timeLeft === 0 &&
            !partidaFinalizada.current
        ) {
            partidaFinalizada.current = true;
            onGameOver({
                score: score,
                questionsAnswered: currentIndex
            });
        }

    }, [timeLeft, mode, loading, error, score, currentIndex, onGameOver]);

    // AVANZAR A LA SIGUIENTE PREGUNTA
    const avanzarPregunta = async (quedanPreguntas) => {
        try {
            if (!session) {
                throw new Error("No existe una sesión de jugador.");
            }

            const siguienteNumero = currentIndex + 1;
            // Si el servidor indica que no quedan preguntas,
            // o alcanzamos la cantidad solicitada, finalizar.
            if (
                quedanPreguntas === false ||
                siguienteNumero >= totalQuestions
            ) {
                await apiRequest(
                    API_ENDPOINTS.siguientePregunta(session.id),
                    {
                        method: 'POST',
                        jugadorToken: session.token
                    }
                );
                let resultados = null;
                try {
                    resultados = await apiRequest(
                        API_ENDPOINTS.obtenerResultadosPartida(session.id)
                    );
                } catch (error) {
                    console.warn("No se pudieron consultar los resultados:", error);
                }
                partidaFinalizada.current = true;
                onGameOver({
                    score: score,
                    questionsAnswered: siguienteNumero,
                    resultados: resultados
                });
                return;
            }
            // El endpoint siguiente avanza la pregunta en el servidor.
            await apiRequest(
                API_ENDPOINTS.siguientePregunta(session.id),
                {
                    method: 'POST',
                    jugadorToken: session.token
                }
            );

            setCurrentIndex(siguienteNumero);
            setSelectedAnswer(null);
            setCorrectAnswer(null);
            setIsAnswerLocked(false);
            await cargarPregunta(session.id, siguienteNumero);
        } catch (err) {
            console.error("Error avanzando pregunta:", err);
            setError(
                err.message || "No se pudo avanzar a la siguiente pregunta."
            );
        }
    };

    // RESPONDER PREGUNTA
    const handleSelectOption = async (index) => {

        if (
            isAnswerLocked ||
            !session ||
            !questions[currentIndex] ||
            partidaFinalizada.current
        ) {
            return;
        }
        setIsAnswerLocked(true);
        setSelectedAnswer(index);
        try {
            console.log("Enviando respuesta al servidor:", index);
            const resultado = await apiRequest(
                API_ENDPOINTS.responderPregunta(session.id),
                {
                    method: 'POST',
                    jugadorToken: session.token,
                    body: {
                        opcion: index
                    }
                }
            );
            console.log("Resultado del servidor:", resultado);
            // El servidor decide si la respuesta es correcta.
            const esCorrecta = resultado.correcta === true;
            setCorrectAnswer(
                Number.isInteger(resultado.opcionCorrecta)
                    ? resultado.opcionCorrecta
                    : null
            );
            const puntosGanados = Number(resultado.puntosGanados) || 0;
            const nuevaPuntuacion = score + puntosGanados;
            setScore(nuevaPuntuacion);
            // Bonificación y penalización del modo supervivencia.
            if (mode === 'survival') {
                if (esCorrecta) {
                    setTimeLeft(prev => prev + 10);
                } else {
                    setTimeLeft(prev => Math.max(0, prev - 5));
                }
            }
            // Esperar para mostrar visualmente el resultado.
            await new Promise(resolve => setTimeout(resolve, 800));
            if (partidaFinalizada.current) {
                return;
            }
            // Actualizar la puntuación antes de avanzar.
            const quedanPreguntas = resultado.quedanPreguntas;
            if (
                quedanPreguntas === false ||
                currentIndex + 1 >= totalQuestions
            ) {
                // El servidor finalizará la partida.
                await apiRequest(
                    API_ENDPOINTS.siguientePregunta(session.id),
                    {
                        method: 'POST',
                        jugadorToken: session.token
                    }
                );
                let resultados = null;
                try {
                    resultados = await apiRequest(
                        API_ENDPOINTS.obtenerResultadosPartida(session.id)
                    );
                } catch (error) {
                    console.warn("No se pudieron consultar los resultados:", error);
                }
                partidaFinalizada.current = true;
                onGameOver({
                    score: nuevaPuntuacion,
                    questionsAnswered: currentIndex + 1,
                    resultados: resultados
                });
                return;
            }
            await avanzarPregunta(quedanPreguntas);
        } catch (err) {
            console.error("Error al responder:", err);
            setError(
                err.message || "No se pudo enviar la respuesta."
            );
            setIsAnswerLocked(false);
        }
    };
    // PANTALLA DE CARGA
    if (loading) {
        return (
            <div className="game-container-wrapper">
                <div className="game-board">
                    <div
                        className="game-board__content"
                        style={{ textAlign: 'center', padding: '40px' }}
                    >
                        <h2>⏳ Preparando tu partida...</h2>
                        <p>Conectando con el servidor de trivias.</p>
                    </div>
                </div>
            </div>
        );
    }
    // PANTALLA DE ERROR
    if (error || questions.length === 0) {
        return (
            <div className="game-container-wrapper">
                <div className="game-board">
                    <div
                        className="game-board__content"
                        style={{ textAlign: 'center', padding: '40px' }}
                    >
                        <h2>⚠️ Ups, hubo un problema</h2>

                        <p style={{ margin: '16px 0' }}>
                            {error || "No hay preguntas disponibles."}
                        </p>

                        <button
                            className="game-board__exit-btn"
                            onClick={onExit}
                        >
                            ⬅ Volver al Menú
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    // PREGUNTA ACTUAL
    const currentQ = questions[currentIndex];
    if (!currentQ) {
        return null;
    }
    let fogClass = 'game-board__fog--normal';
    if (mode === 'survival') {
        if (timeLeft <= 15) {
            fogClass = 'game-board__fog--danger';
        } else if (timeLeft <= 30) {
            fogClass = 'game-board__fog--warning';
        }
    }
    // INTERFAZ
    return (
        <div className="game-container-wrapper">
            <div className={`game-board ${mode === 'survival' ? fogClass : ''}`}>
                {mode === 'survival' && (
                    <div className={`game-board__fog ${fogClass}`} />
                )}
                <div className="game-board__content">
                    <header className="game-board__header">
                        <button
                            className="game-board__exit-btn"
                            onClick={onExit}
                        >
                            🚪 Salir
                        </button>
                        <div className="game-board__stats">
                            <span className="game-board__score-tag">
                                Puntos: <strong>{score}</strong>
                            </span>
                            {mode === 'survival' && (
                                <span
                                    className={`game-board__timer ${
                                        timeLeft <= 15
                                            ? 'game-board__timer--danger'
                                            : ''
                                    }`}
                                >
                                    ⏱️ {timeLeft}s
                                </span>
                            )}
                        </div>
                    </header>
                    <section className="question-card">
                        <div className="question-card__meta">
                            <span className="question-card__category">
                                📂 {currentQ.category.toUpperCase()}
                            </span>
                            <span className="question-card__counter">
                                Pregunta #{currentIndex + 1} de {totalQuestions}
                            </span>
                        </div>
                        <h2 className="question-card__title">
                            {currentQ.question}
                        </h2>
                    </section>

                    <section className="answers-grid">
                        {currentQ.options.map((opcion, index) => {
                            const letra = String.fromCharCode(65 + index);
                            let statusClass = '';
                            if (selectedAnswer !== null) {
                                if (index === correctAnswer) {
                                    statusClass = 'answer-card--correct';
                                } else if (index === selectedAnswer) {
                                    statusClass = 'answer-card--wrong';
                                }
                            }
                            return (
                                <article
                                    key={index}
                                    className={`answer-card ${statusClass}`}
                                    onClick={() => handleSelectOption(index)}
                                    style={{
                                        cursor: isAnswerLocked ? 'default' : 'pointer'
                                    }}
                                >
                                    <div className="answer-card__prefix">
                                        {letra}
                                    </div>

                                    <div className="answer-card__text">
                                        {opcion}
                                    </div>
                                </article>
                            );
                        })}
                    </section>

                </div>
            </div>
        </div>
    );
}