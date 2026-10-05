"use client";

import { useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/client";

type Service = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: number | null;
  price_type: string | null;
  region: string | null;
  city: string | null;
  work_format: string | null;
  category_id: number | null;
};

type Profile = { id: string; display_name: string | null };
type Category = { id: number; name: string; slug: string };

const categories = [
  { name: "Ремонт и строительство", image: "/illustrations/repair.svg", tone: "violet" },
  { name: "Уборка и клининг", image: "/illustrations/cleaning.svg", tone: "mint" },
  { name: "IT и цифровые услуги", image: "/illustrations/it.svg", tone: "blue" },
  { name: "Красота и здоровье", image: "/illustrations/beauty.svg", tone: "pink" },
  { name: "Образование и репетиторы", image: "/illustrations/education.svg", tone: "yellow" },
  { name: "Транспорт и доставка", image: "/illustrations/delivery.svg", tone: "peach" },
  { name: "Другое", image: "/illustrations/other.svg", tone: "lilac" },
];

function illustrationFor(service: Service, category?: Category) {
  const text = (category?.slug + " " + service.title + " " + (service.description ?? "")).toLowerCase();
  if (text.includes("уборк") || text.includes("клини")) return "/illustrations/cleaning.svg";
  if (text.includes("красот") || text.includes("массаж") || text.includes("здоров")) return "/illustrations/beauty.svg";
  if (text.includes("ремонт") || text.includes("стро") || text.includes("сантех") || text.includes("электр")) return "/illustrations/repair.svg";
  if (text.includes("репет") || text.includes("обуч") || text.includes("образ")) return "/illustrations/education.svg";
  if (text.includes("достав") || text.includes("курьер") || text.includes("авто")) return "/illustrations/delivery.svg";
  if (text.includes("it") || text.includes("digital") || text.includes("компьют") || text.includes("сайт") || text.includes("программ")) return "/illustrations/it.svg";
  return "/illustrations/other.svg";
}

function formatPrice(price: number | null, type: string | null) {
  if (price === null) return "Цена по договорённости";
  const value = new Intl.NumberFormat("ru-RU").format(price);
  if (type === "hourly") return `от ${value} ₽/час`;
  if (type === "starting") return `от ${value} ₽`;
  return `${value} ₽`;
}

