function escapeHtml(text) {
  if (!text && text !== 0) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Crear tarjeta de producto minimalista
function createProductCard(p) {
  const div = document.createElement('div');
  div.className = 'product';
  div.innerHTML = `
    <img src="${p.image || 'assets/default-product.png'}" alt="${escapeHtml(p.name)}">
    <h3>💰 ${Number(p.price).toFixed(2)}€</h3>
  `;

  div.addEventListener('click', () => {
    openModal(p);
  });

  return div;
}

// Cargar productos desde JSON y localStorage
async function loadProducts() {
  const container = document.getElementById('product-list');
  container.innerHTML = '<p>Cargando productos...</p>';

  let initial = [];
  try {
    const res = await fetch('data/products.json');
    initial = await res.json();
  } catch (err) { console.error(err); }

  let localProducts = [];
  try {
    const raw = localStorage.getItem('localundertake_products');
    if (raw) localProducts = JSON.parse(raw);
  } catch (err) {}

  const allProducts = [...localProducts, ...initial];

  container.innerHTML = '';
  allProducts.forEach(p => container.appendChild(createProductCard(p)));
}

// Añadir producto local
function addLocalProduct(product) {
  const key = 'localundertake_products';
  let items = [];
  try {
    const raw = localStorage.getItem(key);
    if (raw) items = JSON.parse(raw);
  } catch (err) {}

  items.unshift(product);
  localStorage.setItem(key, JSON.stringify(items));
  loadProducts();
}

// Borrar productos locales
function clearLocalProducts() {
  if (confirm('¿Borrar todos los productos añadidos localmente?')) {
    localStorage.removeItem('localundertake_products');
    loadProducts();
  }
}

// CONFIGURAR FORMULARIO
function setupForm() {
  const form = document.getElementById('add-product-form');
  const btnClear = document.getElementById('clear-local');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('product-name').value.trim();
    const price = Number(document.getElementById('product-price').value || 0);
    const seller = document.getElementById('product-seller').value.trim();
    const image = document.getElementById('product-image').value.trim();

    if (!name || !seller || isNaN(price)) {
      alert('Rellena nombre, vendedor y precio válidos.');
      return;
    }

    const product = {
      name,
      price,
      seller,
      image: image || null,
      achievement: '🆕 Añadido localmente'
    };

    addLocalProduct(product);
    form.reset();
  });

  btnClear.addEventListener('click', clearLocalProducts);
}

// MODAL
function openModal(product) {
  const modal = document.getElementById('product-modal');
  const modalBody = document.getElementById('modal-body');

  modalBody.innerHTML = `
    <h2>${escapeHtml(product.name)}</h2>
    <img src="${product.image || 'assets/default-product.png'}" alt="${escapeHtml(product.name)}">
    <p><strong>💰 Precio:</strong> ${product.price}€</p>
    <p><strong>👤 Vendedor:</strong> ${escape
