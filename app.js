========================= */

function setupButtons() {
  $("adminBtn")?.addEventListener("click", openAdmin);
  $("languageBtn")?.addEventListener("click", toggleLanguage);

  $("cartBtn")?.addEventListener("click", openCart);
  $("closeCart")?.addEventListener("click", closeCart);
  $("cartOverlay")?.addEventListener("click", closeCart);

  $("adminBtn")?.addEventListener("click", openAdmin);
  $("closeAdmin")?.addEventListener("click", closeAdmin);
  $("langBtn")?.addEventListener("click", toggleLanguage);

  $("whatsappOrder")?.addEventListener("click", checkoutWhatsApp);

  $("searchInput")?.addEventListener("input", filterProducts);
  $("categoryFilter")?.addEventListener("change", filterProducts);
@@ -37,7 +42,10 @@ function setupButtons() {
  $("logoutBtn")?.addEventListener("click", logoutAdmin);

  $("productForm")?.addEventListener("submit", saveProduct);
  $("cancelEdit")?.addEventListener("click", cancelEdit);
  $("cancelEditBtn")?.addEventListener("click", cancelEdit);

  $("productCategory")?.addEventListener("change", updateSwitchField);
  $("productImage")?.addEventListener("change", previewImage);
}

/* =========================
@@ -51,13 +59,16 @@ async function loadProducts() {
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    showProductsError();
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
@@ -67,26 +78,30 @@ function renderProducts(list) {

  if (!list.length) {
    container.innerHTML = `
      <div class="empty-products">
        <h3>No products found</h3>
        <p>Try another search or category.</p>
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
            ? `<img src="${escapeAttribute(product.image_url)}" alt="${escapeAttribute(product.name)}">`
            ? `<img src="${escapeHTML(product.image_url)}" alt="${escapeHTML(product.name)}">`
            : `<div class="no-image">AHSTORE</div>`
        }
      </div>

      <div class="product-info">
        <div class="product-brand">${escapeHTML(product.brand || "")}</div>

        <div class="product-brand">
          ${escapeHTML(product.brand || "")}
        </div>

        <h3>${escapeHTML(product.name)}</h3>

        <div class="product-meta">
@@ -99,19 +114,25 @@ function renderProducts(list) {
        </div>

        ${
          product.switch_type && product.category?.toLowerCase() === "keyboard"
            ? `<div class="switch-type">Switch: ${escapeHTML(product.switch_type)}</div>`
          product.switch_type &&
          product.category?.toLowerCase() === "keyboard"
            ? `<div class="switch-type">
                Switch: ${escapeHTML(product.switch_type)}
               </div>`
            : ""
        }

        <div class="price">
          $${Number(product.price_usd || 0).toFixed(2)}
          <small>${Number(product.price_iqd || 0).toLocaleString()} IQD</small>
          <small>
            ${Number(product.price_iqd || 0).toLocaleString()} IQD
          </small>
        </div>

        <button class="add-cart" onclick="addToCart('${product.id}')">
          ${language === "ku" ? "زیادکردن بۆ سەبەتە" : "Add to Cart"}
          ${language === "ku" ? "زیادکردن بۆ سەبەت" : "Add to Cart"}
        </button>

      </div>
    </div>
  `).join("");
@@ -122,39 +143,31 @@ function filterProducts() {
  const category = $("categoryFilter")?.value || "all";

  const filtered = products.filter(product => {
    const matchesSearch =
      `${product.name} ${product.brand} ${product.category}`
        .toLowerCase()
        .includes(search);
    const text = `
      ${product.name || ""}
      ${product.brand || ""}
      ${product.category || ""}
    `.toLowerCase();

    const searchMatch = text.includes(search);

    const matchesCategory =
    const categoryMatch =
      category === "all" ||
      (product.category || "").toLowerCase() === category.toLowerCase();

    return matchesSearch && matchesCategory;
    return searchMatch && categoryMatch;
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
@@ -178,12 +191,14 @@ function addToCart(id) {

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);

  saveCart();
  renderCart();
}

function changeQuantity(id, amount) {
  const item = cart.find(item => item.id === id);

  if (!item) return;

  item.quantity += amount;
@@ -198,172 +213,217 @@ function changeQuantity(id, amount) {
}

function saveCart() {
  localStorage.setItem("ahstore_cart", JSON.stringify(cart));
  localStorage.setItem(
    "ahstore_cart",
    JSON.stringify(cart)
  );
}

function renderCart() {
  const container = $("cartItems");
  const count = $("cartCount");
  const totalUSD = $("cartTotalUSD");
  const totalIQD = $("cartTotalIQD");
  const total = $("cartTotal");

  if (!container) return;

  const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  if (count) {
    count.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    count.textContent = totalItems;
  }

  if (!cart.length) {
    container.innerHTML = `
      <div class="empty-cart">
        <h3>${language === "ku" ? "سەبەتەکە بەتاڵە" : "Your cart is empty"}</h3>
      <div class="loading">
        ${language === "ku"
          ? "سەبەتەکە بەتاڵە"
          : "Your cart is empty"}
      </div>
    `;

    if (totalUSD) totalUSD.textContent = "$0.00";
    if (totalIQD) totalIQD.textContent = "0 IQD";
    if (total) {
      total.textContent = "$0";
    }

    return;
  }

  let usd = 0;
  let iqd = 0;
  let totalUSD = 0;

  container.innerHTML = cart.map(item => {
    usd += Number(item.price_usd || 0) * item.quantity;
    iqd += Number(item.price_iqd || 0) * item.quantity;

    totalUSD +=
      Number(item.price_usd || 0) *
      item.quantity;

    return `
      <div class="cart-item">

        <div>
          <strong>${escapeHTML(item.name)}</strong>
          <div>$${Number(item.price_usd || 0).toFixed(2)}</div>
          <div>
            $${Number(item.price_usd || 0).toFixed(2)}
          </div>
        </div>

        <div class="quantity">
          <button onclick="changeQuantity('${item.id}', -1)">−</button>

          <button onclick="changeQuantity('${item.id}', -1)">
            −
          </button>

          <span>${item.quantity}</span>
          <button onclick="changeQuantity('${item.id}', 1)">+</button>

          <button onclick="changeQuantity('${item.id}', 1)">
            +
          </button>

        </div>

        <button class="remove-cart" onclick="removeFromCart('${item.id}')">
        <button
          class="remove-cart"
          onclick="removeFromCart('${item.id}')">
          ×
        </button>

      </div>
    `;
  }).join("");

  if (totalUSD) totalUSD.textContent = `$${usd.toFixed(2)}`;
  if (totalIQD) totalIQD.textContent = `${iqd.toLocaleString()} IQD`;
  if (total) {
    total.textContent = `$${totalUSD.toFixed(2)}`;
  }
}

function openCart() {
  $("cartDrawer")?.classList.add("open");
  $("overlay")?.classList.add("show");
  $("cartOverlay")?.classList.remove("hidden");
}

function closeCart() {
  $("cartDrawer")?.classList.remove("open");
  $("overlay")?.classList.remove("show");
  $("cartOverlay")?.classList.add("hidden");
}

/* =========================
   WHATSAPP
========================= */

function checkoutWhatsApp() {
  if (!cart.length) {
    alert(language === "ku" ? "سەبەتەکە بەتاڵە" : "Your cart is empty.");
    alert(
      language === "ku"
        ? "سەبەتەکە بەتاڵە."
        : "Your cart is empty."
    );
    return;
  }

  let message =
    language === "ku"
      ? "سڵاو AHSTORE، دەمەوێت ئەم بەرهەمانە بکڕم:\n\n"
      : "Hello AHSTORE, I would like to order:\n\n";
      ? "سڵاو AH STORE، دەمەوێت ئەم بەرهەمانە داوا بکەم:\n\n"
      : "Hello AH STORE, I would like to order:\n\n";

  cart.forEach(item => {
    message += `• ${item.name} x${item.quantity}\n`;
    message +=
      `• ${item.name} x${item.quantity}\n`;
  });

  message +=
    language === "ku"
      ? "\nتکایە زانیارییەکانی داواکارییەکەم بۆ بنێرە."
      : "\nPlease send me the order details.";

  window.open(
    `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`,
    "_blank"
  );
  const url =
    `https://wa.me/${WHATSAPP}?text=` +
    encodeURIComponent(message);

  window.open(url, "_blank");
}

/* =========================
   LANGUAGE
========================= */

function toggleLanguage() {
  language = language === "en" ? "ku" : "en";
  localStorage.setItem("ahstore_language", language);
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
  document.documentElement.dir = language === "ku" ? "rtl" : "ltr";
  document.documentElement.lang = language === "ku" ? "ku" : "en";

  const langBtn = $("langBtn");
  if (langBtn) {
    langBtn.textContent = language === "ku" ? "English" : "کوردی";
  }
  document.documentElement.lang =
    language === "ku" ? "ku" : "en";

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
  document.documentElement.dir =
    language === "ku" ? "rtl" : "ltr";

  Object.entries(translations).forEach(([id, text]) => {
    const element = $(id);
    if (!element) return;
  const elements =
    document.querySelectorAll("[data-en]");

    if ("placeholder" in element) {
      element.placeholder = text[language];
    } else {
      element.textContent = text[language];
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
  $("adminModal")?.classList.add("show");
  $("overlay")?.classList.add("show");
  $("adminModal")?.classList.remove("hidden");

  checkAuth();
}

function closeAdmin() {
  $("adminModal")?.classList.remove("show");
  $("overlay")?.classList.remove("show");
  $("adminModal")?.classList.add("hidden");
}

async function checkAuth() {

  const {
    data: { session }
  } = await db.auth.getSession();
@@ -376,206 +436,411 @@ async function checkAuth() {
}

function showLoginPanel() {
  if ($("adminLogin")) $("adminLogin").style.display = "block";
  if ($("adminPanel")) $("adminPanel").style.display = "none";

  $("loginSection")?.classList.remove("hidden");

  $("adminPanel")?.classList.add("hidden");
}

function showAdminPanel() {
  if ($("adminLogin")) $("adminLogin").style.display = "none";
  if ($("adminPanel")) $("adminPanel").style.display = "block";

  $("loginSection")?.classList.add("hidden");

  $("adminPanel")?.classList.remove("hidden");

  renderAdminProducts();
}

async function loginAdmin(event) {

  event.preventDefault();

  const email = $("adminEmail")?.value.trim();
  const password = $("adminPassword")?.value;
  const email =
    $("adminEmail")?.value.trim();

  const password =
    $("adminPassword")?.value;

  const message =
    $("loginMessage");

  if (!email || !password) return;

  const { error } = await db.auth.signInWithPassword({
    email,
    password
  });
  const { error } =
    await db.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    alert("Login failed: " + error.message);

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
   ADMIN PRODUCTS
   ADD / EDIT PRODUCTS
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

  let imageUrl = editingId
    ? products.find(p => p.id === editingId)?.image_url || ""
    : "";
  /* IMAGE UPLOAD */

  if (imageFile) {

    const extension =
      imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
      imageFile.name
        .split(".")
        .pop()
        .toLowerCase();

    const fileName = `${crypto.randomUUID()}.${extension}`;
    const fileName =
      `${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await db.storage
      .from("products")
      .upload(fileName, imageFile);
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

    if (uploadError) {
      alert("Image upload failed: " + uploadError.message);
      return;
    }

    const { data } = db.storage
      .from("products")
      .getPublicUrl(fileName);
    const { data } =
      db.storage
        .from("products")
        .getPublicUrl(fileName);

    imageUrl = data.publicUrl;
    imageUrl =
      data.publicUrl;
  }

  const productData = {

    name,
    brand,
    category,
    price_usd: priceUSD,
    price_iqd: priceIQD,

    price_usd:
      priceUSD,

    price_iqd:
      priceIQD,

    connection,
    switch_type: category.toLowerCase() === "keyboard" ? switchType : null,
    image_url: imageUrl

    switch_type:
      category === "keyboard"
        ? switchType
        : null,

    image_url:
      imageUrl
  };

  let result;

  if (editingId) {
    result = await db
      .from("products")
      .update(productData)
      .eq("id", editingId);

    result =
      await db
        .from("products")
        .update(productData)
        .eq("id", editingId);

  } else {
    result = await db
      .from("products")
      .insert(productData);

    result =
      await db
        .from("products")
        .insert(productData);
  }

  if (result.error) {
    alert("Could not save product: " + result.error.message);

    alert(
      "Could not save product: " +
      result.error.message
    );

    return;
  }

  alert(editingId ? "Product updated!" : "Product added!");
  alert(
    editingId
      ? "Product updated!"
      : "Product added!"
  );

  editingId = null;
  $("productForm")?.reset();

  $("productForm").reset();

  $("cancelEditBtn")
    ?.classList.add("hidden");

  $("saveProductBtn").textContent =
    "ADD PRODUCT";

  await loadProducts();
  renderAdminProducts();
}

/* =========================
   ADMIN PRODUCT LIST
========================= */

function renderAdminProducts() {
  const container = $("adminProducts");

  const container =
    $("adminProductsList");

  if (!container) return;

  if (!products.length) {
    container.innerHTML = "<p>No products yet.</p>";

    container.innerHTML =
      "<p>No products yet.</p>";

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

      <div>
        <button onclick="editProduct('${product.id}')">Edit</button>
        <button onclick="deleteProduct('${product.id}')">Delete</button>
      </div>
    </div>
  `).join("");

    `).join("");
}

function editProduct(id) {
  const product = products.find(p => p.id === id);

  const product =
    products.find(p => p.id === id);

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
  $("productForm")?.reset();

  $("productForm").reset();

  $("cancelEditBtn")
    ?.classList.add("hidden");

  $("saveProductBtn").textContent =
    "ADD PRODUCT";

  updateSwitchField();
}

async function deleteProduct(id) {
  const product = products.find(p => p.id === id);

  const product =
    products.find(p => p.id === id);

  if (!product) return;

  if (!confirm(`Delete "${product.name}"?`)) return;
  const confirmed =
    confirm(
      `Delete "${product.name}"?`
    );

  const { error } = await db
    .from("products")
    .delete()
    .eq("id", id);
  if (!confirmed) return;

  const { error } =
    await db
      .from("products")
      .delete()
      .eq("id", id);

  if (error) {
    alert("Delete failed: " + error.message);

    alert(
      "Delete failed: " +
      error.message
    );

    return;
  }

  await loadProducts();
  renderAdminProducts();
}

/* =========================
   HELPERS
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
@@ -584,13 +849,12 @@ function escapeHTML(value) {
    .replace(/'/g, "&#039;");
}
function escapeAttribute(value) {
  return escapeHTML(value);
}
/* =========================
   GLOBAL FUNCTIONS
========================= */

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeQuantity = changeQuantity;
window.checkoutWhatsApp = checkoutWhatsApp;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;

