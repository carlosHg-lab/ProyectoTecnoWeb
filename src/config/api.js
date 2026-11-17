import { EventSourcePolyfill } from "event-source-polyfill";
export const BASE_URL = "https://carlos-trivia-api.loca.lt";
export const conectarEventosPartida = (id, alRecibirEstado) => {
    const origen = new EventSourcePolyfill(
        API_ENDPOINTS.obtenerEventos(id),
        {
            headers: {
                "bypass-tunnel-reminder": "true"
            }
        }
    );
export const API_ENDPOINTS = {

    // Categorías
    obtenerCategorias: `${BASE_URL}/api/categorias`,

    // Preguntas aleatorias
    obtenerPreguntas: (cantidad = 10, categoria = "", dificultad = "") => {
        const params = new URLSearchParams();

        params.append("cantidad", cantidad);

        if (categoria) params.append("categoria", categoria);
        if (dificultad) params.append("dificultad", dificultad);

        return `${BASE_URL}/api/preguntas/aleatorias?${params.toString()}`;
    },

    verificarRespuesta: `${BASE_URL}/api/preguntas/verificar`,

    // Administración de preguntas
    administrarPreguntas: `${BASE_URL}/api/preguntas`,
    eliminarPregunta: (id) => `${BASE_URL}/api/preguntas/${id}`,

    // Partidas
    crearPartida: `${BASE_URL}/api/partidas`,

    obtenerPartida: (id) =>
        `${BASE_URL}/api/partidas/${encodeURIComponent(id)}`,

    unirsePartida: (id) =>
        `${BASE_URL}/api/partidas/${encodeURIComponent(id)}/unirse`,

    iniciarPartida: (id) =>
        `${BASE_URL}/api/partidas/${encodeURIComponent(id)}/iniciar`,

    responderPregunta: (id) =>
        `${BASE_URL}/api/partidas/${encodeURIComponent(id)}/responder`,

    siguientePregunta: (id) =>
        `${BASE_URL}/api/partidas/${encodeURIComponent(id)}/siguiente`,

    obtenerPreguntaActual: (id) =>
        `${BASE_URL}/api/partidas/${encodeURIComponent(id)}/pregunta`,

    obtenerEventos: (id) =>
        `${BASE_URL}/api/partidas/${encodeURIComponent(id)}/eventos`,

    obtenerResultadosPartida: (id) =>
        `${BASE_URL}/api/partidas/${encodeURIComponent(id)}/resultados`,

    // Historial
    obtenerHistorial: `${BASE_URL}/api/resultados`
};


// ==========================================
// PETICIONES HTTP
// ==========================================

export const apiRequest = async (
    url,
    {
        method = "GET",
        body = null,
        jugadorToken = null,
        adminKey = null
    } = {}
) => {

    const headers = {
    "Accept": "application/json",
    "bypass-tunnel-reminder": "true"
};

    if (body !== null) {
        headers["Content-Type"] = "application/json";
    }

    if (jugadorToken) {
        headers["X-Jugador-Token"] = jugadorToken;
    }

    if (adminKey) {
        headers["X-Admin-Key"] = adminKey;
    }

    const respuesta = await fetch(url, {
        method,
        headers,
        body: body !== null ? JSON.stringify(body) : null
    });

    if (respuesta.status === 204) {
        return null;
    }

    const texto = await respuesta.text();

    let datos = null;

    if (texto) {
        try {
            datos = JSON.parse(texto);
        } catch {
            throw new Error("El servidor devolvió una respuesta inválida.");
        }
    }

    if (!respuesta.ok) {
        throw new Error(
            datos?.error ||
            datos?.mensaje ||
            `Error HTTP ${respuesta.status}`
        );
    }

    return datos;
};


// ==========================================
// EVENTOS EN TIEMPO REAL (SSE)
// ==========================================

export const conectarEventosPartida = (id, alRecibirEstado) => {

    const origen = new EventSource(
        API_ENDPOINTS.obtenerEventos(id)
    );

    origen.addEventListener("estado", (evento) => {
        try {
            const partida = JSON.parse(evento.data);
            alRecibirEstado(partida);
        } catch (error) {
            console.error("Error procesando evento:", error);
        }
    });

    origen.onerror = (error) => {
        console.error("Error en conexión SSE:", error);
    };

    return origen;
};
