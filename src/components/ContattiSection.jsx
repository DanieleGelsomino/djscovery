// src/components/ContattiSection.jsx
import React, { useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { useLanguage } from "./LanguageContext";
import { sendContact } from "../api";
import { useToast } from "./ToastContext";
import WhatsAppIcon from "@mui/icons-material/WhatsApp"; // 👈 icona MUI

const Section = styled(motion.section)`
    text-align: center;
    background: linear-gradient(180deg, #111, #000);
    padding: 1rem 0;
`;

const Form = styled.form`
    display: grid;
    grid-template-columns: 1fr; /* 📱 mobile: 1 colonna */
    gap: 0.75rem;
    width: 100%;
    margin-top: 1rem;
    background-color: rgba(0, 0, 0, 0.25);
    padding: 1rem; /* compatto su mobile */
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,.4);

    @media (min-width: 768px) {
        width: 60%;
        margin-left: auto;
        margin-right: auto;
        padding: 1.5rem; /* più respiro su desktop */
        grid-template-columns: repeat(2, minmax(0, 1fr)); /* 💻 due colonne */
    }
`;

const Input = styled(motion.input)`
    width: 100%;
    padding: .75rem;
    border: 1px solid var(--gray);
    border-radius: 4px;
    background-color: #111;
    color: var(--white);
`;

const TextArea = styled(motion.textarea)`
    width: 100%;
    padding: .75rem;
    border: 1px solid var(--gray);
    border-radius: 4px;
    background-color: #111;
    color: var(--white);
    resize: none;
    grid-column: 1 / -1; /* sempre full width */
`;

const SubmitButton = styled(motion.button)`
    width: 100%;
    padding: .9rem;
    background-color: var(--red);
    color: var(--white);
    border: none;
    border-radius: 8px;
    font-weight: 700;
    opacity: ${(p) => (p.disabled ? 0.7 : 1)};
    cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
    grid-column: 1 / -1; /* sempre sotto e full width */
`;

const OrDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: .5rem 0;   /* subito sotto il tasto invia */
  opacity: .8;
  grid-column: 1 / -1; /* full width anche su desktop */
  &::before, &::after {
    content: "";
    height: 1px;
    background: #333;
    flex: 1;
  }
  span { white-space: nowrap; font-size: .95rem; color: #bbb; }
`;

const WhatsAppBtn = styled(motion.a)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .6rem;
  padding: .9rem;
  border-radius: 8px;
  background: #25D366;
  color: #111;
  font-weight: 800;
  text-decoration: none;
  box-shadow: 0 6px 18px rgba(0,0,0,.35);
  grid-column: 1 / -1; /* sempre full width */
`;

const ContattiSection = () => {
    const [sending, setSending] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const { t } = useLanguage();
    const { showToast } = useToast();

    const WHATSAPP_PHONE =
        (import.meta?.env && import.meta.env.VITE_WHATSAPP_PHONE) ||
        (window.APP_CONFIG && window.APP_CONFIG.WHATSAPP_PHONE) ||
        "+390000000000"; // TODO: sostituisci col tuo numero

    const buildWhatsAppUrl = (phone, text) => {
        const digits = String(phone || "").replace(/[^\d]/g, "");
        const msg = text ? encodeURIComponent(text) : "";
        return `https://wa.me/${digits}${msg ? `?text=${msg}` : ""}`;
    };

    const waDefault = t("contacts.whatsappDefault") || "Ciao! Vorrei informazioni.";
    const waPrefill =
        `${waDefault}` +
        (form.name ? `\nNome: ${form.name}` : "") +
        (form.message ? `\nMessaggio: ${form.message}` : "");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (sending) return;
        setSending(true);
        try {
            await sendContact(form);
            showToast(t("contacts.sent") || "Messaggio inviato con successo!", "success");
            setForm({ name: "", email: "", message: "" });
        } catch (err) {
            console.error("Errore invio contatto:", err);
            const msg =
                err?.response?.data?.error === "email_failed"
                    ? (t("contacts.error_email") || "Invio email fallito. Riprova più tardi.")
                    : (t("contacts.error_generic") || "Impossibile inviare il messaggio.");
            showToast(msg, "error");
        } finally {
            setSending(false);
        }
    };

    return (
        <Section>
            <div className="container">
                <h2>{t("contacts.title")}</h2>
                <p>{t("contacts.subtitle")}</p>

                <Form
                    as={motion.form}
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    {/* 📱 mobile full-width; 💻 da 768px name/email affiancati */}
                    <Input
                        whileFocus={{ scale: 1.02 }}
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder={t("contacts.name")}
                        required
                        disabled={sending}
                    />
                    <Input
                        whileFocus={{ scale: 1.02 }}
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder={t("contacts.email")}
                        required
                        disabled={sending}
                    />

                    <TextArea
                        whileFocus={{ scale: 1.02 }}
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        placeholder={t("contacts.message")}
                        rows="5"
                        required
                        disabled={sending}
                    />

                    {/* Tasto invia */}
                    <SubmitButton
                        type="submit"
                        disabled={sending}
                        whileHover={!sending ? { scale: 1.03 } : {}}
                        whileTap={!sending ? { scale: 0.98 } : {}}
                    >
                        {sending ? (t("contacts.sending") || "Invio…") : t("contacts.send")}
                    </SubmitButton>

                    {/* “oppure” sempre sotto al tasto invia */}
                    <OrDivider><span>{t("contacts.or") || "oppure"}</span></OrDivider>

                    {/* Bottone WhatsApp */}
                    <WhatsAppBtn
                        href={buildWhatsAppUrl(WHATSAPP_PHONE, waPrefill)}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        aria-label={t("contacts.whatsappCta") || "Scrivici su WhatsApp"}
                    >
                        <WhatsAppIcon sx={{ fontSize: 22 }} />
                        {t("contacts.whatsappCta") || "Scrivici su WhatsApp"}
                    </WhatsAppBtn>
                </Form>
            </div>
        </Section>
    );
};

export default ContattiSection;
