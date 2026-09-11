const gridEl = document.getElementById("grid");
const countEl = document.getElementById("count");
const statusEl = document.getElementById("status");
const searchEl = document.getElementById("search");
const sortEl = document.getElementById("sort");
const libraryToolbar = document.getElementById("library-toolbar");
const pills = [...document.querySelectorAll(".pill")];
const viewTabs = [...document.querySelectorAll(".view-tab")];
const studio = document.getElementById("studio");
const promptForm = document.getElementById("prompt-form");
const promptSubject = document.getElementById("prompt-subject");
const promptVessel = document.getElementById("prompt-vessel");
const promptDetails = document.getElementById("prompt-details");
const promptMood = document.getElementById("prompt-mood");
const promptText = document.getElementById("prompt-text");
const promptComposed = document.getElementById("prompt-composed");
const promptCopy = document.getElementById("prompt-copy");
const promptSection = document.getElementById("prompt-section");
const promptTitle = document.getElementById("prompt-title");
const promptDescription = document.getElementById("prompt-description");
const promptSubmit = document.getElementById("prompt-submit");
const promptSubmitLabel = promptSubmit?.querySelector(".btn-label");
const studioResult = document.getElementById("studio-result");
const studioPreview = document.getElementById("studio-preview");
const studioPlaceholder = document.getElementById("studio-placeholder");
const studioLoading = document.getElementById("studio-loading");
const studioResultKicker = document.getElementById("studio-result-kicker");
const studioResultTitle = document.getElementById("studio-result-title");
const studioResultDesc = document.getElementById("studio-result-desc");
const studioToLibrary = document.getElementById("studio-to-library");
const openCreateBtn = document.getElementById("open-create");
const openGenerateBtn = document.getElementById("open-generate");
const sheet = document.getElementById("sheet");
const sheetTitle = document.getElementById("sheet-title");
const sheetClose = document.getElementById("sheet-close");
const sheetKicker = document.getElementById("sheet-kicker");
const form = document.getElementById("product-form");
const formId = document.getElementById("form-id");
const formSection = document.getElementById("form-section");
const formTitle = document.getElementById("form-title");
const formDescription = document.getElementById("form-description");
const formDelete = document.getElementById("form-delete");
const formCancel = document.getElementById("form-cancel");
const formSubmit = document.getElementById("form-submit");
const imageInput = document.getElementById("image-input");
const dropzone = document.getElementById("dropzone");
const dropzoneTitle = document.getElementById("dropzone-title");
const preview = document.getElementById("preview");

const LABELS = { cafe: "Café", restaurant: "Restaurant" };

const MENU_STYLE =
  "professional food photography, square 1:1 composition, soft natural lighting, shallow depth of field, clean background, appetizing, high detail, menu catalog style, no text, no watermark, no logo";

const EXAMPLES = {
  cappuccino: {
    subject: "cappuccino with latte art heart",
    vessel: "white ceramic cup",
    details: "silky microfoam",
    mood: "soft natural light, clean white background",
    section: "cafe",
    title: "Cappuccino",
    description: "Mousse de lait onctueuse.",
  },
  burger: {
    subject: "gourmet cheeseburger with melted cheddar",
    vessel: "toasted brioche bun on a ceramic plate",
    details: "lettuce, tomato, pickle",
    mood: "soft natural light, clean background",
    section: "restaurant",
    title: "Burger classique",
    description: "Pain brioche, steak, cheddar.",
  },
  tajine: {
    subject: "moroccan chicken tagine with preserved lemon and green olives",
    vessel: "traditional earthenware tajine pot",
    details: "tender chicken, giant green olives, preserved lemon",
    mood: "soft natural light, clean beige background",
    section: "restaurant",
    title: "Tajine poulet citron olives",
    description: "Poulet fermier, olives vertes, citron confit.",
  },
  couscous: {
    subject: "couscous royal with lamb chicken merguez and vegetables",
    vessel: "large traditional serving dish",
    details: "fluffy semolina, carrots, turnips, zucchini",
    mood: "soft natural light, clean background",
    section: "restaurant",
    title: "Couscous royal marocain",
    description: "Semoule, trois viandes et légumes.",
  },
  glace: {
    subject: "vanilla ice cream scoop with visible vanilla bean seeds",
    vessel: "clear glass cup",
    details: "creamy texture, soft peak scoop",
    mood: "soft natural light, clean white background",
    section: "cafe",
    title: "Glace vanille",
    description: "Boule de vanille Bourbon.",
  },
  jus: {
    subject: "fresh orange juice",
    vessel: "tall cylindrical highball glass, straight sides, flat base",
    details: "mint leaf on top",
    mood: "pure white background, studio product photo, centered",
    section: "cafe",
    title: "Jus d'orange pressé",
    description: "Oranges fraîches.",
  },
  pizza: {
    subject: "classic margherita pizza with fresh basil mozzarella and tomato sauce",
    vessel: "round pizza on a wooden board",
    details: "melted cheese, fresh basil leaves",
    mood: "soft natural light, clean background",
    section: "restaurant",
    title: "Pizza margherita",
    description: "Tomate, mozzarella, basilic.",
  },
};

