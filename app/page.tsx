import SiteHeader from "@/components/SiteHeader";

const categories = [
  { name: "Ремонт и строительство", icon: "🛠️", tone: "violet" },
  { name: "Уборка и клининг", icon: "🧹", tone: "pink" },
  { name: "IT и цифровые услуги", icon: "💻", tone: "mint" },
  { name: "Красота и здоровье", icon: "💆", tone: "peach" },
  { name: "Образование и репетиторы", icon: "🎓", tone: "yellow" },
  { name: "Транспорт и доставка", icon: "🚗", tone: "blue" },
  { name: "Другое", icon: "•••", tone: "lilac" },
];

const popularServices = [
  { title: "Мелкий бытовой ремонт", text: "Сантехника, электрика, сборка мебели", price: "от 1 500 ₽", name: "Алексей П.", city: "Москва", rating: "4.9", reviews: "124", icon: "🔧" },
  { title: "Уборка квартиры", text: "Генеральная, регулярная, после ремонта", price: "от 1 200 ₽", name: "Ольга К.", city: "Москва", rating: "4.8", reviews: "98", icon: "🧹" },
  { title: "Веб-разработка", text: "Сайты, боты, автоматизация", price: "от 3 000 ₽", name: "Иван С.", city: "Москва", rating: "5.0", reviews: "56", icon: "💻" },
  { title: "Массаж", text: "Классический, расслабляющий", price: "от 1 800 ₽", name: "Марина В.", city: "Москва", rating: "4.9", reviews: "72", icon: "✨" },
];

const benefits = [
  ["✓", "Проверенные исполнители", "Профиль, отзывы, рейтинг"],
  ["⚡", "Быстрый отклик", "Большинство отвечают в течение 15 минут"],
  ["✓", "Безопасное общение", "Чаты, защита платежей, поддержка"],
  ["♥", "Рядом с вами", "Услуги в вашем городе и регионе"],
];

export default function Home() {
  return (
    <main>
      <SiteHeader />

      <section className="home-hero">
        <div className="hero-content">
          <div className="hero-badges">
            <span>⚡ Быстро</span><i>•</i><span>Надёжно</span><i>•</i><span>Рядом</span>
          </div>
          <h1>Найдите специалиста<br />для любой задачи</h1>
          <p>Услуги от проверенных исполнителей рядом с вами.<br />Быстро, удобно, безопасно.</p>

          <div className="hero-search">
            <div className="search-field"><span>⌕</span><input aria-label="Поиск услуги" placeholder="Что нужно сделать?" /></div>
            <a className="location-field" href="/services"><span>⌖</span> Москва <b>⌄</b></a>
            <a className="hero-search-button" href="/services">Найти</a>
          </div>

          <div className="hero-actions">
            <a className="button" href="/services/new">＋ Разместить услугу</a>
            <a className="button secondary" href="/requests/new">Мне нужна услуга →</a>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="art-glow" />
          <div className="art-house">⚡</div>
          <div className="art-tool art-one">🔧</div>
          <div className="art-tool art-two">🧹</div>
          <div className="art-tool art-three">💻</div>
          <div className="art-heart">♥</div>
          <div className="art-note">Твои задачи<br /><strong>— наши люди</strong></div>
        </div>
      </section>

      <section className="category-strip">
        {categories.map((category) => (
          <a className={"category-tile " + category.tone} href="/services" key={category.name}>
            <span className="category-icon">{category.icon}</span>
            <span className="category-name">{category.name}</span>
            <span className="category-arrow">→</span>
          </a>
        ))}
      </section>

      <section className="content-section popular-layout">
        <div>
          <div className="section-head">
            <div>
              <span className="eyebrow">Выбор пользователей</span>
              <h2>Популярные услуги</h2>
            </div>
            <a href="/services" className="see-all">Смотреть все →</a>
          </div>

          <div className="service-preview-grid">
            {popularServices.map((service) => (
              <a className="preview-card" href="/services" key={service.title}>
                <div className="preview-image">
                  <span>{service.icon}</span>
                  <span className="favorite" aria-label="В избранное">♡</span>
                </div>
                <div className="rating">★ {service.rating} <small>({service.reviews})</small></div>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
                <div className="provider"><span className="avatar">{service.name.slice(0, 1)}</span><span><strong>{service.name}</strong><small>{service.city} · рядом</small></span></div>
                <strong className="price">{service.price}</strong>
              </a>
            ))}
          </div>
        </div>

        <aside className="why-card">
          <span className="eyebrow">Почему выбирают</span>
          <h2>Услугач?</h2>
          <div className="benefits">
            {benefits.map(([icon, title, text]) => (
              <div className="benefit" key={title}><span>{icon}</span><div><strong>{title}</strong><small>{text}</small></div></div>
            ))}
          </div>
          <a className="button wide" href="/services/new">＋ Разместить услугу</a>
        </aside>
      </section>

      <section className="city-banner">
        <div><span className="city-pin">⌖</span><div><span className="eyebrow">География</span><h2>Услуги в вашем городе</h2></div></div>
        <a href="/services">Все города →</a>
      </section>

      <footer className="modern-footer">
        <div><a className="logo" href="/">⚡ Услугач</a><span>Маркетплейс услуг рядом с вами</span></div>
        <div><a href="/services">Каталог</a><a href="/profile">Личный кабинет</a><a href="/register">Регистрация</a></div>
        <small>© Услугач · MVP 1.0</small>
      </footer>
    </main>
  );
}
