# Database Tests (SQL)

Ce dossier contient les tests SQL pour valider la logique métier dans PostgreSQL/Supabase.

## 📋 Tests disponibles

### 🧪 Tests d'intégration SQL (manuel - Dashboard ou psql)

#### `setup_test_database.sql` ⚙️
**Setup unique - À exécuter une seule fois**

Crée un schéma `test` séparé pour isoler complètement les tests de vos données de production.

✅ **Avantages** :
- Aucun popup de sécurité dans Dashboard
- Zéro risque pour vos données de production
- Isolation complète (schéma dédié)

**Exécution :** Supabase Dashboard → SQL Editor → Coller et Run

---

#### `compute_shares.integration.sql` 🧪
**Test d'intégration du usecase `compute_shares`**

Test complet qui s'exécute dans le schéma `test` isolé.

**Ce qui est testé :**
- ✅ Calcul des dépenses personnelles (170.99€ et 140€)
- ✅ Calcul des capacités mensuelles (3029.01€ et 2660€)
- ✅ Calcul des pourcentages de quotes-parts (53.24% et 46.76%)
- ✅ Calcul des montants à payer (873.19€ et 766.81€)
- ✅ Absence d'erreurs d'arrondi (somme = 1640€)
- ✅ Calcul du "rest à vivre" (2155.82€ et 1893.19€)

**Exécution :**
- Dashboard : SQL Editor → Coller et Run (pas de popup ✅)
- Local psql : `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/tests/compute_shares.integration.sql`

---

### 🤖 Tests automatisés (CI/CD)

#### `compute_shares.pgtap.sql`
**Tests pg_tap pour intégration continue**

Version automatisée des tests pour GitHub Actions (utilise pg_tap).

**Utilise les mêmes données** que `compute_shares.integration.sql` mais avec syntaxe pg_tap.

## 🚀 Exécution des tests

### 🎯 Tests manuels (Dashboard - recommandé)

**1️⃣ Setup unique (une seule fois) :**
1. Ouvrir Supabase Dashboard → SQL Editor
2. Copier-coller `setup_test_database.sql`
3. Run ✅

**2️⃣ Lancer les tests (à chaque fois) :**
1. Ouvrir Supabase Dashboard → SQL Editor
2. Copier-coller `compute_shares.integration.sql`
3. Run ✅ (pas de popup, pas de risque)

✅ **Avantages** : Tests isolés dans schéma `test`, zéro risque pour la production

---

### 🖥️ Tests manuels (local psql - avec logs détaillés)

**Recommandé si vous voulez voir les `RAISE NOTICE` avec ✅**

```bash
# Démarrer Supabase local
pnpm supabase:start

# Setup (une fois)
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/tests/setup_test_database.sql

# Lancer les tests avec logs colorés
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/tests/compute_shares.integration.sql
```

Vous verrez :
```
✅ TEST 1/13: Person 1 expenses = 170.99€
✅ TEST 2/13: Person 2 expenses = 140.00€
...
✅ ALL 13 TESTS PASSED!
📊 Results Summary:
  Person 1: 53.24% = 873.19€ (rest: 2155.82€)
  Person 2: 46.76% = 766.81€ (rest: 1893.19€)
```

---

### 🤖 Tests automatisés (CI/CD)

**GitHub Actions lance automatiquement `compute_shares.pgtap.sql` sur chaque push/PR**

```bash
# Pour tester en local comme la CI/CD
pnpm test:db
```


## 📊 Interpréter les résultats

### Sortie de succès

```
ok 1 - Person 1 personal expenses should total 170.99€
ok 2 - Person 2 personal expenses should total 140€
ok 3 - Person 1 capacity should be 3029.01€
...
ok 13 - Person 2 should have 1893.19€ rest à vivre
1..13
```

✅ **Tous les tests passent** : `ok` devant chaque test

### Sortie d'échec

```
not ok 5 - Total household expenses should be 1640€
# Failed test 5: "Total household expenses should be 1640€"
#         have: 1650.00
#         want: 1640.00
```

