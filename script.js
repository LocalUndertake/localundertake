// --- VARIABLES GLOBALES ---
const localKey = 'localundertake_products';
const profileKey = 'localundertake_user';
let products = [];
let userProfile = null;

// --- FUNCIONES AUXILIARES ---
function escapeHtml(text) {
  if (!text && text !== 0) return '';
  return String(text).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
}

function loadUserProfile() {
  const data = localStorage.getItem(profileKey);
  if (data) {
    userProfile = JSON.parse(data);
  }
}

function saveUserProfile(profile) {
  localStorage.setItem(profileKey, JSON.stringify(profile));
  userProfile = profile;
}

// --- CREAR TARJETA ---
function createProductCard(p) {
  const div = document.createElement('div');
  div.className = 'product';
  div.innerHTML = `
    <img src="${p.image || 'https://via.placeholder.com/200'}" alt="${escapeHtml(p.name)}">
    <span class="category-badge">${escapeHtml(p.category || '')}</span>
    <div class="product-info">
      <h3>${escapeHtml(p.name)}</h3>
      <p>${Number(p.price).toFixed(2)}€</p>
      <small>${escapeHtml(p.seller)}</small>
    </div>
  `;
  div.addEventListener('click', () => openProductModal(p));
  return div;
}

// --- CARGAR PRODUCTOS ---
async function loadProducts() {
  const container = document.getElementById('product-list');
  container.innerHTML = '<p>Cargando productos...</p>';

  try {
    const res = await fetch('data/products.json');
    const initial = await res.json();
    const local = JSON.parse(localStorage.getItem(localKey) || '[]');
    products = [...local, ...initial];
  } catch {
    products = JSON.parse(localStorage.getItem(localKey) || '[]');
  }

  renderProducts(products);
}

function renderProducts(list) {
  const container = document.getElementById('product-list');
  container.innerHTML = '';
  list.forEach(p => container.appendChild(createProductCard(p)));
}

// --- AÑADIR PRODUCTO ---
function addLocalProduct(product) {
  const local = JSON.parse(localStorage.getItem(localKey) || '[]');
  local.unshift(product);
  localStorage.setItem(localKey, JSON.stringify(local));
  loadProducts();
}

// --- FORMULARIO ---
function setupForm() {
  const form = document.getElementById('add-product-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!userProfile) {
      alert('Primero crea tu perfil de vendedor (icono 👤 arriba).');
      return;
    }

    const name = form['product-name'].value.trim();
    const price = Number(form['product-price'].value);
    const image = form['product-image'].value.trim();
    const category = form['product-category'].value;

    if (!name || !price || !category) {
      alert('Completa todos los campos correctamente.');
      return;
    }

    const product = {
      name, price, image,
      category,
      seller: userProfile.name,
      sellerAvatar: userProfile.avatar || '',
      achievement: '🆕 Añadido por vendedor'
    };

    addLocalProduct(product);
    form.reset();
  });

  document.getElementById('clear-local').addEventListener('click', () => {
    if (confirm('¿Borrar todos los productos locales?')) {
      localStorage.removeItem(localKey);
      loadProducts();
    }
  });
}

// --- MODAL PRODUCTO ---
function openProductModal(p) {
  const modal = document.getElementById('product-modal');
  document.getElementById('modal-image').src = p.image || 'https://via.placeholder.com/200';
  document.getElementById('modal-name').textContent = p.name;
  document.getElementById('modal-price').textContent = `💰 ${p.price}€`;
  document.getElementById('modal-category').textContent = `📦 ${p.category}`;
  const seller = document.getElementById('modal-seller');
  seller.textContent = p.seller;
  seller.onclick = () => openProfileModal(p.seller);
  modal.style.display = 'flex';
}

document.getElementById('close-modal').onclick = () => {
  document.getElementById('product-modal').style.display = 'none';
};

// --- MODAL PERFIL ---
function openProfileModal(sellerName) {
  const modal = document.getElementById('profile-modal');
  const sellerProducts = products.filter(p => p.seller === sellerName);
  const sellerInfo = (userProfile && userProfile.name === sellerName) ? userProfile : { name: sellerName, bio: "Vendedor local", avatar: "https://via.placeholder.com/100" };

  document.getElementById('profile-name').textContent = sellerInfo.name;
  document.getElementById('profile-name-2').textContent = sellerInfo.name;
  document.getElementById('profile-avatar').src = sellerInfo.avatar;
  document.getElementById('profile-bio').textContent = sellerInfo.bio;

  const container = document.getElementById('profile-products');
  container.innerHTML = '';
  sellerProducts.forEach(p => container.appendChild(createProductCard(p)));

  document.getElementById('product-modal').style.display = 'none';
  modal.style.display = 'flex';
}

document.getElementById('close-profile').onclick = () => {
  document.getElementById('profile-modal').style.display = 'none';
};

// --- MODAL CREAR / EDITAR PERFIL ---
const editModal = document.getElementById('edit-profile-modal');
document.getElementById('user-profile-btn').onclick = () => {
  if (userProfile) {
    document.getElementById('edit-profile-name').value = userProfile.name;
    document.getElementById('edit-profile-bio').value = userProfile.bio;
    document.getElementById('edit-profile-avatar').value = userProfile.avatar;
    document.getElementById('edit-profile-avatar-preview').src = userProfile.avatar || 'https://via.placeholder.com/100';
  }
  editModal.style.display = 'flex';
};

document.getElementById('close-edit-profile').onclick = () => {
  editModal.style.display = 'none';
};

document.getElementById('save-profile').onclick = () => {
  const name = document.getElementById('edit-profile-name').value.trim();
  const bio = document.getElementById('edit-profile-bio').value.trim();
  const avatar = document.getElementById('edit-profile-avatar').value.trim();
  if (!name) return alert('Debes poner un nombre.');
  const profile = { name, bio, avatar };
  saveUserProfile(profile);
  alert('✅ Perfil guardado.');
  editModal.style.display = 'none';
};

// --- BÚSQUEDA Y FILTRO ---
function setupSearch() {
  const input = document.getElementById('search-input');
  const select = document.getElementById('filter-category');
  function filter() {
    const term = input.value.toLowerCase();
    const cat = select.value;
    const filtered = products.filter(p =>
      (!cat || p.category === cat) &&
      (p.name.toLowerCase().includes(term) || p.seller.toLowerCase().includes(term))
    );
    renderProducts(filtered);
  }
  input.addEventListener('input', filter);
  select.addEventListener('change', filter);
}

// --- INICIALIZAR ---
document.addEventListener('DOMContentLoaded', () => {
  loadUserProfile();
  setupForm();
  setupSearch();
  loadProducts();
});
