"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SiteHeader from "@/components/SiteHeader";

type Row = { id: string; title?: string; display_name?: string | null; name?: string; status: string; created_at: string; role?: string; city?: string | null; region?: string | null; slug?: string; is_active?: boolean; reason?: string; details?: string | null; service_id?: string | null };
type Stats = { users: number; services: number; requests: number; responses: number; messages: number; complaints: number };

const supabase = createClient();

export default function AdminPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<Row[]>([]);
  const [services, setServices] = useState<Row[]>([]);
  const [requests, setRequests] = useState<Row[]>([]);
  const [complaints, setComplaints] = useState<Row[]>([]);
  const [categories, setCategories] = useState<Row[]>([]);
  const [stats, setStats] = useState<Stats>({ users: 0, services: 0, requests: 0, responses: 0, messages: 0, complaints: 0 });
  const [newCategory, setNewCategory] = useState("");
  const [busy, setBusy] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    const auth = await supabase.auth.getUser();
    if (!auth.data.user) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role,status")
      .eq("id", auth.data.user.id)
      .maybeSingle();

    const isAdmin = profile?.role === "admin" && profile?.status === "active";
    setAllowed(isAdmin);

    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const [u, s, r, c, cat, resp, msg] = await Promise.all([
      supabase.from("profiles").select("id,display_name,city,region,role,status,created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("services").select("id,title,status,created_at,user_id").order("created_at", { ascending: false }).limit(100),
      supabase.from("requests").select("id,title,status,created_at,user_id").order("created_at", { ascending: false }).limit(100),
      supabase.from("complaints").select("id,reason,details,status,created_at,service_id,user_id").order("created_at", { ascending: false }).limit(100),
      supabase.from("categories").select("id,name,slug,is_active,sort_order").order("sort_order"),
      supabase.from("responses").select("id", { count: "exact", head: true }),
      supabase.from("messages").select("id", { count: "exact", head: true }),
    ]);

    const ownerIds = [
      ...(s.data || []).map((x: any) => x.user_id),
      ...(r.data || []).map((x: any) => x.user_id),
      ...(c.data || []).map((x: any) => x.user_id),
    ];
    const uniqueIds = [...new Set(ownerIds)];
    let names: Record<string, string> = {};

    if (uniqueIds.length > 0) {
      const { data: people } = await supabase.from("profiles").select("id,display_name").in("id", uniqueIds);
      names = Object.fromEntries((people || []).map((p: any) => [p.id, p.display_name || "Пользователь"]));
    }

    setUsers((u.data || []) as Row[]);
    setServices((s.data || []).map((x: any) => ({ ...x, display_name: names[x.user_id] })));
    setRequests((r.data || []).map((x: any) => ({ ...x, display_name: names[x.user_id] })));
    setComplaints((c.data || []).map((x: any) => ({ ...x, display_name: names[x.user_id] })));
    setCategories((cat.data || []) as Row[]);
    setStats({
      users: u.data?.length || 0,
      services: s.data?.length || 0,
      requests: r.data?.length || 0,
      responses: resp.count || 0,
      messages: msg.count || 0,
      complaints: c.data?.length || 0,
    });
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function update(table: string, id: string, patch: Record<string, unknown>) {
    setBusy(id);
    const { error: updateError } = await supabase.from(table).update(patch).eq("id", id);
    if (updateError) setError(updateError.message);
    await load();
    setBusy("");
  }

  async function createCategory() {
    const name = newCategory.trim();
    if (!name) return;

    setBusy("category");
    const slug = name.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "-").replace(/^-+|-+$/g, "") + "-" + Date.now().toString(36);
    const { error: insertError } = await supabase.from("categories").insert({ name, slug, is_active: true });

    if (insertError) setError(insertError.message);
    else setNewCategory("");

    await load();
    setBusy("");
  }

  async function removeCategory(id: string) {
    setBusy(id);
    const { error: deleteError } = await supabase.from("categories").delete().eq("id", id);

    if (deleteError) setError("Категорию нельзя удалить, если она уже используется в объявлениях.");
    await load();
    setBusy("");
  }

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="page-shell">
          <div className="empty-state">Проверяем доступ…</div>
        </main>
      </>
    );
  }

  if (!allowed) {
    return (
      <>
        <SiteHeader />
        <main className="page-shell">
          <section className="admin-denied">
            <span className="eyebrow">Закрытый раздел</span>
            <h1>Доступ к админке закрыт</h1>
            <p>Этот раздел доступен только администраторам «Услугача».</p>
            <a className="button" href="/profile">Вернуться в кабинет</a>
          </section>
        </main>
      </>
    );
  }

  const statLabels: Record<keyof Stats, string> = {
    users: "пользователей",
    services: "услуг",
    requests: "заявок",
    responses: "откликов",
    messages: "сообщений",
    complaints: "жалоб",
  };

  return (
    <>
      <SiteHeader />
      <main className="page-shell admin-page">
        <section className="admin-head">
          <div>
            <span className="eyebrow">Управление платформой</span>
            <h1>Админ-панель</h1>
            <p>Модерация пользователей, объявлений, жалоб и категорий.</p>
          </div>
          <button className="secondary-btn" onClick={load}>Обновить данные</button>
        </section>

        {error && <div className="form-error">{error}</div>}

        <section className="admin-stats">
          {(Object.keys(stats) as Array<keyof Stats>).map((key) => (
            <div className="admin-stat" key={key}>
              <strong>{stats[key]}</strong>
              <span>{statLabels[key]}</span>
            </div>
          ))}
        </section>

        <div className="admin-grid">
          <section className="content-card">
            <div className="section-head"><div><span className="eyebrow">Пользователи</span><h2>Аккаунты</h2></div></div>
            <div className="admin-list">
              {users.map((user) => (
                <div className="admin-row" key={user.id}>
                  <div>
                    <strong>{user.display_name || "Без имени"}</strong>
                    <span>{user.city || user.region || "Локация не указана"} · {new Date(user.created_at).toLocaleDateString("ru-RU")}</span>
                  </div>
                  <div className="admin-row-actions">
                    <b className={user.status === "blocked" ? "status-bad" : "status-good"}>{user.status === "blocked" ? "Заблокирован" : "Активен"}</b>
                    {user.role !== "admin" && (
                      <button className="text-button" disabled={busy === user.id} onClick={() => update("profiles", user.id, { status: user.status === "blocked" ? "active" : "blocked" })}>
                        {user.status === "blocked" ? "Разблокировать" : "Заблокировать"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="content-card">
            <div className="section-head"><div><span className="eyebrow">Объявления</span><h2>Услуги</h2></div></div>
            <div className="admin-list">
              {services.map((service) => (
                <div className="admin-row" key={service.id}>
                  <div><strong>{service.title}</strong><span>{service.display_name || "Исполнитель"} · {new Date(service.created_at).toLocaleDateString("ru-RU")}</span></div>
                  <select value={service.status} disabled={busy === service.id} onChange={(e) => update("services", service.id, { status: e.target.value })}>
                    <option value="published">Опубликована</option>
                    <option value="pending">На модерации</option>
                    <option value="rejected">Отклонена</option>
                    <option value="archived">Архив</option>
                  </select>
                </div>
              ))}
            </div>
          </section>

          <section className="content-card">
            <div className="section-head"><div><span className="eyebrow">Заявки</span><h2>Задачи пользователей</h2></div></div>
            <div className="admin-list">
              {requests.map((request) => (
                <div className="admin-row" key={request.id}>
                  <div><strong>{request.title}</strong><span>{request.display_name || "Заказчик"} · {new Date(request.created_at).toLocaleDateString("ru-RU")}</span></div>
                  <select value={request.status} disabled={busy === request.id} onChange={(e) => update("requests", request.id, { status: e.target.value })}>
                    <option value="published">Опубликована</option>
                    <option value="closed">Закрыта</option>
                    <option value="archived">Архив</option>
                  </select>
                </div>
              ))}
            </div>
          </section>

          <section className="content-card">
            <div className="section-head"><div><span className="eyebrow">Жалобы</span><h2>Модерация</h2></div></div>
            <div className="admin-list">
              {complaints.length === 0 ? (
                <div className="mini-empty">Новых жалоб нет.</div>
              ) : (
                complaints.map((complaint) => (
                  <div className="admin-row" key={complaint.id}>
                    <div>
                      <strong>{complaint.reason}</strong>
                      <span>{complaint.display_name || "Пользователь"} · {complaint.service_id ? "услуга" : "заявка"} · {complaint.details || "Без деталей"}</span>
                    </div>
                    <select value={complaint.status} disabled={busy === complaint.id} onChange={(e) => update("complaints", complaint.id, { status: e.target.value })}>
                      <option value="open">Новая</option>
                      <option value="reviewing">На проверке</option>
                      <option value="resolved">Решена</option>
                      <option value="rejected">Отклонена</option>
                    </select>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="content-card">
            <div className="section-head"><div><span className="eyebrow">Категории</span><h2>Справочник</h2></div></div>
            <div className="admin-category-create">
              <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Название новой категории" />
              <button className="primary-btn" disabled={busy === "category"} onClick={createCategory}>Добавить</button>
            </div>
            <div className="admin-list">
              {categories.map((category) => (
                <div className="admin-row" key={category.id}>
                  <div><strong>{category.name}</strong><span>{category.slug}</span></div>
                  <div className="admin-row-actions">
                    <button className="text-button" onClick={() => update("categories", category.id, { is_active: !category.is_active })}>{category.is_active ? "Скрыть" : "Вернуть"}</button>
                    <button className="text-button danger-link" disabled={busy === category.id} onClick={() => removeCategory(category.id)}>Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
