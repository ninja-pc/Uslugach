"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SiteHeader from "@/components/SiteHeader";

type UserRow={id:string;display_name:string|null;city:string|null;region:string|null;role:string;status:string;created_at:string};
type ServiceRow={id:string;title:string;status:string;created_at:string;provider_name?:string};
type RequestRow={id:string;title:string;status:string;created_at:string;owner_name?:string};
type ComplaintRow={id:string;reason:string;details:string|null;status:string;created_at:string;service_id:string|null;request_id:string|null;reporter_name?:string};
type CategoryRow={id:string;name:string;slug:string;is_active:boolean;sort_order:number};

const supabase=createClient();

export default function AdminPage(){
 const [allowed,setAllowed]=useState<boolean|null>(null); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
 const [users,setUsers]=useState<UserRow[]>([]); const [services,setServices]=useState<ServiceRow[]>([]); const [requests,setRequests]=useState<RequestRow[]>([]); const [complaints,setComplaints]=useState<ComplaintRow[]>([]); const [categories,setCategories]=useState<CategoryRow[]>([]);
 const [stats,setStats]=useState({users:0,services:0,requests:0,responses:0,messages:0,complaints:0});
 const [newCategory,setNewCategory]=useState(""); const [busy,setBusy]=useState("");

 async function load(){
   setLoading(true); setError("");
   const auth=await supabase.auth.getUser();
   if(!auth.data.user){setAllowed(false);setLoading(false);return;}
   const {data:profile}=await supabase.from("profiles").select("role,status").eq("id",auth.data.user.id).maybeSingle();
   const ok=profile?.role==="admin"&&profile?.status==="active"; setAllowed(ok);
   if(!ok){setLoading(false);return;}
   const [u,s,r,c,cat,resp,msg]=await Promise.all([
     supabase.from("profiles").select("id,display_name,city,region,role,status,created_at").order("created_at",{ascending:false}).limit(100),
     supabase.from("services").select("id,title,status,created_at,user_id").order("created_at",{ascending:false}).limit(100),
     supabase.from("requests").select("id,title,status,created_at,user_id").order("created_at",{ascending:false}).limit(100),
     supabase.from("complaints").select("id,reason,details,status,created_at,service_id,request_id,user_id").order("created_at",{ascending:false}).limit(100),
     supabase.from("categories").select("id,name,slug,is_active,sort_order").order("sort_order"),
     supabase.from("responses").select("id",{count:"exact",head:true}),
     supabase.from("messages").select("id",{count:"exact",head:true})
   ]);
   const userIds=[...(s.data||[]).map((x:any)=>x.user_id),...(r.data||[]).map((x:any)=>x.user_id),...(c.data||[]).map((x:any)=>x.user_id)];
   const unique=[...new Set(userIds)];
   let names:Record<string,string>={};
   if(unique.length){const {data:ps}=await supabase.from("profiles").select("id,display_name").in("id",unique);names=Object.fromEntries((ps||[]).map((p:any)=>[p.id,p.display_name||"Пользователь"]));}
   setUsers((u.data||[]) as UserRow[]); setServices((s.data||[]).map((x:any)=>({...x,provider_name:names[x.user_id]}))); setRequests((r.data||[]).map((x:any)=>({...x,owner_name:names[x.user_id]}))); setComplaints((c.data||[]).map((x:any)=>({...x,reporter_name:names[x.user_id]}))); setCategories((cat.data||[]) as CategoryRow[]);
   setStats({users:u.data?.length||0,services:s.data?.length||0,requests:r.data?.length||0,responses:resp.count||0,messages:msg.count||0,complaints:c.data?.length||0}); setLoading(false);
 }
 useEffect(()=>{load()},[]);

 async function update(table:string,id:string,patch:any){
   setBusy(id); const {error:e}=await supabase.from(table).update(patch).eq("id",id); if(e)setError(e.message); else await load(); setBusy(""); 
 }
 async function createCategory(){
   if(!newCategory.trim())return; setBusy("category"); const slug=newCategory.toLowerCase().trim().replace(/[^a-zа-яё0-9]+/gi,"-").replace(/^-+|-+$/g,"")+"-"+Date.now().toString(36);
   const {error:e}=await supabase.from("categories").insert({name:newCategory.trim(),slug,is_active:true}); if(e)setError(e.message); else setNewCategory(""); await load(); setBusy("");
 }
 async function removeCategory(id:string){
   setBusy(id); const {error:e}=await supabase.from("categories").delete().eq("id",id); if(e)setError("Категорию нельзя удалить, если она уже используется в объявлениях."); else await load(); setBusy("");
 }

 if(loading)return <><SiteHeader/><main className="page-shell"><div className="empty-state">Проверяем доступ…</div></main>;
 if(!allowed)return <><SiteHeader/><main className="page-shell"><section className="admin-denied"><span className="eyebrow">Закрытый раздел</span><h1>Доступ к админке закрыт</h1><p>Этот раздел доступен только администраторам «Услугача».</p><a className="button" href="/profile">Вернуться в кабинет</a></section></main></>;

 return <><SiteHeader/><main className="page-shell admin-page">
   <section className="admin-head"><div><span className="eyebrow">Управление платформой</span><h1>Админ-панель</h1><p>Модерация пользователей, объявлений, жалоб и категорий.</p></div><button className="secondary-btn" onClick={load}>Обновить данные</button></section>
   <section className="admin-stats">{Object.entries(stats).map(([key,value])=><div className="admin-stat" key={key}><strong>{value}</strong><span>{{users:"пользователей",services:"услуг",requests:"заявок",responses:"откликов",messages:"сообщений",complaints:"жалоб"} as any}[key]}</span></div>)}</section>
   <div className="admin-grid">
    <section className="content-card"><div className="section-head"><div><span className="eyebrow">Пользователи</span><h2>Аккаунты</h2></div></div><div className="admin-list">{users.map(u=><div className="admin-row" key={u.id}><div><strong>{u.display_name||"Без имени"}</strong><span>{u.city||u.region||"Локация не указана"} · {new Date(u.created_at).toLocaleDateString("ru-RU")}</span></div><div className="admin-row-actions"><b className={u.status==="blocked"?"status-bad":"status-good"}>{u.status==="blocked"?"Заблокирован":"Активен"}</b>{u.role!=="admin"&&<button className="text-button" disabled={busy===u.id} onClick={()=>update("profiles",u.id,{status:u.status==="blocked"?"active":"blocked"})}>{u.status==="blocked"?"Разблокировать":"Заблокировать"}</button>}</div></div>)}</div></section>
    <section className="content-card"><div className="section-head"><div><span className="eyebrow">Объявления</span><h2>Услуги</h2></div></div><div className="admin-list">{services.map(s=><div className="admin-row" key={s.id}><div><strong>{s.title}</strong><span>{s.provider_name||"Исполнитель"} · {new Date(s.created_at).toLocaleDateString("ru-RU")}</span></div><select value={s.status} disabled={busy===s.id} onChange={e=>update("services",s.id,{status:e.target.value})}><option value="published">Опубликована</option><option value="pending">На модерации</option><option value="rejected">Отклонена</option><option value="archived">Архив</option></select></div>)}</div></section>
    <section className="content-card"><div className="section-head"><div><span className="eyebrow">Заявки</span><h2>Задачи пользователей</h2></div></div><div className="admin-list">{requests.map(r=><div className="admin-row" key={r.id}><div><strong>{r.title}</strong><span>{r.owner_name||"Заказчик"} · {new Date(r.created_at).toLocaleDateString("ru-RU")}</span></div><select value={r.status} disabled={busy===r.id} onChange={e=>update("requests",r.id,{status:e.target.value})}><option value="published">Опубликована</option><option value="closed">Закрыта</option><option value="archived">Архив</option></select></div>)}</div></section>
    <section className="content-card"><div className="section-head"><div><span className="eyebrow">Жалобы</span><h2>Модерация</h2></div></div><div className="admin-list">{complaints.length===0?<div className="mini-empty">Новых жалоб нет.</div>:complaints.map(c=><div className="admin-row" key={c.id}><div><strong>{c.reason}</strong><span>{c.reporter_name||"Пользователь"} · {c.service_id?"услуга":"заявка"} · {c.details||"Без деталей"}</span></div><select value={c.status} disabled={busy===c.id} onChange={e=>update("complaints",c.id,{status:e.target.value})}><option value="open">Новая</option><option value="reviewing">На проверке</option><option value="resolved">Решена</option><option value="rejected">Отклонена</option></select></div>)}</div></section>
    <section className="content-card"><div className="section-head"><div><span className="eyebrow">Категории</span><h2>Справочник</h2></div></div><div className="admin-category-create"><input value={newCategory} onChange={e=>setNewCategory(e.target.value)} placeholder="Название новой категории"/><button className="primary-btn" disabled={busy==="category"} onClick={createCategory}>Добавить</button></div><div className="admin-list">{categories.map(c=><div className="admin-row" key={c.id}><div><strong>{c.name}</strong><span>{c.slug}</span></div><div className="admin-row-actions"><button className="text-button" onClick={()=>update("categories",c.id,{is_active:!c.is_active})}>{c.is_active?"Скрыть":"Вернуть"}</button><button className="text-button danger-link" disabled={busy===c.id} onClick={()=>removeCategory(c.id)}>Удалить</button></div></div>)}</div></section>
   </div>
 </main></>;
}
