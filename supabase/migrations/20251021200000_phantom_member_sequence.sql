-- Migration: Créer séquence globale pour auto-génération des pseudos fantômes
-- Génère les matricules : Membre-1, Membre-2, Membre-3, etc.

CREATE SEQUENCE IF NOT EXISTS phantom_member_sequence START 1;

-- Grant permissions
GRANT USAGE ON SEQUENCE phantom_member_sequence TO authenticated;

-- Add comment
COMMENT ON SEQUENCE phantom_member_sequence IS
'Génère les matricules pour les membres fantômes : Membre-1, Membre-2, etc.';
