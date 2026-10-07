"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SiteHeader from "@/components/SiteHeader";

type Performer = {
  id: string;
  display_name: string | null;
  bio: string | null;
  city: string | null;
  region: string | null;
  district: string | null;
  serviceCount: number;
  services: { id: string; title: string; price: number | null; price_type: string | null }[];
};

const supabase = createClient();

export default function PerformersPage() {
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      const { data: services, error: servicesError } = await supabase
        .from("services")
        .select("id,user_id,title,price,price_type,city,region")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(200);

      if (servicesError) {
        setError("Не удалось загрузить исполнителей: " + servicesError.message);
        setLoading(false);
        return;
      }

      const rows = services || [];
      const ids = [...new Set(rows.map((service) => service.user_id))];
      if (!ids.length) {
        setPerformers([]);
        setLoading(false);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id,display_name,bio,city,region,district")
        .in("id", ids);

      if (profilesError) {
        setError("Не удалось загрузить профили: " + profilesError.message);
        setLoading(false);
        return;
      }

      const servicesByUser: Record<string, Performer["services"]> = {};
      for (const service of rows) {
        if (!servicesByUser[service.user_id]) servicesByUser[service.user_id] = [];
        if (servicesByUser[service.user_id].length < 3) {
          servicesByUser[service.user_id].push(service);
        }
      }

      setPerformers(
        (profiles || []).map((profile) => ({
          ...profile,
          serviceCount: rows.filter((service) => service.user_id === profile.id).length,
          services: servicesByUser[profile.id] || [],
        }))
      );
      setLoading(false);
    }

    load();
  }, []);

  const filtered = performers.filter((performer) => {
    const text = [
      performer.display_name || "",
      performer.bio || "",
      performer.city || "",
      performer.region || "",
      ...performer.services.map((service) => service.title),
    ].join(" ").toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <main className="page">
      <SiteHeader />
      <section className="section performers-page">
        <div className="catalog-heading">
          <div>
            <span className="eyebrow">Специалисты</span>
            <h1>Исполнители</h1>
            <p>Найдите специалиста по профилю и опубликованным услугам.</p>
          </div>
          <a className="button" href="/services/new">Разместить услугу</a>
        </div>

        <div className="search catalog-search">
          <img src="/icons/search.svg" alt="" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск исполнителя, услуги или города" />
        </div>

        {loading ? (
          <div className="empty">Загружаем исполнителей...</div>
        ) : error ? (
          <div className="form-error">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="empty">Пока нет исполнителей с опубликованными услугами.</div>
        ) : (
          <div className="performer-grid">
            {filtered.map((performer) => (
              <article className="performer-card" key={performer.id}>
                <div className="performer-card-head">
                  <div className="performer-avatar">{(performer.display_name || "И").slice(0, 1).toUpperCase()}</div>
                  <div>
                    <h2>{performer.display_name || "Исполнитель"}</h2>
                    <p>{[performer.city, performer.region].filter(Boolean).join(" · ") || "Локация не указана"}</p>
                  </div>
                </div>

                <p className="performer-bio">{performer.bio || "Исполнитель пока не добавил описание профиля."}</p>

                <div className="performer-meta">
                  <span>{performer.serviceCount} {performer.serviceCount === 1 ? "услуга" : performer.serviceCount < 5 ? "услуги" : "услуг"}</span>
                  {performer.district && <span>Район: {performer.district}</span>}
                </div>

                <div className="performer-services">
                  {performer.services.map((service) => (
                    <a href={"/service?id=" + service.id} key={service.id}>
                      <span>{service.title}</span>
                      <b>{service.price == null ? "По договорённости" : new Intl.NumberFormat("ru-RU").format(service.price) + " ₽"}</b>
                    </a>
                  ))}
                </div>

                <a className="button secondary performer-profile-link" href={"/user?id=" + performer.id}>
                  Открыть профиль
                </a>
              </article>
            ))}
          </div>
        )}
      </section>

      <style jsx>{`
        .performer-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
        .performer-card{padding:20px;border:1px solid #e7eaf1;border-radius:24px;background:#fff;box-shadow:0 12px 32px rgba(35,43,74,.06)}
        .performer-card-head{display:flex;align-items:center;gap:13px}
        .performer-avatar{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:#f0efff;color:#5d58d8;font-size:20px;font-weight:800}
        .performer-card h2{margin:0;font-size:19px}
        .performer-card-head p{margin:4px 0 0;color:#7a8497;font-size:12px}
        .performer-bio{min-height:48px;margin:18px 0 12px;color:#566178;font-size:13px;line-height:1.55}
        .performer-meta{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
        .performer-meta span{padding:6px 9px;border-radius:999px;background:#f5f6fa;color:#687287;font-size:11px;font-weight:700}
        .performer-services{display:grid;gap:8px;margin-bottom:16px}
        .performer-services a{display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border-radius:13px;background:#f8f9fc;color:#26334c;text-decoration:none}
        .performer-services span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:700}
        .performer-services b{flex:0 0 auto;font-size:11px}
        .performer-profile-link{width:100%;text-align:center;display:block}
        @media(max-width:980px){.performer-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:650px){.performer-grid{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}