function buildPrompt() {
  const parts = [
    promptSubject.value,
    promptVessel.value,
    promptDetails.value,
    promptMood.value,
  ]
    .map((p) => String(p || "").trim().replace(/\.+$/, ""))
    .filter(Boolean);

  if (!parts.length) return "";
  return `${parts.join(". ")}. ${MENU_STYLE}`;
}

function syncPromptPreview() {
  const prompt = buildPrompt();
  promptText.value = prompt;
  promptComposed.textContent = prompt || "—";
  promptCopy.hidden = !prompt;
}

let section = "all";
let view = "library";
let items = [];
let searchQuery = "";
let sortBy = "recent";
let generating = false;
let statusTimer = null;

function setStatus(message, isError = false) {
  if (statusTimer) {
    clearTimeout(statusTimer);
    statusTimer = null;
  }
  if (!message) {
    statusEl.hidden = true;
    statusEl.textContent = "";
    statusEl.classList.remove("is-error");
    return;
  }
  statusEl.hidden = false;
  statusEl.textContent = message;
  statusEl.classList.toggle("is-error", isError);
  if (!isError) {
    statusTimer = setTimeout(() => setStatus(""), 4500);
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function sectionCounts() {
  return {
    all: items.length,
    cafe: items.filter((i) => i.section === "cafe").length,
    restaurant: items.filter((i) => i.section === "restaurant").length,
  };
}

function updateFilterCounts() {
  const counts = sectionCounts();
  document.querySelectorAll("[data-count]").forEach((el) => {
    const key = el.dataset.count;
    el.textContent = String(counts[key] ?? 0);
  });
}

function filteredLibrary() {
  const q = searchQuery.trim().toLowerCase();
  const list = items.filter((item) => {
    if (section !== "all" && item.section !== section) return false;
    if (!q) return true;
    return (
      (item.title || "").toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q)
    );
  });

  const byTitle = (a, b) =>
    (a.title || "").localeCompare(b.title || "", "fr", { sensitivity: "base" });
  const byDate = (a, b) => {
    const da = a.createdAt ? Date.parse(a.createdAt) : 0;
    const db = b.createdAt ? Date.parse(b.createdAt) : 0;
    return da - db;
  };

  list.sort((a, b) => {
    if (sortBy === "az") return byTitle(a, b);
    if (sortBy === "za") return byTitle(b, a);
    if (sortBy === "oldest") return byDate(a, b);
    if (sortBy === "section") {
      const sec = (a.section || "").localeCompare(b.section || "", "fr");
      return sec || byTitle(a, b);
    }
    // recent (default)
    return byDate(b, a) || byTitle(a, b);
  });

  return list;
}

function setCount(n, label = "photo") {
  const word = n === 1 ? label : `${label}s`;
  if (section === "all" && !searchQuery.trim()) {
    countEl.textContent = `${n} ${word}`;
    return;
  }
  const scope =
    section === "cafe" ? "café" : section === "restaurant" ? "resto" : "filtrées";
  countEl.textContent = `${n} ${word}${searchQuery.trim() || section !== "all" ? ` · ${scope}` : ""}`;
}

function showSkeleton() {
  gridEl.innerHTML = `
    <div class="skeleton-grid">
      <div class="skeleton"></div>
      <div class="skeleton"></div>
      <div class="skeleton"></div>
      <div class="skeleton"></div>
    </div>`;
}

function setView(next) {
  view = next;
  viewTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.view === next);
  });

  const isStudio = next === "studio";
  studio.hidden = !isStudio;
  libraryToolbar.hidden = isStudio;
  gridEl.hidden = isStudio;

  if (isStudio) {
    countEl.textContent = "—";
    syncPromptPreview();
    promptSubject.focus();
  } else {
    renderLibrary();
  }
}

