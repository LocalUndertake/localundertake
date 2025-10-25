// Helper: crear tarjeta de producto
function createProductCard(p) {
  const div = document.createElement('div');
  div.className = 'product';
  div.innerHTML = `
    <img src="${p.image || 'assets/default-product.png'}" alt="${p.name}">
    <h3>${escapeHtml(p.name)}</h3>
    <p><strong>💰 ${Number(p.price).toFixed(2)}€</strong></p>
    <p>👤 ${escapeHtml(p.seller)}</p>
    <p>📂 ${escapeHtml(p.category || 'Sin categoría')}</p>
    <p>${p.achievement ? escapeHtml(p.achievement) : ''}</p>
  `;
  div.addEventListener('click', () => openModal(p));
  return div;
}

// Evita inyección básica
function escapeHtml(text) {
  if (!text && text !== 0) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Cargar productos iniciales desde JSON y localStorage
async function loadProducts() {
  const container = document.getElementById('product-list');
  container.innerHTML = '<p>Cargando productos...</p>';

  let initial = [];
  try {
    const res = await fetch('data/products.json');
    initial = await res.json();
  } catch (err) {
    console.error('No se pudo cargar data/products.json', err);
  }

  // Productos guardados en localStorage
  const localKey = 'localundertake_products';
  let localProducts = [];
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) localProducts = JSON.parse(raw);
  } catch (err) {
    console.error('Error leyendo localStorage', err);
  }

  // Fusionar: locales primero
  const all = [].concat(localProducts, initial);
  window.allProducts = all; // para búsquedas y perfiles
  container.innerHTML = '';

  all.forEach(p => {
    const card = createProductCard(p);
    container.appendChild(card);
  });

  // Generar perfiles
  generateProfiles(all);
}

// Añadir nuevo producto
function addLocalProduct(product) {
  const localKey = 'localundertake_products';
  let localProducts = [];
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) localProducts = JSON.parse(raw);
  } catch (err) {
    console.error('Error leyendo localStorage', err);
  }
  localProducts.unshift(product);
  localStorage.setItem(localKey, JSON.stringify(localProducts));
  loadProducts();
}

// Borrar productos locales
function clearLocalProducts() {
  if (confirm('¿Borrar todos los productos añadidos localmente?')) {
    localStorage.removeItem('localundertake_products');
    loadProducts();
  }
}

// Manejar formulario
function setupForm() {
  const form = document.getElementById('add-product-form');
  const btnClear = document.getElementById('clear-local');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('product-name').value.trim();
    const price = Number(document.getElementById('product-price').value || 0);
    const seller = document.getElementById('product-seller').value.trim();
    const image = document.getElementById('product-image').value.trim();
    const category = document.getElementById('product-category')?.value || 'General';

    if (!name || !seller || isNaN(price)) {
      alert('Rellena nombre, vendedor y precio válidos.');
      return;
    }

    const product = {
      name,
      price,
      seller,
      image: image || null,
      category,
      achievement: '🆕 Añadido localmente'
    };

    addLocalProduct(product);
    form.reset();
  });

  btnClear.addEventListener('click', clearLocalProducts);
}

// ===== MODAL PRODUCTO =====
function openModal(p) {
  const modal = document.getElementById('product-modal');
  document.getElementById('modal-image').src = p.image || 'assets/default-product.png';
  document.getElementById('modal-name').textContent = p.name;
  document.getElementById('modal-price').textContent = `💰 ${Number(p.price).toFixed(2)}€`;
  document.getElementById('modal-seller').textContent = `👤 ${p.seller}`;
  document.getElementById('modal-category').textContent = `📂 ${p.category || 'Sin categoría'}`;
  document.getElementById('modal-achievement').textContent = p.achievement || '';

  const sellerEl = document.getElementById('modal-seller');
  sellerEl.classList.add('seller-link');
  sellerEl.onclick = () => {
    closeModal();
    openProfile(p.seller);
  };

  modal.style.display = 'flex';
}
function closeModal() {
  document.getElementById('product-modal').style.display = 'none';
}

// ===== PERFIL =====
let sellerProfiles = {};
function generateProfiles(products) {
  sellerProfiles = {};
  products.forEach(p => {
    if (!sellerProfiles[p.seller]) {
      sellerProfiles[p.seller] = {
        name: p.seller,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.seller)}`,
        bio: 'Emprendedor local 🚀',
        products: []
      };
    }
    sellerProfiles[p.seller].products.push(p);
  });
}

function openProfile(sellerName) {
  const profile = sellerProfiles[sellerName];
  if (!profile) return;

  document.getElementById('profile-avatar').src = profile.avatar;
  document.getElementById('profile-name').textContent = profile.name;
  document.getElementById('profile-name-2').textContent = profile.name;
  document.getElementById('profile-bio').textContent = profile.bio || '';

  const grid = document.getElementById('profile-products');
  grid.innerHTML = '';
  profile.products.forEach(p => {
    const card = createProductCard(p);
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      closeProfile();
      openModal(p);
    });
    grid.appendChild(card);
  });

  const modal = document.getElementById('profile-modal');
  modal.style.display = 'flex';
}

function closeProfile() {
  document.getElementById('profile-modal').style.display = 'none';
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  setupForm();
  loadProducts();
});
