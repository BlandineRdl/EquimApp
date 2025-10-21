-- Migration: Ajouter contrainte d'unicité globale sur profiles.pseudo
-- Garantit qu'un pseudo de vrai membre ne peut exister qu'une seule fois dans l'app

ALTER TABLE profiles
ADD CONSTRAINT unique_profile_pseudo UNIQUE (pseudo);

COMMENT ON CONSTRAINT unique_profile_pseudo ON profiles IS
'Garantit l''unicité globale des pseudos des vrais membres. Les phantoms utilisent le préfixe "Membre-" pour éviter les collisions.';
