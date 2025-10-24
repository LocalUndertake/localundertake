// Helper: escapar HTML básico
function escapeHtml(text) {
  if (!text && text !== 0) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Crea una tarjeta de producto (con detalles ocultos)
function createProductCard(p) {
  const div = document.createElement('div');
  div.className = 'product';
  div.innerHTML = `
    <img src="${p.image || 'assets/default-product.png'}" alt="${escapeHtml(p.name)}">
    <h3>${escapeHtml(p.name)}</h3>
    <div class="product-details">
      <p><strong>💰 ${Number(p.price).toFixed(2)}€</strong></p>
      <p>👤 ${escapeHtml(p.seller)}</p>
      ${p.achievement ? `<p>${escapeHtml(p.achievement)}</p>` : ''}
    </div>
  `;

  // Evento: al hacer clic, mostrar/ocultar detalles
  div.addEventListener('click', () => {
    div.classList.toggle('active');
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
  } catch (err) {
    console.error('Error al cargar products.json', err);
  }

  const localKey = 'localundertake_products';
  let localProducts = [];
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) localProducts = JSON.parse(raw);
  } catch (err) {
    console.error('Error leyendo localStorage', err);
  }
