"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import SiteHeader from "@/components/SiteHeader";

const supabase = createClient();

export default function PublicUserPage() {
  const [profile, setProfile] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const id = new URLSearchParams(window.location.search).get("id");
      if (!id) {
        setLoading(false);
        return;
      }

      const [{ data: profileRow }, { data: serviceRows }, { data: reviewRows }] =
        await Promise.all([
          supabase.from("profiles").select("id,display_name,bio,city,region,district").eq("id", id).maybeSingle(),
          supabase.from("services").select("id,title,description,price,price_type,city,region").eq("user_id", id).eq("status", "published").order("created_at", { ascending: false }),
          supabase.from("reviews").select("id,author_id,rating,body,created_at").eq("target_user_id", id).order("created_at", { ascending: false }),
        ]);

      setProfile(profileRow);
      setServices(serviceRows || []);

      const authorIds = [...new Set((reviewRows || []).map((r: any) => r.author_id))];
      let names: Record<string, string> = {};
      if (authorIds.length) {
        const { data: profiles } = await supabase.from("profiles").select("id,display_name").in("id", authorIds);
        names = Object.fromEntries((profiles || []).map((p: any) => [p.id, p.display_name || "Пользователь"]));
      }

      setReviews((reviewRows || []).map((r: any) => ({
        ...r,
        author_name: names[r.author_id] || "Пользователь",
      })));
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <><SiteHeader /><main className="page-shell"><div className="empty-state">Загрузка профиля…</div><style jsx>{\`
.portfolio-section{margin-top:16px}.portfolio-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}.portfolio-grid a{display:block;position:relative;overflow:hidden;border-radius:18px;background:#f2f4f9;min-height:170px}.portfolio-grid img{width:100%;height:100%;min-height:170px;object-fit:cover;display:block;transition:transform .2s ease}.portfolio-grid a:hover img{transform:scale(1.03)}.portfolio-grid span{position:absolute;left:9px;right:9px;bottom:9px;padding:7px 9px;border-radius:10px;background:rgba(255,255,255,.9);font-size:10px;font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media(max-width:760px){.portfolio-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}`}</style></main></>;
  }

  if (!profile) {
    return <><SiteHeader /><main className="page-shell"><div className="empty-state"><h3>Профиль не найден</h3><Link href="/services">Вернуться в каталог</Link></div></main></>;
  }

  const average = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <>
      <SiteHeader />
      <main className="page-shell public-profile-page">
        <div className="breadcrumbs"><Link href="/services">Каталог</Link><span>/</span><span>Профиль исполнителя</span></div>

        <section className="public-profile-hero">
          <div className="public-avatar">{(profile.display_name || "П").slice(0, 1).toUpperCase()}</div>
          <div>
            <span className="eyebrow">Исполнитель</span>
            <h1>{profile.display_name || "Пользователь"}</h1>
            <p>{[profile.city, profile.region].filter(Boolean).join(" · ") || "Локация не указана"}</p>
          </div>
          {average && <div className="public-rating"><strong>{average}</strong><span>★ · {reviews.length} отзывов</span></div>}
        </section>

        <div className="public-profile-grid">
          <section className="content-card">
            <span className="eyebrow">О специалисте</span>
            <h2>{profile.bio || "Специалист пока не добавил описание."}</h2>
            <p className="muted">{profile.district ? "Район: " + profile.district : "Работает с заказчиками через Услугач."}</p>
          </section>

          <section className="content-card">
            <span className="eyebrow">Услуги</span>
            <h2>Предложения специалиста</h2>
            {services.length ? (
              <div className="public-service-list">
                {services.map((service) => (
                  <Link className="public-service-item" href={"/service?id=" + service.id} key={service.id}>
                    <div><strong>{service.title}</strong><span>{service.city || service.region || "Онлайн"}</span></div>
                    <b>{service.price == null ? "По договорённости" : new Intl.NumberFormat("ru-RU").format(service.price) + " ₽"}</b>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mini-empty">Опубликованных услуг пока нет.</div>
            )}
          </section>
        </div>

        {reviews.length > 0 && (
          <section className="service-reviews public-reviews">
            <span className="eyebrow">Отзывы</span>
            <h2>Что говорят клиенты</h2>
            <div className="review-list">
              {reviews.map((review) => (
                <article className="review-card" key={review.id}>
                  <div className="review-card-head">
                    <div className="avatar">{review.author_name.slice(0, 1).toUpperCase()}</div>
                    <div><strong>{review.author_name}</strong><small>{new Date(review.created_at).toLocaleDateString("ru-RU")}</small></div>
                    <span className="review-rating">{"★".repeat(review.rating)}<i>{"★".repeat(5 - review.rating)}</i></span>
                  </div>
                  {review.body && <p>{review.body}</p>}
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
