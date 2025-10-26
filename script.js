// === VARIABLES GLOBALES ===
let currentSeller = null;
let currentUser = JSON.parse(localStorage.getItem("localundertake_user")) || null;

// === INICIALIZACIÓN ===
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  setupProfileIcon();
});

// === FUNCIONES DE PRODUCTOS ===

// Renderizar productos desde localStorage
function renderProducts() {
  const container = document.getElementById("product-list");
  const products = JSON.parse(localStorage.getItem("localundertake_products") || "[]");
  container.innerHTML = "";

  if (products.length === 0) {
    container.innerHTML = "<p style='grid-column:1/-1;text-align:center;'>No hay productos aún.</p>";
    return;
  }

  products.forEach((product) => {
    const div = document.createElement("div");
    div.classList.add("product");
    div.innerHTML = `
      <div class="category-badge">${product.category}</div>
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>💶 ${product.price} €</p>
        <p>👤 ${product.seller}</p>
      </div>
    `;
    div.addEventListener("click", () => openProductModal(product));
    container.appendChild(div);
  });
}

// Añadir producto
document.getElementById("add-product-form").addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("product-name").value.trim();
  const price = parseFloat(document.getElementById("product-price").value.trim());
  const seller = currentUser?.name || document.getElementById("product-seller").value.trim();
  const category = document.getElementById("product-category").value;
  const image = document.getElementById("product-image").value.trim();
  const description = document.getElementById("product-description").value.trim(); // 🔹 Nuevo campo descripción

  if (!name || !price || !seller || !category) {
    alert("Por favor, completa todos los campos obligatorios.");
    return;
  }

  const newProduct = {
    id: Date.now(),
    name,
    price,
    seller,
    category,
    image: image || `https://via.placeholder.com/300x200?text=${encodeURIComponent(name)}`,
    description // 🔹 Guardamos descripción
  };

  const products = JSON.parse(localStorage.getItem("localundertake_products") || "[]");
  products.push(newProduct);
  localStorage.setItem("localundertake_products", JSON.stringify(products));

  renderProducts();
  e.target.reset();
});

// Limpiar productos locales
document.getElementById("clear-local").addEventListener("click", () => {
  if (confirm("¿Seguro que quieres eliminar todos los productos locales?")) {
    localStorage.removeItem("localundertake_products");
    renderProducts();
  }
});

// === MODAL PRODUCTO ===
function openProductModal(product) {
  const modal = document.getElementById("product-modal");
  modal.style.display = "flex";
  document.getElementById("modal-image").src = product.image;
  document.getElementById("modal-name").textContent = product.name;
  document.getElementById("modal-price").textContent = `💶 ${product.price} €`;
  document.getElementById("modal-seller").innerHTML = `👤 <a href="#" id="seller-link">${product.seller}</a>`;
  document.getElementById("modal-category").textContent = `🏷️ ${product.category}`;
  document.getElementById("modal-description").textContent = product.description || ""; // 🔹 Muestra descripción

  document.getElementById("seller-link").addEventListener("click", (e) => {
    e.preventDefault();
    closeProductModal();
    openProfileModal(product.seller);
  });
}

function closeProductModal() {
  document.getElementById("product-modal").style.display = "none";
}

document.getElementById("close-modal").addEventListener("click", closeProductModal);

// === PERFIL DE VENDEDOR ===
function openProfileModal(sellerName) {
  const modal = document.getElementById("profile-modal");
  modal.style.display = "flex";
  currentSeller = sellerName;

  document.getElementById("profile-name").textContent = sellerName;
  document.getElementById("profile-name-2").textContent = sellerName;

  const userProfiles = JSON.parse(localStorage.getItem("localundertake_userProfiles") || "{}");
  const sellerProfile = userProfiles[sellerName] || {};

  document.getElementById("profile-avatar").src =
    sellerProfile.avatar || "https://api.dicebear.com/9.x/initials/svg?seed=" + encodeURIComponent(sellerName);
  document.getElementById("profile-bio").value = sellerProfile.bio || "";

  // Productos del vendedor
  const products = JSON.parse(localStorage.getItem("localundertake_products") || "[]");
  const sellerProducts = products.filter((p) => p.seller === sellerName);
  const container = document.getElementById("profile-products");
  container.innerHTML = "";

  if (sellerProducts.length === 0) {
    container.innerHTML = "<p>No hay productos de este vendedor.</p>";
  } else {
    sellerProducts.forEach((product) => {
      const div = document.createElement("div");
      div.classList.add("product");
      div.innerHTML = `
        <div class="category-badge">${product.category}</div>
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>💶 ${product.price} €</p>
          <p>👤 ${product.seller}</p>
        </div>
      `;
      div.addEventListener("click", () => {
        closeProfileModal();
        openProductModal(product);
      });
      container.appendChild(div);
    });
  }

  loadReviews();
}

