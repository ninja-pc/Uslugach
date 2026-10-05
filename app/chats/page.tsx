'use client';

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import SiteHeader from "@/components/SiteHeader";

type ChatItem = { id:string; request_id:string|null; service_id:string|null; title:string; personName:string; personId:string|null; lastMessage:string; lastAt:string|null; unread:number };

export default function ChatsPage(){
  const supabase=createClient();
  const [items,setItems]=useState<ChatItem[]>([]);
  const [loading,setLoading]=useState(true);
  const [notice,setNotice]=useState("");
  const previousUnread=useRef(0);

  async function load(showNotice=true){
    const {data:u}=await supabase.auth.getUser();
    if(!u.user){window.location.href="/login";return}

    const {data:cp}=await supabase.from("chat_participants").select("chat_id,user_id,last_read_at").eq("user_id",u.user.id);
    const ownRows=cp||[];
    const ids=ownRows.map(x=>x.chat_id);
    if(!ids.length){setItems([]);setLoading(false);return}

    const {data:cs}=await supabase.from("chats").select("id,request_id,service_id,created_at").in("id",ids).order("created_at",{ascending:false});
    const chats=cs||[];
    const reqIds=[...new Set(chats.map(x=>x.request_id).filter(Boolean))] as string[];
    const serviceIds=[...new Set(chats.map(x=>x.service_id).filter(Boolean))] as string[];

    const [{data:rs},{data:ss},{data:allParticipants},{data:ms}] = await Promise.all([
      reqIds.length ? supabase.from("requests").select("id,title,user_id").in("id",reqIds) : Promise.resolve({data:[] as any[]}),
      serviceIds.length ? supabase.from("services").select("id,title,user_id").in("id",serviceIds) : Promise.resolve({data:[] as any[]}),
      supabase.from("chat_participants").select("chat_id,user_id").in("chat_id",ids),
      supabase.from("messages").select("id,chat_id,user_id,body,created_at").in("chat_id",ids).order("created_at",{ascending:false})
    ]);

    const reqMap:any={};(rs||[]).forEach(r=>reqMap[r.id]=r);
    const serviceMap:any={};(ss||[]).forEach(s=>serviceMap[s.id]=s);
    const profileIds=[...new Set((allParticipants||[]).map(x=>x.user_id))] as string[];
    const {data:profiles}=profileIds.length ? await supabase.from("profiles").select("id,display_name").in("id",profileIds) : {data:[] as any[]};
    const profileMap:any={};(profiles||[]).forEach(p=>profileMap[p.id]=p.display_name||"Пользователь");

    const readMap:any={};ownRows.forEach(x=>readMap[x.chat_id]=x.last_read_at);
    const messageMap:any={};(ms||[]).forEach(m=>{if(!messageMap[m.chat_id])messageMap[m.chat_id]=m});

    const next=chats.map(c=>{
      const context=c.request_id ? reqMap[c.request_id] : serviceMap[c.service_id];
      const participants=(allParticipants||[]).filter(x=>x.chat_id===c.id);
      const other=participants.find(x=>x.user_id!==u.user.id);
      const readAt=readMap[c.id];
      const unread=(ms||[]).filter(m=>m.chat_id===c.id && m.user_id!==u.user.id && (!readAt || new Date(m.created_at)>new Date(readAt))).length;
      return {id:c.id,request_id:c.request_id,service_id:c.service_id,title:context?.title||"Объявление",personName:other?profileMap[other.user_id]||"Пользователь":"Пользователь",personId:other?.user_id||null,lastMessage:messageMap[c.id]?.body||"Сообщений пока нет",lastAt:messageMap[c.id]?.created_at||c.created_at,unread};
    }).sort((a,b)=>new Date(b.lastAt).getTime()-new Date(a.lastAt).getTime());

    const unreadTotal=next.reduce((sum,x)=>sum+x.unread,0);
    if(showNotice && unreadTotal>previousUnread.current){
      const fresh=next.find(x=>x.unread>0);
      if(fresh)setNotice("Новое сообщение от "+fresh.personName+" по объявлению «"+fresh.title+"»");
    }
    previousUnread.current=unreadTotal;
    setItems(next);
    setLoading(false);
  }

  useEffect(()=>{load(false);const timer=window.setInterval(()=>load(true),5000);return ()=>window.clearInterval(timer)},[]);
  useEffect(()=>{if(!notice)return;const t=window.setTimeout(()=>setNotice(""),5000);return ()=>window.clearTimeout(t)},[notice]);

  return <><SiteHeader/><main className="page-shell chats-page">
    {notice&&<div className="chat-notification"><span className="chat-notification-dot"/><div><strong>Новое сообщение</strong><span>{notice.replace("Новое сообщение от ","")}</span></div><button onClick={()=>setNotice("")} aria-label="Закрыть">×</button></div>}
    <section className="catalog-hero"><div><span className="eyebrow">Общение</span><h1>Мои чаты</h1><p>Здесь видно, кто написал, по какому объявлению и есть ли новые сообщения.</p></div></section>
    {loading?<div className="empty-state">Загрузка…</div>:items.length===0?
      <div className="empty-state"><h3>Пока нет чатов</h3><p>Откликнитесь на заявку или напишите исполнителю, чтобы начать общение.</p><Link className="primary-btn" href="/requests">Найти заявку</Link></div>:
      <div className="chat-list">{items.map(c=>
        <Link className={"chat-list-item "+(c.unread?"has-unread":"")} href={"/chat?id="+c.id} key={c.id}>
          <div className="chat-list-avatar">{c.personName.slice(0,1).toUpperCase()}</div>
          <div className="chat-list-main">
            <div className="chat-list-top"><strong>{c.personName}</strong><time>{new Date(c.lastAt).toLocaleDateString("ru-RU",{day:"2-digit",month:"2-digit"})}</time></div>
            <div className="chat-list-ad"><img src="/icons/briefcase.svg" alt="" />{c.title}</div>
            <p>{c.lastMessage}</p>
          </div>
          <div className="chat-list-meta">{c.unread>0&&<span className="chat-unread">{c.unread>99?"99+":c.unread}</span>}<span className="chat-open">›</span></div>
        </Link>
      )}</div>}
  </main></>;
}
