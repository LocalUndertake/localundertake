let allProducts = [];

function escapeHtml(t){return t?String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}

function createProductCard(p){
  const div=document.createElement("div");
  div.className="product";
  div.innerHTML=`
    <img src="${p.image||"assets/default-product.png"}" alt="${escapeHtml(p.name)}">
    <div class="product-info">
      <h3>${escapeHtml(p.name)}</h3>
      <p>${Number(p.price).toFixed(2)}€ • ${p.category||"Sin categoría"}</p>
    </div>`;
  div.addEventListener("click",()=>openModal(p));
  return div;
}

async function loadProducts(){
  const container=document.getElementById("product-list");
  container.innerHTML="<p>Cargando productos...</p>";
  try{
    const res=await fetch("data/products.json");
    const json=await res.json();
    const local=JSON.parse(localStorage.getItem("localundertake_products")||"[]");
    allProducts=[...local,...json];
    renderFiltered();
  }catch(e){
    container.innerHTML="<p>Error al cargar productos 😔</p>";
  }
}

function renderFiltered(){
  const search=document.getElementById("search-input").value.toLowerCase();
  const filter=document.getElementById("filter-category").value;
  const container=document.getElementById("product-list");
  container.innerHTML="";
  const filtered=allProducts.filter(p=>{
    const matchText=p.name.toLowerCase().includes(search)||p.seller.toLowerCase().includes(search);
    const matchCat=!filter||p.category===filter;
    return matchText&&matchCat;
  });
  if(filtered.length===0){
    container.innerHTML="<p>Sin resultados 😔</p>";
    return;
  }
  filtered.forEach(p=>container.appendChild(createProductCard(p)));
}

function openModal(p){
  const modal=document.getElementById("product-modal");
  document.getElementById("modal-image").src=p.image||"assets/default-product.png";
  document.getElementById("modal-name").textContent=p.name;
  document.getElementById("modal-price").textContent=`💰 ${Number(p.price).toFixed(2)}€`;
  document.getElementById("modal-seller").textContent=`👤 ${p.seller}`;
  document.getElementById("modal-category").textContent=`📦 Categoría: ${p.category||"Sin categoría"}`;
  document.getElementById("modal-achievement").textContent=p.achievement||"";
  modal.style.display="flex";
}
function closeModal(){document.getElementById("product-modal").style.display="none";}

function addLocalProduct(p){
  const key="localundertake_products";
  const local=JSON.parse(localStorage.getItem(key)||"[]");
  local.unshift(p);
  localStorage.setItem(key,JSON.stringify(local));
  loadProducts();
}
function clearLocalProducts(){
  if(confirm("¿Borrar todos los productos locales?")){
    localStorage.removeItem("localundertake_products");
    loadProducts();
  }
}

function setup(){
  const form=document.getElementById("add-product-form");
  form.addEventListener("submit",e=>{
    e.preventDefault();
    const name=form["product-name"].value.trim();
    const price=Number(form["product-price"].value);
    const seller=form["product-seller"].value.trim();
    const image=form["product-image"].value.trim();
    const category=form["product-category"].value;
    if(!name||!seller||!category||isNaN(price)){
      alert("Por favor, completa todos los campos correctamente.");
      return;
    }
    const product={name,price,seller,image:image||null,category,achievement:"🆕 Añadido localmente"};
    addLocalProduct(product);
    form.reset();
  });
  document.getElementById("clear-local").addEventListener("click",clearLocalProducts);
  document.getElementById("close-modal").addEventListener("click",closeModal);
  window.addEventListener("click",e=>{if(e.target.id==="product-modal")closeModal();});
  document.getElementById("search-input").addEventListener("input",renderFiltered);
  document.getElementById("filter-category").addEventListener("change",renderFiltered);
}

document.addEventListener("DOMContentLoaded",()=>{setup();loadProducts();});
