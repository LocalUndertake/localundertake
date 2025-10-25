// ==============================
// Modal de producto
// ==============================
const modal = document.getElementById('product-modal');
const modalContent = document.getElementById('modal-content');
const closeModal = document.getElementById('close-modal');

// ==============================
// Modal de perfil
// ==============================
const profileModal = document.getElementById('profile-modal');
const profileContent = document.getElementById('profile-content');
const closeProfileModal = document.getElementById('close-profile-modal');

// ==============================
// Función: Crear tarjeta producto
// ==============================
function createProductCard(p) {
  const div = document.createElement('div');
  div.className = 'product';
  div.innerHTML = `
    <img src="${p.image || 'assets/default-product.png'}" alt="${p.name}">
    <h3>${p.name}</h3>
    <p><strong>${Number(p.price).toFixed(2)}€</strong></p>
    <p class="seller" data-seller="${p.seller}">👤 ${p.seller}</p>
  `;
  // Click en imagen → abre modal de producto
  div.querySelector('img').addEventListener('click', () => {
    openProductModal(p);
  });
  // Click en vendedor → abre perfil
  div.querySelector('.seller').addEventListener('click', () => {
    openProfileModal(p.seller);
  });
  return div;
}

// ==============================
// Abrir modal de producto
// ==============================
function openProductModal(p) {
  // Cierra modal de perfil si está abierto
  if (profileModal.classList.contains('active')) {
    profileModal.classList.remove('active');
  }

  modalContent.innerHTML = `
    <img src="${p.image || 'assets/default-product.png'}" alt="${p.name}">
    <h2>${p.name}</h2>
    <p><strong>💰 ${Number(p.price).toFixed(2)}€</strong></p>
    <p>👤 ${p.seller}</p>
    <p>🏷️ Categoría: ${p.category || 'Sin categoría'}</p>
    <p>${p.description || ''}</p>
  `;
  modal.classList.add('active');
}

closeModal.addEventListener('click', () => modal.classList.remove('active'));

// ==============================
// Abrir modal de perfil
// ==============================
function openProfileModal(sellerName) {
  profileContent.innerHTML = `<h2>👤 ${sellerName}</h2><p>Cargando productos...</p>`;
  profileModal.classList.add('active');

  // Permitir scroll si hay muchos productos
  profileContent.style.overflowY = 'auto';
  profileContent.style.maxHeight = '80vh';

  // Filtra productos de ese vendedor
  const sellerProducts = allProducts.filter(p => p.seller === sellerName);
  profileContent.innerHTML = `
    <h2>👤 ${sellerName}</h2>
    <div class="profile-products"></div>
  `;
  const container = profileContent.querySelector('.profile-products');
  sellerProducts.forEach(p => {
    const div = document.createElement('div');
    div.className = 'product mini';
    div.innerHTML = `
      <img src="${p.image || 'assets/default-product.png'}" alt="${p.name}">
      <h4>${p.name}</h4>
      <p>${Number(p.price).toFixed(2)}€</p>
    `;
    // Clic en producto del perfil → abrir modal de producto y cerrar perfil
    div.querySelector('img').addEventListener('click', () => {
      profileModal.classList.remove('active');
      openProductModal(p);
    });
    container.appendChild(div);
  });
}

closeProfileModal.addEventListener('click', () => {
  profileModal.classList.remove('active');
});

// ==============================
// Variables globales y carga
// ==============================
let allProducts = [];

async function loadProducts() {
  const res = await fetch('data/products.json');
  allProducts = await res.json();
  renderFiltered(allProducts);
}

// ==============================
// Renderizado filtrado (búsqueda / categoría)
// ==============================
function renderFiltered(list) {
  const container = document.getElementById('product-list');
  container.innerHTML = '';
  list.forEach(p => {
    container.appendChild(createProductCard(p));
  });
}

// ==============================
// Búsqueda
// ==============================
document.getElementById('search-input').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  const filtered = allProducts.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.seller.toLowerCase().includes(q) ||
    (p.category && p.category.toLowerCase().includes(q))
  );
  renderFiltered(filtered);
});

// ==============================
// Inicialización
// ==============================
document.addEventListener('DOMContentLoaded', loadProducts);
