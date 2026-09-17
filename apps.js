const SUPABASE_URL = "https://toeqdxunmvspulvkpdow.supabase.co";
const SUPABASE_KEY = "sb_publishable_JsjlGkffizJ1Ap7oPCAQ6Q_8TJ64tw0";
const WHATSAPP = "9647701068935";

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

let products = [];
let cart = JSON.parse(localStorage.getItem("ahstore_cart") || "[]");
let editingId = null;
let currentLanguage = localStorage.getItem("ahstore_language") || "en";

const $ = (id) => document.getElementById(id);

/* =========================
   LANGUAGE
========================= */

function updateLanguage() {
  document.documentElement.lang = currentLanguage;
  document.body.classList.toggle("rtl", currentLanguage === "ku");

  document.querySelectorAll("[data-en][data-ku]").forEach((el) => {
    el.textContent = currentLanguage === "ku"
      ? el.dataset.ku
      : el.dataset.en;
  });

  document.querySelectorAll("[data-placeholder-en][data-placeholder-ku]").forEach((el) => {
    el.placeholder = currentLanguage === "ku"
      ? el.dataset.placeholderKu
      : el.dataset.placeholderEn;
  });

  $("languageBtn").textContent =
    currentLanguage === "en" ? "کوردی" : "English";

  renderProducts();
  renderCart();
}

$("languageBtn").addEventListener("click", () => {
  currentLanguage = currentLanguage === "en" ? "ku" : "en";
  localStorage.setItem("ahstore_language", currentLanguage);
  updateLanguage();
});


/* =========================
   PRODUCTS
========================= */

async function loadProducts() {
  $("productsGrid").innerHTML =
    `<div class="loading">${currentLanguage === "ku" ? "بەرهەمەکان بار دەکرێن..." : "Loading products..."}</div>`;

  const { data, error } = await db
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    $("productsGrid").innerHTML =
      `<div class="empty-products">Unable to load products.</div>`;
    return;
  }

  products = data || [];
  renderProducts();
  renderAdminProducts();
}

function getCategoryName(category) {
  const names = {
    keyboard: ["Keyboards", "کیبۆرد"],
    mouse: ["Mice", "ماوس"],
    headset: ["Headsets", "هێدسێت"],
    mousepad: ["Mousepads", "ماوس پاد"],
    controller: ["Controllers", "کۆنتڕۆڵەر"],
    monitor: ["Monitors", "مۆنیتەر"],
    accessories: ["Accessories", "ئاکسسواری"],
    other: ["Other", "هی تر"]
  };

  return names[category]
    ? names[category][currentLanguage === "ku" ? 1 : 0]
    : category || "";
}

function renderProducts() {
  const grid = $("productsGrid");
  const search = $("searchInput").value.toLowerCase().trim();
  const category = $("categoryFilter").value;

  const filtered = products.filter((product) => {
    const matchesSearch =
      !search ||
      `${product.name} ${product.brand || ""} ${product.category || ""}`
        .toLowerCase()
        .includes(search);

    const matchesCategory =
      category === "all" || product.category === category;

    return matchesSearch && matchesCategory;
  });

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-products">
        ${currentLanguage === "ku"
          ? "هیچ بەرهەمێک نەدۆزرایەوە."
          : "No products found."}
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map((product) => {
    const image = product.image_url ||
      "https://via.placeholder.com/600x400/07101b/00e5ff?text=AH+STORE";

    const connection = product.connection
      ? `<span class="detail-tag">📡 ${escapeHTML(product.connection)}</span>`
      : "";

    const switchType = product.switch_type
      ? `<span class="detail-tag">⌨️ ${escapeHTML(product.switch_type)}</span>`
      : "";

    return `
      <article class="product-card">
        <img
          class="product-image"
          src="${escapeAttribute(image)}"
          alt="${escapeAttribute(product.name)}"
          loading="lazy"
        >

        <div class="product-info">
          <div class="product-brand">
            ${escapeHTML(product.brand || "AH STORE")}
          </div>

          <div class="product-name">
            ${escapeHTML(product.name)}
          </div>

          <div class="product-details">
            <span class="detail-tag">
              ${escapeHTML(getCategoryName(product.category))}
            </span>
            ${connection}
            ${switchType}
          </div>

          <div class="product-price">
            <div class="price-usd">
              $${Number(product.price_usd || 0).toFixed(2)}
            </div>

            <div class="price-iqd">
              ${formatIQD(product.price_iqd)} IQD
            </div>
          </div>

          <button
            class="add-cart"
            onclick="addToCart('${product.id}')"
          >
            ${currentLanguage === "ku"
              ? "➕ زیادکردن بۆ سەبەت"
              : "➕ ADD TO CART"}
          </button>
        </div>
      </article>
    `;
  }).join("");
}

