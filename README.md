# Menu Media API

Photos menu café / restaurant → Cloudinary (+ génération Flux.2 Klein).

## App menu (CRUD)

```http
GET    /library?section=restaurant|cafe
POST   /library/:section
PATCH  /library/:section/:id
DELETE /library/:section/:id
```

Champs : `id`, `title`, `description`, `image`

## Génération Flux.2 Klein

1. Clé [build.nvidia.com](https://build.nvidia.com) → `NVIDIA_API_KEY=nvapi-...` dans `.env`
2. Générer :

```bash
npm run flux:cafe
npm run flux:restaurant
npm run flux:moroccan
npm run flux:generate -- --section=cafe --limit=10
```

```http
GET  /flux/catalog
POST /flux/prompt          { "prompt", "title", "section" }
POST /flux/generate/:id
POST /flux/generate-batch  { "section", "limit" }
```

## Catalogue produits (par catégorie)

```
src/data/catalog/
  helpers.js
  cafe/          coffee, tea, juices, iceCream, …
  restaurant/    burgers, pizza, pasta, … + moroccan/
  index.js
```

`fluxCatalog.js` réexporte tout (API / scripts inchangés).


http://localhost:3000 — Mes photos + Créer avec l’IA

## Déploiement Vercel

Variables : `CLOUDINARY_*`, `NVIDIA_API_KEY`
