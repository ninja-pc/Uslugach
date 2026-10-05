'use client';

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import SiteHeader from "@/components/SiteHeader";

export default function ChatPage(){
  const supabase=createClient();
  const [chatId,setChatId]=useState<string|null>(null),[me,setMe]=useState<any>(null),[messages,setMessages]=useState<any[]>([]),[body,setBody]=useState(""),[title,setTitle]=useState("Чат"),[personName,setPersonName]=useState("Пользователь"),[loading,setLoading]=useState(true),[sending,setSending]=useState(false),[error,setError]=useState("");
  const endRef=useRef<HTMLDivElement>(null);
  const textareaRef=useRef<HTMLTextAreaElement>(null);

  async function load(currentChatId:string|null){
    const {data:u}=await supabase.auth.getUser();
    if(!u.user){window.location.href="/login";return}
    setMe(u.user);
    if(!currentChatId){setLoading(false);return}
    const {data:chat}=await supabase.from("chats").select("id,request_id,service_id").eq("id",currentChatId).single();
    const {data:participants}=await supabase.from("chat_participants").select("user_id").eq("chat_id",currentChatId);
    const other=(participants||[]).find(p=>p.user_id!==u.user.id);
    if(other){const {data:p}=await supabase.from("profiles").select("display_name").eq("id",other.user_id).single();if(p?.display_name)setPersonName(p.display_name)}
    if(chat?.request_id){
      const {data:r}=await supabase.from("requests").select("title").eq("id",chat.request_id).single();
      if(r?.title)setTitle(r.title);
    } else if(chat?.service_id){
      const {data:s}=await supabase.from("services").select("title").eq("id",chat.service_id).single();
      if(s?.title)setTitle(s.title);
    }
    const {data:ms,error:e}=await supabase.from("messages").select("id,user_id,body,created_at").eq("chat_id",currentChatId).order("created_at");
    if(e)setError(e.message);else setMessages(ms||[]);
    await supabase.from("chat_participants").update({last_read_at:new Date().toISOString()}).eq("chat_id",currentChatId).eq("user_id",u.user.id);
    setLoading(false);
  }

  useEffect(()=>{
    const id=new URLSearchParams(window.location.search).get("id");
    setChatId(id); load(id);
  },[]);

  useEffect(()=>{if(!loading)requestAnimationFrame(()=>endRef.current?.scrollIntoView({behavior:"smooth"}))},[messages,loading]);

  function resize(){
    const el=textareaRef.current;if(!el)return;
    el.style.height="0px";el.style.height=Math.min(Math.max(el.scrollHeight,44),140)+"px";
  }

  async function send(e?:FormEvent){
    e?.preventDefault();
    if(!body.trim()||!me||!chatId||sending)return;
    setSending(true);setError("");
    const text=body.trim();
    const {error:e2}=await supabase.from("messages").insert({chat_id:chatId,user_id:me.id,body:text});
    if(e2)setError(e2.message);else{
      setBody("");
      if(textareaRef.current){textareaRef.current.style.height="44px"}
      await load(chatId);
    }
    setSending(false);
    textareaRef.current?.focus();
  }

  function onKeyDown(e:React.KeyboardEvent<HTMLTextAreaElement>){
    if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}
  }

  return <><SiteHeader/><main className="page-shell chat-page">
    <div className="breadcrumbs"><Link href="/chats">Мои чаты</Link><span>/</span><span>Переписка</span></div>
    <section className="chat-shell">
      <header className="chat-header">
        <Link href="/chats" className="chat-back" aria-label="Назад">‹</Link>
        <div className="chat-avatar">{title.slice(0,1).toUpperCase()}</div>
        <div className="chat-header-info"><strong>{personName}</strong><span>{title}</span></div>
      </header>
      {loading?<div className="chat-loading">Загрузка сообщений…</div>:<div className="chat-messages">
        {messages.length===0?<div className="chat-empty"><img src="/icons/chat.svg" alt="" /><strong>Начните переписку</strong><span>Напишите исполнителю или заказчику первое сообщение.</span></div>:messages.map(m=>
          <div className={m.user_id===me?.id?"chat-message mine":"chat-message"} key={m.id}>
            <p>{m.body}</p><small>{new Date(m.created_at).toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"})}</small>
          </div>
        )}
        <div ref={endRef}/>
      </div>}
      <form className="chat-compose" onSubmit={send}>
        <textarea ref={textareaRef} rows={1} value={body} onChange={e=>{setBody(e.target.value);resize()}} onKeyDown={onKeyDown} placeholder="Напишите сообщение…" />
        <button className="chat-send" disabled={sending||!body.trim()} aria-label="Отправить"><img src="/icons/send.svg" alt="" /></button>
      </form>
      {error&&<div className="chat-error">{error}</div>}
      <div className="chat-hint">Enter — отправить · Shift + Enter — новая строка</div>
    </section>
  </main></>;
}
