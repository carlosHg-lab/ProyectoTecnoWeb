// src/components/Footer.jsx
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__content">
        {/* Columna 1: Marca */}
        <div className="footer__col">
          <h4 className="footer__brand-title">TRIVIA <span>Z</span></h4>
          <p className="footer__text">
            Plataforma de desafíos tecnológicos y dinámicas de conocimiento en tiempo real.
          </p>
        </div>

        {/* Columna 2: Enlaces útiles (placeholder) */}
        <div className="footer__col">
          <h5>Enlaces</h5>
          <a href="#terminos" onClick={(e) => e.preventDefault()}>Términos y Condiciones</a>
          <a href="#privacidad" onClick={(e) => e.preventDefault()}>Política de Privacidad</a>
          <a href="#soporte" onClick={(e) => e.preventDefault()}>Soporte Técnico</a>
        </div>

        {/* Columna 3: Contact Us */}
        <div className="footer__col">
          <h5>Contacto</h5>
          <p>📧 soporte@triviaz.com</p>
          <p>📍 La Paz, Bolivia</p>
          <a 
            href="#contact" 
            onClick={(e) => e.preventDefault()} 
            className="footer__contact-btn"
          >
            Contact Us
          </a>
        </div>
      </div>

      {/* Copyright inferior */}
      <div className="footer__bottom">
        <p>&copy; 2026 Trivia Z. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}