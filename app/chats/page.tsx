'use client';

import { useEffect,useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import SiteHeader from "@/components/SiteHeader";

export default function ChatsPage(){
 const supabase=createClient();const [items,setItems]=useState<any[]>([]);const [loading,setLoading]=useState(true);
 useEffect(()=>{(async()=>{const {data:u}=await supabase.auth.getUser();if(!u.user){window.location.href="/login";return}
 const {data:cp}=await supabase.from("chat_participants").select("chat_id").eq("user_id",u.user.id);const ids=[...(cp||[])].map(x=>x.chat_id);if(!ids.length){setLoading(false);return}
 const {data:cs}=await supabase.from("chats").select("id,request_id,created_at").in("id",ids).order("created_at",{ascending:false});
 const reqIds=[...new Set((cs||[]).map(x=>x.request_id).filter(Boolean))];let reqMap:any={};if(reqIds.length){const {data:rs}=await supabase.from("requests").select("id,title").in("id",reqIds);(rs||[]).forEach(r=>reqMap[r.id]=r)}
 setItems((cs||[]).map(c=>({...c,title:reqMap[c.request_id]?.title||"Переписка"})));setLoading(false)})()},[]);
 return <><SiteHeader/><main className="page-shell"><section className="catalog-hero"><div><span className="eyebrow">Общение</span><h1>Мои чаты</h1><p>Переписка по заявкам и договорённостям.</p></div></section>{loading?<div className="empty-state">Загрузка…</div>:items.length===0?<div className="empty-state"><h3>Пока нет чатов</h3><p>Откликнитесь на заявку, чтобы начать общение.</p><Link className="primary-btn" href="/requests">Найти заявку</Link></div>:<div className="cabinet-items">{items.map(c=><Link className="cabinet-item" href={"/chat?id="+c.id} key={c.id}><div className="cabinet-item-art"><img src="/illustrations/chat.svg" alt="" /></div><div className="cabinet-item-main"><span className="item-status published">Переписка</span><h3>{c.title}</h3><p>Открыть чат</p></div><strong>→</strong></Link>)}</div>}</main></>;
}