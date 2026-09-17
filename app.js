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
  $("languageBtn")?.addEventListener("click", toggleLanguage);

  $("cartBtn")?.addEventListener("click", openCart);
  $("closeCart")?.addEventListener("click", closeCart);
  $("cartOverlay")?.addEventListener("click", closeCart);

  $("adminBtn")?.addEventListener("click", openAdmin);
  $("closeAdmin")?.addEventListener("click", closeAdmin);

  $("whatsappOrder")?.addEventListener("click", checkoutWhatsApp);

  $("searchInput")?.addEventListener("input", filterProducts);
  $("categoryFilter")?.addEventListener("change", filterProducts);

  $("loginForm")?.addEventListener("submit", loginAdmin);
  $("logoutBtn")?.addEventListener("click", logoutAdmin);

  $("productForm")?.addEventListener("submit", saveProduct);
  $("cancelEditBtn")?.addEventListener("click", cancelEdit);

  $("productCategory")?.addEventListener("change", updateSwitchField);
  $("productImage")?.addEventListener("change", previewImage);
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
    console.error("Products error:", error);
    $("productsGrid").innerHTML = `
      <div class="loading">Unable to load products.</div>
    `;
    return;
  }

  products = data || [];
  renderProducts(products);
  renderAdminProducts();
}

function renderProducts(list) {
  const container = $("productsGrid");

  if (!container) return;

  if (!list.length) {
    container.innerHTML = `
      <div class="loading">
        No products found.
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(product => `
    <div class="product-card">

      <div class="product-image">
        ${
          product.image_url
            ? `<img src="${escapeHTML(product.image_url)}" alt="${escapeHTML(product.name)}">`
            : `<div class="no-image">AHSTORE</div>`
        }
      </div>

      <div class="product-info">

        <div class="product-brand">
          ${escapeHTML(product.brand || "")}
        </div>

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
          product.switch_type &&
          product.category?.toLowerCase() === "keyboard"
            ? `<div class="switch-type">
                Switch: ${escapeHTML(product.switch_type)}
               </div>`
            : ""
        }

        <div class="price">
          $${Number(product.price_usd || 0).toFixed(2)}
          <small>
            ${Number(product.price_iqd || 0).toLocaleString()} IQD
          </small>
        </div>

        <button class="add-cart" onclick="addToCart('${product.id}')">
          ${language === "ku" ? "زیادکردن بۆ سەبەت" : "Add to Cart"}
        </button>

      </div>
    </div>
  `).join("");
}

function filterProducts() {
  const search = ($("searchInput")?.value || "").toLowerCase();
  const category = $("categoryFilter")?.value || "all";

  const filtered = products.filter(product => {
    const text = `
      ${product.name || ""}
      ${product.brand || ""}
      ${product.category || ""}
    `.toLowerCase();

    const searchMatch = text.includes(search);

    const categoryMatch =
      category === "all" ||
      (product.category || "").toLowerCase() === category.toLowerCase();

    return searchMatch && categoryMatch;
  });

  renderProducts(filtered);
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
  localStorage.setItem(
    "ahstore_cart",
    JSON.stringify(cart)
  );
}

function renderCart() {
  const container = $("cartItems");
  const count = $("cartCount");
  const total = $("cartTotal");

  if (!container) return;

  const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  if (count) {
    count.textContent = totalItems;
  }

  if (!cart.length) {
    container.innerHTML = `
      <div class="loading">
        ${language === "ku"
          ? "سەبەتەکە بەتاڵە"
          : "Your cart is empty"}
      </div>
    `;

    if (total) {
      total.textContent = "$0";
    }

    return;
  }

  let totalUSD = 0;

  container.innerHTML = cart.map(item => {

    totalUSD +=
      Number(item.price_usd || 0) *
      item.quantity;

    return `
      <div class="cart-item">

        <div>
          <strong>${escapeHTML(item.name)}</strong>
          <div>
            $${Number(item.price_usd || 0).toFixed(2)}
          </div>
        </div>

        <div class="quantity">

          <button onclick="changeQuantity('${item.id}', -1)">
            −
          </button>

          <span>${item.quantity}</span>

          <button onclick="changeQuantity('${item.id}', 1)">
            +
          </button>

        </div>

        <button
          class="remove-cart"
          onclick="removeFromCart('${item.id}')">
          ×
        </button>

      </div>
    `;
  }).join("");

  if (total) {
    total.textContent = `$${totalUSD.toFixed(2)}`;
  }
}

function openCart() {
  $("cartDrawer")?.classList.add("open");
  $("cartOverlay")?.classList.remove("hidden");
}

function closeCart() {
  $("cartDrawer")?.classList.remove("open");
  $("cartOverlay")?.classList.add("hidden");
}

/* =========================
   WHATSAPP
========================= */

function checkoutWhatsApp() {
  if (!cart.length) {
    alert(
      language === "ku"
        ? "سەبەتەکە بەتاڵە."
        : "Your cart is empty."
    );
    return;
  }

  let message =
    language === "ku"
      ? "سڵاو AH STORE، دەمەوێت ئەم بەرهەمانە داوا بکەم:\n\n"
      : "Hello AH STORE, I would like to order:\n\n";

  cart.forEach(item => {
    message +=
      `• ${item.name} x${item.quantity}\n`;
  });

  message +=
    language === "ku"
      ? "\nتکایە زانیارییەکانی داواکارییەکەم بۆ بنێرە."
      : "\nPlease send me the order details.";

  const url =
    `https://wa.me/${WHATSAPP}?text=` +
    encodeURIComponent(message);

  window.open(url, "_blank");
}

