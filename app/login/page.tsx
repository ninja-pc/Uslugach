"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setLoading(true);
    const result = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (result.error) { setError(result.error.message); return; }
    router.push("/profile"); router.refresh();
  }

  return <main className="auth-page"><form className="form-card" onSubmit={submit}>
    <a className="logo" href="/">⚡ Услугач</a><span className="eyebrow">Вход</span>
    <h1>С возвращением</h1><p>Войдите, чтобы управлять профилем и услугами.</p>
    <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
    <label>Пароль<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} /></label>
    {error && <div className="form-error">{error}</div>}
    <button className="button wide" disabled={loading}>{loading ? "Входим..." : "Войти"}</button>
    <p className="form-foot">Нет аккаунта? <a href="/register">Зарегистрироваться</a></p>
  </form></main>;
}
