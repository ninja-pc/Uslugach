'use client';

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import SiteHeader from "@/components/SiteHeader";

export default function ChatPage(){
  const supabase=createClient(); const params=useSearchParams(); const chatId=params.get("id");
  const [me,setMe]=useState<any>(null),[messages,setMessages]=useState<any[]>([]),[body,setBody]=useState(""),[title,setTitle]=useState("Чат"),[loading,setLoading]=useState(true),[sending,setSending]=useState(false),[error,setError]=useState("");
  async function load(){
    const {data:u}=await supabase.auth.getUser(); if(!u.user){window.location.href="/login";return} setMe(u.user);
    if(!chatId){setLoading(false);return}
    const {data:chat}=await supabase.from("chats").select("id,request_id").eq("id",chatId).single();
    if(chat?.request_id){const {data:r}=await supabase.from("requests").select("title").eq("id",chat.request_id).single();if(r?.title)setTitle(r.title)}
    const {data:ms,error:e}=await supabase.from("messages").select("id,user_id,body,created_at").eq("chat_id",chatId).order("created_at");
    if(e)setError(e.message); else setMessages(ms||[]); setLoading(false);
  }
  useEffect(()=>{load()},[chatId]);
  async function send(e:FormEvent){e.preventDefault();if(!body.trim()||!me||!chatId)return;setSending(true);const {error:e2}=await supabase.from("messages").insert({chat_id:chatId,user_id:me.id,body:body.trim()});if(e2)setError(e2.message);else{setBody("");await load()}setSending(false)}
  return <><SiteHeader/><main className="page-shell"><div className="breadcrumbs"><Link href="/profile">Кабинет</Link><span>/</span><span>Чат</span></div><section className="chat-shell"><header><div><span className="eyebrow">Переписка</span><h1>{title}</h1></div></header>{loading?<div className="empty-state">Загрузка…</div>:<div className="chat-messages">{messages.length===0?<div className="mini-empty">Начните переписку с короткого сообщения о задаче.</div>:messages.map(m=><div className={m.user_id===me?.id?"chat-message mine":"chat-message"} key={m.id}><p>{m.body}</p><small>{new Date(m.created_at).toLocaleString("ru-RU")}</small></div>)}</div>}<form className="chat-compose" onSubmit={send}><textarea rows={3} value={body} onChange={e=>setBody(e.target.value)} placeholder="Напишите сообщение…" />{error&&<div className="form-error">{error}</div>}<button className="primary-btn" disabled={sending}>{sending?"Отправляем…":"Отправить"}</button></form></section></main></>;
}