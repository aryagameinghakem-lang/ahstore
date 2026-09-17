```javascript
// ==========================================
// AH STORE - APP.JS
// Supabase + Products + Cart + Admin
// ==========================================

const SUPABASE_URL = "https://toeqdxunmvspulvkpdow.supabase.co";
const SUPABASE_KEY = "sb_publishable_JsjlGkffizJ1Ap7oPCAQ6Q_8TJ64tw0";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const WHATSAPP_NUMBER = "9647701068935";

let products = [];
let cart = [];
let currentLanguage = "en";
let editingProductId = null;
let currentDetailsProduct = null;

// ==========================================
// START
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  setupButtons();
  setupSearch();
  setupLanguage();
  setupAdmin();
  setupProductForm();
  updateSwitchField();

  loadProducts();
});

// ==========================================
// LOAD PRODUCTS
// ==========================================

async function loadProducts() {
  const grid = document.getElementById("productsGrid");

  try {
    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Products loading error:", error);

      if (grid) {
        grid.innerHTML = `
          <div class="loading">
            Failed to load products.
          </div>
        `;
      }

      return;
    }

    products = data || [];

    console.log("Products loaded:", products);

    renderProducts(products);
    renderAdminProducts();
  } catch (error) {
    console.error("Unexpected loading error:", error);
  }
}

// ==========================================
// RENDER PRODUCTS
// ==========================================

function renderProducts(list) {
  const grid = document.getElementById("productsGrid");

  if (!grid) return;

  grid.innerHTML = "";

  if (!list || list.length === 0) {
    grid.innerHTML = `
      <div class="loading">
        No products found.
      </div>
    `;
    return;
  }

  list.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";

    const imageArea = document.createElement("div");

    if (product.image_url) {
      const img = document.createElement("img");
      img.className = "product-image";
      img.src = product.image_url;
      img.alt = product.name || "Product";
      img.loading = "lazy";

      img.onerror = () => {
        imageArea.innerHTML = `<div class="no-image">NO IMAGE</div>`;
      };

      imageArea.appendChild(img);
    } else {
      imageArea.innerHTML = `<div class="no-image">NO IMAGE</div>`;
    }

    const info = document.createElement("div");
    info.className = "product-info";

    const brand
```
