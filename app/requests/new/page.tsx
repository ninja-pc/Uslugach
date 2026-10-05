'use client';

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LOCATION_REGIONS, getCities } from "@/lib/locations";
import SiteHeader from "@/components/SiteHeader";

export default function NewRequestPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [form, setForm] = useState({ title:"", description:"", category_id:"", budget:"", district:"", deadline:"", urgency:"normal" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.replace("/login?next=/requests/new"); return; }
      setUser(data.user);
      const { data: cats } = await supabase.from("categories").select("id,name").eq("is_active", true).order("name");
      setCategories(cats || []);
      setLoading(false);
    })();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) { setError("Заполните название и описание"); return; }
    setSaving(true); setError("");
    const { data, error } = await supabase.from("requests").insert({
      user_id: user.id, category_id: form.category_id || null, title: form.title.trim(),
      description: form.description.trim(), budget: form.budget ? Number(form.budget) : null,
      region: region || null, city: city || null, district: form.district.trim() || null,
      deadline: form.deadline || null, urgency: form.urgency, status: "published",
    }).select("id").single();
    if (error) { setError(error.message); setSaving(false); return; }
    router.push("/request?id=" + data.id);
  }

  if (loading) return <><SiteHeader /><main className="page-shell"><div className="empty-state">Загрузка…</div></main></>;

  return <><SiteHeader /><main className="page-shell">
    <section className="detail-hero">
      <div><span className="eyebrow">Новая заявка</span><h1>Опишите задачу — специалисты откликнутся</h1><p>Чем подробнее вы расскажете о задаче, сроках и бюджете, тем точнее будут предложения.</p></div>
      <div className="service-visual"><img src="/illustrations/tools.svg" alt="" /></div>
    </section>
    <form className="form-card" onSubmit={submit}>
      {error && <div className="form-error">{error}</div>}
      <div className="form-grid">
        <label>Что нужно сделать<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Например: нужен электрик для замены проводки" /></label>
        <label>Категория<select value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Выберите категорию</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      </div>
      <label>Подробности<textarea required rows={7} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Опишите объём работы, материалы, пожелания и важные детали" /></label>
      <div className="form-grid">
        <label>Бюджет, ₽<input type="number" min="0" value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})} placeholder="Например, 15000" /></label>
        <label>Срочность<select value={form.urgency} onChange={e=>setForm({...form,urgency:e.target.value})}><option value="normal">В обычном порядке</option><option value="urgent">Срочно</option><option value="asap">Как можно скорее</option></select></label>
      </div>
      <div className="form-grid">
        <label>Регион<select value={region} onChange={e=>{setRegion(e.target.value);setCity("")}}><option value="">Выберите регион</option>{LOCATION_REGIONS.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}</select></label>
        <label>Город<select value={city} disabled={!region} onChange={e=>setCity(e.target.value)}><option value="">{region ? "Выберите город" : "Сначала регион"}</option>{getCities(region).map(c=><option key={c} value={c}>{c}</option>)}</select></label>
      </div>
      <div className="form-grid">
        <label>Район<input value={form.district} onChange={e=>setForm({...form,district:e.target.value})} placeholder="Необязательно" /></label>
        <label>Желаемый срок<input type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})} /></label>
      </div>
      <div className="form-actions"><button className="primary-btn" disabled={saving}>{saving ? "Публикуем…" : "Опубликовать заявку"}</button><button type="button" className="secondary-btn" onClick={()=>router.back()}>Отмена</button></div>
    </form>
  </main></>;
}