$("searchInput").addEventListener("input", renderProducts);
$("categoryFilter").addEventListener("change", renderProducts);


/* =========================
   CART
========================= */

function saveCart() {
  localStorage.setItem("ahstore_cart", JSON.stringify(cart));
}

function addToCart(id) {
  const product = products.find((p) => String(p.id) === String(id));
  if (!product) return;

  const existing = cart.find((item) => String(item.id) === String(id));

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price_usd: Number(product.price_usd || 0),
      price_iqd: Number(product.price_iqd || 0),
      image_url: product.image_url || "",
      quantity: 1
    });
  }

  saveCart();
  renderCart();
  openCart();
}

function removeFromCart(id) {
  cart = cart.filter((item) => String(item.id) !== String(id));
  saveCart();
  renderCart();
}

function changeQuantity(id, amount) {
  const item = cart.find((x) => String(x.id) === String(id));
  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    removeFromCart(id);
    return;
  }

  saveCart();
  renderCart();
}

function renderCart() {
  $("cartCount").textContent =
    cart.reduce((total, item) => total + item.quantity, 0);

  const container = $("cartItems");

  if (!cart.length) {
    container.innerHTML = `
      <div class="empty-products">
        ${currentLanguage === "ku"
          ? "سەبەتەکە بەتاڵە."
          : "Your cart is empty."}
      </div>`;
    $("cartTotal").textContent = "$0";
    return;
  }

  let totalUSD = 0;

  container.innerHTML = cart.map((item) => {
    totalUSD += item.price_usd * item.quantity;

    return `
      <div class="cart-item">
        <img
          src="${escapeAttribute(item.image_url || "https://via.placeholder.com/100")}"
          alt=""
        >

        <div class="cart-item-info">
          <div class="cart-item-name">
            ${escapeHTML(item.name)}
          </div>

          <div class="cart-item-price">
            $${item.price_usd.toFixed(2)}
          </div>

          <div style="margin-top:8px;display:flex;gap:7px;align-items:center;">
            <button class="edit-btn"
              onclick="changeQuantity('${item.id}', -1)">−</button>

            <span>${item.quantity}</span>

            <button class="edit-btn"
              onclick="changeQuantity('${item.id}', 1)">+</button>
          </div>
        </div>

        <button
          class="remove-cart"
          onclick="removeFromCart('${item.id}')"
        >
          ✕
        </button>
      </div>
    `;
  }).join("");

  $("cartTotal").textContent = `$${totalUSD.toFixed(2)}`;
}

function openCart() {
  $("cartOverlay").classList.remove("hidden");
  $("cartDrawer").classList.add("open");
}

function closeCart() {
  $("cartOverlay").classList.add("hidden");
  $("cartDrawer").classList.remove("open");
}

$("cartBtn").addEventListener("click", openCart);
$("closeCart").addEventListener("click", closeCart);
$("cartOverlay").addEventListener("click", closeCart);


/* =========================
   WHATSAPP
========================= */

