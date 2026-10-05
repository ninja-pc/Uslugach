'use client';

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LOCATION_REGIONS, getCities } from "@/lib/locations";
import SiteHeader from "@/components/SiteHeader";

export default function NewRequestPage() {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category_id: "",
    budget: "",
    district: "",
    deadline: "",
    urgency: "normal",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.replace("/login?next=/requests/new");
        return;
      }

      setUser(data.user);

      const { data: cats } = await supabase
        .from("categories")
        .select("id,name")
        .eq("is_active", true)
        .order("name");

      setCategories(cats || []);
      setLoading(false);
    }

    load();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setError("Необходимо войти в аккаунт");
      return;
    }

    if (!form.title.trim() || !form.description.trim()) {
      setError("Заполните название и описание");
      return;
    }

    setSaving(true);
    setError("");

    const { data, error: insertError } = await supabase
      .from("requests")
      .insert({
        user_id: user.id,
        category_id: form.category_id || null,
        title: form.title.trim(),
        description: form.description.trim(),
        budget: form.budget ? Number(form.budget) : null,
        region: region || null,
        city: city || null,
        district: form.district.trim() || null,
        deadline: form.deadline || null,
        urgency: form.urgency,
        status: "published",
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    router.push("/request?id=" + data.id);
  }

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="page-shell">
          <div className="empty-state">Загрузка…</div>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="page-shell request-create-page">
        <section className="request-create-head">
          <span className="eyebrow">Новая заявка</span>
          <h1>Опишите задачу — специалисты откликнутся</h1>
          <p>
            Чем подробнее вы расскажете о задаче, сроках и бюджете, тем точнее
            будут предложения.
          </p>
        </section>

        <form className="form-card" onSubmit={submit}>
          {error && <div className="form-error">{error}</div>}

          <div className="form-grid">
            <label>
              Что нужно сделать
              <input
                required
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                placeholder="Например: нужен электрик для замены проводки"
              />
            </label>

            <label>
              Категория
              <select
                value={form.category_id}
                onChange={(event) =>
                  setForm({ ...form, category_id: event.target.value })
                }
              >
                <option value="">Выберите категорию</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Подробности
            <textarea
              required
              rows={7}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              placeholder="Опишите объём работы, материалы, пожелания и важные детали"
            />
          </label>

          <div className="form-grid">
            <label>
              Бюджет, ₽
              <input
                type="number"
                min="0"
                value={form.budget}
                onChange={(event) =>
                  setForm({ ...form, budget: event.target.value })
                }
                placeholder="Например, 15000"
              />
            </label>

            <label>
              Срочность
              <select
                value={form.urgency}
                onChange={(event) =>
                  setForm({ ...form, urgency: event.target.value })
                }
              >
                <option value="normal">В обычном порядке</option>
                <option value="urgent">Срочно</option>
                <option value="asap">Как можно скорее</option>
              </select>
            </label>
          </div>

          <div className="form-grid">
            <label>
              Регион
              <select
                value={region}
                onChange={(event) => {
                  setRegion(event.target.value);
                  setCity("");
                }}
              >
                <option value="">Выберите регион</option>
                {LOCATION_REGIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Город
              <select
                value={city}
                disabled={!region}
                onChange={(event) => setCity(event.target.value)}
              >
                <option value="">
                  {region ? "Выберите город" : "Сначала регион"}
                </option>
                {getCities(region).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-grid">
            <label>
              Район
              <input
                value={form.district}
                onChange={(event) =>
                  setForm({ ...form, district: event.target.value })
                }
                placeholder="Необязательно"
              />
            </label>

            <label>
              Желаемый срок
              <input
                type="date"
                value={form.deadline}
                onChange={(event) =>
                  setForm({ ...form, deadline: event.target.value })
                }
              />
            </label>
          </div>

          <div className="form-actions">
            <button className="primary-btn" disabled={saving}>
              {saving ? "Публикуем…" : "Опубликовать заявку"}
            </button>

            <button
              type="button"
              className="secondary-btn"
              onClick={() => router.back()}
            >
              Отмена
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
