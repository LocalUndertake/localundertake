// === VARIABLES GLOBALES ===
const STORAGE_KEY = "localundertake_products";
const PROFILE_KEY = "localundertake_profiles";
const LOCAL_USER_KEY = "localundertake_user";

// === UTILIDADES ===
function saveProfiles(profiles) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles || {}));
}
function getProfiles() {
  return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
}
function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products || []));
}
function getProducts() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}
function getUserProfile() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USER_KEY) || "null");
  } catch {
    return null;
  }
}
function saveUserProfile(profile) {
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile || {}));
  updateUserIcon();
}

// === PERFIL DE USUARIO LOCAL ===
function updateUserIcon() {
  const icon = document.getElementById("user-profile-icon");
  const user = getUserProfile();
  if (!icon) return;
  if (user && user.avatar) {
    icon.style.backgroundImage = `url('${user.avatar}')`;
    icon.style.backgroundSize = "cover";
    icon.style.backgroundPosition = "center";
  } else if (user && user.name) {
    icon.style.backgroundImage = `url('https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name)}')`;
    icon.style.backgroundSize = "cover";
    icon.style.backgroundPosition = "center";
  } else {
    icon.style.backgroundImage = `url('https://api.dicebear.com/9.x/initials/svg?seed=User')`;
    icon.style.backgroundSize = "cover";
    icon.style.backgroundPosition = "center";
  }
}

function openUserModal() {
  const modal = document.getElementById("user-modal");
  const user = getUserProfile() || {};
  document.getElementById("user-name").value = user.name || "";
  document.getElementById("user-bio").value = user.bio || "";
  document.getElementById("user-avatar").value = user.avatar || "";
  modal.style.display = "flex";
}
function closeUserModal() {
  document.getElementById("user-modal").style.display = "none";
}
document.getElementById("user-profile-icon").addEventListener("click", openUserModal);
document.getElementById("close-user-modal").addEventListener("click", closeUserModal);

document.getElementById("save-user-profile").addEventListener("click", () => {
  const name = document.getElementById("user-name").value.trim();
  const bio = document.getElementById("user-bio").value.trim();
  const avatar = document.getElementById("user-avatar").value.trim();
  if (!name) return alert("Introduce un nombre para tu perfil.");
  saveUserProfile({ name, bio, avatar });
  const sellerInput = document.getElementById("product-seller");
  if (sellerInput) sellerInput.value = name;
  closeUserModal();
  alert("Perfil guardado correctamente.");
});

document.addEventListener("DOMContentLoaded", () => {
  updateUserIcon();
  const user = getUserProfile();
  if (user && user.name) {
    const sellerInput = document.getElementById("product-seller");
    if (sellerInput) sellerInput.value = user.name;
  }
  renderProducts();
});

// === AÑADIR PRODUCTO ===
document.getElementById("add-product-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("product-name").value.trim();
  const price = parseFloat(document.getElementById("product-price").value.trim());
  const user = getUserProfile();
  const sellerInput = document.getElementById("product-seller");
  const seller = (user && user.name) ? user.name : sellerInput.value.trim();
  const category = document.getElementById("product-category").value;
  const image = document.getElementById("product-image").value.trim();
  const description = document.getElementById("product-description").value.trim();

  if (!name || !price || !seller || !category)
    return alert("Por favor, completa todos los campos.");

  const newProduct = {
    id: Date.now(),
    name,
    price,
    seller,
    category,
    image: image || `https://via.placeholder.com/300x200?text=${encodeURIComponent(name)}`,
    description: description || "",
  };

  const products = getProducts();
  products.push(newProduct);
  saveProducts(products);
  renderProducts();
  e.target.reset();
  if (user && user.name && sellerInput) sellerInput.value = user.name;
});

document.getElementById("clear-local").addEventListener("click", () => {
  if (confirm("¿Seguro que quieres borrar todos los productos locales?")) {
    localStorage.removeItem(STORAGE_KEY);
    renderProducts();
  }
});

// === BUSCAR Y FILTRAR ===
document.getElementById("search-input").addEventListener("input", renderProducts);
document.getElementById("filter-category").addEventListener("change", renderProducts);

// === MOSTRAR PRODUCTOS ===
function renderProducts() {
  const list = document.getElementById("product-list");
  const products = getProducts();
  const query = document.getElementById("search-input").value.toLowerCase().trim();
  const filter = document.getElementById("filter-category").value;
  list.innerHTML = "";

  const filtered = products.filter(p => {
    const matchQuery =
      p.name.toLowerCase().includes(query) ||
      p.seller.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query);
    const matchCategory = !filter || p.category === filter;
    return matchQuery && matchCategory;
  });

  if (!filtered.length) {
    list.innerHTML = `<p class="placeholder">No se encontraron productos.</p>`;
    return;
  }

  filtered.forEach(p => {
    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <div class="category-badge">${p.category}</div>
      <div class="product-info">
        <h3>${p.name}</h3>
        <p>${Number(p.price).toFixed(2)}€</p>
        <p style="color:#555;font-size:0.9rem;">👤 ${p.seller}</p>
      </div>`;
    card.addEventListener("click", () => openProductModal(p));
    list.appendChild(card);
  });
}

// === MODAL DE PRODUCTO ===
function openProductModal(product) {
  const modal = document.getElementById("product-modal");
  modal.style.display = "flex";
  document.getElementById("modal-image").src = product.image;
  document.getElementById("modal-name").textContent = product.name;
  document.getElementById("modal-price").textContent = `💶 ${product.price} €`;
  document.getElementById("modal-seller").innerHTML = `👤 <a href="#" id="seller-link">${product.seller}</a>`;
  document.getElementById("modal-category").textContent = `🏷️ ${product.category}`;
  document.getElementById("modal-description").textContent = product.description ? `📝 ${product.description}` : "";

  const sellerLink = document.getElementById("seller-link");
  sellerLink.addEventListener("click", (e) => {
    e.preventDefault();
    closeProductModal();
    openProfileModal(product.seller);
  });
}

function closeProductModal() {
  document.getElementById("product-modal").style.display = "none";
}
document.getElementById("close-modal").addEventListener("click", closeProductModal);
