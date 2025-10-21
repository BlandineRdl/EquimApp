-- Migration: Ajouter contraintes sur les membres fantômes
-- 1. Contrainte d'unicité globale sur phantom_pseudo
-- 2. Contrainte de format "Membre-%"
-- 3. Modifier contrainte phantom_has_data pour permettre revenu >= 0

-- Contrainte d'unicité globale pour les pseudos fantômes
ALTER TABLE group_members
ADD CONSTRAINT unique_phantom_pseudo UNIQUE (phantom_pseudo);

-- Contrainte de format : doit commencer par "Membre-"
ALTER TABLE group_members
ADD CONSTRAINT phantom_pseudo_format
CHECK (phantom_pseudo IS NULL OR phantom_pseudo LIKE 'Membre-%');

-- Mettre à jour la contrainte phantom_has_data pour revenu >= 0
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS phantom_has_data;

ALTER TABLE group_members ADD CONSTRAINT phantom_has_data CHECK (
  (is_phantom = false AND user_id IS NOT NULL AND phantom_pseudo IS NULL AND phantom_income IS NULL)
  OR (is_phantom = true AND user_id IS NULL AND phantom_pseudo IS NOT NULL AND phantom_income >= 0)
);

-- Add comments
COMMENT ON CONSTRAINT unique_phantom_pseudo ON group_members IS
'Garantit l''unicité globale des pseudos fantômes. Format: Membre-{suffixe}';

COMMENT ON CONSTRAINT phantom_pseudo_format ON group_members IS
'Force le préfixe "Membre-" pour tous les pseudos fantômes';

COMMENT ON CONSTRAINT phantom_has_data ON group_members IS
'Valide que les phantoms ont un pseudo et revenu >= 0, et que les vrais membres ont un user_id';
