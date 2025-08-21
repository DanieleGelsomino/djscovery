import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { useLanguage } from "./LanguageContext";
import { FaPaperPlane } from "react-icons/fa";
import { useToast } from "./ToastContext";
import { subscribeNewsletter } from "../api";
import heroImg from "../assets/img/newsletter.jpg";

const Section = styled.section`
    position: relative;
    padding: 3rem 0;
    color: var(--white);
    text-align: center;
    overflow: hidden;
    background-image: url(${heroImg});
    background-size: cover;
    background-position: center;
`;
const Overlay = styled.div`
    position: absolute; inset: 0;
    background: linear-gradient(rgba(0,0,0,.5), rgba(0,0,0,.5));
    z-index: 0;
`;
const Content = styled.div` position: relative; z-index: 1; `;
const Form = styled.form`
    display: flex; flex-direction: column; gap: 1rem; width: 100%;
    max-width: 400px; margin: 1rem auto 0;
    background-color: rgba(0,0,0,.25);
    padding: 1.5rem; border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,.4);
`;
const Input = styled(motion.input)`
    width: 100%; padding: .75rem; border: none; border-radius: 4px;
`;
const Button = styled(motion.button)`
    width: 100%; padding: .75rem; border: none; border-radius: 4px;
    background: var(--yellow); color: var(--black); font-weight: bold;
    display: flex; align-items: center; justify-content: center; gap: .5rem;
    &:disabled { opacity: .6; cursor: not-allowed; }
`;
const ConsentRow = styled.label`
  display: flex; align-items: flex-start; gap: .5rem; font-size: .9rem; text-align: left;
`;

const NewsletterSection = () => {
    const [email, setEmail] = useState("");
    const [consent, setConsent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [website, setWebsite] = useState(""); // honeypot
    const { t } = useLanguage();
    const { showToast } = useToast();

    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

    useEffect(() => {
        if (!siteKey) return;
        if (window.grecaptcha) return;
        const s = document.createElement("script");
        s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
        s.async = true;
        document.head.appendChild(s);
    }, [siteKey]);

    const runRecaptcha = async () => {
        if (!siteKey || !window.grecaptcha) return null;
        try {
            await window.grecaptcha.ready();
            return await window.grecaptcha.execute(siteKey, { action: "newsletter" });
        } catch {
            return null;
        }
    };

    const validate = (v) => /\S+@\S+\.\S+/.test(v);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr("");

        if (!validate(email)) {
            setErr(t("newsletter.email_invalid") || "Email non valida");
            return;
        }
        if (!consent) {
            setErr(t("newsletter.consent_required") || "Devi accettare la privacy");
            return;
        }

        setLoading(true);
        try {
            const recaptchaToken = await runRecaptcha();

            // Se la tua subscribeNewsletter accetta SOLO l'email, questa riga funziona comunque:
            // await subscribeNewsletter(email);

            // Se hai aggiornato l'API client come consigliato:
            await subscribeNewsletter(email, {
                attributes: { PAGE: window.location.pathname || "/" },
                consent: true,
                recaptchaToken,
                website, // honeypot (vuoto per umani)
            });

            setEmail("");
            setConsent(false);
            showToast(t("newsletter.success"), "success");
        } catch (e2) {
            setErr(e2?.message || t("newsletter.error"));
            showToast(t("newsletter.error"), "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Section>
            <Overlay />
            <Content className="container">
                <h2>{t("newsletter.title")}</h2>
                <p>{t("newsletter.subtitle")}</p>

                <Form onSubmit={handleSubmit} noValidate>
                    {/* Honeypot (invisibile per gli utenti) */}
                    <input
                        type="text"
                        name="website"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        tabIndex="-1"
                        autoComplete="off"
                        aria-hidden="true"
                        style={{ position: "absolute", left: "-5000px" }}
                    />

                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t("newsletter.email")}
                        required
                        whileFocus={{ scale: 1.02 }}
                        aria-invalid={!!err}
                    />

                    <ConsentRow>
                        <input
                            id="consent"
                            type="checkbox"
                            checked={consent}
                            onChange={(e) => setConsent(e.target.checked)}
                            required
                        />
                        <span>
              {t("newsletter.consent_text") || (
                  <>Acconsento al trattamento dei dati secondo la <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.</>
              )}
            </span>
                    </ConsentRow>

                    {err && (
                        <div role="alert" style={{ color: "#ffdede", fontSize: ".9rem", textAlign: "left" }}>
                            {err}
                        </div>
                    )}

                    <Button type="submit" disabled={loading} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        {loading ? (t("newsletter.loading") || "Invio…") : t("newsletter.subscribe")} <FaPaperPlane />
                    </Button>
                </Form>
            </Content>
        </Section>
    );
};

export default NewsletterSection;
