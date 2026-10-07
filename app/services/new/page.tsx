"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import { LOCATION_REGIONS, getCities } from "@/lib/locations";

type Category = { id: string; name: string };

function makeSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-zа-яё0-9]+/gi, "-").replace(/^-+|-+$/g, "") + "-" + Date.now().toString(36);
}

export default function NewServicePage() {
  const router = useRouter(); const supabase = createClient();
  const [categories,setCategories] = useState<Category[]>([]); const [title,setTitle]=useState("");
  const [categoryId,setCategoryId]=useState(""); const [description,setDescription]=useState("");
  const [price,setPrice]=useState(""); const [priceType,setPriceType]=useState("fixed");
  const [region,setRegion]=useState(""); const [city,setCity]=useState(""); const [district,setDistrict]=useState(""); const [workFormat,setWorkFormat]=useState("onsite");
  const [images,setImages]=useState<File[]>([]); const [imageUrls,setImageUrls]=useState<string[]>([]);
  const [error,setError]=useState(""); const [loading,setLoading]=useState(false); const [checkingAuth,setCheckingAuth]=useState(true); const [userId,setUserId]=useState<string|null>(null);

  useEffect(() => {
    async function load() {
      const [{ data: auth }, categoriesResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("categories").select("id,name").order("sort_order"),
      ]);
      setUserId(auth.user?.id ?? null);
      setCategories(categoriesResult.data || []);
      setCheckingAuth(false);
    }
    load();
  }, [supabase]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setLoading(true);
    const auth=await supabase.auth.getUser(); const user=auth.data.user;
    if (!user) { setLoading(false); router.push("/login?next=/services/new"); return; }
    let uploadedUrls:string[]=[];
    try { uploadedUrls=await uploadImages(user.id); } catch(e:any) { setError(e.message||"Не удалось загрузить фотографии."); setLoading(false); return; }
    const result=await supabase.from("services").insert({
      user_id:user.id, category_id:categoryId || null, title, slug:makeSlug(title), description,
      price:price ? Number(price) : null, price_type:priceType, region:region || null, city:city || null, district:district || null,
      work_format:workFormat, image_urls:uploadedUrls, status:"pending"
    }).select("id").single();
    setLoading(false);
    if (result.error) { setError(result.error.message); return; }
    router.push("/profile?moderation=service");
  }

  const cities = getCities(region);

  if (checkingAuth) return <main className="page"><SiteHeader /><section className="section narrow"><p>Проверяем аккаунт...</p></section></main>;

  if (!userId) return <main className="page"><SiteHeader />
    <section className="section narrow">
      <span className="eyebrow">Нужен аккаунт</span><h1>Размещать услуги могут только зарегистрированные пользователи</h1>
      <p>Зарегистрируйтесь один раз — после этого сможете размещать услуги, редактировать профиль и общаться с клиентами.</p>
      <div className="hero-actions"><a className="button" href="/register?next=/services/new">Зарегистрироваться</a><a className="button secondary" href="/login?next=/services/new">Войти</a></div>
    </section></main>;

  return <main className="page"><SiteHeader />
    <section className="section narrow"><span className="eyebrow">Новая услуга</span><h1>Предложите свою услугу</h1><p>Заполните основные поля и добавьте до 10 фотографий. Первое фото станет главным.</p>
    <form className="form-card form-wide" onSubmit={submit}>
      <label>Название услуги<input value={title} onChange={e=>setTitle(e.target.value)} required maxLength={140} placeholder="Например, ремонт ванной комнаты" /></label>
      <label>Категория<select value={categoryId} onChange={e=>setCategoryId(e.target.value)} required><option value="">Выберите категорию</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Фотографии<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>{const next=Array.from(e.target.files||[]).slice(0,10);setImages(next);setImageUrls(next.map(f=>URL.createObjectURL(f)));}} />{imageUrls.length>0&&<div className="upload-preview-grid">{imageUrls.map((url,i)=><div className="upload-preview" key={url}><img src={url} alt={"Фото "+(i+1)} /></div>)}</div>}</label>
      <label>Описание<textarea value={description} onChange={e=>setDescription(e.target.value)} required rows={7} maxLength={5000} placeholder="Что вы делаете и что входит в работу?" /></label>
      <div className="form-grid"><label>Цена<input type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} /></label>
      <label>Тип цены<select value={priceType} onChange={e=>setPriceType(e.target.value)}><option value="fixed">За работу</option><option value="hourly">За час</option><option value="negotiable">Договорная</option><option value="free">Бесплатно</option></select></label></div>
      <div className="form-grid">
        <label>Регион<select value={region} onChange={e=>{setRegion(e.target.value);setCity("")}} required><option value="">Выберите регион</option>{LOCATION_REGIONS.map(item=><option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
        <label>Город<select value={city} onChange={e=>setCity(e.target.value)} disabled={!region} required><option value="">{region ? "Выберите город" : "Сначала регион"}</option>{cities.map(item=><option key={item} value={item}>{item}</option>)}</select></label>
      </div>
      <label>Район<input value={district} onChange={e=>setDistrict(e.target.value)} placeholder="Например, Центральный" /></label>
      <label>Формат работы<select value={workFormat} onChange={e=>setWorkFormat(e.target.value)}><option value="onsite">На месте</option><option value="remote">Удалённо</option><option value="hybrid">Гибрид</option></select></label>
      {error && <div className="form-error">{error}</div>}<button className="button" disabled={loading}>{loading ? "Публикуем..." : "Опубликовать услугу"}</button>
    </form></section></main>;
}
