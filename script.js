// ==========================
// VARIABLES GLOBALES
// ==========================
const productList = document.getElementById("product-list");
const addProductForm = document.getElementById("add-product-form");
const clearLocalBtn = document.getElementById("clear-local");
const searchInput = document.getElementById("search-input");
const filterCategory = document.getElementById("filter-category");

// MODALES
const productModal = document.getElementById("product-modal");
const closeModalBtn = document.getElementById("close-modal");
const profileModal = document.getElementById("profile-modal");
const closeProfileBtn = document.getElementById("close-profile");
const userModal = document.getElementById("user-modal");
const userProfileIcon = document.getElementById("user-profile-icon");
const closeUserModal = document.getElementById("close-user-modal");

let products = JSON.parse(localStorage.getItem("products")) || [];
let userProfile = JSON.parse(localStorage.getItem("userProfile")) || null;
let currentSeller = null;

// ==========================
// PERFIL DE USUARIO (superior derecha)
// ==========================
userProfileIcon.addEventListener("click", () => {
  userModal.style.display = "flex";
  document.getElementById("user-name").value = userProfile?.name || "";
  document.getElementById("user-bio").value = userProfile?.bio || "";
  document.getElementById("user-avatar").value = userProfile?.avatar || "";
});

document.getElementById("save-user-profile").addEventListener("click", () => {
  const name = document.getElementById("user-name").value.trim();
  const bio = document.getElementById("user-bio").value.trim();
  const avatar = document.getElementById("user-avatar").value.trim();

  if (!name) return alert("Por favor, introduce tu nombre o marca.");

  userProfile = { name, bio, avatar };
  localStorage.setItem("userProfile", JSON.stringify(userProfile));
  userModal.style.display = "none";

  // Mostrar foto en icono si existe
  userProfileIcon.style.backgroundImage = avatar ? `url('${avatar}')` : "";
});

closeUserModal.addEventListener("click", () => {
  userModal.style.display = "none";
});

if (userProfile?.avatar) {
  userProfileIcon.style.backgroundImage = `url('${userProfile.avatar}')`;
}

// ==========================
// AÑADIR PRODUCTOS
// ==========================
addProductForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("product-name").value.trim();
  const price = parseFloat(document.getElementById("product-price").value.trim());
  const category = document.getElementById("product-category").value;
  const image = document.getElementById("product-image").value.trim() || "https://via.placeholder.com/300x200";
  const description = document.getElementById("product-description").value.trim() || "Sin descripción.";

  // Usar perfil actual si existe
  const seller = userProfile?.name || document.getElementById("product-seller").value.trim();

  if (!name || !price || !seller || !category) {
    alert("Por favor, completa todos los campos obligatorios.");
    return;
  }

  const product = {
    id: Date.now(),
    name,
    price,
    seller,
    category,
    image,
    description,
    reviews: []
  };

  products.push(product);
  localStorage.setItem("products", JSON.stringify(products));
  renderProducts(products);
  addProductForm.reset();
});

clearLocalBtn.addEventListener("click", () => {
  if (confirm("¿Borrar todos los productos locales?")) {
    products = [];
    localStorage.removeItem("products");
    renderProducts(products);
  }
});

