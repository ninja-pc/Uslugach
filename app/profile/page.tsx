"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import { LOCATION_REGIONS, getCities } from "@/lib/locations";

type Profile = { display_name: string | null; bio: string | null; region: string | null; city: string | null; district: string | null; phone: string | null };
type Service = { id:string; title:string; description:string|null; price:number|null; price_type:string|null; city:string|null; status:string };
type Request = { id:string; title:string; description:string|null; budget:number|null; city:string|null; deadline:string|null; status:string };

export default function ProfilePage() {
  const router = useRouter(); const supabase = createClient();
  const [profile, setProfile] = useState<Profile>({display_name:"",bio:"",region:"",city:"",district:"",phone:""});
  const [email, setEmail] = useState(""); const [error, setError] = useState("");
  const [saved, setSaved] = useState(false); const [loading, setLoading] = useState(true);
  const [services,setServices] = useState<Service[]>([]);
  const [requests,setRequests] = useState<Request[]>([]);

  useEffect(() => {
    async function load() {
      const auth = await supabase.auth.getUser(); const user = auth.data.user;
      if (!user) { router.replace("/login"); return; }
      setEmail(user.email || "");
      const [result, servicesResult, requestsResult] = await Promise.all([
        supabase.from("profiles").select("display_name,bio,region,city,district,phone").eq("id", user.id).maybeSingle(),
        supabase.from("services").select("id,title,description,price,price_type,city,status").eq("user_id", user.id).order("created_at",{ascending:false}),
        supabase.from("requests").select("id,title,description,budget,city,deadline,status").eq("user_id", user.id).order("created_at",{ascending:false})
      ]);
      if (result.data) setProfile(result.data);
      setServices((servicesResult.data||[]) as Service[]);
      setRequests((requestsResult.data||[]) as Request[]);
      setLoading(false);
    }
    load();
  }, [router, supabase]);

  async function save(event: FormEvent) {
    event.preventDefault(); setError(""); setSaved(false);
    const auth = await supabase.auth.getUser(); const user = auth.data.user;
    if (!user) { router.push("/login"); return; }
    const result = await supabase.from("profiles").update(profile).eq("id", user.id);
    if (result.error) setError(result.error.message); else setSaved(true);
  }

  async function logout() { await supabase.auth.signOut(); router.push("/"); router.refresh(); }
  if (loading) return <main className="page"><SiteHeader /><section className="section narrow"><p>Загружаем профиль...</p></section></main>;

  const cities = getCities(profile.region || "");

  return <main className="page"><SiteHeader />
    <section className="section cabinet-section"><div className="cabinet-hero"><div className="cabinet-profile"><div className="cabinet-avatar">{(profile.display_name||email||"У").slice(0,1).toUpperCase()}</div><div><span className="eyebrow">Личный кабинет</span><h1>{profile.display_name||"Мой кабинет"}</h1><p>{email}</p></div></div><div className="cabinet-stats"><div><strong>{services.filter(s=>s.status==="published").length}</strong><span>опубликованных услуг</span></div><div><strong>{requests.filter(r=>!["closed","cancelled","completed"].includes(r.status)).length}</strong><span>активных заявок</span></div></div></div>
    <div className="cabinet-actions"><a className="cabinet-action primary" href="/services/new"><strong>Разместить услугу</strong><span>Предложить свои услуги</span></a><a className="cabinet-action" href="/services"><strong>Найти специалиста</strong><span>Открыть каталог</span></a><a className="cabinet-action" href="/requests/new"><strong>Создать заявку</strong><span>Опишите нужную задачу</span></a></div>
    <div className="cabinet-columns"><section className="cabinet-list-card"><div className="cabinet-list-head"><div><span className="eyebrow">Мои предложения</span><h2>Опубликованные услуги</h2></div><a href="/services/new">＋ Добавить</a></div>
      {services.filter(s=>s.status==="published").length===0?<div className="cabinet-empty"><strong>Пока нет опубликованных услуг</strong><span>Добавьте первое предложение.</span><a className="button" href="/services/new">Разместить услугу</a></div>:<div className="cabinet-items">{services.filter(s=>s.status==="published").map(s=><a className="cabinet-item" href={"/service?id="+s.id} key={s.id}><div className="cabinet-item-art"><img src="/illustrations/other.svg" alt="" /></div><div className="cabinet-item-main"><span className="item-status published">Опубликована</span><h3>{s.title}</h3><p>{s.description||"Без описания"}</p><small>{s.city||"Город не указан"}</small></div><strong className="cabinet-item-price">{s.price==null?"По договорённости":new Intl.NumberFormat("ru-RU").format(s.price)+" ₽"+(s.price_type==="hourly"?" / час":"")}</strong></a>)}</div>}
    </section><section className="cabinet-list-card"><div className="cabinet-list-head"><div><span className="eyebrow">Мои задачи</span><h2>Заявки</h2></div><a href="/requests/new">＋ Создать</a></div>
      {requests.length===0?<div className="cabinet-empty"><strong>Пока нет заявок</strong><span>Создайте заявку, если вам нужен специалист.</span><a className="button secondary" href="/requests/new">Создать заявку</a></div>:<div className="cabinet-items">{requests.map(r=><div className="cabinet-item" key={r.id}><div className="cabinet-item-art request-art"><img src="/illustrations/hero.svg" alt="" /></div><div className="cabinet-item-main"><span className="item-status">{r.status}</span><h3>{r.title}</h3><p>{r.description||"Без описания"}</p><small>{r.city||"Город не указан"}{r.deadline?" · до "+new Date(r.deadline).toLocaleDateString("ru-RU"):""}</small></div><strong className="cabinet-item-price">{r.budget==null?"Бюджет не указан":new Intl.NumberFormat("ru-RU").format(r.budget)+" ₽"}</strong></div>)}</div>}
    </section></div>
    <form className="form-card form-wide cabinet-form" onSubmit={save}>
      <label>Email<input value={email} disabled /></label>
      <label>Имя<input value={profile.display_name || ""} onChange={e => setProfile({...profile,display_name:e.target.value})} required maxLength={80} /></label>
      <label>О себе<textarea value={profile.bio || ""} onChange={e => setProfile({...profile,bio:e.target.value})} rows={5} maxLength={1000} /></label>
      <div className="form-grid">
        <label>Регион<select value={profile.region || ""} onChange={e => setProfile({...profile,region:e.target.value,city:""})}><option value="">Выберите регион</option>{LOCATION_REGIONS.map(region=><option key={region.name} value={region.name}>{region.name}</option>)}</select></label>
        <label>Город<select value={profile.city || ""} onChange={e => setProfile({...profile,city:e.target.value})} disabled={!profile.region}><option value="">{profile.region ? "Выберите город" : "Сначала регион"}</option>{cities.map(city=><option key={city} value={city}>{city}</option>)}</select></label>
      </div>
      <div className="form-grid">
        <label>Район<input value={profile.district || ""} onChange={e => setProfile({...profile,district:e.target.value})} /></label>
        <label>Телефон<input value={profile.phone || ""} onChange={e => setProfile({...profile,phone:e.target.value})} maxLength={30} /></label>
      </div>
      {error && <div className="form-error">{error}</div>}{saved && <div className="form-success">Профиль сохранён.</div>}
      <button className="button">Сохранить профиль</button>
    </form>
    <button className="text-button cabinet-logout" onClick={logout}>Выйти из аккаунта</button>
    </section></main>;
}
