"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Category = { id: string; name: string };

function makeSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-zа-яё0-9]+/gi, "-").replace(/^-+|-+$/g, "") + "-" + Date.now().toString(36);
}

export default function NewServicePage() {
  const router = useRouter(); const supabase = createClient();
  const [categories,setCategories] = useState<Category[]>([]); const [title,setTitle]=useState("");
  const [categoryId,setCategoryId]=useState(""); const [description,setDescription]=useState("");
  const [price,setPrice]=useState(""); const [priceType,setPriceType]=useState("fixed");
  const [city,setCity]=useState(""); const [district,setDistrict]=useState(""); const [workFormat,setWorkFormat]=useState("onsite");
  const [error,setError]=useState(""); const [loading,setLoading]=useState(false);

  useEffect(() => { supabase.from("categories").select("id,name").order("sort_order").then(r => setCategories(r.data || [])); }, [supabase]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setLoading(true);
    const auth=await supabase.auth.getUser(); const user=auth.data.user;
    if (!user) { router.push("/login"); return; }
    const result=await supabase.from("services").insert({
      user_id:user.id, category_id:categoryId || null, title, slug:makeSlug(title), description,
      price:price ? Number(price) : null, price_type:priceType, city:city || null, district:district || null,
      work_format:workFormat, status:"published"
    }).select("id").single();
    setLoading(false);
    if (result.error) { setError(result.error.message); return; }
    router.push("/service?id=" + result.data.id);
  }

  return <main className="page"><header className="header"><a className="logo" href="/">⚡ Услугач</a><nav><a href="/services">Все услуги</a></nav></header>
    <section className="section narrow"><span className="eyebrow">Новая услуга</span><h1>Предложите свою услугу</h1><p>Заполните основные поля. Фотографии добавим следующим этапом.</p>
    <form className="form-card form-wide" onSubmit={submit}>
      <label>Название услуги<input value={title} onChange={e=>setTitle(e.target.value)} required maxLength={140} placeholder="Например, ремонт ванной комнаты" /></label>
      <label>Категория<select value={categoryId} onChange={e=>setCategoryId(e.target.value)}><option value="">Выберите категорию</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Описание<textarea value={description} onChange={e=>setDescription(e.target.value)} required rows={7} maxLength={5000} placeholder="Что вы делаете и что входит в работу?" /></label>
      <div className="form-grid"><label>Цена<input type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} /></label>
      <label>Тип цены<select value={priceType} onChange={e=>setPriceType(e.target.value)}><option value="fixed">За работу</option><option value="hourly">За час</option><option value="negotiable">Договорная</option><option value="free">Бесплатно</option></select></label></div>
      <div className="form-grid"><label>Город<input value={city} onChange={e=>setCity(e.target.value)} /></label><label>Район<input value={district} onChange={e=>setDistrict(e.target.value)} /></label></div>
      <label>Формат работы<select value={workFormat} onChange={e=>setWorkFormat(e.target.value)}><option value="onsite">На месте</option><option value="remote">Удалённо</option><option value="hybrid">Гибрид</option></select></label>
      {error && <div className="form-error">{error}</div>}<button className="button" disabled={loading}>{loading ? "Публикуем..." : "Опубликовать услугу"}</button>
    </form></section></main>;
}
