"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SiteHeader from "@/components/SiteHeader";

type Service={id:string;user_id:string;title:string;description:string;price:number|null;price_type:string;city:string|null;region:string|null;work_format:string;provider_name?:string};
function imageFor(s:Service){const t=(s.title+" "+s.description).toLowerCase();if(t.includes("уборк")||t.includes("клини"))return "/illustrations/cleaning.svg";if(t.includes("ремонт")||t.includes("стро")||t.includes("сантех")||t.includes("электр"))return "/illustrations/repair.svg";if(t.includes("it")||t.includes("сайт")||t.includes("компьют")||t.includes("программ"))return "/illustrations/it.svg";if(t.includes("красот")||t.includes("массаж")||t.includes("здоров"))return "/illustrations/beauty.svg";if(t.includes("достав")||t.includes("авто")||t.includes("курьер"))return "/illustrations/delivery.svg";return "/illustrations/other.svg";}

const supabase=createClient();

export default function ServicesPage() {
  const [services,setServices]=useState<Service[]>([]);
  const [search,setSearch]=useState("");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [categories,setCategories]=useState<Category[]>([]);
  const [categoryFilter,setCategoryFilter]=useState("");
  const [favorites,setFavorites]=useState<Set<string>>(new Set());

  useEffect(()=>{
    let cancelled=false;
    async function load(){
      setLoading(true); setError("");
      const params=new URLSearchParams(window.location.search);
      const initialQuery=params.get("q")||"";
      const initialCategory=params.get("category")||"";
      setSearch(initialQuery); setCategoryFilter(initialCategory);
      const [{data:categoryRows,error:categoryError},{data:serviceRows,error:serviceError}]=await Promise.all([
        supabase.from("categories").select("id,name,slug").eq("is_active",true).order("name"),
        supabase.from("services").select("id,user_id,title,description,price,price_type,city,region,work_format,category_id").eq("status","published").order("created_at",{ascending:false}).limit(60)
      ]);
      const result={data:serviceRows,error:serviceError};
      if(categoryError&&!serviceError) setError("Не удалось загрузить категории: "+categoryError.message);
      if(cancelled)return;
      if(result.error){setError("Не удалось загрузить каталог: "+result.error.message);setLoading(false);return;}
      const rows=(result.data||[]) as Service[];
      const categoryList=(categoryRows||[]) as Category[];
      setCategories(categoryList);
      const ids=[...new Set(rows.map(x=>x.user_id))];
      let names:Record<string,string>={};
      if(ids.length){
        const profiles=await supabase.from("profiles").select("id,display_name").in("id",ids);
        if(!profiles.error) for(const p of profiles.data||[]) names[p.id]=p.display_name||"Исполнитель";
      }
      if(cancelled)return;
      setServices(rows.map(x=>({...x,provider_name:names[x.user_id]||"Исполнитель"})));
      const auth=await supabase.auth.getUser();
      if(auth.data.user&&rows.length){const {data:favoriteRows}=await supabase.from("favorites").select("service_id").eq("user_id",auth.data.user.id).in("service_id",rows.map(x=>x.id));setFavorites(new Set((favoriteRows||[]).map(x=>x.service_id)));}
      else setFavorites(new Set());
      setLoading(false);
    }
    load();
    return()=>{cancelled=true};
  },[]);

  const selectedCategory=categories.find(c=>c.slug===categoryFilter);
  const filtered=services.filter(s=>{
    const matchesText=(s.title+" "+s.description+" "+(s.city||"")+" "+(s.region||"")).toLowerCase().includes(search.toLowerCase());
    const matchesCategory=!selectedCategory||s.category_id===selectedCategory.id;
    return matchesText&&matchesCategory;
  });

  async function toggleFavorite(serviceId:string){
    const auth=await supabase.auth.getUser();
    if(!auth.data.user){window.location.href="/login?next="+encodeURIComponent(window.location.pathname+window.location.search);return;}
    const isFavorite=favorites.has(serviceId);
    if(isFavorite){await supabase.from("favorites").delete().eq("user_id",auth.data.user.id).eq("service_id",serviceId);setFavorites(current=>{const next=new Set(current);next.delete(serviceId);return next;});}
    else {const {error}=await supabase.from("favorites").insert({user_id:auth.data.user.id,service_id:serviceId});if(!error)setFavorites(current=>new Set(current).add(serviceId));}
  }

  return <main className="page"><SiteHeader />
    <section className="section catalog-page"><div className="catalog-heading"><div><span className="eyebrow">Маркетплейс</span><h1>Найдите специалиста</h1><p>Реальные опубликованные услуги от исполнителей.</p></div><a className="button" href="/services/new">Разместить услугу</a></div>
    <div className="search catalog-search"><img src="/icons/search.svg" alt="" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск по услугам, описанию, городу или региону" /></div>
    <div className="catalog-filters">{categories.map(c=><button type="button" key={c.id} className={categoryFilter===c.slug?"active":""} onClick={()=>setCategoryFilter(categoryFilter===c.slug?"":c.slug)}>{c.name}</button>)}</div>
    {loading ? <div className="empty">Загружаем услуги...</div> : error ? <div className="form-error">{error}</div> : filtered.length===0 ? <div className="empty">Пока опубликованных услуг нет. Станьте первым исполнителем.</div> :
      <div className="service-grid">{filtered.map(s=><a className="service-card" href={"/service?id="+s.id} key={s.id}><div className="service-card-image"><img src={imageFor(s)} alt="" /><button type="button" className={"service-favorite" + (favorites.has(s.id) ? " is-favorite" : "")} aria-label={favorites.has(s.id) ? "Убрать из избранного" : "В избранное"} onClick={(e)=>{e.preventDefault();e.stopPropagation();toggleFavorite(s.id);}}><img src="/icons/heart.svg" alt="" /></button></div><div className="service-top"><span>{s.city||"Онлайн"}</span><span>{s.work_format==="remote"?"Удалённо":s.work_format==="hybrid"?"Гибрид":"На месте"}</span></div><h3>{s.title}</h3><p>{s.description}</p><div className="service-card-bottom"><strong>{s.price==null?"По договорённости":new Intl.NumberFormat("ru-RU").format(s.price)+" ₽"+(s.price_type==="hourly"?" / час":"")}</strong><small>{s.provider_name}</small></div></a>)}</div>}
    </section></main>;
}
