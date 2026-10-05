"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SiteHeader from "@/components/SiteHeader";

type Service={id:string;user_id:string;title:string;description:string;price:number|null;price_type:string;city:string|null;region:string|null;work_format:string;provider_name?:string};

export default function ServicesPage() {
  const supabase=createClient();
  const [services,setServices]=useState<Service[]>([]);
  const [search,setSearch]=useState("");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  useEffect(()=>{
    async function load(){
      setLoading(true); setError("");
      const result=await supabase.from("services").select("id,user_id,title,description,price,price_type,city,region,work_format").eq("status","published").order("created_at",{ascending:false});
      if(result.error){setError("Не удалось загрузить каталог: "+result.error.message);setLoading(false);return;}
      const rows=(result.data||[]) as Service[];
      const ids=[...new Set(rows.map(x=>x.user_id))];
      let names:Record<string,string>={};
      if(ids.length){
        const profiles=await supabase.from("profiles").select("id,display_name").in("id",ids);
        if(!profiles.error) for(const p of profiles.data||[]) names[p.id]=p.display_name||"Исполнитель";
      }
      setServices(rows.map(x=>({...x,provider_name:names[x.user_id]||"Исполнитель"})));
      setLoading(false);
    }
    load();
  },[supabase]);

  const filtered=services.filter(s=>(s.title+" "+s.description+" "+(s.city||"")+" "+(s.region||"")).toLowerCase().includes(search.toLowerCase()));

  return <main className="page"><SiteHeader />
    <section className="section"><span className="eyebrow">Каталог</span><h1>Услуги</h1>
    <div className="search catalog-search"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск по услугам, описанию, городу или региону" /></div>
    {loading ? <div className="empty">Загружаем услуги...</div> : error ? <div className="form-error">{error}</div> : filtered.length===0 ? <div className="empty">Пока опубликованных услуг нет. Станьте первым исполнителем.</div> :
      <div className="service-grid">{filtered.map(s=><a className="service-card" href={"/service?id="+s.id} key={s.id}>
        <div className="service-top"><span>{s.city||"Онлайн"}</span><span>{s.work_format==="remote"?"Удалённо":s.work_format==="hybrid"?"Гибрид":"На месте"}</span></div>
        <h3>{s.title}</h3><p>{s.description}</p><strong>{s.price==null?"Цена по договорённости":String(s.price)+" ₽"+(s.price_type==="hourly"?" / час":"")}</strong><small>{s.provider_name}</small>
      </a>)}</div>}
    </section></main>;
}
