export default function SiteFooter() {
  return (
    <footer className="modern-footer">
      <div className="footer-main">
        <a className="footer-brand" href="/">
          <img src="/icons/logo-mark.svg" alt="" />
          <span>Услугач</span>
        </a>
        <p>Люди для Людей.</p>
      </div>

      <nav className="footer-actions" aria-label="Основная навигация">
        <a className="footer-button" href="/services">Услуги</a>
        <a className="footer-button" href="/requests">Заявки</a>
        <a className="footer-button" href="/performers">Исполнители</a>
      </nav>

      <nav className="footer-legal-links" aria-label="Правовая информация">
        <a href="/terms">Правила сервиса</a>
        <a href="/privacy">Политика обработки персональных данных</a>
      </nav>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} «Услугач»</span>
        <span>Используя сервис, вы подтверждаете согласие с опубликованными условиями.</span>
      </div>
    </footer>
  );
}
