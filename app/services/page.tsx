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
    <section className="section catalog-page"><div className="catalog-heading"><div><span className="eyebrow">Маркетплейс</span><h1>Найдите специалиста</h1><p>Реальные опубликованные услуги от исполнителей.</p></div><a className="button" href="/services/new">Разместить услугу</a></div>
    <div className="search catalog-search"><img src="/icons/search.svg" alt="" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск по услугам, описанию, городу или региону" /></div>
    {loading ? <div className="empty">Загружаем услуги...</div> : error ? <div className="form-error">{error}</div> : filtered.length===0 ? <div className="empty">Пока опубликованных услуг нет. Станьте первым исполнителем.</div> :
      <div className="service-grid">{filtered.map(s=><a className="service-card" href={"/service?id="+s.id} key={s.id}><div className="service-card-image"><img src={imageFor(s)} alt="" /><span className="service-favorite"><img src="/icons/heart.svg" alt="" /></span></div><div className="service-top"><span>{s.city||"Онлайн"}</span><span>{s.work_format==="remote"?"Удалённо":s.work_format==="hybrid"?"Гибрид":"На месте"}</span></div><h3>{s.title}</h3><p>{s.description}</p><div className="service-card-bottom"><strong>{s.price==null?"По договорённости":new Intl.NumberFormat("ru-RU").format(s.price)+" ₽"+(s.price_type==="hourly"?" / час":"")}</strong><small>{s.provider_name}</small></div></a>)}</div>}
    </section></main>;
}