❌ **Test échoué** : `not ok` avec détails de l'erreur

## 🏗️ Structure d'un test pg_tap

```sql
BEGIN;

-- 1️⃣ Charger l'extension pg_tap
CREATE EXTENSION IF NOT EXISTS pgtap;

-- 2️⃣ Déclarer le nombre de tests
SELECT plan(13);

-- 3️⃣ Préparer les données (Arrange)
INSERT INTO profiles ...

-- 4️⃣ Exécuter les tests (Act + Assert)
SELECT is(
  (SELECT SUM(amount) FROM expenses),
  1640.00::NUMERIC,
  'Total expenses should be 1640€'
);

-- 5️⃣ Nettoyer
DELETE FROM profiles WHERE ...

-- 6️⃣ Terminer
SELECT * FROM finish();

ROLLBACK;
```

## 🔧 Commandes utiles

```bash
# Lancer tous les tests DB
pnpm test:db

# Démarrer/arrêter Supabase local
pnpm supabase:start
pnpm supabase:stop

# Vérifier le statut de Supabase
pnpm supabase:status

# Réinitialiser la DB (⚠️ efface les données)
pnpm supabase:reset
```

## 📝 Écrire de nouveaux tests

### Template de base

```sql
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(3); -- Nombre de tests

-- Test 1
SELECT is(
  (SELECT COUNT(*) FROM users),
  0::BIGINT,
  'Users table should be empty initially'
);

-- Test 2
INSERT INTO users (name) VALUES ('Alice');
SELECT is(
  (SELECT COUNT(*) FROM users),
  1::BIGINT,
  'Should have 1 user after insert'
);

-- Test 3
SELECT is(
  (SELECT name FROM users LIMIT 1),
  'Alice'::TEXT,
  'User name should be Alice'
);

-- Cleanup
DELETE FROM users;

SELECT * FROM finish();

ROLLBACK;
```

### Fonctions pg_tap utiles

- `is(actual, expected, description)` - Test d'égalité
- `isnt(actual, expected, description)` - Test d'inégalité
- `ok(boolean, description)` - Test vrai/faux
- `cmp_ok(val1, operator, val2, description)` - Comparaison personnalisée
- `throws_ok(sql, expected_error, description)` - Test d'erreur

## 🔗 Ressources

- [pg_tap Documentation](https://pgtap.org/)
- [Supabase Testing Guide](https://supabase.com/docs/guides/database/testing)
- [PostgreSQL Testing Best Practices](https://wiki.postgresql.org/wiki/Testing)

## ⚠️ Bonnes pratiques

1. **Isolation** : Tests dans schéma `test` dédié (zéro risque production)
2. **Cleanup** : Les tests nettoient automatiquement après exécution
3. **UUIDs de test** : UUIDs prévisibles (`11111111-1111...`) pour débogage facile
4. **Données réalistes** : Utiliser des données proches de cas réels (spreadsheet de prod)
5. **Assertions claires** : Messages de tests explicites en français
6. **Indépendance** : Chaque test peut s'exécuter seul sans dépendance

## 🚦 CI/CD

Les tests SQL (`compute_shares.pgtap.sql`) sont exécutés automatiquement dans GitHub Actions :

- ✅ Sur chaque push vers `main` ou `develop`
- ✅ Sur chaque Pull Request
- ✅ Bloque le merge si les tests échouent

**Workflow complet :**
1. Unit Tests (Vitest)
2. **Database Tests (pg_tap)** ← Tests SQL
3. Integration Tests (Supabase)
4. Lint & Type Check
5. Build Check

Voir [`.github/workflows/test.yml`](../../.github/workflows/test.yml) pour la configuration.

---

## 📂 Structure des fichiers

```
supabase/tests/
├── setup_test_database.sql          # Setup du schéma test (1 fois)
├── compute_shares.integration.sql   # Test d'intégration manuel
├── compute_shares.pgtap.sql         # Test automatisé CI/CD
└── README.md                        # Cette doc
```