/* =========================
   LANGUAGE
========================= */

function toggleLanguage() {
  language =
    language === "en"
      ? "ku"
      : "en";

  localStorage.setItem(
    "ahstore_language",
    language
  );

  applyLanguage();
  renderProducts(products);
  renderCart();
}

function applyLanguage() {

  document.documentElement.lang =
    language === "ku" ? "ku" : "en";

  document.documentElement.dir =
    language === "ku" ? "rtl" : "ltr";

  const elements =
    document.querySelectorAll("[data-en]");

  elements.forEach(element => {

    const text =
      language === "ku"
        ? element.dataset.ku
        : element.dataset.en;

    if (text) {
      element.textContent = text;
    }
  });

  const input =
    $("searchInput");

  if (input) {
    input.placeholder =
      language === "ku"
        ? input.dataset.placeholderKu
        : input.dataset.placeholderEn;
  }

  const languageButton =
    $("languageBtn");

  if (languageButton) {
    languageButton.textContent =
      language === "ku"
        ? "English"
        : "کوردی";
  }
}

/* =========================
   ADMIN
========================= */

function openAdmin() {
  $("adminModal")?.classList.remove("hidden");

  checkAuth();
}

function closeAdmin() {
  $("adminModal")?.classList.add("hidden");
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

  $("loginSection")?.classList.remove("hidden");

  $("adminPanel")?.classList.add("hidden");
}

function showAdminPanel() {

  $("loginSection")?.classList.add("hidden");

  $("adminPanel")?.classList.remove("hidden");

  renderAdminProducts();
}

async function loginAdmin(event) {

  event.preventDefault();

  const email =
    $("adminEmail")?.value.trim();

  const password =
    $("adminPassword")?.value;

  const message =
    $("loginMessage");

  if (!email || !password) return;

  const { error } =
    await db.auth.signInWithPassword({
      email,
      password
    });

  if (error) {

    if (message) {
      message.textContent =
        "Login failed: " + error.message;
    }

    return;
  }

  if (message) {
    message.textContent = "";
  }

  showAdminPanel();
}

async function logoutAdmin() {

  await db.auth.signOut();

  showLoginPanel();
}

/* =========================
   ADD / EDIT PRODUCTS
========================= */

