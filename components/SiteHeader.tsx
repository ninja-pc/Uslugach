"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SiteHeader() {
  const router=useRouter(); const supabase=createClient();
  const [email,setEmail]=useState<string|null>(null),[ready,setReady]=useState(false),[unread,setUnread]=useState(0);

  async function loadUnread(userId:string){
    const {data:cp}=await supabase.from("chat_participants").select("chat_id,last_read_at").eq("user_id",userId);
    const rows=cp||[]; if(!rows.length){setUnread(0);return}
    const ids=rows.map(x=>x.chat_id);
    const {data:ms}=await supabase.from("messages").select("chat_id,user_id,created_at").in("chat_id",ids);
    const total=(ms||[]).filter(m=>{const row=rows.find(x=>x.chat_id===m.chat_id);return m.user_id!==userId&&(!row?.last_read_at||new Date(m.created_at)>new Date(row.last_read_at))}).length;
    setUnread(total);
  }

  useEffect(()=>{
    let mounted=true;
    async function loadUser(){const {data}=await supabase.auth.getUser();if(!mounted)return;setEmail(data.user?.email??null);setReady(true);if(data.user)loadUnread(data.user.id)}
    loadUser();
    const timer=window.setInterval(async()=>{const {data}=await supabase.auth.getUser();if(data.user)loadUnread(data.user.id)},5000);
    const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>{if(!mounted)return;setEmail(session?.user?.email??null);setReady(true);if(session?.user)loadUnread(session.user.id);else setUnread(0)});
    return ()=>{mounted=false;window.clearInterval(timer);listener.subscription.unsubscribe()};
  },[supabase]);

  async function logout(){await supabase.auth.signOut();router.push("/");router.refresh()}

  return <header className="modern-header"><div className="header-main">
    <a className="brand" href="/"><img className="brand-mark" src="/icons/logo-mark.svg" alt="" /><span>Услугач</span></a>
    <a className="location-pill" href="/services"><img src="/icons/location.svg" alt="" /><span>Москва</span><b>⌄</b></a>
    <nav className="main-nav"><a href="/services">Услуги</a><a href="/requests">Заявки</a><a href="/services">Исполнители</a><a href="/profile">Кабинет</a></nav>
    <div className="header-actions">
      <a className="header-search" href="/services" aria-label="Поиск"><img src="/icons/search.svg" alt="" /></a>
      {ready&&!email&&<a className="header-login" href="/login">Войти</a>}
      {ready&&!email&&<a className="header-register" href="/register">Регистрация</a>}
      {email&&<a className="header-login header-chat-link" href="/chats"><span className="header-chat-icon"><img src="/icons/chat.svg" alt="" /></span><span>Чаты</span>{unread>0&&<b className="header-unread">{unread>99?"99+":unread}</b>}</a>}
      {email&&<a className="header-login" href="/profile">Кабинет</a>}
      {email&&<a className="header-register" href="/services/new">Разместить услугу</a>}
      {email&&<button className="header-logout" onClick={logout}>Выйти</button>}
    </div>
  </div></header>;
}