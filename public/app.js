const gridEl = document.getElementById("grid");
const countEl = document.getElementById("count");
const statusEl = document.getElementById("status");
const searchEl = document.getElementById("search");
const pills = [...document.querySelectorAll(".pill")];
const openCreateBtn = document.getElementById("open-create");
const sheet = document.getElementById("sheet");
const sheetTitle = document.getElementById("sheet-title");
const sheetClose = document.getElementById("sheet-close");
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

let section = "all";
let items = [];
let searchQuery = "";

function setStatus(message, isError = false) {
  if (!message) {
    statusEl.hidden = true;
    statusEl.textContent = "";
    return;
  }
  statusEl.hidden = false;
  statusEl.textContent = message;
  statusEl.classList.toggle("is-error", isError);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function filteredItems() {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) =>
      (item.title || "").toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q)
  );
}

function setCount(n) {
  countEl.textContent = n === 0 ? "0 produit" : n === 1 ? "1 produit" : `${n} produits`;
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

function render() {
  const list = filteredItems();
  setCount(list.length);

  if (!list.length) {
    gridEl.innerHTML = `
      <div class="empty">
        <strong>${items.length ? "Aucun résultat" : "Aucun produit"}</strong>
        ${
          items.length
            ? "Modifiez le filtre ou la recherche."
            : "Cliquez sur « Ajouter » pour créer le premier."
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
        </div>
        <div class="card-body">
          <span class="card-tag">${escapeHtml(LABELS[item.section] || item.section)}</span>
          <h3 class="card-title">${escapeHtml(item.title || "Sans titre")}</h3>
          <p class="card-desc">${escapeHtml(item.description || "—")}</p>
        </div>
      </button>`
    )
    .join("");
}

async function loadProducts() {
  setStatus("");
  showSkeleton();
  countEl.textContent = "…";

  try {
    const params = new URLSearchParams();
    if (section !== "all") params.set("section", section);
    const res = await fetch(`/library?${params}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Impossible de charger les produits");
    items = data.items || [];
    render();
  } catch (err) {
    setCount(0);
    setStatus(err.message, true);
    gridEl.innerHTML = `<div class="empty"><strong>Erreur</strong>${escapeHtml(err.message)}</div>`;
  }
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
  sheetTitle.textContent = "Nouveau produit";
  formDelete.hidden = true;
  dropzoneTitle.textContent = "Image du produit";
  imageInput.required = true;
  resetPreview();
  sheet.showModal();
}

function openEdit(item) {
  form.reset();
  formId.value = item.id;
  formSection.value = item.section;
  formSection.disabled = true;
  formTitle.value = item.title || "";
  formDescription.value = item.description || "";
  sheetTitle.textContent = "Modifier le produit";
  formDelete.hidden = false;
  dropzoneTitle.textContent = "Remplacer l’image (optionnel)";
  imageInput.required = false;
  setPreviewFromUrl(item.image);
  sheet.showModal();
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

pills.forEach((pill) => {
  pill.addEventListener("click", () => {
    section = pill.dataset.section;
    pills.forEach((p) => {
      const active = p === pill;
      p.classList.toggle("is-active", active);
      p.setAttribute("aria-selected", active ? "true" : "false");
    });
    loadProducts();
  });
});

searchEl.addEventListener("input", () => {
  searchQuery = searchEl.value;
  render();
});

gridEl.addEventListener("click", (event) => {
  const card = event.target.closest(".card");
  if (!card) return;
  const item = items.find(
    (i) => i.id === card.dataset.id && i.section === card.dataset.section
  );
  if (item) openEdit(item);
});

openCreateBtn.addEventListener("click", openCreate);
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
