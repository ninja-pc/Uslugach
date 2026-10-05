const categories = [
  "Ремонт и строительство",
  "Красота и здоровье",
  "Уборка",
  "IT и digital",
  "Репетиторы",
  "Переводы",
  "Авто",
  "Доставка",
];

export default function Home() {
  return (
    <main>
      <header className="header">
        <a className="logo" href="/">⚡ Услугач</a>
        <nav>
          <a href="/services">Найти услугу</a>
          <a href="/requests">Нужны услуги</a>
          <a className="button secondary" href="/login">Войти</a>
          <a className="button" href="/register">Регистрация</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Услуги без лишних сложностей</span>
          <h1>Найдите специалиста или предложите свою услугу</h1>
          <p>Услугач соединяет людей, которым нужна помощь, с теми, кто умеет делать работу хорошо.</p>
          <div className="search">
            <input aria-label="Поиск" placeholder="Что вам нужно?" />
            <button>Найти</button>
          </div>
          <div className="hero-actions">
            <a className="button" href="/services/new">Предложить услугу</a>
            <a className="button secondary" href="/requests/new">Мне нужна услуга</a>
          </div>
        </div>
        <div className="hero-card">
          <div className="bolt">⚡</div>
          <strong>20 тестировщиков</strong>
          <span>Начинаем с простого MVP и реальных сценариев.</span>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Категории</span>
            <h2>Что вы ищете?</h2>
          </div>
          <a href="/services">Все услуги →</a>
        </div>
        <div className="grid">
          {categories.map((category) => (
            <a className="category" href="/services" key={category}>
              <span>›</span>
              {category}
            </a>
          ))}
        </div>
      </section>

      <section className="section split">
        <div>
          <span className="eyebrow">Два сценария</span>
          <h2>Ищете исполнителя? Или хотите найти клиента?</h2>
        </div>
        <div className="cards">
          <article>
            <h3>Предлагаю услугу</h3>
            <p>Создайте карточку услуги, укажите цену, город и формат работы.</p>
            <a href="/services/new">Создать услугу →</a>
          </article>
          <article>
            <h3>Мне нужна услуга</h3>
            <p>Опишите задачу, бюджет и срок — исполнители смогут откликнуться.</p>
            <a href="/requests/new">Создать заявку →</a>
          </article>
        </div>
      </section>

      <footer>© Услугач · MVP 1.0</footer>
    </main>
  );
}