$("whatsappOrder").addEventListener("click", () => {
  if (!cart.length) {
    alert(
      currentLanguage === "ku"
        ? "سەرەتا بەرهەمێک زیاد بکە."
        : "Your cart is empty."
    );
    return;
  }

  let message =
    currentLanguage === "ku"
      ? "سڵاو AH STORE، دەمەوێت ئەم بەرهەمانە داوا بکەم:%0A%0A"
      : "Hello AH STORE, I would like to order:%0A%0A";

  let total = 0;

  cart.forEach((item, index) => {
    const subtotal = item.price_usd * item.quantity;
    total += subtotal;

    message +=
      `${index + 1}. ${item.name} x${item.quantity} - $${subtotal.toFixed(2)}%0A`;
  });

  message += `%0A${currentLanguage === "ku" ? "کۆی گشتی" : "Total"}: $${total.toFixed(2)}`;
  message += `%0A%0A${currentLanguage === "ku" ? "تکایە زانیارییەکانی گەیاندن بنێرن." : "Please send me the delivery details."}`;

  window.open(`https://wa.me/${WHATSAPP}?text=${message}`, "_blank");
});


/* =========================
   ADMIN MODAL
========================= */

$("adminBtn").addEventListener("click", openAdmin);
$("closeAdmin").addEventListener("click", closeAdmin);

function openAdmin() {
  $("adminModal").classList.remove("hidden");
}

function closeAdmin() {
  $("adminModal").classList.add("hidden");
}


/* =========================
   AUTH
========================= */

async function checkAuth() {
  const { data } = await db.auth.getSession();

  if (data.session) {
    showAdminPanel();
  } else {
    showLogin();
  }
}

function showLogin() {
  $("loginSection").classList.remove("hidden");
  $("adminPanel").classList.add("hidden");
}

function showAdminPanel() {
  $("loginSection").classList.add("hidden");
  $("adminPanel").classList.remove("hidden");
  renderAdminProducts();
}

$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  $("loginMessage").textContent = "Signing in...";

  const email = $("adminEmail").value.trim();
  const password = $("adminPassword").value;

  const { error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    $("loginMessage").textContent = error.message;
    return;
  }

  $("loginMessage").textContent = "";
  showAdminPanel();
});

$("logoutBtn").addEventListener("click", async () => {
  await db.auth.signOut();
  resetProductForm();
  showLogin();
});


/* =========================
   ADMIN PRODUCTS
========================= */

function renderAdminProducts() {
  const container = $("adminProductsList");

  if (!container) return;

  if (!products.length) {
    container.innerHTML = `
      <p style="color:#8d9bb0;">
        No products yet.
      </p>`;
    return;
  }

  container.innerHTML = products.map((product) => `
    <div class="admin-product">

      <img
        src="${escapeAttribute(product.image_url || "https://via.placeholder.com/100")}"
        alt=""
      >

      <div class="admin-product-info">
        <strong>${escapeHTML(product.name)}</strong>
        <small>
          $${Number(product.price_usd || 0).toFixed(2)}
          • ${formatIQD(product.price_iqd)} IQD
        </small>
      </div>

      <div class="admin-actions">
        <button
          class="edit-btn"
          onclick="editProduct('${product.id}')"
        >
          ✏️
        </button>

        <button
          class="delete-btn"
          onclick="deleteProduct('${product.id}')"
        >
          🗑️
        </button>
      </div>

    </div>
  `).join("");
}


/* =========================
   IMAGE PREVIEW
========================= */

$("productImage").addEventListener("change", () => {
  const file = $("productImage").files[0];

  if (!file) {
    $("imagePreview").classList.add("hidden");
    return;
  }

  const url = URL.createObjectURL(file);
  $("imagePreview").src = url;
  $("imagePreview").classList.remove("hidden");
});


/* =========================
   PRODUCT FORM
========================= */

