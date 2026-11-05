// src/config/api.js

const BASE_URL = 'https://opentdb.com';
const TRANSLATE_URL = 'https://api.mymemory.translated.net/get';
export const API_ENDPOINTS = {
  obtenerToken: `${BASE_URL}/api_token.php?command=request`,
  resetearToken: (token) => `${BASE_URL}/api_token.php?command=reset&token=${token}`,
  obtenerCategorias: `${BASE_URL}/api_category.php`,

  obtenerPreguntas: (cantidad = 10, token = null, categoria = '', dificultad = '') => {
    let url = `${BASE_URL}/api.php?amount=${cantidad}&type=multiple`;
    if (token) url += `&token=${token}`;
    if (categoria) url += `&category=${categoria}`;
    if (dificultad) url += `&difficulty=${dificultad}`;
    return url;
  }
};

// Funci├│n para limpiar entidades HTML de OpenTDB (ej. convierte &quot; en ")
const decodificarHTML = (texto) => {
  const txt = document.createElement('textarea');
  txt.innerHTML = texto;
  return txt.value;
};
// 2. TRADUCIR UN TEXTO DE INGLES A ESPAÑOL
const traducirTexto = async (texto) => {

  if (!texto || texto.trim() === '') {
    return texto;
  }

  const url = `${TRANSLATE_URL}?q=${encodeURIComponent(texto)}&langpair=en|es`;

  const respuesta = await fetch(url);

  if (!respuesta.ok) {
    throw new Error('Error al conectar con el servicio de traducción.');
  }

  const datos = await respuesta.json();

  if (datos.responseStatus !== 200) {
    throw new Error('No se pudo traducir el texto.');
  }

  return decodificarHTML(datos.responseData.translatedText);
};

//fUNCION DE TRADUCCION DE TEXTOS

const traducirVarios = async (textos) => {
  const resultados = new Array(textos.length);
  let posicion = 0;
  const trabajador = async () => {
    while (posicion < textos.length) {
      const indice = posicion;
      posicion++;
      resultados[indice] = await traducirTexto(textos[indice]);
    }
  };
  await Promise.all([
    trabajador(),
    trabajador(),
    trabajador()
  ]);
  return resultados;
};
// Transforma el objeto de OpenTDB al formato que espera GameBoard.jsx
// 4. FORMATEAR Y TRADUCIR LAS PREGUNTAS
export const formatearPreguntas = async (resultadosAPI) => {
  const preguntasOriginales = resultadosAPI.map((item) => {
    return {
      category: decodificarHTML(item.category),
      question: decodificarHTML(item.question),
      correct: decodificarHTML(item.correct_answer),
      incorrectas: item.incorrect_answers.map(decodificarHTML)
    };
  });

  // Reunir todos los textos que necesitan traducción
  const textos = [];
  preguntasOriginales.forEach((item) => {
    textos.push(item.category);
    textos.push(item.question);
    textos.push(item.correct);
    item.incorrectas.forEach((respuesta) => {
      textos.push(respuesta);
    });
  });
  
  // Traducir todos los textos
  const textosTraducidos = await traducirVarios(textos);
  // Reconstruir las preguntas
  let posicion = 0;
  const preguntasFinales = preguntasOriginales.map((item) => {
    const categoria = textosTraducidos[posicion++];
    const pregunta = textosTraducidos[posicion++];
    const respuestaCorrecta = textosTraducidos[posicion++];
    const respuestasIncorrectas = [];
    item.incorrectas.forEach(() => {
      respuestasIncorrectas.push(textosTraducidos[posicion++]);
    });
    // Mezclar las respuestas
    const opcionesMezcladas = [
      ...respuestasIncorrectas,
      respuestaCorrecta
    ];
    opcionesMezcladas.sort(() => Math.random() - 0.5);
    // Encontrar la posición de la respuesta correcta
    const indiceCorrecto = opcionesMezcladas.indexOf(respuestaCorrecta);
    return {
      category: categoria,
      question: pregunta,
      options: opcionesMezcladas,
      correct: indiceCorrecto
    };
  });
  return preguntasFinales;
};
