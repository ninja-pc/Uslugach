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

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="header">
      <a className="logo" href="/">⚡ Услугач</a>
      <nav>
        <a href="/services">Найти услугу</a>
        {email && <a href="/profile">Кабинет</a>}
        {email && <a className="button" href="/services/new">Разместить услугу</a>}
        {ready && !email && <a className="button secondary" href="/login">Войти</a>}
        {ready && !email && <a className="button" href="/register">Регистрация</a>}
        {email && <button className="text-button" onClick={logout}>Выйти</button>}
      </nav>
    </header>
  );
}
