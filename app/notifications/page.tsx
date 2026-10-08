"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type NotificationRow={id:string;type:string;title:string;body:string|null;link:string|null;read_at:string|null;created_at:string};
const supabase=createClient();

export default function NotificationsPage(){
 const router=useRouter();
 const [rows,setRows]=useState<NotificationRow[]>([]);
 const [loading,setLoading]=useState(true);

 async function load(){
   const {data:user}=await supabase.auth.getUser();
   if(!user.user){router.replace("/login?next=/notifications");return;}
   const {data}=await supabase.from("notifications").select("id,type,title,body,link,read_at,created_at").order("created_at",{ascending:false}).limit(100);
   setRows(data||[]);setLoading(false);
 }
 useEffect(()=>{load()},[]);

 async function markRead(id:string){
   await supabase.from("notifications").update({read_at:new Date().toISOString()}).eq("id",id);
   setRows(prev=>prev.map(row=>row.id===id?{...row,read_at:new Date().toISOString()}:row));
 }
 async function markAll(){
   const unread=rows.filter(row=>!row.read_at).map(row=>row.id);
   if(!unread.length)return;
   await supabase.from("notifications").update({read_at:new Date().toISOString()}).in("id",unread);
   await load();
 }

 if(loading)return <>
<main className="page-shell"><div className="empty-state">Загружаем уведомления…</div></main></>;

 return <>
<main className="page-shell notifications-page">
   <section className="notifications-head"><div><span className="eyebrow">События аккаунта</span><h1>Уведомления</h1><p>Отклики, сообщения и отзывы в одном месте.</p></div><button className="secondary-btn" onClick={markAll}>Прочитать всё</button></section>
   <section className="notifications-list">
     {rows.length===0?<div className="content-card mini-empty">Пока нет уведомлений.</div>:rows.map(row=><article className={row.read_at?"notification-row":"notification-row unread"} key={row.id} onClick={()=>{if(!row.read_at)markRead(row.id);if(row.link)router.push(row.link)}}>
       <div className="notification-icon"><img src={row.type==="message"?"/icons/chat.svg":row.type==="review"?"/icons/star.svg":"/icons/bell.svg"} alt="" /></div>
       <div className="notification-copy"><strong>{row.title}</strong>{row.body&&<p>{row.body}</p>}<small>{new Date(row.created_at).toLocaleString("ru-RU")}</small></div>
       {!row.read_at&&<span className="notification-dot" aria-label="Непрочитано" />}
     </article>)}
   </section>
 </main></>;
}
