-- =====================================================
-- APEX GYM — Migración 023
-- 023_settings.sql
--
-- Objetivo: ajustes con valor general y excepción por gimnasio
-- (docs/plan-multi-gimnasio.md, fase 5).
--
-- Qué ajustes existen, su tipo y su valor por defecto NO viven aquí: viven en
-- el catálogo `setting-definitions.ts`. Agregar un ajuste es agregar un
-- registro ahí, sin migración. Estas tablas solo guardan lo que el super
-- admin cambió respecto de ese defecto.
--
-- Resolución (settings/resolve-setting.ts):
--   1. valor general marcado `enforced` → ese, para todos;
--   2. excepción del gimnasio;
--   3. valor general;
--   4. defecto del catálogo.
-- =====================================================

BEGIN;

CREATE TABLE platform_settings (
    key        VARCHAR(100) PRIMARY KEY,
    value      JSONB NOT NULL,
    enforced   BOOLEAN NOT NULL DEFAULT FALSE,
    updated_by UUID REFERENCES platform_admins (id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE company_settings (
    company_id UUID NOT NULL REFERENCES companies (id),
    key        VARCHAR(100) NOT NULL,
    value      JSONB NOT NULL,
    updated_by UUID REFERENCES platform_admins (id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (company_id, key)
);

COMMIT;
