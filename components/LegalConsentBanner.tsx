"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "uslugach-legal-consent-v1";

export default function LegalConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [rules, setRules] = useState(false);
  const [privacy, setPrivacy] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(CONSENT_KEY) !== "accepted") setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function accept() {
    if (!rules || !privacy) return;
    window.localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="legal-consent-backdrop" role="dialog" aria-modal="true" aria-labelledby="legal-consent-title">
      <section className="legal-consent">
        <span className="eyebrow">Перед началом</span>
        <h2 id="legal-consent-title">Добро пожаловать в «Услугач»</h2>
        <p>
          Продолжая пользоваться сервисом, ознакомьтесь с правилами площадки и условиями
          обработки персональных данных.
        </p>

        <label className="legal-check">
          <input type="checkbox" checked={rules} onChange={(e) => setRules(e.target.checked)} />
          <span>Я ознакомился(ась) и согласен(на) с <a href="/terms" target="_blank">Правилами сервиса</a>.</span>
        </label>
        <label className="legal-check">
          <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
          <span>Я согласен(на) на обработку персональных данных в соответствии с <a href="/privacy" target="_blank">Политикой обработки персональных данных</a>.</span>
        </label>

        <button className="button wide" type="button" disabled={!rules || !privacy} onClick={accept}>
          Согласен(на), продолжить
        </button>
        <small>
          Если вы не согласны с условиями, пожалуйста, не используйте сервис.
        </small>
      </section>
    </div>
  );
}