function renderLibrary() {
  updateFilterCounts();
  const list = filteredLibrary();
  setCount(list.length, "photo");

  if (!list.length) {
    const hasItems =
      section === "all"
        ? items.length > 0
        : items.some((i) => i.section === section);
    gridEl.innerHTML = `
      <div class="empty">
        <strong>${hasItems || searchQuery.trim() ? "Aucun résultat" : "Aucune photo pour l’instant"}</strong>
        ${
          hasItems || searchQuery.trim()
            ? "Changez de filtre (Tous / Café / Restaurant) ou la recherche."
            : "Créez une photo avec l’IA ou importez une image existante."
        }
        ${
          !hasItems && !searchQuery.trim()
            ? `<div class="empty-actions">
                <button type="button" class="btn btn-accent" data-empty-action="studio">Créer une photo IA</button>
                <button type="button" class="btn btn-ghost" data-empty-action="create">Importer une image</button>
              </div>`
            : section !== "all"
              ? `<div class="empty-actions">
                  <button type="button" class="btn btn-ghost" data-empty-action="all">Voir toutes les photos</button>
                </div>`
              : ""
        }
      </div>`;
    return;
  }

  gridEl.innerHTML = list
    .map(
      (item) => `
      <button type="button" class="card" data-id="${escapeHtml(item.id)}" data-section="${escapeHtml(item.section)}">
        <div class="card-media">
          <img class="card-img" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" />
          <span class="card-shade">modifier</span>
        </div>
        <div class="card-body">
          <span class="card-tag is-${escapeHtml(item.section)}">${escapeHtml(LABELS[item.section] || item.section)}</span>
          <h3 class="card-title">${escapeHtml(item.title || "Sans titre")}</h3>
          <p class="card-desc">${escapeHtml(item.description || "—")}</p>
        </div>
      </button>`
    )
    .join("");
}

async function loadProducts() {
  setStatus("");
  if (view === "library") showSkeleton();
  countEl.textContent = "…";

  try {
    // Always load everything — filters apply client-side (Tous / Café / Restaurant)
    const res = await fetch("/library");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Impossible de charger les produits");
    items = data.items || [];
    updateFilterCounts();
    if (view === "library") renderLibrary();
  } catch (err) {
    setCount(0);
    updateFilterCounts();
    setStatus(err.message, true);
    if (view === "library") {
      gridEl.innerHTML = `<div class="empty"><strong>Erreur</strong>${escapeHtml(err.message)}</div>`;
    }
  }
}

function setStudioBusy(busy) {
  studioPlaceholder.hidden = busy || !studioPreview.hidden;
  studioLoading.hidden = !busy;
  if (busy) {
    studioPreview.hidden = true;
    studioResultKicker.textContent = "En cours";
    studioResultTitle.textContent = "Génération…";
    studioResultDesc.textContent = "Patientez quelques secondes, l’image arrive.";
    studioToLibrary.hidden = true;
    if (promptSubmitLabel) promptSubmitLabel.textContent = "Génération…";
  } else if (promptSubmitLabel) {
    promptSubmitLabel.textContent = "Générer la photo";
  }
}

