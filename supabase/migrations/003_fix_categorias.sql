-- Migration 003: add missing soft-delete column to categorias
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMPTZ DEFAULT NULL;
