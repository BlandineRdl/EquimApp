# Guide de Démarrage Rapide - Tests d'Intégration

Ce guide vous permet de lancer les tests d'intégration en **5 minutes**.

## 🚀 Option 1: Supabase Local (Recommandé)

### Étape 1: Installer Supabase CLI

**macOS (Homebrew):**
```bash
brew install supabase/tap/supabase
```

**Windows/Linux (npm):**
```bash
npm install -g supabase
```

**Vérifier l'installation:**
```bash
supabase --version
# Devrait afficher: supabase 1.x.x
```

### Étape 2: Initialiser Supabase

```bash
# À la racine du projet
supabase init
```

Cela crée un dossier `supabase/` avec la configuration.

### Étape 3: Démarrer Supabase

```bash
# Démarre tous les services Supabase en local
pnpm supabase:start
```

**Première fois:** Ça peut prendre 2-3 minutes (télécharge les images Docker).

**Résultat:** Vous verrez les credentials affichés :
```
API URL: http://localhost:54321
anon key: eyJhbGc...
service_role key: eyJhbG...
```

### Étape 4: Lancer les Tests

```bash
# Lancer les tests d'intégration
pnpm test:integration:local
```

**✅ C'est tout !** Les tests vont :
1. Se connecter à Supabase local
2. Créer un utilisateur de test
3. Exécuter tous les tests d'intégration
4. Nettoyer les données après chaque test

### Commandes Utiles

```bash
# Voir le statut de Supabase
pnpm supabase:status

# Arrêter Supabase
pnpm supabase:stop

# Reset la base de données
pnpm supabase:reset

# Redémarrer Supabase
pnpm supabase:stop && pnpm supabase:start
```

---

## 🌍 Option 2: Supabase Cloud (Alternative)

Si vous préférez utiliser un projet Supabase cloud pour les tests :

### Étape 1: Créer un Projet de Test

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Créez un nouveau projet appelé **"equimapp-test"**
3. Attendez que le projet soit prêt (~2 minutes)

### Étape 2: Copier les Credentials

1. Dans le projet, allez dans **Settings > API**
2. Copiez :
   - **Project URL**
   - **anon public** key

### Étape 3: Configurer .env.test

```bash
# Copier le template
cp .env.test.example .env.test

# Éditer .env.test avec vos credentials
```

**Contenu de .env.test:**
```env
SUPABASE_TEST_URL=https://votre-projet.supabase.co
SUPABASE_TEST_ANON_KEY=eyJhbGc...
SUPABASE_TEST_USER_EMAIL=test@example.com
SUPABASE_TEST_USER_PASSWORD=test-password-123
SKIP_INTEGRATION_TESTS=false
```

### Étape 4: Créer un Utilisateur de Test

1. Dans Supabase Dashboard > **Authentication > Users**
2. Cliquez **Add user** > **Create new user**
3. Email: `test@example.com`
4. Password: `test-password-123`
5. Confirmez l'email automatiquement

### Étape 5: Lancer les Tests

```bash
pnpm test:integration
```

---

## 🔍 Vérifier que Tout Fonctionne

### Test Rapide

```bash
# Démarrer Supabase local
pnpm supabase:start

# Lancer UN test d'intégration
pnpm test:integration:local src/features/group/infra/SupabaseGroupGateway.integration.spec.ts

# Si ça passe ✅ tout fonctionne !
```

### Logs de Débogage

Si un test échoue, ajoutez des logs :

```typescript
// Dans votre test
console.log("Client URL:", client.supabaseUrl);
console.log("Current user:", await helper.getCurrentUser());
```

### Vérifier la DB

**Option 1: Supabase Studio (Interface Web)**
```bash
# Ouvrir Supabase Studio dans le navigateur
open http://localhost:54323
```

**Option 2: SQL Direct**
```bash
# Ouvrir psql
supabase db reset

# Lister les tables
supabase db diff
```

---

## 🎯 Workflow de Développement

### Développement Normal
```bash
# Démarrer Supabase une fois
pnpm supabase:start

# Lancer les tests en watch mode
pnpm test:watch

# Supabase reste actif en arrière-plan
```

### Avant de Commit
```bash
# Tests unitaires (rapides)
pnpm test:unit

# Tests d'intégration (plus lents)
pnpm test:integration:local

# Tout ensemble
pnpm test:run
```

### Cleanup
```bash
# Arrêter Supabase quand vous avez fini
pnpm supabase:stop
```

---

## ❓ Troubleshooting

### Erreur: "Supabase local is not running"

**Solution:**
```bash
pnpm supabase:start
```

### Erreur: "Port 54321 already in use"

**Solution 1:** Arrêter le service qui utilise le port
```bash
lsof -ti:54321 | xargs kill
pnpm supabase:start
```

**Solution 2:** Changer le port dans `supabase/config.toml`
```toml
[api]
port = 54322
```

### Erreur: "Docker not found"

**Solution:** Installer Docker Desktop
- macOS: [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
- Windows: [https://docs.docker.com/desktop/windows/install/](https://docs.docker.com/desktop/windows/install/)

### Tests Échouent: "User not found"

**Solution:** Reset la DB et recréer l'utilisateur
```bash
pnpm supabase:reset
pnpm test:integration:local
```

### Migrations ne S'Appliquent Pas

**Solution:**
```bash
# Copier vos migrations dans supabase/
cp -r migrations/ supabase/migrations/

# Reset et réappliquer
pnpm supabase:reset
```

---

## 📊 Comprendre les Résultats

### Test Réussi ✅
```
✓ should create group in Supabase (125ms)
```

### Test Échoué ❌
```
× should create group in Supabase (125ms)
  → Expected groupId
```

### Tests Skippés ⊘
```
⊘ Integration Tests (SKIP_INTEGRATION_TESTS=true)
```

---

## 🎓 Exemples de Tests

### Test Simple
```typescript
it("should create a group", async () => {
  const { client, helper } = await setupLocalSupabaseTest();

  const { data, error } = await client
    .from("groups")
    .insert({ name: "Test Group" })
    .select()
    .single();

  expect(error).toBeNull();
  expect(data.name).toBe("Test Group");

  helper.trackGroup(data.id);
  await cleanupLocalSupabaseTest(helper);
});
```

### Test Complet avec Setup
```typescript
describe("Group Creation", () => {
  let client, helper;

  beforeAll(async () => {
    const setup = await setupLocalSupabaseTest();
    client = setup.client;
    helper = setup.helper;
  });

  afterAll(async () => {
    await cleanupLocalSupabaseTest(helper);
  });

  it("should create group with members", async () => {
    // Test ici
  });
});
```

---

## 🚀 Prochaines Étapes

1. ✅ **Démarrer Supabase:** `pnpm supabase:start`
2. ✅ **Lancer les tests:** `pnpm test:integration:local`
3. ✅ **Vérifier les résultats:** Tous verts ? 🎉
4. 📖 **Lire la doc complète:** [INTEGRATION_TESTING_STRATEGY.md](./INTEGRATION_TESTING_STRATEGY.md)
5. ✍️ **Écrire vos propres tests:** Voir exemples dans `src/features/**/infra/*.integration.spec.ts`

---

## 📚 Resources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Testing Strategy (complet)](./INTEGRATION_TESTING_STRATEGY.md)
- [Testing Guide](./TESTING.md)

Besoin d'aide ? Ouvrez une issue ! 🙋‍♂️