function showStudioResult(item) {
  studioPlaceholder.hidden = true;
  studioLoading.hidden = true;
  studioPreview.hidden = false;
  studioPreview.src = item.image;
  studioResultKicker.textContent = "Enregistrée";
  studioResultTitle.textContent = item.title || "Sans titre";
  studioResultDesc.textContent =
    item.description || "Photo ajoutée à vos photos.";
  studioToLibrary.hidden = false;
  studioResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function submitPrompt(event) {
  event.preventDefault();
  if (generating) return;

  syncPromptPreview();
  const prompt = promptText.value.trim();
  const title = promptTitle.value.trim();
  if (!promptSubject.value.trim() || !title) {
    setStatus("Indiquez le produit et le nom sur le menu.", true);
    return;
  }

  generating = true;
  promptSubmit.classList.add("is-busy");
  promptSubmit.disabled = true;
  setStudioBusy(true);
  setStatus("Création de la photo…");

  try {
    const res = await fetch("/flux/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        title,
        description: promptDescription.value.trim(),
        section: promptSection.value,
        model: "klein-4b",
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || "Génération échouée");

    showStudioResult(body);
    setStatus(`Photo enregistrée : ${body.title}`);
    await loadProducts();
  } catch (err) {
    setStudioBusy(false);
    studioPlaceholder.hidden = false;
    studioResultKicker.textContent = "Erreur";
    studioResultTitle.textContent = "Échec de la génération";
    studioResultDesc.textContent = err.message;
    setStatus(err.message, true);
  } finally {
    generating = false;
    promptSubmit.classList.remove("is-busy");
    promptSubmit.disabled = false;
    if (promptSubmitLabel) promptSubmitLabel.textContent = "Générer la photo";
  }
}

function applyExample(key) {
  const ex = EXAMPLES[key];
  if (!ex) return;
  promptSubject.value = ex.subject;
  promptVessel.value = ex.vessel;
  promptDetails.value = ex.details;
  promptMood.value = ex.mood;
  promptSection.value = ex.section;
  promptTitle.value = ex.title;
  promptDescription.value = ex.description;
  document.querySelectorAll("[data-example]").forEach((chip) => {
    chip.classList.toggle("is-active", chip.dataset.example === key);
  });
  syncPromptPreview();
  setStatus(`Exemple « ${ex.title} » chargé — vous pouvez générer.`);
}

function resetPreview() {
  preview.hidden = true;
  preview.removeAttribute("src");
  dropzone.classList.remove("has-file");
  imageInput.value = "";
}

function setPreviewFromUrl(url) {
  if (!url) return resetPreview();
  preview.src = url;
  preview.hidden = false;
  dropzone.classList.add("has-file");
}

function openCreate() {
  form.reset();
  formId.value = "";
  formSection.value = section === "cafe" ? "cafe" : "restaurant";
  formSection.disabled = false;
  if (sheetKicker) sheetKicker.textContent = "Nouveau";
  sheetTitle.textContent = "Ajouter un produit";
  formDelete.hidden = true;
  dropzoneTitle.textContent = "Ajouter une image";
  imageInput.required = true;
  resetPreview();
  sheet.showModal();
  formTitle.focus();
}

function openEdit(item) {
  form.reset();
  formId.value = item.id;
  formSection.value = item.section;
  formSection.disabled = true;
  formTitle.value = item.title || "";
  formDescription.value = item.description || "";
  if (sheetKicker) sheetKicker.textContent = LABELS[item.section] || "Produit";
  sheetTitle.textContent = "Modifier le produit";
  formDelete.hidden = false;
  dropzoneTitle.textContent = "Remplacer l’image (optionnel)";
  imageInput.required = false;
  setPreviewFromUrl(item.image);
  sheet.showModal();
  formTitle.focus();
}

function closeSheet() {
  sheet.close();
}

async function saveProduct(event) {
  event.preventDefault();
  formSubmit.disabled = true;
  setStatus("Enregistrement…");

  const id = formId.value;
  const selectedSection = formSection.value;
  const fd = new FormData(form);
  fd.delete("id");
  if (!imageInput.files?.length) fd.delete("image");

  try {
    const url = id ? `/library/${selectedSection}/${id}` : `/library/${selectedSection}`;
    const method = id ? "PATCH" : "POST";

    if (method === "POST" && !imageInput.files?.length) {
      throw new Error("Une image est requise pour créer un produit");
    }

    const res = await fetch(url, { method, body: fd });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || "Échec");

    setStatus(id ? "Produit mis à jour." : `Ajouté : ${body.title}`);
    closeSheet();
    await loadProducts();
  } catch (err) {
    setStatus(err.message, true);
  } finally {
    formSubmit.disabled = false;
  }
}

