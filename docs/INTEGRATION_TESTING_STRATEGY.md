# Stratégie de Tests d'Intégration Supabase

## Options Disponibles

### Option 1: Projet Supabase de Test (Recommandé pour MVP)
**Avantages:**
- Simple à mettre en place
- Pas de configuration Docker complexe
- Utilise la vraie infrastructure Supabase
- Gratuit avec le plan Supabase gratuit

**Inconvénients:**
- Nécessite une connexion internet
- Coûts potentiels si usage intensif
- Données persistantes (besoin de cleanup)

**Setup:**
```bash
# 1. Créer un projet Supabase dédié aux tests
# https://app.supabase.com

# 2. Copier les credentials dans .env.test
cp .env.test.example .env.test

# 3. Créer un utilisateur de test
# Dans Supabase Dashboard > Authentication > Add user
```

**Configuration `.env.test`:**
```env
SUPABASE_TEST_URL=https://xxxxx.supabase.co
SUPABASE_TEST_ANON_KEY=eyJhbGc...
SUPABASE_TEST_USER_EMAIL=test@example.com
SUPABASE_TEST_USER_PASSWORD=test-password-123
SKIP_INTEGRATION_TESTS=false
```

---

### Option 2: Supabase Local avec Docker (Recommandé pour CI/CD)
**Avantages:**
- Environnement isolé et reproductible
- Pas de coûts
- Rapide (local)
- Reset facile entre les tests

**Inconvénients:**
- Configuration Docker nécessaire
- Plus complexe à mettre en place
- Nécessite Docker Desktop

**Setup:**
```bash
# 1. Installer Supabase CLI
npm install -g supabase

# 2. Initialiser Supabase localement
supabase init

# 3. Démarrer Supabase en local
supabase start

# 4. Les credentials sont affichés dans le terminal
# API URL: http://localhost:54321
# anon key: eyJhbG...
# service_role key: eyJhbG...
```

**Configuration automatique:**
```typescript
// src/test/integration/setup-supabase-local.ts
export const setupLocalSupabase = async () => {
  const client = createClient(
    'http://localhost:54321',
    process.env.SUPABASE_LOCAL_ANON_KEY || 'eyJhbG...'
  );

  // Reset DB avant chaque test
  await resetDatabase();

  return { client };
};
```

---

### Option 3: Testcontainers (Avancé)
**Avantages:**
- Contrôle total sur l'environnement
- Isolation parfaite
- Démarrage/arrêt automatique

**Inconvénients:**
- Très complexe pour Supabase (nécessite PostgreSQL + PostgREST + GoTrue + Realtime)
- Lent à démarrer
- Configuration difficile

**Note:** ❌ **Non recommandé pour Supabase** - Trop complexe car Supabase = PostgreSQL + plusieurs services (PostgREST, GoTrue, Realtime, Storage)

---

### Option 4: Mocks Complets (Alternative)
**Avantages:**
- Pas besoin de DB réelle
- Très rapide
- Pas de dépendances externes

**Inconvénients:**
- Ne teste pas la vraie intégration
- Peut manquer des bugs liés à la DB
- Maintenance des mocks

**Usage:**
```typescript
// Tests unitaires uniquement avec InMemoryGateway
// Déjà implémenté !
```

---

## 🎯 Recommandation pour EquimApp

### Pour le Développement Local
**Option 2: Supabase Local avec Docker**

### Pour la CI/CD
**Option 2: Supabase Local avec Docker** (idéal pour GitHub Actions)

### Configuration Hybride (Meilleur des deux mondes)

```typescript
// src/test/integration/setup-supabase.ts
export const setupSupabaseTest = async () => {
  // Utilise local si disponible, sinon cloud
  const isLocal = process.env.SUPABASE_USE_LOCAL === 'true';

  const config = isLocal
    ? getLocalConfig()
    : getCloudConfig();

  const client = createClient(config.url, config.anonKey);
  const helper = new SupabaseTestHelper(client);

  return { client, helper };
};
```

---

## 🚀 Setup Recommandé (Supabase Local)