// ==========================
// RENDERIZAR PRODUCTOS
// ==========================
function renderProducts(list) {
  if (!list.length) {
    productList.innerHTML = "<p class='placeholder'>No hay productos añadidos.</p>";
    return;
  }

  productList.innerHTML = list.map(p => `
    <div class="product-card" data-id="${p.id}">
      <img src="${p.image}" alt="${p.name}">
      <div class="product-info">
        <h3>${p.name}</h3>
        <p class="price">💶 ${p.price.toFixed(2)} €</p>
        <p class="seller">👤 ${p.seller}</p>
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".product-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = parseInt(card.dataset.id);
      const product = products.find(p => p.id === id);
      openProductModal(product);
    });
  });
}

renderProducts(products);

// ==========================
// BUSCADOR Y FILTRO
// ==========================
function filterProducts() {
  const query = searchInput.value.toLowerCase();
  const category = filterCategory.value;
  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(query) ||
                          p.seller.toLowerCase().includes(query) ||
                          p.category.toLowerCase().includes(query);
    const matchesCategory = !category || p.category === category;
    return matchesSearch && matchesCategory;
  });
  renderProducts(filtered);
}

searchInput.addEventListener("input", filterProducts);
filterCategory.addEventListener("change", filterProducts);

// ==========================
// MODAL PRODUCTO
// ==========================
function openProductModal(product) {
  // Cerrar perfil si está abierto
  profileModal.style.display = "none";

  document.getElementById("modal-image").src = product.image;
  document.getElementById("modal-name").textContent = product.name;
  document.getElementById("modal-price").textContent = `💶 ${product.price.toFixed(2)} €`;
  document.getElementById("modal-seller").innerHTML = `👤 <span class="seller-link" data-seller="${product.seller}">${product.seller}</span>`;
  document.getElementById("modal-category").textContent = `📦 Categoría: ${product.category}`;
  document.getElementById("modal-description").textContent = `📝 ${product.description}`;

  // Mostrar reseñas de producto
  currentSeller = product.seller;
  loadProductReviews(product.id);

  // Listener para abrir perfil desde el nombre del vendedor
  document.querySelector(".seller-link").addEventListener("click", () => {
    productModal.style.display = "none";
    openProfile(product.seller);
  });

  productModal.style.display = "flex";
}

closeModalBtn.addEventListener("click", () => {
  productModal.style.display = "none";
});

// ==========================
// MODAL PERFIL DE VENDEDOR
// ==========================
function openProfile(sellerName) {
  currentSeller = sellerName;
  const sellerProducts = products.filter(p => p.seller === sellerName);
  const profileAvatar = userProfile?.name === sellerName ? userProfile.avatar : "https://via.placeholder.com/80";
  const profileBio = userProfile?.name === sellerName ? userProfile.bio : "Sin descripción.";

  document.getElementById("profile-avatar").src = profileAvatar;
  document.getElementById("profile-name").textContent = sellerName;
  document.getElementById("profile-name-2").textContent = sellerName;
  document.getElementById("profile-bio").value = profileBio;

  document.getElementById("profile-products").innerHTML = sellerProducts.map(p => `
    <div class="product-card" data-id="${p.id}">
      <img src="${p.image}" alt="${p.name}">
      <div class="product-info">
        <h3>${p.name}</h3>
        <p class="price">💶 ${p.price.toFixed(2)} €</p>
      </div>
    </div>
  `).join("");

  document.querySelectorAll("#profile-products .product-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = parseInt(card.dataset.id);
      const product = products.find(p => p.id === id);
      profileModal.style.display = "none";
      openProductModal(product);
    });
  });

  loadSellerReviews(sellerName);
  profileModal.style.display = "flex";
}

closeProfileBtn.addEventListener("click", () => {
  profileModal.style.display = "none";
});

// ==========================
// SISTEMA DE RESEÑAS (VENDEDOR)
// ==========================
function loadSellerReviews(sellerName) {
  const reviewsList = document.getElementById("reviews-list");
  const allReviews = JSON.parse(localStorage.getItem("reviews")) || {};
  const sellerReviews = allReviews[sellerName] || [];

  reviewsList.innerHTML = sellerReviews.map(r => `
    <div class="review-item">
      <strong>${r.name}</strong> — ⭐ ${r.rating}<br>
      <p>${r.text}</p>
    </div>
  `).join("") || "<p>Sin reseñas aún.</p>";

  const form = document.getElementById("add-review-form");
  form.onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById("reviewer-name").value.trim();
    const rating = document.getElementById("review-rating").value;
    const text = document.getElementById("review-text").value.trim();
    if (!name || !rating || !text) return;

    const newReview = { name, rating, text };
    sellerReviews.push(newReview);
    allReviews[sellerName] = sellerReviews;
    localStorage.setItem("reviews", JSON.stringify(allReviews));
    loadSellerReviews(sellerName);
    form.reset();
  };

  document.getElementById("clear-reviews").onclick = () => {
    if (confirm("¿Borrar reseñas de este vendedor?")) {
      delete allReviews[sellerName];
      localStorage.setItem("reviews", JSON.stringify(allReviews));
      loadSellerReviews(sellerName);
    }
  };
}

// ==========================
// SISTEMA DE RESEÑAS (PRODUCTO)
// ==========================
function loadProductReviews(productId) {
  const productReviewsList = document.getElementById("product-reviews-list");
  const allProductReviews = JSON.parse(localStorage.getItem("productReviews")) || {};
  const reviews = allProductReviews[productId] || [];

  productReviewsList.innerHTML = reviews.map(r => `
    <div class="review-item">
      <strong>${r.name}</strong> — ⭐ ${r.rating}<br>
      <p>${r.text}</p>
    </div>
  `).join("") || "<p>Sin reseñas para este producto.</p>";

  const form = document.getElementById("add-product-review-form");
  form.onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById("product-reviewer-name").value.trim();
    const rating = document.getElementById("product-review-rating").value;
    const text = document.getElementById("product-review-text").value.trim();
    if (!name || !rating || !text) return;

    const newReview = { name, rating, text };
    reviews.push(newReview);
    allProductReviews[productId] = reviews;
    localStorage.setItem("productReviews", JSON.stringify(allProductReviews));
    loadProductReviews(productId);
    form.reset();
  };

  document.getElementById("clear-product-reviews").onclick = () => {
    if (confirm("¿Borrar todas las reseñas de este producto?")) {
      delete allProductReviews[productId];
      localStorage.setItem("productReviews", JSON.stringify(allProductReviews));
      loadProductReviews(productId);
    }
  };
}

// ==========================
// CIERRE DE MODALES AL CLIC FUERA
// ==========================
window.addEventListener("click", (e) => {
  if (e.target === productModal) productModal.style.display = "none";
  if (e.target === profileModal) profileModal.style.display = "none";
  if (e.target === userModal) userModal.style.display = "none";
});