async function deleteProduct() {
  const id = formId.value;
  const selectedSection = formSection.value;
  if (!id) return;
  if (!confirm("Supprimer ce produit de Cloudinary ?")) return;

  setStatus("Suppression…");
  try {
    const res = await fetch(`/library/${selectedSection}/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Suppression impossible");
    }
    setStatus("Produit supprimé.");
    closeSheet();
    await loadProducts();
  } catch (err) {
    setStatus(err.message, true);
  }
}

function setSectionFilter(next) {
  section = next || "all";
  pills.forEach((p) => {
    const active = p.dataset.section === section;
    p.classList.toggle("is-active", active);
    p.setAttribute("aria-selected", active ? "true" : "false");
  });
  if (view === "library") renderLibrary();
}

pills.forEach((pill) => {
  pill.addEventListener("click", () => setSectionFilter(pill.dataset.section));
});

viewTabs.forEach((tab) => {
  tab.addEventListener("click", () => setView(tab.dataset.view));
});

searchEl.addEventListener("input", () => {
  searchQuery = searchEl.value;
  if (view === "library") renderLibrary();
});

sortEl.addEventListener("change", () => {
  sortBy = sortEl.value || "recent";
  if (view === "library") renderLibrary();
});

gridEl.addEventListener("click", (event) => {
  const emptyAction = event.target.closest("[data-empty-action]");
  if (emptyAction) {
    if (emptyAction.dataset.emptyAction === "create") openCreate();
    else if (emptyAction.dataset.emptyAction === "studio") setView("studio");
    else if (emptyAction.dataset.emptyAction === "all") {
      searchQuery = "";
      searchEl.value = "";
      setSectionFilter("all");
    }
    return;
  }

  const card = event.target.closest(".card");
  if (!card || view !== "library") return;
  const item = items.find(
    (i) => i.id === card.dataset.id && i.section === card.dataset.section
  );
  if (item) openEdit(item);
});

promptForm.addEventListener("submit", submitPrompt);
studioToLibrary.addEventListener("click", () => setView("library"));

[promptSubject, promptVessel, promptDetails, promptMood].forEach((el) => {
  el.addEventListener("input", syncPromptPreview);
});

promptForm.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-example]");
  if (chip) applyExample(chip.dataset.example);
});

promptCopy.addEventListener("click", async (event) => {
  event.preventDefault();
  event.stopPropagation();
  const text = promptText.value.trim();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    setStatus("Prompt copié.");
  } catch {
    setStatus("Impossible de copier.", true);
  }
});

openCreateBtn.addEventListener("click", openCreate);
openGenerateBtn.addEventListener("click", () => setView("studio"));
sheetClose.addEventListener("click", closeSheet);
formCancel.addEventListener("click", closeSheet);
formDelete.addEventListener("click", deleteProduct);
form.addEventListener("submit", saveProduct);

sheet.addEventListener("click", (e) => {
  if (e.target === sheet) closeSheet();
});

imageInput.addEventListener("change", () => {
  const file = imageInput.files?.[0];
  if (!file) {
    if (!formId.value) resetPreview();
    return;
  }
  const url = URL.createObjectURL(file);
  preview.src = url;
  preview.hidden = false;
  dropzone.classList.add("has-file");
});

["dragenter", "dragover"].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add("is-dragover");
  });
});
["dragleave", "drop"].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove("is-dragover");
  });
});
dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  const dt = new DataTransfer();
  dt.items.add(file);
  imageInput.files = dt.files;
  imageInput.dispatchEvent(new Event("change"));
});

loadProducts();
