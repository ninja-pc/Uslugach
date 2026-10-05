"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SiteHeader from "@/components/SiteHeader";

type Service={id:string;user_id:string;title:string;description:string;price:number|null;price_type:string;city:string|null;district:string|null;region:string|null;work_format:string;category_id:number|null;provider_name:string;bio:string|null};
type Similar={id:string;user_id:string;title:string;description:string|null;price:number|null;price_type:string|null;city:string|null;work_format:string|null};
const supabase=createClient();

function imageFor(s:{title:string;description?:string|null}){const t=(s.title+" "+(s.description||"")).toLowerCase();if(t.includes("уборк")||t.includes("клини"))return "/illustrations/cleaning.svg";if(t.includes("ремонт")||t.includes("стро")||t.includes("сантех")||t.includes("электр"))return "/illustrations/repair.svg";if(t.includes("it")||t.includes("сайт")||t.includes("компьют")||t.includes("программ"))return "/illustrations/it.svg";if(t.includes("красот")||t.includes("массаж")||t.includes("здоров"))return "/illustrations/beauty.svg";if(t.includes("достав")||t.includes("авто")||t.includes("курьер"))return "/illustrations/delivery.svg";return "/illustrations/other.svg"}
function price(v:number|null,t:string|null){if(v==null)return "Цена по договорённости";return new Intl.NumberFormat("ru-RU").format(v)+" ₽"+(t==="hourly"?" / час":"")}

