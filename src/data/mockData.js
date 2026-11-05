// src/data/mockData.js
export const CATEGORIES = [
  { id: 'cine', name: '🎬 Cine y Series' },
  { id: 'musica', name: '🎵 Música' },
  { id: 'deportes', name: '⚽ Deportes' },
  { id: 'arte', name: '🎨 Arte' },
  { id: 'ciencia', name: '🔬 Ciencia' }
];

export const MOCK_QUESTIONS = [
  {
    id: 1,
    category: 'cine',
    difficulty: 'medio',
    question: '¿Qué actor interpretó al personaje principal en la película "Inception"?',
    options: ['Leonardo DiCaprio', 'Christian Bale', 'Brad Pitt', 'Matt Damon'],
    correct: 0
  },
  {
    id: 2,
    category: 'musica',
    difficulty: 'facil',
    question: '¿Cuál es la banda británica que lanzó el famoso álbum "Abbey Road"?',
    options: ['The Rolling Stones', 'Queen', 'The Beatles', 'Pink Floyd'],
    correct: 2
  },
  {
    id: 3,
    category: 'ciencia',
    difficulty: 'medio',
    question: '¿Cuál es el elemento químico cuyo símbolo es Au?',
    options: ['Plata', 'Oro', 'Argón', 'Aluminio'],
    correct: 1
  },
  {
    id: 4,
    category: 'deportes',
    difficulty: 'facil',
    question: '¿Cuántos jugadores conforman un equipo de fútbol en el campo durante un partido oficial?',
    options: ['10', '11', '12', '9'],
    correct: 1
  },
  {
    id: 5,
    category: 'arte',
    difficulty: 'dificil',
    question: '¿Quién pintó "La joven de la perla"?',
    options: ['Vincent van Gogh', 'Johannes Vermeer', 'Rembrandt', 'Claude Monet'],
    correct: 1
  },
  {
    id: 6,
    category: 'cine',
    difficulty: 'facil',
    question: '¿Cómo se llama el vaquero protagonista de la película animada "Toy Story"?',
    options: ['Buzz Lightyear', 'Woody', 'Andy', 'Rex'],
    correct: 1
  }
];