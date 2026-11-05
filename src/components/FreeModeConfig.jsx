// src/components/FreeModeConfig.jsx
import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

export default function FreeModeConfig({ onStartCustomGame, onBack }) {
  const [categorias, setCategorias] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.obtenerCategorias);
        const data = await res.json();
        console.log("=== CATEGORÍAS CARGADAS ===", data.trivia_categories);
        setCategorias(data.trivia_categories || []);
      } catch (err) {
        console.error("Error cargando categorías:", err);
      }
    };
    cargarCategorias();
  }, []);

  const grupos = {
    "Cultura General y Otros": [],
    "Entretenimiento": [],
    "Ciencia": []
  };

  categorias.forEach((cat) => {
    if (cat.name.startsWith("Entertainment: ")) {
      grupos["Entretenimiento"].push({ id: cat.id, name: cat.name.replace("Entertainment: ", "") });
    } else if (cat.name.startsWith("Science")) {
      grupos["Ciencia"].push({ id: cat.id, name: cat.name.replace("Science: ", "") });
    } else {
      grupos["Cultura General y Otros"].push({ id: cat.id, name: cat.name });
    }
  });

  const handleStart = () => {
    onStartCustomGame({ category: selectedCategory, difficulty: selectedDifficulty });
  };

  return (
    <div className="game-container-wrapper">
      <div className="config-dialog">
        <header className="config-dialog__header">
          <div className="config-dialog__title-wrapper">
            <span className="config-dialog__icon">🧭</span>
            <div>
              <h2 className="config-dialog__title">Personalizar Modo Libre</h2>
              <p className="config-dialog__subtitle">Conectado con los filtros oficiales de Open Trivia DB</p>
            </div>
          </div>
        </header>

        <section className="config-dialog__section">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ padding: '6px', borderRadius: '6px', background: '#1e293b', color: '#fff' }}
            >
              <option value="">📂 Todas las categorías</option>
              {Object.entries(grupos).map(([grupo, lista]) => (
                <optgroup key={grupo} label={grupo}>
                  {lista.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              style={{ padding: '6px', borderRadius: '6px', background: '#1e293b', color: '#fff' }}
            >
              <option value="">⚡ Cualquier dificultad</option>
              <option value="easy">Fácil (Easy)</option>
              <option value="medium">Medio (Medium)</option>
              <option value="hard">Difícil (Hard)</option>
            </select>
          </div>
        </section>

        <footer className="config-dialog__footer">
          <button className="config-dialog__back-btn" onClick={onBack}>
            ← Volver
          </button>
          <button className="config-dialog__start-btn" onClick={handleStart}>
            Iniciar Partida Infinita ➔
          </button>
        </footer>
      </div>
    </div>
  );
}