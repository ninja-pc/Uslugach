"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SiteHeader() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
      setReady(true);
    }
    loadUser();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setEmail(session?.user?.email ?? null);
      setReady(true);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, [supabase]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="modern-header">
      <div className="header-main">
        <a className="brand" href="/"><img className="brand-mark" src="/icons/logo-mark.svg" alt="" /><span>Услугач</span></a>
        <a className="location-pill" href="/services"><img src="/icons/location.svg" alt="" /><span>Москва</span><b>⌄</b></a>
        <nav className="main-nav">
          <a href="/services">Услуги</a>
          <a href="/requests">Заявки</a>
          <a href="/services">Исполнители</a>
          <a href="/profile">Кабинет</a>
        </nav>
        <div className="header-actions">
          <a className="header-search" href="/services" aria-label="Поиск"><img src="/icons/search.svg" alt="" /></a>
          {ready && !email && <a className="header-login" href="/login">Войти</a>}
          {ready && !email && <a className="header-register" href="/register">Регистрация</a>}
          {email && <a className="header-login" href="/chats">Чаты</a>}
          {email && <a className="header-login" href="/profile">Кабинет</a>}
          {email && <a className="header-register" href="/services/new">Разместить услугу</a>}
          {email && <button className="header-logout" onClick={logout}>Выйти</button>}
        </div>
      </div>
    </header>
  );
}