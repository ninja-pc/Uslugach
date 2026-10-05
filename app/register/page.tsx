"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); const [message, setMessage] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage(""); setLoading(true);
    const result = await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } });
    setLoading(false);
    if (result.error) { setError(result.error.message); return; }
    const next = searchParams.get("next");
    if (result.data.session) { router.push(next && next.startsWith("/") ? next : "/profile"); router.refresh(); return; }
    setMessage("Аккаунт создан. Проверьте почту, затем войдите.");
  }

  const loginHref = "/login" + (searchParams.get("next") ? "?next=" + encodeURIComponent(searchParams.get("next")!) : "");

  return <main className="auth-page"><form className="form-card" onSubmit={submit}>
    <a className="logo" href="/">⚡ Услугач</a><span className="eyebrow">Регистрация</span>
    <h1>Создайте аккаунт</h1><p>Один аккаунт подходит и исполнителю, и заказчику.</p>
    <label>Имя<input value={name} onChange={e => setName(e.target.value)} required maxLength={80} /></label>
    <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
    <label>Пароль<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} /></label>
    {error && <div className="form-error">{error}</div>}{message && <div className="form-success">{message}</div>}
    <button className="button wide" disabled={loading}>{loading ? "Создаём..." : "Зарегистрироваться"}</button>
    <p className="form-foot">Уже есть аккаунт? <a href={loginHref}>Войти</a></p>
  </form></main>;
}