async function saveProduct(event) {

  event.preventDefault();

  const name =
    $("productName").value.trim();

  const brand =
    $("productBrand").value.trim();

  const category =
    $("productCategory").value;

  const priceUSD =
    Number($("productUSD").value || 0);

  const priceIQD =
    Number($("productIQD").value || 0);

  const connection =
    $("productConnection").value;

  const switchType =
    $("productSwitch").value.trim();

  const imageFile =
    $("productImage").files?.[0];

  let imageUrl = "";

  if (editingId) {

    const oldProduct =
      products.find(p => p.id === editingId);

    imageUrl =
      oldProduct?.image_url || "";
  }

  /* IMAGE UPLOAD */

  if (imageFile) {

    const extension =
      imageFile.name
        .split(".")
        .pop()
        .toLowerCase();

    const fileName =
      `${crypto.randomUUID()}.${extension}`;

    const { error } =
      await db.storage
        .from("products")
        .upload(
          fileName,
          imageFile
        );

    if (error) {

      alert(
        "Image upload failed: " +
        error.message
      );

      return;
    }

    const { data } =
      db.storage
        .from("products")
        .getPublicUrl(fileName);

    imageUrl =
      data.publicUrl;
  }

  const productData = {

    name,
    brand,
    category,

    price_usd:
      priceUSD,

    price_iqd:
      priceIQD,

    connection,

    switch_type:
      category === "keyboard"
        ? switchType
        : null,

    image_url:
      imageUrl
  };

  let result;

  if (editingId) {

    result =
      await db
        .from("products")
        .update(productData)
        .eq("id", editingId);

  } else {

    result =
      await db
        .from("products")
        .insert(productData);
  }

  if (result.error) {

    alert(
      "Could not save product: " +
      result.error.message
    );

    return;
  }

  alert(
    editingId
      ? "Product updated!"
      : "Product added!"
  );

  editingId = null;

  $("productForm").reset();

  $("cancelEditBtn")
    ?.classList.add("hidden");

  $("saveProductBtn").textContent =
    "ADD PRODUCT";

  await loadProducts();
}

/* =========================
   ADMIN PRODUCT LIST
========================= */

function renderAdminProducts() {

  const container =
    $("adminProductsList");

  if (!container) return;

  if (!products.length) {

    container.innerHTML =
      "<p>No products yet.</p>";

    return;
  }

  container.innerHTML =
    products.map(product => `

      <div class="admin-product">

        <div>

          <strong>
            ${escapeHTML(product.name)}
          </strong>

          <small>
            $${Number(product.price_usd || 0).toFixed(2)}
            /
            ${Number(product.price_iqd || 0).toLocaleString()}
            IQD
          </small>

        </div>

        <div>

          <button
            onclick="editProduct('${product.id}')">
            Edit
          </button>

          <button
            onclick="deleteProduct('${product.id}')">
            Delete
          </button>

        </div>

      </div>

    `).join("");
}

function editProduct(id) {

  const product =
    products.find(p => p.id === id);

  if (!product) return;

  editingId = id;

  $("productName").value =
    product.name || "";

  $("productBrand").value =
    product.brand || "";

  $("productCategory").value =
    product.category || "other";

  $("productUSD").value =
    product.price_usd || "";

  $("productIQD").value =
    product.price_iqd || "";

  $("productConnection").value =
    product.connection || "Wired";

  $("productSwitch").value =
    product.switch_type || "";

  $("saveProductBtn").textContent =
    "UPDATE PRODUCT";

  $("cancelEditBtn")
    ?.classList.remove("hidden");

  updateSwitchField();
}

function cancelEdit() {

  editingId = null;

  $("productForm").reset();

  $("cancelEditBtn")
    ?.classList.add("hidden");

  $("saveProductBtn").textContent =
    "ADD PRODUCT";

  updateSwitchField();
}

async function deleteProduct(id) {

  const product =
    products.find(p => p.id === id);

  if (!product) return;

  const confirmed =
    confirm(
      `Delete "${product.name}"?`
    );

  if (!confirmed) return;

  const { error } =
    await db
      .from("products")
      .delete()
      .eq("id", id);

  if (error) {

    alert(
      "Delete failed: " +
      error.message
    );

    return;
  }

  await loadProducts();
}

/* =========================
   SWITCH TYPE
========================= */

function updateSwitchField() {

  const category =
    $("productCategory")?.value;

  const field =
    $("switchField");

  if (!field) return;

  if (category === "keyboard") {
    field.classList.remove("hidden");
  } else {
    field.classList.add("hidden");
  }
}

/* =========================
   IMAGE PREVIEW
========================= */

function previewImage() {

  const file =
    $("productImage")?.files?.[0];

  const preview =
    $("imagePreview");

  if (!file || !preview) return;

  preview.src =
    URL.createObjectURL(file);

  preview.classList.remove("hidden");
}

/* =========================
   SECURITY / HTML
========================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================
   GLOBAL FUNCTIONS
========================= */

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeQuantity = changeQuantity;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
