document.addEventListener("DOMContentLoaded", () => {
  const productList = document.getElementById("product-list");
  const form = document.getElementById("add-product-form");
  const clearLocalBtn = document.getElementById("clear-local");
  const searchInput = document.getElementById("search-input");

  const productModal = document.getElementById("product-modal");
  const profileModal = document.getElementById("profile-modal");
  const productModalContent = document.querySelector("#product-modal .modal-content");
  const profileModalContent = document.querySelector("#profile-modal .modal-content");

  let products = [];

  // 🧩 Cargar productos
  async function loadProducts() {
    try {
      const localProducts = JSON.parse(localStorage.getItem("localProducts")) || [];
      const res = await fetch("data/products.json");
      const jsonProducts = await res.json();
      products = [...jsonProducts, ...localProducts];
      renderProducts(products);
    } catch (err) {
      productList.innerHTML = "<p>Error cargando productos.</p>";
    }
  }

  // 🖼️ Renderizar productos
  function renderProducts(arr) {
    if (!arr.length) {
      productList.innerHTML = "<p style='text-align:center;'>No hay productos disponibles.</p>";
      return;
    }
    productList.innerHTML = arr
      .map(
        (p, i) => `
      <div class="product" data-index="${i}">
        <span class="category-badge">${p.category}</span>
        <img src="${p.image || "assets/default-product.png"}" alt="${p.name}">
        <div class="product-info">
          <h3>${p.name}</h3>
          <p>${p.price} €</p>
        </div>
      </div>`
      )
      .join("");

    document.querySelectorAll(".product").forEach((card) =>
      card.addEventListener("click", () => openProduct(arr[card.dataset.index]))
    );
  }

  // 🔍 Búsqueda
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.seller.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
    renderProducts(filtered);
  });

  // 🧾 Añadir producto (solo local)
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const p = {
      name: document.getElementById("product-name").value.trim(),
      price: document.getElementById("product-price").value.trim(),
      seller: document.getElementById("product-seller").value.trim(),
      category: document.getElementById("product-category").value.trim(),
      image: document.getElementById("product-image").value.trim(),
    };
    const localProducts = JSON.parse(localStorage.getItem("localProducts")) || [];
    localProducts.push(p);
    localStorage.setItem("localProducts", JSON.stringify(localProducts));
    products.push(p);
    renderProducts(products);
    form.reset();
  });

  // 🗑️ Borrar locales
  clearLocalBtn.addEventListener("click", () => {
    localStorage.removeItem("localProducts");
    loadProducts();
  });

  // 🪟 Abrir producto
  function openProduct(p) {
    closeProfile(); // 🔧 Cerrar perfil si estaba abierto
    productModalContent.innerHTML = `
      <button class="modal-close" onclick="closeProduct()">×</button>
      <img src="${p.image || "assets/default-product.png"}" alt="${p.name}">
      <div class="modal-body">
        <h3>${p.name}</h3>
        <p><strong>Precio:</strong> ${p.price} €</p>
        <p><strong>Vendedor:</strong> <a href="#" class="seller-link">${p.seller}</a></p>
        <p><strong>Categoría:</strong> ${p.category}</p>
      </div>`;
    productModal.style.display = "flex";

    // Clic en vendedor → abrir perfil
    productModalContent
      .querySelector(".seller-link")
      .addEventListener("click", (e) => {
        e.preventDefault();
        closeProduct();
        openProfile(p.seller);
      });
  }

  // ❌ Cerrar producto
  window.closeProduct = () => (productModal.style.display = "none");

  // 👤 Abrir perfil
  function openProfile(sellerName) {
    const sellerProducts = products.filter((p) => p.seller === sellerName);

    profileModalContent.innerHTML = `
      <button class="modal-close" onclick="closeProfile()">×</button>
      <div class="profile-scroll">
        <div class="profile-header">
          <img src="assets/default-avatar.png" alt="${sellerName}" class="profile-avatar">
          <div class="profile-info">
            <h3>${sellerName}</h3>
            <p>Pequeño emprendedor local 🌟</p>
          </div>
        </div>
        <div class="profile-body">
          <h4>Productos de ${sellerName}</h4>
          <div class="product-grid profile-grid">
            ${sellerProducts
              .map(
                (p) => `
              <div class="product" data-name="${p.name}">
                <span class="category-badge">${p.category}</span>
                <img src="${p.image || "assets/default-product.png"}" alt="${p.name}">
                <div class="product-info">
                  <h3>${p.name}</h3>
                  <p>${p.price} €</p>
                </div>
              </div>`
              )
              .join("")}
          </div>
          <div class="reviews-section">
            <h4>Reseñas de este vendedor</h4>
            <div id="reviews-list">
              <div class="review"><div class="meta">⭐️⭐️⭐️⭐️⭐️ — Usuario Anónimo</div><p>Excelente atención y productos de calidad.</p></div>
            </div>
            <form id="review-form" class="review-form">
              <input type="text" id="review-name" placeholder="Tu nombre" required>
              <select id="review-stars">
                <option value="5">⭐️⭐️⭐️⭐️⭐️</option>
                <option value="4">⭐️⭐️⭐️⭐️</option>
                <option value="3">⭐️⭐️⭐️</option>
                <option value="2">⭐️⭐️</option>
                <option value="1">⭐️</option>
              </select>
              <textarea id="review-text" rows="2" placeholder="Escribe tu reseña..." required></textarea>
              <button type="submit" class="small">Enviar</button>
            </form>
          </div>
        </div>
      </div>
    `;
    profileModal.style.display = "flex";

    // 🔧 Scroll para toda la ventana del perfil
    const scrollContainer = profileModalContent.querySelector(".profile-scroll");
    scrollContainer.style.maxHeight = "90vh";
    scrollContainer.style.overflowY = "auto";
    scrollContainer.style.scrollBehavior = "smooth";

    // Clic en producto dentro del perfil
    profileModalContent.querySelectorAll(".product").forEach((card) =>
      card.addEventListener("click", () => {
        const clicked = sellerProducts.find((p) => p.name === card.dataset.name);
        closeProfile();
        openProduct(clicked);
      })
    );

    // Formulario de reseñas
    const reviewForm = profileModalContent.querySelector("#review-form");
    const reviewsList = profileModalContent.querySelector("#reviews-list");
    reviewForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = reviewForm.querySelector("#review-name").value.trim();
      const stars = reviewForm.querySelector("#review-stars").value;
      const text = reviewForm.querySelector("#review-text").value.trim();
      reviewsList.innerHTML += `
        <div class="review"><div class="meta">${"⭐️".repeat(stars)} — ${name}</div><p>${text}</p></div>
      `;
      reviewForm.reset();
    });
  }

  // ❌ Cerrar perfil
  window.closeProfile = () => (profileModal.style.display = "none");

  // Cerrar modales al hacer clic fuera
  [productModal, profileModal].forEach((m) =>
    m.addEventListener("click", (e) => {
      if (e.target === m) m.style.display = "none";
    })
  );

  loadProducts();
});