function closeProfileModal() {
  document.getElementById("profile-modal").style.display = "none";
}

document.getElementById("close-profile").addEventListener("click", closeProfileModal);

// === GUARDAR BIO PERFIL DE VENDEDOR ===
document.getElementById("save-bio").addEventListener("click", () => {
  if (!currentSeller) return;

  const bio = document.getElementById("profile-bio").value;
  const userProfiles = JSON.parse(localStorage.getItem("localundertake_userProfiles") || "{}");

  if (!userProfiles[currentSeller]) userProfiles[currentSeller] = {};
  userProfiles[currentSeller].bio = bio;
  localStorage.setItem("localundertake_userProfiles", JSON.stringify(userProfiles));

  alert("Biografía guardada correctamente ✅");
});

// === RESEÑAS ===
function loadReviews() {
  const reviewsList = document.getElementById("reviews-list");
  reviewsList.innerHTML = "";

  const allReviews = JSON.parse(localStorage.getItem("localundertake_reviews") || "{}");
  const reviews = allReviews[currentSeller] || [];

  if (reviews.length === 0) {
    reviewsList.innerHTML = "<p>No hay reseñas aún.</p>";
    return;
  }

  reviews.forEach((r) => {
    const div = document.createElement("div");
    div.classList.add("review");
    div.innerHTML = `
      <div class="meta">${r.name} — <span class="stars">${"⭐".repeat(r.rating)}</span></div>
      <p>${r.text}</p>
    `;
    reviewsList.appendChild(div);
  });
}

document.getElementById("add-review-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!currentSeller) return;

  const name = document.getElementById("reviewer-name").value.trim();
  const rating = parseInt(document.getElementById("review-rating").value);
  const text = document.getElementById("review-text").value.trim();

  if (!name || !rating || !text) return alert("Completa todos los campos de la reseña.");

  const allReviews = JSON.parse(localStorage.getItem("localundertake_reviews") || "{}");
  if (!allReviews[currentSeller]) allReviews[currentSeller] = [];

  allReviews[currentSeller].push({ name, rating, text });
  localStorage.setItem("localundertake_reviews", JSON.stringify(allReviews));

  loadReviews();
  e.target.reset();
});

document.getElementById("clear-reviews").addEventListener("click", () => {
  if (!currentSeller) return;
  if (confirm("¿Eliminar todas las reseñas de este vendedor?")) {
    const allReviews = JSON.parse(localStorage.getItem("localundertake_reviews") || "{}");
    delete allReviews[currentSeller];
    localStorage.setItem("localundertake_reviews", JSON.stringify(allReviews));
    loadReviews();
  }
});

// === PERFIL DE USUARIO LOCAL (ICONO ESQUINA SUPERIOR DERECHA) ===
function setupProfileIcon() {
  const icon = document.getElementById("user-profile-icon");

  if (currentUser?.avatar) {
    icon.style.backgroundImage = `url('${currentUser.avatar}')`;
    icon.style.backgroundSize = "cover";
  }

  icon.addEventListener("click", () => {
    document.getElementById("user-modal").style.display = "flex";
    document.getElementById("user-name").value = currentUser?.name || "";
    document.getElementById("user-bio").value = currentUser?.bio || "";
    document.getElementById("user-avatar").value = currentUser?.avatar || "";
  });
}

document.getElementById("save-user-profile").addEventListener("click", () => {
  const name = document.getElementById("user-name").value.trim();
  const bio = document.getElementById("user-bio").value.trim();
  const avatar = document.getElementById("user-avatar").value.trim();

  if (!name) return alert("El nombre es obligatorio.");

  currentUser = { name, bio, avatar };
  localStorage.setItem("localundertake_user", JSON.stringify(currentUser));

  const icon = document.getElementById("user-profile-icon");
  if (avatar) {
    icon.style.backgroundImage = `url('${avatar}')`;
    icon.style.backgroundSize = "cover";
  } else {
    icon.style.backgroundImage = `url('https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}')`;
  }

  document.getElementById("user-modal").style.display = "none";
});

document.getElementById("close-user-modal").addEventListener("click", () => {
  document.getElementById("user-modal").style.display = "none";
});