export default function ServicePage(){
 const [service,setService]=useState<Service|null>(null);const [similar,setSimilar]=useState<Similar[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");const [contacting,setContacting]=useState(false);const [contactError,setContactError]=useState("");
 useEffect(()=>{async function load(){const id=new URLSearchParams(window.location.search).get("id");if(!id){setError("Услуга не найдена.");setLoading(false);return}
  const result=await supabase.from("services").select("id,user_id,title,description,price,price_type,city,district,region,work_format,category_id").eq("id",id).eq("status","published").maybeSingle();
  if(result.error||!result.data){setError(result.error?"Не удалось загрузить услугу.":"Услуга не найдена или снята с публикации.");setLoading(false);return}
  const profile=await supabase.from("profiles").select("display_name,bio").eq("id",result.data.user_id).maybeSingle();
  setService({...result.data,provider_name:profile.data?.display_name||"Исполнитель",bio:profile.data?.bio||null} as Service);
  let query=supabase.from("services").select("id,user_id,title,description,price,price_type,city,work_format").eq("status","published").neq("id",id).limit(4);
  if(result.data.category_id) query=query.eq("category_id",result.data.category_id);
  let rel=await query.order("created_at",{ascending:false});
  if(!rel.data?.length&&result.data.category_id)rel=await supabase.from("services").select("id,user_id,title,description,price,price_type,city,work_format").eq("status","published").neq("id",id).order("created_at",{ascending:false}).limit(4);
  setSimilar((rel.data||[]) as Similar[]);setLoading(false);
 }load()},[]);

 async function startChat(){
   if(!service)return;
   setContacting(true);setContactError("");
   const {data:u}=await supabase.auth.getUser();
   if(!u.user){window.location.href="/login?next="+encodeURIComponent("/service?id="+service.id);return}
   if(u.user.id===service.user_id){setContactError("Это ваша услуга — написать самому себе нельзя.");setContacting(false);return}
   const {data:parts,error:partsError}=await supabase.from("chat_participants").select("chat_id").eq("user_id",u.user.id);
   if(partsError){setContactError("Не удалось открыть чаты.");setContacting(false);return}
   const ids=(parts||[]).map(p=>p.chat_id);
   if(ids.length){
     const {data:existing}=await supabase.from("chats").select("id").in("id",ids).eq("service_id",service.id).limit(1).maybeSingle();
     if(existing?.id){window.location.href="/chat?id="+existing.id;return}
   }
   const chatId=crypto.randomUUID();
   const {error:chatError}=await supabase.from("chats").insert({id:chatId,service_id:service.id});
   if(chatError){setContactError("Не удалось создать диалог.");setContacting(false);return}
   const {error:participantsError}=await supabase.from("chat_participants").insert([
     {chat_id:chatId,user_id:u.user.id},
     {chat_id:chatId,user_id:service.user_id}
   ]);
   if(participantsError){setContactError(`Не удалось подключить участников: ${participantsError.message}`);setContacting(false);return}
   window.location.href="/chat?id="+chatId;
 }

 if(loading)return <main className="page"><SiteHeader/><section className="section"><p>Загружаем услугу...</p></section></main>;
 if(error)return <main className="page"><SiteHeader/><section className="section narrow"><div className="form-error">{error}</div><a className="button" href="/services">Вернуться в каталог</a></section></main>;
 if(!service)return null;
 const format=service.work_format==="remote"?"Удалённо":service.work_format==="hybrid"?"Гибрид":"На месте";
 return <main className="page"><SiteHeader/><section className="section service-page">
   <div className="service-breadcrumb"><a href="/services">Каталог</a><span>/</span><span>{service.city||service.region||"Россия"}</span><span>/</span><strong>{service.title}</strong></div>
   <div className="service-detail-new">
    <article className="service-main-new">
     <div className="service-visual"><img src={imageFor(service)} alt="" /><span className="service-save"><img src="/icons/heart.svg" alt="" /></span></div>
     <div className="service-content"><span className="eyebrow">Предложение услуги</span><h1>{service.title}</h1><div className="detail-chips"><span>{service.city||"Онлайн"}</span><span>{format}</span>{service.region&&<span>{service.region}</span>}</div>
      <p className="service-description">{service.description||"Исполнитель пока не добавил подробное описание этой услуги."}</p>
      <div className="service-facts"><div><small>Стоимость</small><strong>{price(service.price,service.price_type)}</strong></div><div><small>Формат работы</small><strong>{format}</strong></div><div><small>Локация</small><strong>{service.city||service.region||"Онлайн"}</strong></div></div>
      <div className="service-note"><strong>Перед заказом</strong><span>Уточните сроки, итоговую стоимость и детали работы напрямую с исполнителем.</span></div>
     </div>
    </article>
    <aside className="service-side"><div className="provider-card-new"><span className="eyebrow">Исполнитель</span><div className="provider-big"><span>{service.provider_name.slice(0,1).toUpperCase()}</span><div><h2>{service.provider_name}</h2><small>{service.city||service.region||"Россия"}</small></div></div><p>{service.bio||"Исполнитель пока не добавил описание профиля."}</p><button className="button wide" onClick={startChat} disabled={contacting}>{contacting?"Открываем чат…":"Написать исполнителю"}</button>{contactError&&<div className="form-error">{contactError}</div>}<a className="side-link" href="/profile">Открыть кабинет →</a></div>
     <div className="trust-card"><strong>Что обсудить до заказа</strong><div><span>01</span>Задачу и ожидаемый результат</div><div><span>02</span>Цену и сроки выполнения</div><div><span>03</span>Формат связи и место работы</div></div></aside>
   </div>
   {similar.length>0&&<section className="similar-section"><div className="section-head"><div><span className="eyebrow">Ещё варианты</span><h2>Похожие услуги</h2></div><a href="/services" className="see-all">Смотреть весь каталог →</a></div><div className="similar-grid">{similar.map(s=><a className="similar-card" href={"/service?id="+s.id} key={s.id}><div className="similar-image"><img src={imageFor(s)} alt="" /></div><span>{s.city||"Онлайн"}</span><h3>{s.title}</h3><p>{s.description||"Описание услуги"}</p><strong>{price(s.price,s.price_type)}</strong></a>)}</div></section>}
   <section className="service-bottom-banner"><div><span className="eyebrow">Не нашли подходящее?</span><h2>Посмотрите другие услуги</h2><p>В каталоге собраны опубликованные предложения исполнителей.</p></div><a className="button" href="/services">Открыть каталог</a></section>
  </section></main>
}