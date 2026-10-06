"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LOCATION_REGIONS } from "@/lib/locations";

export default function SiteHeader() {
  const router=useRouter(); const supabase=createClient();
  const [email,setEmail]=useState<string|null>(null),[ready,setReady]=useState(false),[unread,setUnread]=useState(0); const [isAdmin,setIsAdmin]=useState(false);
  const [city, setCity] = useState("Москва");
  const [cityOpen, setCityOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = window.sessionStorage.getItem("uslugach-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const enabled = saved ? saved === "dark" : prefersDark;
    setDarkMode(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  }, []);

  function toggleTheme() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    window.sessionStorage.setItem("uslugach-theme", next ? "dark" : "light");
  }

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
    async function loadUser(){const {data}=await supabase.auth.getUser();if(!mounted)return;setEmail(data.user?.email??null);setReady(true);if(data.user){loadUnread(data.user.id);const {data:p}=await supabase.from("profiles").select("role,status").eq("id",data.user.id).maybeSingle();setIsAdmin(p?.role==="admin"&&p?.status==="active")}else setIsAdmin(false)}
    loadUser();
    const timer=window.setInterval(async()=>{const {data}=await supabase.auth.getUser();if(data.user)loadUnread(data.user.id)},5000);
    const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>{if(!mounted)return;setEmail(session?.user?.email??null);setReady(true);if(session?.user){loadUnread(session.user.id);supabase.from("profiles").select("role,status").eq("id",session.user.id).maybeSingle().then(({data:p})=>setIsAdmin(p?.role==="admin"&&p?.status==="active"))}else {setUnread(0);setIsAdmin(false)}});
    return ()=>{mounted=false;window.clearInterval(timer);listener.subscription.unsubscribe()};
  },[supabase]);

  async function logout(){await supabase.auth.signOut();router.push("/");router.refresh()}

  return <header className="modern-header"><div className="header-main">
    <a className="brand" href="/"><img className="brand-mark" src="/icons/logo-mark.svg" alt="" /><span>Услугач</span></a>
    <div className="city-picker">
      <button className="location-pill" type="button" aria-haspopup="listbox" aria-expanded={cityOpen} onClick={() => setCityOpen((open) => !open)}>
        <img src="/icons/location.svg" alt="" /><span>{city}</span><b aria-hidden="true">⌄</b>
      </button>
      {cityOpen && <div className="city-menu" role="listbox" aria-label="Выберите город">
        {LOCATION_REGIONS.flatMap((region) => region.cities).map((option) => <button key={option} type="button" role="option" aria-selected={city === option} className={city === option ? "city-option selected" : "city-option"} onClick={() => { setCity(option); setCityOpen(false); }}>{option}</button>)}
      </div>}
    </div>
    <nav className="main-nav"><a href="/services">Услуги</a><a href="/requests">Заявки</a><a href="/services">Исполнители</a><a href="/profile">Кабинет</a></nav>
    <div className="header-actions">
      <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={darkMode ? "Включить светлую тему" : "Включить тёмную тему"} title={darkMode ? "Светлая тема" : "Тёмная тема"}><span aria-hidden="true">{darkMode ? "☼" : "◐"}</span></button>
      <a className="header-search" href="/services" aria-label="Поиск"><img src="/icons/search.svg" alt="" /></a>
      {ready&&!email&&<a className="header-login" href="/login">Войти</a>}
      {ready&&!email&&<a className="header-register" href="/register">Регистрация</a>}
      {email&&<a className="header-login header-chat-link" href="/chats"><span className="header-chat-icon"><img src="/icons/chat.svg" alt="" /></span><span>Чаты</span>{unread>0&&<b className="header-unread">{unread>99?"99+":unread}</b>}</a>}
      {email&&<a className="header-login" href="/profile">Кабинет</a>}{email&&isAdmin&&<a className="header-login admin-header-link" href="/admin">Админка</a>}
      {email&&<a className="header-register" href="/services/new">Разместить услугу</a>}
      {email&&<button className="header-logout" onClick={logout}>Выйти</button>}
    </div>
  </div></header>;
}
