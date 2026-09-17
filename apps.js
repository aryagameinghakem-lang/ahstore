const SUPABASE_URL = "https://toeqdxunmvspulvkpdow.supabase.co";
const SUPABASE_KEY = "sb_publishable_JsjlGkffizJ1Ap7oPCAQ6Q_8TJ64tw0";
const WHATSAPP = "9647701068935";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let products = [];
let cart = JSON.parse(localStorage.getItem("ahstore_cart") || "[]");
let language = localStorage.getItem("ahstore_language") || "en";
let editingId = null;

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
  setupButtons();
  applyLanguage();
  renderCart();
  loadProducts();
  checkAuth();
});

/* =========================
   BUTTONS
========================= */

function setupButtons() {
  $("adminBtn")?.addEventListener("click", openAdmin);
  $("cartBtn")?.addEventListener("click", openCart);
  $("closeCart")?.addEventListener("click", closeCart);
  $("closeAdmin")?.addEventListener("click", closeAdmin);
  $("langBtn")?.addEventListener("click", toggleLanguage);

  $("searchInput")?.addEventListener("input", filterProducts);
  $("categoryFilter")?.addEventListener("change", filterProducts);

  $("loginForm")?.addEventListener("submit", loginAdmin);
  $("logoutBtn")?.addEventListener("click", logoutAdmin);

  $("productForm")?.addEventListener("submit", saveProduct);
  $("cancelEdit")?.addEventListener("click", cancelEdit);
}

/* =========================
   PRODUCTS
========================= */

async function loadProducts() {
  const { data, error } = await db
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    showProductsError();
    return;
  }

  products = data || [];
  renderProducts(products);
}

