"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Service = { id:string; title:string; description:string; price:number|null; price_type:string; city:string|null; work_format:string; profiles:{display_name:string|null}|null };

export default function ServicesPage() {
  const supabase=createClient(); const [services,setServices]=useState<Service[]>([]); const [search,setSearch]=useState("");
  useEffect(()=>{ supabase.from("services").select("id,title,description,price,price_type,city,work_format,profiles(display_name)").eq("status","published").order("created_at",{ascending:false}).then(r=>setServices((r.data as Service[])||[])); },[supabase]);
  const filtered=services.filter(s=>(s.title+" "+s.description+" "+(s.city||"")).toLowerCase().includes(search.toLowerCase()));
  return <main className="page"><header className="header"><a className="logo" href="/">⚡ Услугач</a><nav><a href="/requests">Нужны услуги</a><a className="button" href="/services/new">Предложить услугу</a></nav></header>
    <section className="section"><span className="eyebrow">Каталог</span><h1>Услуги</h1>
    <div className="search catalog-search"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск по услугам, описанию или городу" /></div>
    {filtered.length===0 ? <div className="empty">Пока опубликованных услуг нет. Станьте первым исполнителем.</div> :
      <div className="service-grid">{filtered.map(s=><a className="service-card" href={"/service?id="+s.id} key={s.id}>
        <div className="service-top"><span>{s.city||"Онлайн"}</span><span>{s.work_format==="remote"?"Удалённо":s.work_format==="hybrid"?"Гибрид":"На месте"}</span></div>
        <h3>{s.title}</h3><p>{s.description}</p><strong>{s.price==null?"Цена по договорённости":String(s.price)+" ₽"+(s.price_type==="hourly"?" / час":"")}</strong><small>{s.profiles?.display_name||"Исполнитель"}</small>
      </a>)}</div>}
    </section></main>;
}
