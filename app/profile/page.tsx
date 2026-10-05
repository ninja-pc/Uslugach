"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = { display_name: string | null; bio: string | null; city: string | null; district: string | null; phone: string | null };

export default function ProfilePage() {
  const router = useRouter(); const supabase = createClient();
  const [profile, setProfile] = useState<Profile>({display_name:"",bio:"",city:"",district:"",phone:""});
  const [email, setEmail] = useState(""); const [error, setError] = useState("");
  const [saved, setSaved] = useState(false); const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const auth = await supabase.auth.getUser(); const user = auth.data.user;
      if (!user) { router.replace("/login"); return; }
      setEmail(user.email || "");
      const result = await supabase.from("profiles").select("display_name,bio,city,district,phone").eq("id", user.id).maybeSingle();
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
  if (loading) return <main className="page"><p>Загружаем профиль...</p></main>;

  return <main className="page"><header className="header"><a className="logo" href="/">⚡ Услугач</a>
    <nav><a href="/services">Услуги</a><a className="button secondary" href="/services/new">Добавить услугу</a><button className="text-button" onClick={logout}>Выйти</button></nav></header>
    <section className="section narrow"><span className="eyebrow">Личный кабинет</span><h1>Мой профиль</h1><p>Профиль виден другим пользователям маркетплейса.</p>
    <form className="form-card form-wide" onSubmit={save}>
      <label>Email<input value={email} disabled /></label>
      <label>Имя<input value={profile.display_name || ""} onChange={e => setProfile({...profile,display_name:e.target.value})} required maxLength={80} /></label>
      <label>О себе<textarea value={profile.bio || ""} onChange={e => setProfile({...profile,bio:e.target.value})} rows={5} maxLength={1000} /></label>
      <div className="form-grid"><label>Город<input value={profile.city || ""} onChange={e => setProfile({...profile,city:e.target.value})} /></label>
      <label>Район<input value={profile.district || ""} onChange={e => setProfile({...profile,district:e.target.value})} /></label></div>
      <label>Телефон<input value={profile.phone || ""} onChange={e => setProfile({...profile,phone:e.target.value})} maxLength={30} /></label>
      {error && <div className="form-error">{error}</div>}{saved && <div className="form-success">Профиль сохранён.</div>}
      <button className="button">Сохранить профиль</button>
    </form></section></main>;
}
