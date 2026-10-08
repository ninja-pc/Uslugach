"use client";

import { useEffect, useState } from "react";
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
  { name: "Ремонт и строительство", slug: "remont-stroitelstvo", image: "/illustrations/repair.svg", tone: "violet" },
  { name: "Уборка и клининг", slug: "uborka", image: "/illustrations/cleaning.svg", tone: "mint" },
  { name: "IT и цифровые услуги", slug: "it-digital", image: "/illustrations/it.svg", tone: "blue" },
  { name: "Красота и здоровье", slug: "krasota-zdorovie", image: "/illustrations/beauty.svg", tone: "pink" },
  { name: "Образование и репетиторы", slug: "repetitory", image: "/illustrations/education.svg", tone: "yellow" },
  { name: "Транспорт и доставка", slug: "dostavka", image: "/illustrations/delivery.svg", tone: "peach" },
  { name: "Другое", slug: "drugoe", image: "/illustrations/other.svg", tone: "lilac" },
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
  const [requestCount, setRequestCount] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [heroSearch, setHeroSearch] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      const [{ data: serviceRows }, { data: categoryRows }, { count: requestCountFromDb }] = await Promise.all([
        supabase
          .from("services")
          .select("id,user_id,title,description,price,price_type,region,city,work_format,category_id")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase.from("categories").select("id,name,slug").eq("is_active", true),
        supabase.from("requests").select("id", { count: "exact", head: true }).eq("status", "published"),
      ]);

      if (!mounted) return;

      const rows = (serviceRows ?? []) as Service[];
      setServices(rows);
      setRequestCount(requestCountFromDb ?? 0);

      const cats = (categoryRows ?? []) as Category[];
      setCategoryMap(Object.fromEntries(cats.map((item) => [item.id, item])));

      const auth = await supabase.auth.getUser();
      if (auth.data.user && rows.length) {
        const { data: favoriteRows } = await supabase.from("favorites").select("service_id").eq("user_id", auth.data.user.id).in("service_id", rows.map((item) => item.id));
        setFavorites(new Set((favoriteRows ?? []).map((item) => item.service_id)));
      } else {
        setFavorites(new Set());
      }

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
  }, []);

  async function toggleFavorite(serviceId: string) {
    const auth = await supabase.auth.getUser();
    if (!auth.data.user) {
      window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname);
      return;
    }
    const isFavorite = favorites.has(serviceId);
    if (isFavorite) {
      await supabase.from("favorites").delete().eq("user_id", auth.data.user.id).eq("service_id", serviceId);
      setFavorites((current) => { const next = new Set(current); next.delete(serviceId); return next; });
    } else {
      const { error } = await supabase.from("favorites").insert({ user_id: auth.data.user.id, service_id: serviceId });
      if (!error) setFavorites((current) => new Set(current).add(serviceId));
    }
  }

  return (
    <main className="bento-home">
      <section className="bento-grid bento-hero-wrap">
        <div className="bento-card hero-card">
          <div className="hero-content">
            <div className="hero-badges"><span>Маркетплейс услуг</span><i>●</i></div>
            <h1>Люди для<br /><em>Людей.</em></h1>
            <p>Найдите проверенного специалиста для любой задачи — от ремонта до дизайна.</p>
            <div className="hero-search"><div className="search-field"><img src="/icons/search.svg" alt="" /><input aria-label="Поиск услуги" value={heroSearch} onChange={(event) => setHeroSearch(event.target.value)} placeholder="Что нужно сделать?" /></div><a className="hero-search-button" href={"/services" + (heroSearch.trim() ? "?q=" + encodeURIComponent(heroSearch.trim()) : "")}>Найти</a></div>
            <div className="hero-actions"><a className="button" href="/requests/new">Мне нужна услуга <span>↗</span></a><a className="text-link" href="/services">Смотреть каталог <span>→</span></a></div>
          </div>
          <div className="hero-art" aria-hidden="true"><img src="/illustrations/hero.svg" alt="" /></div>
        </div>
        <a className="bento-card join-card" href="/services/new"><span className="card-kicker">Для специалистов</span><strong>Покажите,<br />что вы умеете</strong><span className="round-arrow">↗</span><div className="join-orb">+</div></a>
        <a className="bento-card request-card" href="/requests"><span className="card-kicker">Заявки рядом</span><strong>Кто-то уже<br />ищет вас</strong><span className="request-count">{requestCount > 0 ? requestCount : "—"} <small>{requestCount > 0 ? "новых заявок" : "новых заявок пока нет"}</small></span><span className="round-arrow">↗</span></a>
      </section>
      <section className="mobile-banner-grid" aria-label="Быстрые действия">
        <a className="mobile-banner mobile-banner-specialist" href="/services/new">
          <span><small>Для специалистов</small><strong>Разместить услугу</strong></span><b aria-hidden="true">↗</b>
        </a>
        <a className="mobile-banner mobile-banner-request" href="/requests">
          <span><small>Заявки рядом</small><strong>Найти заказ</strong></span><b aria-hidden="true">↗</b>
        </a>
      </section>
      <section className="bento-grid category-bento"><div className="section-intro"><span className="eyebrow">Выберите направление</span><h2>Найдётся<br /><em>своё.</em></h2><a className="text-link" href="/services">Все категории →</a></div>{categories.slice(0, 6).map((category, index) => <a className={"bento-card category-tile " + category.tone + " cat-" + index} href={"/services?category=" + category.slug} key={category.name}><img className="category-illustration" src={category.image} alt="" /><span className="category-name">{category.name}</span><span className="category-arrow">↗</span></a>)}</section>
      <section className="content-section bento-services"><div className="section-head"><div><span className="eyebrow">Свежие предложения</span><h2>Услуги, которые<br /><em>выбирают сейчас</em></h2></div><a href="/services" className="text-link">Смотреть все →</a></div>{loading ? <div className="service-preview-grid">{[1, 2, 3].map((item) => <div className="preview-card preview-skeleton" key={item}><div className="skeleton-image" /></div>)}</div> : services.length === 0 ? <div className="empty"><strong>Пока нет опубликованных услуг</strong><p>Станьте первым исполнителем — разместите свою услугу.</p><a className="button" href="/services/new">Разместить услугу</a></div> : <div className="service-preview-grid">{services.slice(0, 4).map((service) => { const category = service.category_id ? categoryMap[service.category_id] : undefined; const provider = profiles[service.user_id]?.display_name || "Исполнитель"; return <a className="preview-card" href={"/service?id=" + service.id} key={service.id}><div className="preview-image"><img src={illustrationFor(service, category)} alt="" /><button type="button" className={"favorite" + (favorites.has(service.id) ? " is-favorite" : "")} aria-label={favorites.has(service.id) ? "Убрать из избранного" : "В избранное"} onClick={(event) => { event.preventDefault(); event.stopPropagation(); toggleFavorite(service.id); }}><img src="/icons/heart.svg" alt="" /></button></div><div className="service-category">{category?.name || "Услуга"}</div><h3>{service.title}</h3><p>{service.description || "Описание услуги пока не добавлено."}</p><div className="provider"><span className="avatar">{provider.slice(0, 1).toUpperCase()}</span><span><strong>{provider}</strong><small>{service.city || service.region || "Россия"}</small></span></div><strong className="price">{formatPrice(service.price, service.price_type)}</strong></a>; })}</div>}</section>
      <section className="bento-footer"><div><span className="eyebrow">Услугач</span><h2>Делайте жизнь<br /><em>проще.</em></h2></div><div className="footer-cta"><p>Всё необходимое —<br />в одном месте.</p><a className="button" href="/services">Открыть каталог ↗</a></div></section>
    </main>
  );
}