function renderProducts(list) {
  const container = $("productsGrid");

  if (!container) return;

  if (!list.length) {
    container.innerHTML = `
      <div class="empty-products">
        <h3>No products found</h3>
        <p>Try another search or category.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(product => `
    <div class="product-card">
      <div class="product-image">
        ${
          product.image_url
            ? `<img src="${escapeAttribute(product.image_url)}" alt="${escapeAttribute(product.name)}">`
            : `<div class="no-image">AHSTORE</div>`
        }
      </div>

      <div class="product-info">
        <div class="product-brand">${escapeHTML(product.brand || "")}</div>
        <h3>${escapeHTML(product.name)}</h3>

        <div class="product-meta">
          <span>${escapeHTML(product.category || "")}</span>
          ${
            product.connection
              ? `<span>${escapeHTML(product.connection)}</span>`
              : ""
          }
        </div>

        ${
          product.switch_type && product.category?.toLowerCase() === "keyboard"
            ? `<div class="switch-type">Switch: ${escapeHTML(product.switch_type)}</div>`
            : ""
        }

        <div class="price">
          $${Number(product.price_usd || 0).toFixed(2)}
          <small>${Number(product.price_iqd || 0).toLocaleString()} IQD</small>
        </div>

        <button class="add-cart" onclick="addToCart('${product.id}')">
          ${language === "ku" ? "زیادکردن بۆ سەبەتە" : "Add to Cart"}
        </button>
      </div>
    </div>
  `).join("");
}

function filterProducts() {
  const search = ($("searchInput")?.value || "").toLowerCase();
  const category = $("categoryFilter")?.value || "all";

  const filtered = products.filter(product => {
    const matchesSearch =
      `${product.name} ${product.brand} ${product.category}`
        .toLowerCase()
        .includes(search);

    const matchesCategory =
      category === "all" ||
      (product.category || "").toLowerCase() === category.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  renderProducts(filtered);
}

function showProductsError() {
  const container = $("productsGrid");
  if (container) {
    container.innerHTML = `
      <div class="empty-products">
        <h3>Unable to load products</h3>
        <p>Please refresh the page.</p>
      </div>
    `;
  }
}

/* =========================
   CART
========================= */

function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price_usd: product.price_usd,
      price_iqd: product.price_iqd,
      quantity: 1
    });
  }

  saveCart();
  renderCart();
  openCart();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  renderCart();
}

function changeQuantity(id, amount) {
  const item = cart.find(item => item.id === id);
  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    removeFromCart(id);
    return;
  }

  saveCart();
  renderCart();
}

function saveCart() {
  localStorage.setItem("ahstore_cart", JSON.stringify(cart));
}

function renderCart() {
  const container = $("cartItems");
  const count = $("cartCount");
  const totalUSD = $("cartTotalUSD");
  const totalIQD = $("cartTotalIQD");

  if (!container) return;

  if (count) {
    count.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  if (!cart.length) {
    container.innerHTML = `
      <div class="empty-cart">
        <h3>${language === "ku" ? "سەبەتەکە بەتاڵە" : "Your cart is empty"}</h3>
      </div>
    `;

    if (totalUSD) totalUSD.textContent = "$0.00";
    if (totalIQD) totalIQD.textContent = "0 IQD";
    return;
  }

  let usd = 0;
  let iqd = 0;

  container.innerHTML = cart.map(item => {
    usd += Number(item.price_usd || 0) * item.quantity;
    iqd += Number(item.price_iqd || 0) * item.quantity;

    return `
      <div class="cart-item">
        <div>
          <strong>${escapeHTML(item.name)}</strong>
          <div>$${Number(item.price_usd || 0).toFixed(2)}</div>
        </div>

        <div class="quantity">
          <button onclick="changeQuantity('${item.id}', -1)">−</button>
          <span>${item.quantity}</span>
          <button onclick="changeQuantity('${item.id}', 1)">+</button>
        </div>

        <button class="remove-cart" onclick="removeFromCart('${item.id}')">
          ×
        </button>
      </div>
    `;
  }).join("");

  if (totalUSD) totalUSD.textContent = `$${usd.toFixed(2)}`;
  if (totalIQD) totalIQD.textContent = `${iqd.toLocaleString()} IQD`;
}

function openCart() {
  $("cartDrawer")?.classList.add("open");
  $("overlay")?.classList.add("show");
}

function closeCart() {
  $("cartDrawer")?.classList.remove("open");
  $("overlay")?.classList.remove("show");
}

function checkoutWhatsApp() {
  if (!cart.length) {
    alert(language === "ku" ? "سەبەتەکە بەتاڵە" : "Your cart is empty.");
    return;
  }

  let message =
    language === "ku"
      ? "سڵاو AHSTORE، دەمەوێت ئەم بەرهەمانە بکڕم:\n\n"
      : "Hello AHSTORE, I would like to order:\n\n";

  cart.forEach(item => {
    message += `• ${item.name} x${item.quantity}\n`;
  });

  message +=
    language === "ku"
      ? "\nتکایە زانیارییەکانی داواکارییەکەم بۆ بنێرە."
      : "\nPlease send me the order details.";

  window.open(
    `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`,
    "_blank"
  );
}

/* =========================
   LANGUAGE
========================= */

function toggleLanguage() {
  language = language === "en" ? "ku" : "en";
  localStorage.setItem("ahstore_language", language);
  applyLanguage();
  renderProducts(products);
  renderCart();
}

function applyLanguage() {
  document.documentElement.dir = language === "ku" ? "rtl" : "ltr";
  document.documentElement.lang = language === "ku" ? "ku" : "en";

  const langBtn = $("langBtn");
  if (langBtn) {
    langBtn.textContent = language === "ku" ? "English" : "کوردی";
  }

  const translations = {
    heroTitle: {
      en: "LEVEL UP YOUR SETUP.",
      ku: "سیستەمەکەت بەرزتر بکەرەوە."
    },
    heroText: {
      en: "Gaming gear built for players.",
      ku: "کەرەستەی گەیمینگ بۆ یاریزانان."
    },
    productsTitle: {
      en: "OUR PRODUCTS",
      ku: "بەرهەمەکانمان"
    },
    searchInput: {
      en: "Search products...",
      ku: "گەڕان بۆ بەرهەم..."
    },
    aboutTitle: {
      en: "ABOUT AHSTORE",
      ku: "دەربارەی AHSTORE"
    }
  };

  Object.entries(translations).forEach(([id, text]) => {
    const element = $(id);
    if (!element) return;

    if ("placeholder" in element) {
      element.placeholder = text[language];
    } else {
      element.textContent = text[language];
    }
  });
}

/* =========================
   ADMIN
========================= */

function openAdmin() {
  $("adminModal")?.classList.add("show");
  $("overlay")?.classList.add("show");
  checkAuth();
}

function closeAdmin() {
  $("adminModal")?.classList.remove("show");
  $("overlay")?.classList.remove("show");
}

async function checkAuth() {
  const {
    data: { session }
  } = await db.auth.getSession();

  if (session) {
    showAdminPanel();
  } else {
    showLoginPanel();
  }
}

function showLoginPanel() {
  if ($("adminLogin")) $("adminLogin").style.display = "block";
  if ($("adminPanel")) $("adminPanel").style.display = "none";
}

function showAdminPanel() {
  if ($("adminLogin")) $("adminLogin").style.display = "none";
  if ($("adminPanel")) $("adminPanel").style.display = "block";

  renderAdminProducts();
}

async function loginAdmin(event) {
  event.preventDefault();

  const email = $("adminEmail")?.value.trim();
  const password = $("adminPassword")?.value;

  if (!email || !password) return;

  const { error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert("Login failed: " + error.message);
    return;
  }

  showAdminPanel();
}

async function logoutAdmin() {
  await db.auth.signOut();
  showLoginPanel();
}

/* =========================
   ADMIN PRODUCTS
========================= */

async function saveProduct(event) {
  event.preventDefault();

  const name = $("productName")?.value.trim();
  const brand = $("productBrand")?.value.trim();
  const category = $("productCategory")?.value;
  const priceUSD = Number($("productUSD")?.value || 0);
  const priceIQD = Number($("productIQD")?.value || 0);
  const connection = $("productConnection")?.value || "";
  const switchType = $("productSwitch")?.value || "";
  const imageFile = $("productImage")?.files?.[0];

  if (!name || !category) {
    alert("Please enter the product name and category.");
    return;
  }

  let imageUrl = editingId
    ? products.find(p => p.id === editingId)?.image_url || ""
    : "";

  if (imageFile) {
    const extension =
      imageFile.name.split(".").pop()?.toLowerCase() || "jpg";

    const fileName = `${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await db.storage
      .from("products")
      .upload(fileName, imageFile);

    if (uploadError) {
      alert("Image upload failed: " + uploadError.message);
      return;
    }

    const { data } = db.storage
      .from("products")
      .getPublicUrl(fileName);

    imageUrl = data.publicUrl;
  }

  const productData = {
    name,
    brand,
    category,
    price_usd: priceUSD,
    price_iqd: priceIQD,
    connection,
    switch_type: category.toLowerCase() === "keyboard" ? switchType : null,
    image_url: imageUrl
  };

  let result;

  if (editingId) {
    result = await db
      .from("products")
      .update(productData)
      .eq("id", editingId);
  } else {
    result = await db
      .from("products")
      .insert(productData);
  }

  if (result.error) {
    alert("Could not save product: " + result.error.message);
    return;
  }

  alert(editingId ? "Product updated!" : "Product added!");

  editingId = null;
  $("productForm")?.reset();

  await loadProducts();
  renderAdminProducts();
}

function renderAdminProducts() {
  const container = $("adminProducts");
  if (!container) return;

  if (!products.length) {
    container.innerHTML = "<p>No products yet.</p>";
    return;
  }

  container.innerHTML = products.map(product => `
    <div class="admin-product">
      <div>
        <strong>${escapeHTML(product.name)}</strong>
        <small>
          $${Number(product.price_usd || 0).toFixed(2)}
          /
          ${Number(product.price_iqd || 0).toLocaleString()} IQD
        </small>
      </div>

      <div>
        <button onclick="editProduct('${product.id}')">Edit</button>
        <button onclick="deleteProduct('${product.id}')">Delete</button>
      </div>
    </div>
  `).join("");
}

function editProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  editingId = id;

  $("productName").value = product.name || "";
  $("productBrand").value = product.brand || "";
  $("productCategory").value = product.category || "";
  $("productUSD").value = product.price_usd || "";
  $("productIQD").value = product.price_iqd || "";
  $("productConnection").value = product.connection || "";
  $("productSwitch").value = product.switch_type || "";

  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth"
  });
}

function cancelEdit() {
  editingId = null;
  $("productForm")?.reset();
}

async function deleteProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  if (!confirm(`Delete "${product.name}"?`)) return;

  const { error } = await db
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Delete failed: " + error.message);
    return;
  }

  await loadProducts();
  renderAdminProducts();
}

/* =========================
   HELPERS
========================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHTML(value);
}

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeQuantity = changeQuantity;
window.checkoutWhatsApp = checkoutWhatsApp;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
