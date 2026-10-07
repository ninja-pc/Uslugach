'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import SiteHeader from "@/components/SiteHeader";

export default function RequestsPage() {
  const supabase = createClient();
  const [requests,setRequests]=useState<any[]>([]);
  const [profiles,setProfiles]=useState<Record<string,any>>({});
  const [q,setQ]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{(async()=>{
    const {data}=await supabase.from("requests").select("id,user_id,title,description,budget,city,region,district,deadline,urgency,created_at").eq("status","published").order("created_at",{ascending:false}).limit(60);
    const rows=data||[]; setRequests(rows);
    const ids=[...new Set(rows.map(r=>r.user_id))];
    if(ids.length){const {data:ps}=await supabase.from("profiles").select("id,display_name").in("id",ids); const map:any={}; (ps||[]).forEach(p=>map[p.id]=p); setProfiles(map);}
    setLoading(false);
  })()},[]);

  const filtered=useMemo(()=>requests.filter(r=>(r.title+" "+r.description+" "+(r.city||"")+" "+(r.region||"")).toLowerCase().includes(q.toLowerCase())),[requests,q]);

  return <><SiteHeader/><main className="page-shell">
    <section className="catalog-hero"><div><span className="eyebrow">Заявки</span><h1>Люди ищут специалистов</h1><p>Находите подходящие задачи и предлагайте свою помощь.</p></div><Link className="primary-btn" href="/requests/new">Создать заявку</Link></section>
    <div className="catalog-toolbar"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Поиск по заявкам…" /><span>{filtered.length} заявок</span></div>
    {loading ? <div className="empty-state">Загружаем заявки…</div> : filtered.length===0 ? <div className="empty-state"><h3>Заявок пока нет</h3><p>Попробуйте изменить запрос или создайте первую заявку.</p></div> :
    <div className="bento-grid">{filtered.map((r,i)=><Link className="service-card request-card" key={r.id} href={"/request?id="+r.id}>
      <div className="card-visual"><img src={"/illustrations/"+["tools.svg","cleaning.svg","design.svg","delivery.svg"][i%4]} alt="" /></div>
      <div className="card-body"><div className="card-meta"><span>{r.city||r.region||"Россия"}</span>{r.urgency!=="normal"&&<span className="accent-chip">Срочно</span>}</div>
      <h3>{r.title}</h3><p>{r.description}</p>
      <div className="card-footer"><strong>{r.budget ? "до "+Number(r.budget).toLocaleString("ru-RU")+" ₽" : "Бюджет по договорённости"}</strong><span>{profiles[r.user_id]?.display_name||"Заказчик"}</span></div></div></Link>)}</div>}
  </main><style jsx>{\`
.filter-toggle{margin:8px 0 12px}.filter-panel{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:16px;margin-bottom:16px;border:1px solid #e7eaf1;border-radius:20px;background:#fff;box-shadow:0 10px 28px rgba(35,43,74,.05)}.filter-panel label{display:flex;flex-direction:column;gap:6px;font-size:11px;font-weight:750;color:#667188}.filter-panel input,.filter-panel select{width:100%;min-height:42px;border:1px solid #e2e6ef;border-radius:12px;padding:0 11px;background:#fbfcff;color:#24314b;outline:0}.filter-panel input:focus,.filter-panel select:focus{border-color:#716bff}.filter-reset{align-self:end}@media(max-width:760px){.filter-panel{grid-template-columns:1fr 1fr}}@media(max-width:500px){.filter-panel{grid-template-columns:1fr}}`}</style></>;
}