$("productForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = $("productName").value.trim();
  const brand = $("productBrand").value.trim();
  const category = $("productCategory").value;
  const priceUSD = Number($("productUSD").value);
  const priceIQD = Number($("productIQD").value);
  const connection = $("productConnection").value;
  const switchType = $("productSwitch").value.trim();
  const file = $("productImage").files[0];

  $("productMessage").textContent = "Saving...";

  try {
    let imageUrl = null;

    if (editingId) {
      const oldProduct = products.find(
        (p) => String(p.id) === String(editingId)
      );

      imageUrl = oldProduct?.image_url || null;
    }

    /* UPLOAD IMAGE */

    if (file) {
      const extension =
        file.name.split(".").pop().toLowerCase() || "jpg";

      const fileName =
        `${crypto.randomUUID()}.${extension}`;

      const path = `products/${fileName}`;

      const { error: uploadError } = await db.storage
        .from("products")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = db.storage
        .from("products")
        .getPublicUrl(path);

      imageUrl = publicData.publicUrl;
    }

    const payload = {
      name,
      brand,
      category,
      price_usd: priceUSD,
      price_iqd: priceIQD,
      connection,
      switch_type: category === "keyboard" ? switchType : null,
      image_url: imageUrl
    };

    /* EDIT */

    if (editingId) {
      const { error } = await db
        .from("products")
        .update(payload)
        .eq("id", editingId);

      if (error) throw error;

      $("productMessage").textContent = "Product updated!";
    }

    /* ADD */

    else {
      const { error } = await db
        .from("products")
        .insert(payload);

      if (error) throw error;

      $("productMessage").textContent = "Product added!";
    }

    resetProductForm();
    await loadProducts();

  } catch (error) {
    console.error(error);
    $("productMessage").textContent =
      error.message || "Something went wrong.";
  }
});


/* =========================
   EDIT
========================= */

function editProduct(id) {
  const product = products.find(
    (p) => String(p.id) === String(id)
  );

  if (!product) return;

  editingId = product.id;

  $("productId").value = product.id;
  $("productName").value = product.name || "";
  $("productBrand").value = product.brand || "";
  $("productCategory").value = product.category || "other";
  $("productUSD").value = product.price_usd || "";
  $("productIQD").value = product.price_iqd || "";
  $("productConnection").value = product.connection || "Wired";
  $("productSwitch").value = product.switch_type || "";

  $("saveProductBtn").textContent = "UPDATE PRODUCT";
  $("cancelEditBtn").classList.remove("hidden");

  if (product.image_url) {
    $("imagePreview").src = product.image_url;
    $("imagePreview").classList.remove("hidden");
  }

  updateSwitchField();
  $("productForm").scrollIntoView({ behavior: "smooth" });
}


/* =========================
   DELETE
========================= */

async function deleteProduct(id) {
  const product = products.find(
    (p) => String(p.id) === String(id)
  );

  if (!product) return;

  const confirmed = confirm(
    `Delete "${product.name}"?`
  );

  if (!confirmed) return;

  $("productMessage").textContent = "Deleting...";

  const { error } = await db
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    $("productMessage").textContent = error.message;
    return;
  }

  await loadProducts();

  $("productMessage").textContent = "Product deleted.";
}


/* =========================
   RESET FORM
========================= */

$("cancelEditBtn").addEventListener("click", resetProductForm);

function resetProductForm() {
  editingId = null;

  $("productForm").reset();
  $("productId").value = "";

  $("saveProductBtn").textContent = "ADD PRODUCT";
  $("cancelEditBtn").classList.add("hidden");

  $("imagePreview").src = "";
  $("imagePreview").classList.add("hidden");

  updateSwitchField();
}


/* =========================
   SWITCH TYPE
========================= */

$("productCategory").addEventListener("change", updateSwitchField);

function updateSwitchField() {
  const keyboard =
    $("productCategory").value === "keyboard";

  $("switchField").classList.toggle("hidden", !keyboard);

  if (!keyboard) {
    $("productSwitch").value = "";
  }
}


/* =========================
   HELPERS
========================= */

function formatIQD(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHTML(value);
}


/* =========================
   START
========================= */

updateSwitchField();
updateLanguage();
renderCart();
checkAuth();
loadProducts();

db.auth.onAuthStateChange((_event, session) => {
  if (session) {
    showAdminPanel();
  } else {
    showLogin();
  }
});