### 1. Installation

```bash
# Installer Supabase CLI
brew install supabase/tap/supabase  # macOS
# ou
npm install -g supabase             # npm

# Vérifier l'installation
supabase --version
```

### 2. Initialisation du Projet

```bash
# À la racine du projet
supabase init

# Lier au projet Supabase cloud (optionnel)
supabase link --project-ref your-project-ref
```

### 3. Configuration des Migrations

```bash
# Copier vos migrations existantes
cp -r supabase/migrations ./supabase/migrations/

# Démarrer Supabase local
supabase start
```

### 4. Configuration des Tests

```typescript
// vitest.config.integration.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/test/integration/setup-local.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
```

### 5. Scripts NPM

```json
{
  "scripts": {
    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop",
    "supabase:reset": "supabase db reset",
    "test:integration:local": "supabase start && vitest run --config vitest.config.integration.ts",
    "test:integration:cloud": "SKIP_INTEGRATION_TESTS=false vitest run --grep integration"
  }
}
```

### 6. Helper pour Reset DB

```typescript
// src/test/integration/reset-database.ts
export const resetDatabase = async (client: SupabaseClient) => {
  // Supprimer toutes les données de test
  await client.from('group_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await client.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await client.from('groups').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await client.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Réinitialiser les séquences
  await client.rpc('reset_sequences');
};
```

---

## 🔄 Workflow de Développement

### Local (développement rapide)
```bash
# Démarrer Supabase local
supabase start

# Lancer les tests d'intégration
pnpm test:integration:local

# Arrêter Supabase
supabase stop
```

### CI/CD (GitHub Actions)
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Start Supabase
        run: supabase start

      - name: Install dependencies
        run: pnpm install

      - name: Run unit tests
        run: pnpm test:unit

      - name: Run integration tests
        run: pnpm test:integration:local
        env:
          SUPABASE_USE_LOCAL: true

      - name: Stop Supabase
        run: supabase stop
```

---

## 📝 Bonnes Pratiques

### 1. Isolation des Tests
```typescript
describe("Integration Test", () => {
  beforeEach(async () => {
    // Reset DB avant chaque test
    await resetDatabase(client);
  });

  afterEach(async () => {
    // Cleanup si nécessaire
    await helper.cleanup();
  });
});
```

### 2. Gestion des Credentials
```typescript
// Ne JAMAIS commit de vrais credentials
// Utiliser des variables d'environnement

// .gitignore
.env.test
.env.local
```

### 3. Tests Conditionnels
```typescript
// Skip si Supabase n'est pas disponible
describe.skipIf(!isSupabaseAvailable())(
  "Integration Tests",
  () => {
    // tests...
  }
);
```

### 4. Timeouts Appropriés
```typescript
// Les tests d'intégration sont plus lents
it("should create group", async () => {
  // ...
}, 10000); // 10 secondes timeout
```

---

## 🎯 Résumé des Commandes

```bash
# Setup initial
supabase init
supabase start

# Développement
supabase db reset              # Reset DB
supabase db push               # Push migrations
supabase migration new <name>  # Créer migration

# Tests
pnpm test:integration:local    # Tests avec Supabase local
pnpm test:integration:cloud    # Tests avec Supabase cloud
pnpm test:unit                 # Tests unitaires uniquement

# Cleanup
supabase stop
```

---

## 📚 Ressources

- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
- [Testing with Supabase](https://supabase.com/docs/guides/getting-started/tutorials/with-testing)
- [GitHub Actions + Supabase](https://github.com/supabase/setup-cli)

---

## 🔧 Troubleshooting

### Supabase ne démarre pas
```bash
# Vérifier Docker
docker ps

# Nettoyer et redémarrer
supabase stop --no-backup
supabase start
```

### Port déjà utilisé
```bash
# Changer les ports dans config.toml
[api]
port = 54322  # au lieu de 54321
```

### Migrations ne s'appliquent pas
```bash
# Reset complet
supabase db reset --linked

# Vérifier les migrations
supabase migration list
```
