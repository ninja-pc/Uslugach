"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [nextPath, setNextPath] = useState("/profile");
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); const [message, setMessage] = useState("");
  const [rulesAccepted, setRulesAccepted] = useState(false); const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next");
    if (next && next.startsWith("/")) setNextPath(next);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    if (!rulesAccepted || !privacyAccepted) { setError("Подтвердите согласие с Правилами сервиса и Политикой обработки персональных данных."); return; }
    setLoading(true);
    const result = await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } });
    setLoading(false);
    if (result.error) { setError(result.error.message); return; }
    if (result.data.session) { router.push(nextPath); router.refresh(); return; }
    setMessage("Аккаунт создан. Проверьте почту, затем войдите.");
  }

  return <main className="auth-page"><form className="form-card" onSubmit={submit}>
    <a className="logo" href="/">⚡ Услугач</a><span className="eyebrow">Регистрация</span>
    <h1>Создайте аккаунт</h1><p>Один аккаунт подходит и исполнителю, и заказчику.</p>
    <label>Имя<input value={name} onChange={e => setName(e.target.value)} required maxLength={80} /></label>
    <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
    <label>Пароль<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} /></label>
    {error && <div className="form-error">{error}</div>}{message && <div className="form-success">{message}</div>}
    <div className="legal-register-checks">\n      <label className="legal-check"><input type="checkbox" checked={rulesAccepted} onChange={e => setRulesAccepted(e.target.checked)} /><span>Я согласен(на) с <a href="/terms" target="_blank">Правилами сервиса</a>.</span></label>\n      <label className="legal-check"><input type="checkbox" checked={privacyAccepted} onChange={e => setPrivacyAccepted(e.target.checked)} /><span>Я согласен(на) на обработку персональных данных по <a href="/privacy" target="_blank">Политике обработки персональных данных</a>.</span></label>\n    </div>\n    <button className="button wide" disabled={loading || !rulesAccepted || !privacyAccepted}>{loading ? "Создаём..." : "Зарегистрироваться"}</button>
    <p className="form-foot">Уже есть аккаунт? <a href={"/login?next=" + encodeURIComponent(nextPath)}>Войти</a></p>
  </form></main>;
}
