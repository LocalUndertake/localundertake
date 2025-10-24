function escapeHtml(text) {
  return text
    ? String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
    : "";
}

// Crear tarjeta de producto tipo marketplace
function createProductCard(p) {
  const div = document.createElement("div");
  div.className = "product";
  div.innerHTML = `
    <img src="${p.image || "assets/default-product.png"}" alt="${escapeHtml(p.name)}">
    <div class="product-info">
      <h3>${escapeHtml(p.name)}</h3>
      <p>${Number(p.price).toFixed(2)}€</p>
    </div>
  `;
  div.addEventListener("click", () => openModal(p));
  return div;
}

// Cargar productos
async function loadProducts() {
  const container = document.getElementById("product-list");
  container.innerHTML = "<p>Cargando productos...</p>";

  try {
    const res = await fetch("data/products.json");
    const json = await res.json();
    const local = JSON.parse(localStorage.getItem("localundertake_products") || "[]");
    const all = [...local, ...json];

    container.innerHTML = "";
    all.forEach((p) => container.appendChild(createProductCard(p)));
  } catch (err) {
    container.innerHTML = "<p>Error al cargar productos 😔</p>";
  }
}

// Modal con más información
function openModal(p) {
  const modal = document.getElementById("product-modal");
  document.getElementById("modal-image").src = p.image || "assets/default-product.png";
  document.getElementById("modal-name").textContent = p.name;
  document.getElementById("modal-price").textContent = `💰 ${Number(p.price).toFixed(2)}€`;
  document.getElementById("modal-seller").textContent = `👤 ${p.seller}`;
  document.getElementById("modal-achievement").textContent = p.achievement || "";
  modal.style.display = "flex";
}

function closeModal() {
  document.getElementById("product-modal").style.display = "none";
}

// Añadir producto localmente
function addLocalProduct(product) {
  const key = "localundertake_products";
  const products = JSON.parse(localStorage.getItem(key) || "[]");
  products.unshift(product);
  localStorage.setItem(key, JSON.stringify(products));
  loadProducts();
}

// Limpiar productos locales
function clearLocalProducts() {
  if (confirm("¿Borrar todos los productos añadidos localmente?")) {
    localStorage.removeItem("localundertake_products");
    loadProducts();
  }
}

// Configurar formulario y modal
function setup() {
  const form = document.getElementById("add-product-form");
  const btnClear = document.getElementById("clear-local");
  const closeBtn = document.getElementById("close-modal");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form["product-name"].value.trim();
    const price = Number(form["product-price"].value);
    const seller = form["product-seller"].value.trim();
    const image = form["product-image"].value.trim();

    if (!name || !seller || isNaN(price)) {
      alert("Por favor, completa todos los campos correctamente.");
      return;
    }

    const product = { name, price, seller, image: image || null, achievement: "🆕 Añadido localmente" };
    addLocalProduct(product);
    form.reset();
  });

  btnClear.addEventListener("click", clearLocalProducts);
  closeBtn.addEventListener("click", closeModal);
  window.addEventListener("click", (e) => {
    if (e.target.id === "product-modal") closeModal();
  });
}

// Inicializar
document.addEventListener("DOMContentLoaded", () => {
  setup();
  loadProducts();
});
