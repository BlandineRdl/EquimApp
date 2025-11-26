# EquimApp

Application mobile React Native permettant la gestion de groupes et l'invitation de membres.

## 🚀 Stack Technique

- **Framework**: [Expo](https://expo.dev/) (~54.0.12) avec React Native 0.81.4
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- **État Global**: Redux Toolkit avec React Redux
- **Backend**: [Supabase](https://supabase.com/) (authentification, base de données)
- **Styling**: React Native StyleSheet
- **Icônes**: Lucide React Native
- **TypeScript**: Support complet avec typed routes
- **Tests**: Vitest avec support des tests unitaires et d'intégration
- **Linting**: Biome

## 📁 Architecture

```
src/
├── components/        # Composants réutilisables
├── config/           # Configuration de l'application
├── features/         # Features organisées par domaine
│   ├── auth/        # Authentification
│   ├── group/       # Gestion des groupes
│   ├── notification/# Notifications
│   ├── onboarding/  # Onboarding utilisateur
│   └── user/        # Gestion utilisateur
├── lib/             # Bibliothèques et clients (Supabase, etc.)
├── navigation/      # Configuration de navigation
├── store/           # Redux store et configuration
├── test/            # Utilitaires de test
├── theme/           # Thème et styles
└── types/           # Types TypeScript partagés
```

## 🛠️ Installation

### Prérequis

- Node.js (version recommandée: 18+)
- pnpm (ou npm)
- Expo CLI
- iOS: Xcode et CocoaPods
- Android: Android Studio et SDK

### Installation des dépendances

```bash
pnpm install
```

Pour iOS, installer également les pods:
```bash
cd ios && pod install && cd ..
```

## 🔧 Configuration

### Variables d'environnement

Créer un fichier `.env.local` à la racine du projet:

```bash
# Supabase Configuration
SUPABASE_URL=votre_url_supabase
SUPABASE_ANON_KEY=votre_cle_anon

# Pour les tests locaux (optionnel)
SUPABASE_USE_LOCAL=true
SUPABASE_LOCAL_URL=http://localhost:54321
SUPABASE_LOCAL_ANON_KEY=votre_cle_locale
```

Voir [.env.local.example](.env.local.example) pour plus de détails.

## 🚀 Développement

### Démarrer l'application

```bash
# Démarrer le serveur de développement
pnpm start

# Démarrer sur iOS
pnpm ios

# Démarrer sur Android
pnpm android

# Démarrer sur Web
pnpm web
```

### Scripts disponibles

#### Développement
- `pnpm start` - Démarrer Expo
- `pnpm ios` - Lancer sur iOS
- `pnpm android` - Lancer sur Android

#### Qualité de code
- `pnpm lint` - Vérifier le code avec Biome
- `pnpm lint:fix` - Corriger automatiquement les erreurs
- `pnpm format` - Formater le code
- `pnpm typecheck` - Vérifier les types TypeScript

#### Tests
- `pnpm test` - Lancer les tests en mode watch
- `pnpm test:run` - Lancer tous les tests
- `pnpm test:unit` - Tests unitaires uniquement
- `pnpm test:integration` - Tests d'intégration
- `pnpm test:integration:local` - Tests avec Supabase local
- `pnpm test:ui` - Interface UI pour les tests
- `pnpm test:coverage` - Rapport de couverture

#### Supabase
- `pnpm supabase:start` - Démarrer Supabase local
- `pnpm supabase:stop` - Arrêter Supabase local
- `pnpm supabase:status` - Statut de Supabase
- `pnpm supabase:reset` - Réinitialiser la base de données

#### Build
- `pnpm build:preview:android` - Build preview Android (EAS)
- `pnpm build:preview:ios` - Build preview iOS (EAS)
- `pnpm build:production` - Build production (iOS + Android)

#### Nettoyage
- `pnpm clean` - Nettoyer les caches
- `pnpm clean:ios` - Nettoyer le cache iOS
- `pnpm clean:android` - Nettoyer le cache Android
- `pnpm clean:expo` - Nettoyer le cache Expo
- `pnpm clean:all` - Tout nettoyer (+ Watchman)
- `pnpm nuke` - Réinstallation complète du projet

## 🧪 Tests

Le projet utilise Vitest pour les tests avec deux types de tests:

### Tests unitaires

```bash
pnpm test:unit
```

Tests des fonctions, hooks et composants de manière isolée.

### Tests d'intégration

```bash
# Avec Supabase local (recommandé)
pnpm supabase:start
pnpm test:integration:local

# Avec Supabase distant
pnpm test:integration
```

Tests end-to-end incluant les appels à Supabase.

## 📱 Features

- ✅ **Authentification** - Connexion/Inscription via Supabase
- ✅ **Onboarding** - Parcours d'accueil utilisateur
- ✅ **Groupes** - Création et gestion de groupes
- ✅ **Invitations** - Système d'invitation par token
- ✅ **Notifications** - Gestion des notifications
- ✅ **Profil utilisateur** - Gestion du profil

## 🎨 Conventions de code

### Principes
- **Simplicité**: Éviter la complexité inutile
- **Pragmatisme**: Se concentrer sur les besoins réels
- **Pas de sur-ingénierie**: Solutions simples et efficaces
- **Gestion d'erreurs**: Pas d'erreurs silencieuses, exceptions explicites

### Organisation
- Architecture par features (domain-driven)
- Composants réutilisables dans `/components`
- Types TypeScript partagés dans `/types`
- Configuration centralisée dans `/config`

## 📦 Déploiement

Le projet utilise EAS (Expo Application Services) pour les builds:

```bash
# Preview
pnpm build:preview:android
pnpm build:preview:ios

# Production
pnpm build:production
```

## 🔗 URLs et Schemes

- **Scheme**: `equim://`
- **Package Android**: `com.blackksun.equimapp`
- **Bundle iOS**: `com.blackksun.equimapp`

## 🤝 Contribution

1. Respecter les conventions de code du projet
2. Écrire des tests pour les nouvelles fonctionnalités
3. Vérifier que tous les tests passent: `pnpm test:run`
4. Vérifier le lint: `pnpm lint`
5. Vérifier les types: `pnpm typecheck`

## 📄 License

Privé - Tous droits réservés

## 🐛 Dépannage

### Problèmes courants

#### "Module not found" ou erreurs de cache
```bash
pnpm clean:all
pnpm install
```

#### Problèmes iOS spécifiques
```bash
pnpm reinstall:ios
pnpm rebuild:ios
```

#### Problèmes Android spécifiques
```bash
pnpm rebuild:android
```

#### Tout réinstaller (solution nucléaire)
```bash
pnpm nuke
```

## 📚 Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Native StyleSheet](https://reactnative.dev/docs/stylesheet)
- [Redux Toolkit](https://redux-toolkit.js.org/)
