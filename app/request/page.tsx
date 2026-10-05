'use client';

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import SiteHeader from "@/components/SiteHeader";

export default function RequestDetailPage() {
  const supabase=createClient();
  const [id,setId]=useState<string|null>(null);
  const [request,setRequest]=useState<any>(null);
  const [owner,setOwner]=useState<any>(null);
  const [responses,setResponses]=useState<any[]>([]);
  const [me,setMe]=useState<any>(null);
  const [form,setForm]=useState({message:"",price:""});
  const [loading,setLoading]=useState(true);
  const [sending,setSending]=useState(false);
  const [error,setError]=useState("");
  const [startingChat,setStartingChat]=useState<string|null>(null);

  async function load(currentId:string|null){
    if(!currentId){setLoading(false);return;}
    const [{data:r},{data:u}]=await Promise.all([supabase.from("requests").select("*").eq("id",currentId).single(),supabase.auth.getUser()]);
    setRequest(r); setMe(u.user||null);
    if(r?.user_id){const {data:p}=await supabase.from("profiles").select("display_name,bio,city,region").eq("id",r.user_id).single();setOwner(p);}
    const {data:rs}=await supabase.from("responses").select("id,user_id,message,price,status,created_at").eq("request_id",currentId).order("created_at",{ascending:false});
    if(rs?.length){const {data:ps}=await supabase.from("profiles").select("id,display_name,city,region").in("id",[...new Set(rs.map(x=>x.user_id))]);const map:any={};(ps||[]).forEach(p=>map[p.id]=p);setResponses(rs.map(x=>({...x,profile:map[x.user_id]})))} else setResponses([]);
    setLoading(false);
  }

  useEffect(()=>{
    const currentId=new URLSearchParams(window.location.search).get("id");
    setId(currentId);
    load(currentId);
  },[]);

  async function openChat(response:any){
    if(!me||!request)return;
    setStartingChat(response.id);setError("");
    const chatId=crypto.randomUUID();
    const {error:chatError}=await supabase.from("chats").insert({id:chatId,request_id:request.id});
    if(chatError){setError(chatError.message);setStartingChat(null);return}
    const {error:participantsError}=await supabase.from("chat_participants").insert([
      {chat_id:chatId,user_id:request.user_id},
      {chat_id:chatId,user_id:response.user_id}
    ]);
    if(participantsError){setError(participantsError.message);setStartingChat(null);return}
    const {error:updateError}=await supabase.from("responses").update({status:"accepted"}).eq("id",response.id);
    if(updateError){setError(updateError.message);setStartingChat(null);return}
    window.location.href="/chat?id="+chatId;
  }

  async function send(e:FormEvent){
    e.preventDefault();
    if(!me){window.location.href="/login?next=/request?id="+id;return;}
    if(me.id===request.user_id){setError("Нельзя откликнуться на собственную заявку");return;}
    if(!form.message.trim()){setError("Напишите, что вы готовы сделать");return;}
    setSending(true);setError("");
    const {error}=await supabase.from("responses").insert({request_id:id,user_id:me.id,message:form.message.trim(),price:form.price?Number(form.price):null});
    if(error){setError(error.message);setSending(false);return;}
    setForm({message:"",price:""}); await load(id); setSending(false);
  }

  if(loading)return <><SiteHeader/><main className="page-shell"><div className="empty-state">Загрузка заявки…</div></main></>;
  if(!request)return <><SiteHeader/><main className="page-shell"><div className="empty-state"><h3>Заявка не найдена</h3><Link href="/requests">Вернуться к заявкам</Link></div></main></>;

  const isOwner=me?.id===request.user_id;
  return <><SiteHeader/><main className="page-shell">
    <div className="breadcrumbs"><Link href="/requests">Заявки</Link><span>/</span><span>{request.title}</span></div>
    <section className="detail-hero request-detail-hero"><div><span className="eyebrow">{request.urgency!=="normal"?"Срочная заявка":"Заявка на услугу"}</span><h1>{request.title}</h1><div className="detail-chips"><span>{request.city||request.region||"Удалённо"}</span>{request.district&&<span>{request.district}</span>}{request.deadline&&<span>до {new Date(request.deadline).toLocaleDateString("ru-RU")}</span>}</div></div><div className="service-visual"><img src="/illustrations/tools.svg" alt="" /></div></section>
    <div className="detail-layout"><div>
      <section className="content-card"><h2>Что нужно сделать</h2><p className="detail-description">{request.description}</p><div className="facts-grid"><div><span>Бюджет</span><strong>{request.budget?Number(request.budget).toLocaleString("ru-RU")+" ₽":"По договорённости"}</strong></div><div><span>Срок</span><strong>{request.deadline?new Date(request.deadline).toLocaleDateString("ru-RU"):"Обсуждается"}</strong></div></div></section>
      <section className="content-card"><h2>Отклики специалистов <span className="count-badge">{responses.length}</span></h2>
      {responses.length===0?<div className="mini-empty">Пока никто не откликнулся. Если вы специалист — станьте первым.</div>:<div className="response-list">{responses.map(r=><article className="response-item" key={r.id}><div className="avatar">{(r.profile?.display_name||"С").slice(0,1).toUpperCase()}</div><div><strong>{r.profile?.display_name||"Специалист"}</strong><span className="muted">{r.profile?.city||r.profile?.region||""}</span><p>{r.message}</p>{r.price&&<b>{Number(r.price).toLocaleString("ru-RU")} ₽</b>}{isOwner&&<div className="response-actions"><button className="primary-btn small-btn" disabled={startingChat===r.id||r.status==="accepted"} onClick={()=>openChat(r)}>{startingChat===r.id?"Открываем…":r.status==="accepted"?"Исполнитель выбран":"Выбрать и написать"}</button></div>}</div></article>)}</div>}
      </section>
    </div><aside>
      <section className="content-card sticky-card"><h3>Заказчик</h3><div className="provider-row"><div className="avatar">{(owner?.display_name||"З").slice(0,1).toUpperCase()}</div><div><strong>{owner?.display_name||"Заказчик"}</strong><span>{owner?.city||owner?.region||""}</span></div></div>{owner?.bio&&<p>{owner.bio}</p>}</section>
      {!isOwner&&<section className="content-card response-form-card"><h3>Откликнуться</h3>{!me&&<p>Войдите, чтобы предложить свои услуги.</p>}<form onSubmit={send}><label>Ваше предложение<textarea rows={5} value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="Расскажите о своём опыте и как выполните задачу" /></label><label>Ваша цена, ₽<input type="number" min="0" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="Можно оставить пустым" /></label>{error&&<div className="form-error">{error}</div>}<button className="primary-btn" disabled={sending}>{sending?"Отправляем…":"Отправить отклик"}</button></form></section>}
    </aside></div>
  </main></>;
}
