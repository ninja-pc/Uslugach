"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SiteFooter() {
  const supabase = useMemo(() => createClient(), []);
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

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <footer className="modern-footer">
      <div className="footer-main">
        <a className="footer-brand" href="/">
          <img src="/icons/logo-mark.svg" alt="" />
          <span>Услугач</span>
        </a>
        <p>Люди для Людей.</p>
      </div>

      <nav className="footer-links" aria-label="Основная навигация">
        <a href="/">Главная</a>
        <a href="/services">Услуги</a>
        <a href="/requests">Заявки</a>
        <a href="/performers">Исполнители</a>
        {ready && email ? <a href="/profile">Кабинет</a> : <a href="/register">Регистрация</a>}
        {ready && email && <a href="/chats">Чаты</a>}
        {ready && email && <a href="/notifications">Уведомления</a>}
      </nav>

      <nav className="footer-links footer-legal-links" aria-label="Правовая информация">
        <a href="/terms">Правила сервиса</a>
        <a href="/privacy">Политика обработки персональных данных</a>
      </nav>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} «Услугач»</span>
        <span>Используя сервис, вы подтверждаете согласие с опубликованными условиями.</span>
      </div>
    </footer>
  );
}
