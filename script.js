// ==============================
// Referencias a modales
// ==============================
const modal = document.getElementById('product-modal');
const modalContent = document.getElementById('modal-content');
const closeModal = document.getElementById('close-modal');

const profileModal = document.getElementById('profile-modal');
const profileContent = document.getElementById('profile-content');
const closeProfileModal = document.getElementById('close-profile-modal');

let allProducts = [];

// ==============================
// Crear tarjeta de producto
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

  // Click en imagen → abrir modal producto
  div.querySelector('img').addEventListener('click', () => {
    openProductModal(p);
  });

  // Click en vendedor → abrir perfil
  div.querySelector('.seller').addEventListener('click', () => {
    openProfileModal(p.seller);
  });

  return div;
}

// ==============================
// Abrir modal de producto
// ==============================
function openProductModal(p) {
  // 🔸 Cerrar perfil si está abierto
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

closeModal.addEventListener('click', () => {
  modal.classList.remove('active');
});

// ==============================
// Abrir modal de perfil
// ==============================
function openProfileModal(sellerName) {
  profileContent.innerHTML = `<h2>👤 ${sellerName}</h2><p>Cargando productos...</p>`;
  profileModal.classList.add('active');

  // 🔹 Hacer scroll posible dentro del modal
  profileContent.style.overflowY = 'auto';
  profileContent.style.maxHeight = '80vh';

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
    // 🔸 Al hacer clic en producto del perfil → cerrar perfil y abrir modal producto
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
// Cargar productos
// ==============================
async function loadProducts() {
  try {
    const res = await fetch('data/products.json');
    allProducts = await res.json();
    renderFiltered(allProducts);
  } catch (err) {
    console.error('Error al cargar productos:', err);
  }
}

// ==============================
// Renderizado filtrado
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
