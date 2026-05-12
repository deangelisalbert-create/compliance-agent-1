# Compliance-Data-2026 — Agent IA e-Invoicing (Production)

## 🔒 Sécurité intégrée

| Protection | Détail |
|---|---|
| Clé API cachée | Jamais exposée côté client — uniquement sur le serveur Vercel |
| Anonymisation | Noms de fournisseurs remplacés dans le navigateur avant tout envoi |
| Rate limiting | 20 requêtes / 10 min par IP — protège contre les abus |
| Headers HTTP | CSP, HSTS, X-Frame-Options, etc. |
| CORS strict | Seul votre domaine peut appeler l'API |
| Validation | Taille et format des messages vérifiés côté serveur |
| RGPD | Consentement explicite avec case à cocher + base légale art. 6.1.a |
| Logs d'audit | IP masquées, aucune donnée fournisseur enregistrée |
| noindex | Google n'indexe pas l'outil |

---

## 🚀 Déploiement Vercel (15 minutes)

### Étape 1 — GitHub

```bash
# Dans le dossier du projet
git init
git add .
git commit -m "Initial commit — Compliance-Data-2026"
```

1. Allez sur [github.com](https://github.com) → **New repository**
2. Nommez-le `compliance-data-2026` (privé recommandé)
3. Suivez les instructions pour pusher votre code

### Étape 2 — Vercel

1. Allez sur [vercel.com](https://vercel.com) → connectez avec GitHub
2. **Add New Project** → sélectionnez `compliance-data-2026`
3. Framework : **Next.js** (détecté automatiquement)
4. Cliquez **Deploy**

### Étape 3 — Variables d'environnement (OBLIGATOIRE)

Dans Vercel → votre projet → **Settings** → **Environment Variables** :

| Nom | Valeur |
|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-votre-cle...` |
| `NEXT_PUBLIC_APP_URL` | `https://votre-projet.vercel.app` |

Puis : **Deployments** → **Redeploy**

✅ Votre agent est en ligne !

---

## 💻 Développement local

```bash
# Installer les dépendances
npm install

# Copier le fichier de configuration
cp .env.example .env.local
# → Éditez .env.local avec vos vraies valeurs

# Lancer en dev
npm run dev
# → Ouvrez http://localhost:3000
```

---

## 📁 Structure du projet

```
compliance-data-2026/
├── pages/
│   ├── index.js          ← Interface utilisateur complète
│   └── api/
│       └── chat.js       ← Proxy sécurisé (clé API côté serveur)
├── lib/
│   ├── rateLimiter.js    ← Limite les abus (20 req/10min par IP)
│   └── validate.js       ← Validation des entrées
├── next.config.js        ← Headers de sécurité HTTP
├── .env.example          ← Template des variables (à copier en .env.local)
├── .gitignore            ← Protège les secrets
└── package.json
```

---

## 💰 Coûts

| Service | Coût |
|---|---|
| Vercel (hébergement) | **Gratuit** (hobby plan) |
| Anthropic API | ~0,003 € par audit de 200 lignes |
| Domaine custom (optionnel) | ~10 €/an sur Namecheap ou OVH |

---

## 🔑 Obtenir votre clé API Anthropic

1. Créez un compte sur [console.anthropic.com](https://console.anthropic.com)
2. **API Keys** → **Create Key**
3. Copiez la clé (elle commence par `sk-ant-api03-...`)
4. Collez-la dans Vercel → Environment Variables

---

## ❓ Problèmes fréquents

**"Configuration serveur manquante"**
→ La variable `ANTHROPIC_API_KEY` n'est pas définie dans Vercel. Vérifiez Settings → Environment Variables et faites un Redeploy.

**"Trop de requêtes"**
→ Rate limit atteint (20 req/10 min). Attendez quelques minutes.

**Le fichier n'est pas reconnu**
→ Vérifiez que votre Excel est bien en format `.xlsx` ou `.xls`, ou exportez en `.csv`.
