"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import { LOCATION_REGIONS, getCities } from "@/lib/locations";

type Profile = { display_name: string | null; bio: string | null; region: string | null; city: string | null; district: string | null; phone: string | null };

export default function ProfilePage() {
  const router = useRouter(); const supabase = createClient();
  const [profile, setProfile] = useState<Profile>({display_name:"",bio:"",region:"",city:"",district:"",phone:""});
  const [email, setEmail] = useState(""); const [error, setError] = useState("");
  const [saved, setSaved] = useState(false); const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const auth = await supabase.auth.getUser(); const user = auth.data.user;
      if (!user) { router.replace("/login"); return; }
      setEmail(user.email || "");
      const result = await supabase.from("profiles").select("display_name,bio,region,city,district,phone").eq("id", user.id).maybeSingle();
      if (result.data) setProfile(result.data); setLoading(false);
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
    <section className="section narrow"><span className="eyebrow">Личный кабинет</span><h1>Мой кабинет</h1><p>Здесь можно настроить профиль и управлять своими данными.</p>
    <div className="cabinet-grid">
      <a className="cabinet-card" href="/services/new"><strong>⚡ Разместить услугу</strong><span>Добавить новую карточку услуги</span></a>
      <a className="cabinet-card" href="/services"><strong>🔎 Найти услугу</strong><span>Посмотреть предложения исполнителей</span></a>
    </div>
    <form className="form-card form-wide" onSubmit={save}>
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
