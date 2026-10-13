-- =====================================================
-- APEX GYM — Migración 024
-- 024_client_reminders.sql
--
-- Objetivo: registrar cada recordatorio de renovación que la recepción abre
-- por WhatsApp, para que la lista muestre "Recordado hoy" y nadie le escriba
-- dos veces al mismo cliente.
--
-- Es un hecho, como una asistencia: sin edición ni borrado. Se guarda que se
-- abrió el chat, no que el mensaje llegó: eso solo lo sabe WhatsApp.
-- =====================================================

BEGIN;

CREATE TABLE client_reminders (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies (id),
    client_id  UUID NOT NULL REFERENCES clients (id),
    sent_by    UUID REFERENCES users (id),
    sent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_reminders_company_sent
    ON client_reminders (company_id, sent_at);

COMMIT;
