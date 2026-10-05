"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SiteHeader from "@/components/SiteHeader";

type Service={id:string;title:string;description:string;price:number|null;price_type:string;city:string|null;district:string|null;region:string|null;work_format:string;profiles:{id:string;display_name:string|null;bio:string|null}|null};

export default function ServicePage() {
  const supabase=createClient(); const [service,setService]=useState<Service|null>(null);
  useEffect(()=>{
    const id=new URLSearchParams(window.location.search).get("id");
    if(!id)return;
    supabase.from("services").select("id,title,description,price,price_type,city,district,region,work_format,profiles(id,display_name,bio)").eq("id",id).eq("status","published").single().then(r=>{if(r.data)setService(r.data as Service)});
  },[supabase]);
  if(!service)return <main className="page"><SiteHeader /><section className="section narrow"><p>Загружаем услугу...</p></section></main>;
  return <main className="page"><SiteHeader />
    <section className="section service-detail"><div className="service-main"><span className="eyebrow">Услуга</span><h1>{service.title}</h1><p className="lead">{service.description}</p>
    <div className="detail-meta"><span>{service.region||"Регион не указан"}</span><span>{service.city||"Онлайн"}</span><span>{service.district||"Район не указан"}</span><span>{service.work_format==="remote"?"Удалённо":service.work_format==="hybrid"?"Гибрид":"На месте"}</span></div>
    <strong className="big-price">{service.price==null?"Цена по договорённости":String(service.price)+" ₽"+(service.price_type==="hourly"?" / час":"")}</strong></div>
    <aside className="profile-card"><span className="eyebrow">Исполнитель</span><h2>{service.profiles?.display_name||"Исполнитель"}</h2><p>{service.profiles?.bio||"Профиль исполнителя ещё не заполнен."}</p><a className="button wide" href="/login">Написать исполнителю</a></aside></section></main>;
}
