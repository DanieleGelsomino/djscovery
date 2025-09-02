import React, { useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { useLanguage } from "./LanguageContext";
import { sendContact } from "../api";
import { useToast } from "./ToastContext";

const Section = styled(motion.section)`
    text-align: center;
    background: linear-gradient(180deg, #111, #000);
`;

const Form = styled.form`
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    width: 100%;
    margin-top: 1rem;
    background-color: rgba(0, 0, 0, 0.25);
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,.4);

    @media (min-width: 768px) {
        width: 60%;
        margin: 1rem auto 0;
        grid-template-columns: repeat(2, 1fr);
    }

    textarea, button { grid-column: span 2; }
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
`;

const Button = styled(motion.button)`
    width: 100%;
    padding: .75rem;
    background-color: var(--red);
    color: var(--white);
    border: none;
    border-radius: 4px;
    font-weight: bold;
    opacity: ${(p) => (p.disabled ? 0.7 : 1)};
    cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
`;

const ContattiSection = () => {
    const [sending, setSending] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const { t } = useLanguage();
    const { showToast } = useToast(); // 👈 usa il tuo context

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
                    <Button
                        type="submit"
                        disabled={sending}
                        whileHover={!sending ? { scale: 1.05 } : {}}
                        whileTap={!sending ? { scale: 0.95 } : {}}
                    >
                        {sending ? (t("contacts.sending") || "Invio…") : t("contacts.send")}
                    </Button>
                </Form>
            </div>
        </Section>
    );
};

export default ContattiSection;
