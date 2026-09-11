# Media Scanosh

Photos produit café & restaurant → Cloudinary · génération IA (Flux.2 Klein).

**Prod :** [https://cafe-restau-images.vercel.app](https://cafe-restau-images.vercel.app/)

---

## Stack

| Couche | Techno |
|--------|--------|
| API / UI | Express · `public/` |
| Images | Cloudinary (`media/cafe`, `media/restaurant`) |
| IA | Flux.2 Klein 4B · NVIDIA |
| Deploy | Vercel |

---

## Démarrage local

```bash
npm install
# renseigne .env
npm run dev            # http://localhost:3000
```

### Variables d’environnement

```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NVIDIA_API_KEY=nvapi-…
```

---

## UI

| Onglet | Rôle |
|--------|------|
| **Mes photos** | Bibliothèque · filtre · tri · CRUD |
| **Créer avec l’IA** | Prompt structuré → image → Cloudinary |

---

## API menu (Scanosh / clients)

Champs : `id` · `title` · `description` · `image`

```http
GET    /library
GET    /library?section=cafe|restaurant
POST   /library/:section          # multipart: image, title, description
PATCH  /library/:section/:id
DELETE /library/:section/:id
```

```http
GET  /api                         # index des routes
```

---

## Flux IA

```http
GET  /flux/catalog
POST /flux/prompt                 # { prompt, title, section, description? }
POST /flux/generate/:id
POST /flux/generate-batch         # { section?, limit?, ids? }
```

```bash
npm run flux:cafe
npm run flux:restaurant
npm run flux:moroccan
npm run flux:generate -- --section=cafe --limit=10
```

Clé NVIDIA : [build.nvidia.com](https://build.nvidia.com)

---

## Catalogue produits

~331 items · 1 fichier par catégorie

```
src/data/catalog/
  helpers.js
  cafe/           coffee · tea · juices · iceCream · …
  restaurant/     burgers · pizza · pasta · … · moroccan/
  index.js
```

`src/data/fluxCatalog.js` réexporte l’API catalogue.

---

## Scripts npm

| Script | Description |
|--------|-------------|
| `npm run dev` | Serveur local (nodemon) |
| `npm start` | Production locale |
| `npm run flux:cafe` | Batch photos café |
| `npm run flux:restaurant` | Batch photos restaurant |
| `npm run flux:moroccan` | Batch catalogue marocain |
| `npm run flux:generate` | Batch générique (`--section` · `--limit` · `--ids`) |

---

## Déploiement

1. Projet lié à Vercel  
2. Env prod : `CLOUDINARY_*` + `NVIDIA_API_KEY`  
3. Push → deploy  

**URL :** https://cafe-restau-images.vercel.app/
