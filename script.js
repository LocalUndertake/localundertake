// Helper: crear tarjeta de producto
function createProductCard(p) {
  const div = document.createElement('div');
  div.className = 'product';
  div.innerHTML = `
    <img src="${p.image || 'assets/default-product.png'}" alt="${p.name}">
    <h3>${escapeHtml(p.name)}</h3>
    <p><strong>💰 ${Number(p.price).toFixed(2)}€</strong></p>
    <p>👤 ${escapeHtml(p.seller)}</p>
    <p>${p.achievement ? escapeHtml(p.achievement) : ''}</p>
  `;
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

  // Fusionar: local arriba del JSON para ver los añadidos primero
  const all = [].concat(localProducts, initial);

  // Mostrar
  container.innerHTML = '';
  all.forEach(p => {
    const card = createProductCard(p);
    container.appendChild(card);
  });
}

// Añadir nuevo producto al localStorage y refrescar UI
function addLocalProduct(product) {
  const localKey = 'localundertake_products';
  let localProducts = [];
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) localProducts = JSON.parse(raw);
  } catch (err) {
    console.error('Error leyendo localStorage', err);
  }

  // Añadir al inicio
  localProducts.unshift(product);
  localStorage.setItem(localKey, JSON.stringify(localProducts));
  loadProducts();
}

// Borrar productos locales (solo para pruebas)
function clearLocalProducts() {
  if (confirm('Borrar todos los productos añadidos localmente?')) {
    localStorage.removeItem('localundertake_products');
    loadProducts();
  }
}

// Manejar el formulario
function setupForm() {
  const form = document.getElementById('add-product-form');
  const btnClear = document.getElementById('clear-local');

  form.addEventListener('submit', (e) => {
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

    // limpiar
    form.reset();
  });

  btnClear.addEventListener('click', (e) => {
    clearLocalProducts();
  });
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  setupForm();
  loadProducts();
});