const supabase = createClient();

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [categoryMap, setCategoryMap] = useState<Record<number, Category>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      const [{ data: serviceRows }, { data: categoryRows }] = await Promise.all([
        supabase
          .from("services")
          .select("id,user_id,title,description,price,price_type,region,city,work_format,category_id")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase.from("categories").select("id,name,slug").eq("is_active", true),
      ]);

      if (!mounted) return;

      const rows = (serviceRows ?? []) as Service[];
      setServices(rows);

      const cats = (categoryRows ?? []) as Category[];
      setCategoryMap(Object.fromEntries(cats.map((item) => [item.id, item])));

      const ids = [...new Set(rows.map((item) => item.user_id))];
      if (ids.length) {
        const { data: profileRows } = await supabase
          .from("profiles")
          .select("id,display_name")
          .in("id", ids);

        if (mounted) {
          setProfiles(Object.fromEntries(((profileRows ?? []) as Profile[]).map((item) => [item.id, item])));
        }
      } else {
        setProfiles({});
      }

      setLoading(false);
    }

    load();
    return () => { mounted = false; };
  }, [supabase]);

  return (
    <main>
      <SiteHeader />

      <section className="home-hero">
        <div className="hero-content">
          <div className="hero-badges">
            <span>Быстро</span><i>•</i><span>Надёжно</span><i>•</i><span>Рядом</span>
          </div>
          <h1>Найдите специалиста<br />для любой задачи</h1>
          <p>Услуги от исполнителей рядом с вами.<br />Выбирайте специалиста, общайтесь и договаривайтесь напрямую.</p>

          <div className="hero-search">
            <div className="search-field">
              <img src="/icons/search.svg" alt="" />
              <input aria-label="Поиск услуги" placeholder="Что нужно сделать?" />
            </div>
            <a className="location-field" href="/services">
              <img src="/icons/location.svg" alt="" /> Москва <b>⌄</b>
            </a>
            <a className="hero-search-button" href="/services">Найти</a>
          </div>

          <div className="hero-actions">
            <a className="button" href="/services/new">Разместить услугу</a>
            <a className="button secondary" href="/requests/new">Мне нужна услуга →</a>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <img src="/illustrations/hero.svg" alt="" />
        </div>
      </section>

      <section className="category-strip">
        {categories.map((category) => (
          <a className={"category-tile " + category.tone} href="/services" key={category.name}>
            <img className="category-illustration" src={category.image} alt="" />
            <span className="category-name">{category.name}</span>
            <span className="category-arrow">→</span>
          </a>
        ))}
      </section>

      <section className="content-section popular-layout">
        <div>
          <div className="section-head">
            <div>
              <span className="eyebrow">Каталог</span>
              <h2>Последние услуги</h2>
            </div>
            <a href="/services" className="see-all">Смотреть все →</a>
          </div>

          {loading ? (
            <div className="service-preview-grid">
              {[1, 2].map((item) => <div className="preview-card preview-skeleton" key={item}><div className="skeleton-image" /></div>)}
            </div>
          ) : services.length === 0 ? (
            <div className="empty">
              <strong>Пока нет опубликованных услуг</strong>
              <p>Станьте первым исполнителем — разместите свою услугу.</p>
              <a className="button" href="/services/new">Разместить услугу</a>
            </div>
          ) : (
            <div className="service-preview-grid">
              {services.slice(0, 4).map((service) => {
                const category = service.category_id ? categoryMap[service.category_id] : undefined;
                const provider = profiles[service.user_id]?.display_name || "Исполнитель";
                return (
                  <a className="preview-card" href={"/service?id=" + service.id} key={service.id}>
                    <div className="preview-image">
                      <img src={illustrationFor(service, category)} alt="" />
                      <span className="favorite" aria-label="В избранное">
                        <img src="/icons/heart.svg" alt="" />
                      </span>
                    </div>
                    <div className="service-category">{category?.name || "Услуга"}</div>
                    <h3>{service.title}</h3>
                    <p>{service.description || "Описание услуги пока не добавлено."}</p>
                    <div className="provider">
                      <span className="avatar">{provider.slice(0, 1).toUpperCase()}</span>
                      <span>
                        <strong>{provider}</strong>
                        <small>{service.city || service.region || "Россия"}</small>
                      </span>
                    </div>
                    <strong className="price">{formatPrice(service.price, service.price_type)}</strong>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <aside className="why-card">
          <span className="eyebrow">Услугач</span>
          <h2>Всё необходимое<br />в одном месте</h2>
          <div className="benefits">
            <div className="benefit"><span>01</span><div><strong>Реальные услуги</strong><small>На главной показываем только опубликованные предложения.</small></div></div>
            <div className="benefit"><span>02</span><div><strong>Прямой контакт</strong><small>Откройте услугу и свяжитесь с исполнителем.</small></div></div>
            <div className="benefit"><span>03</span><div><strong>Поиск рядом</strong><small>Город и регион помогают найти специалиста поблизости.</small></div></div>
          </div>
          <a className="button wide" href="/services">Открыть каталог</a>
        </aside>
      </section>

      <section className="city-banner">
        <div>
          <span className="city-pin"><img src="/icons/location.svg" alt="" /></span>
          <div><span className="eyebrow">География</span><h2>Услуги в вашем городе</h2></div>
        </div>
        <a href="/services">Все города →</a>
      </section>

      <footer className="modern-footer">
        <div><a className="logo" href="/"><img src="/icons/logo-mark.svg" alt="" />Услугач</a><span>Маркетплейс услуг рядом с вами</span></div>
        <div><a href="/services">Каталог</a><a href="/profile">Личный кабинет</a><a href="/register">Регистрация</a></div>
        <small>© Услугач · MVP 1.0</small>
      </footer>
    </main>
  );
}
