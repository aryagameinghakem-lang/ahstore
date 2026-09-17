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

    const brand = document.createElement("div");
    brand.className = "product-brand";
    brand.textContent = product.brand || "AH STORE";

    const name = document.createElement("div");
    name.className = "product-name";
    name.textContent = product.name || "Unnamed Product";

    const details = document.createElement("div");
    details.className = "product-details";

    if (product.connection) {
      const connection = document.createElement("span");
      connection.className = "detail-tag";
      connection.textContent = product.connection;
      details.appendChild(connection);
    }

    if (
      product.category === "keyboard" &&
      product.switch_type
    ) {
      const switchTag = document.createElement("span");
      switchTag.className = "detail-tag";
      switchTag.textContent = product.switch_type;
      details.appendChild(switchTag);
    }

    const price = document.createElement("div");
    price.className = "product-price";

    const usd = document.createElement("span");
    usd.className = "price-usd";
    usd.textContent = `$${Number(product.price_usd || 0).toFixed(2)}`;

    const iqd = document.createElement("span");
    iqd.className = "price-iqd";
    iqd.textContent = `${formatIQD(product.price_iqd)} IQD`;

    price.appendChild(usd);
    price.appendChild(iqd);

    const addButton = document.createElement("button");
    addButton.className = "add-cart";
    addButton.textContent =
      currentLanguage === "ku" ? "زیادکردن بۆ سەبەت" : "ADD TO CART";

    // IMPORTANT:
    // No inline onclick.
    addButton.addEventListener("click", (event) => {
      event.stopPropagation();
      addToCart(product.id);
    });

    info.appendChild(brand);
    info.appendChild(name);
    info.appendChild(details);
    info.appendChild(price);
    info.appendChild(addButton);

    card.appendChild(imageArea);
    card.appendChild(info);

    // Clicking the product opens details.
    card.addEventListener("click", () => {
      openProductDetails(product.id);
    });

    grid.appendChild(card);
  });
}

// ==========================================
// SEARCH + CATEGORY
// ==========================================

function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");

  if (searchInput) {
    searchInput.addEventListener("input", filterProducts);
  }

  if (categoryFilter) {
    categoryFilter.addEventListener("change", filterProducts);
  }
}

function filterProducts() {
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");

  const search = (searchInput?.value || "").toLowerCase().trim();
  const category = categoryFilter?.value || "all";

  const filtered = products.filter((product) => {
    const matchesSearch =
      !search ||
      String(product.name || "").toLowerCase().includes(search) ||
      String(product.brand || "").toLowerCase().includes(search) ||
      String(product.category || "").toLowerCase().includes(search);

    const matchesCategory =
      category === "all" ||
      String(product.category || "").toLowerCase() === category;

    return matchesSearch && matchesCategory;
  });

  renderProducts(filtered);
}

// ==========================================
// PRODUCT DETAILS
// ==========================================

function openProductDetails(productId) {
  const product = products.find(
    (p) => String(p.id) === String(productId)
  );

  if (!product) {
    console.error("Product not found:", productId);
    return;
  }

  currentDetailsProduct = product;

  const overlay = document.getElementById("productDetailsOverlay");
  const modal = document.getElementById("productDetailsModal");

  const image = document.getElementById("detailsImage");
  const noImage = document.getElementById("detailsNoImage");

  const brand = document.getElementById("detailsBrand");
  const name = document.getElementById("detailsName");

  const category = document.getElementById("detailsCategory");
  const connection = document.getElementById("detailsConnection");

  const switchRow = document.getElementById("detailsSwitchRow");
  const switchText = document.getElementById("detailsSwitch");

  const usd = document.getElementById("detailsUSD");
  const iqd = document.getElementById("detailsIQD");

  if (!overlay) {
    console.error("Product details overlay not found.");
    return;
  }

  if (image) {
    if (product.image_url) {
      image.src = product.image_url;
      image.alt = product.name || "Product";
      image.classList.remove("hidden");
    } else {
      image.removeAttribute("src");
      image.classList.add("hidden");
    }
  }

  if (noImage) {
    if (product.image_url) {
      noImage.classList.add("hidden");
    } else {
      noImage.classList.remove("hidden");
    }
  }

  if (brand) {
    brand.textContent = product.brand || "AH STORE";
  }

  if (name) {
    name.textContent = product.name || "Unnamed Product";
  }

  if (category) {
    category.textContent = capitalize(
      product.category || "Other"
    );
  }

  if (connection) {
    connection.textContent =
      product.connection || "Not specified";
  }

  if (switchRow && switchText) {
    if (
      product.category === "keyboard" &&
      product.switch_type
    ) {
      switchRow.classList.remove("hidden");
      switchText.textContent = product.switch_type;
    } else {
      switchRow.classList.add("hidden");
    }
  }

  if (usd) {
    usd.textContent = `$${Number(
      product.price_usd || 0
    ).toFixed(2)}`;
  }

  if (iqd) {
    iqd.textContent = `${formatIQD(product.price_iqd)} IQD`;
  }

  overlay.classList.remove("hidden");

  if (modal) {
    modal.scrollTop = 0;
  }
}

function closeProductDetails() {
  const overlay = document.getElementById("productDetailsOverlay");

  if (overlay) {
    overlay.classList.add("hidden");
  }

  currentDetailsProduct = null;
}

// ==========================================
// CART
// ==========================================

function addToCart(productId) {
  const product = products.find(
    (p) => String(p.id) === String(productId)
  );

  if (!product) {
    console.error("Product not found:", productId);
    return;
  }

  const existing = cart.find(
    (item) => String(item.id) === String(product.id)
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1
    });
  }

  saveCart();
  renderCart();
  openCart();

  console.log("Added to cart:", product.name);
}

function removeFromCart(productId) {
  cart = cart.filter(
    (item) => String(item.id) !== String(productId)
  );

  saveCart();
  renderCart();
}

function changeQuantity(productId, amount) {
  const item = cart.find(
    (p) => String(p.id) === String(productId)
  );

  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  saveCart();
  renderCart();
}

function saveCart() {
  try {
    localStorage.setItem("ah_store_cart", JSON.stringify(cart));
  } catch (error) {
    console.error("Could not save cart:", error);
  }
}

function loadCart() {
  try {
    const saved = localStorage.getItem("ah_store_cart");

    if (saved) {
      cart = JSON.parse(saved);

      if (!Array.isArray(cart)) {
        cart = [];
      }
    }
  } catch (error) {
    console.error("Could not load cart:", error);
    cart = [];
  }
}

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const cartCount = document.getElementById("cartCount");
  const cartTotal = document.getElementById("cartTotal");

  if (!cartItems) return;

  cartItems.innerHTML = "";

  const totalQuantity = cart.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  if (cartCount) {
    cartCount.textContent = totalQuantity;
  }

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="loading">
        ${
          currentLanguage === "ku"
            ? "سەبەتەکە بەتاڵە"
            : "Your cart is empty."
        }
      </div>
    `;

    if (cartTotal) {
      cartTotal.textContent = "$0.00";
    }

    return;
  }

  let totalUSD = 0;

  cart.forEach((item) => {
    const quantity = Number(item.quantity || 1);
    const itemPrice = Number(item.price_usd || 0);

    totalUSD += itemPrice * quantity;

    const row = document.createElement("div");
    row.className = "cart-item";

    const info = document.createElement("div");
    info.className = "cart-item-info";

    const itemName = document.createElement("div");
    itemName.className = "cart-item-name";
    itemName.textContent = item.name;

    const itemPrice = document.createElement("div");
    itemPrice.className = "cart-item-price";
    itemPrice.textContent =
      `$${Number(item.price_usd || 0).toFixed(2)} × ${quantity}`;

    const quantityBox = document.createElement("div");
    quantityBox.className = "quantity";

    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";

    minus.addEventListener("click", () => {
      changeQuantity(item.id, -1);
    });

    const number = document.createElement("span");
    number.textContent = quantity;

    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";

    plus.addEventListener("click", () => {
      changeQuantity(item.id, 1);
    });

    quantityBox.appendChild(minus);
    quantityBox.appendChild(number);
    quantityBox.appendChild(plus);

    info.appendChild(itemName);
    info.appendChild(itemPrice);
    info.appendChild(quantityBox);

    const remove = document.createElement("button");
    remove.className = "remove-cart";
    remove.type = "button";
    remove.textContent = "✕";

    remove.addEventListener("click", () => {
      removeFromCart(item.id);
    });

    row.appendChild(info);
    row.appendChild(remove);

    cartItems.appendChild(row);
  });

  if (cartTotal) {
    cartTotal.textContent = `$${totalUSD.toFixed(2)}`;
  }
}

function openCart() {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartOverlay");

  if (drawer) {
    drawer.classList.add("open");
  }

  if (overlay) {
    overlay.classList.remove("hidden");
  }
}

function closeCart() {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartOverlay");

  if (drawer) {
    drawer.classList.remove("open");
  }

  if (overlay) {
    overlay.classList.add("hidden");
  }
}

// ==========================================
// WHATSAPP ORDER
// ==========================================

function sendWhatsAppOrder() {
  if (cart.length === 0) {
    alert(
      currentLanguage === "ku"
        ? "سەبەتەکە بەتاڵە."
        : "Your cart is empty."
    );
    return;
  }

  let message =
    currentLanguage === "ku"
      ? "سڵاو AH STORE، دەمەوێت ئەم بەرهەمانە داوا بکەم:\n\n"
      : "Hello AH STORE, I would like to order:\n\n";

  let totalUSD = 0;

  cart.forEach((item) => {
    const quantity = Number(item.quantity || 1);
    const price = Number(item.price_usd || 0);

    totalUSD += price * quantity;

    message += `• ${item.name} × ${quantity} — $${(
      price * quantity
    ).toFixed(2)}\n`;
  });

  message += `\nTotal: $${totalUSD.toFixed(2)}\n`;

  message +=
    currentLanguage === "ku"
      ? "\nتکایە زانیارییەکانی گەیاندن بنێرن."
      : "\nPlease send me the delivery details.";

  const url =
    `https://wa.me/${WHATSAPP_NUMBER}?text=` +
    encodeURIComponent(message);

  window.open(url, "_blank");
}

// ==========================================
// LANGUAGE
// ==========================================

function setupLanguage() {
  const languageBtn = document.getElementById("languageBtn");

  if (languageBtn) {
    languageBtn.addEventListener("click", toggleLanguage);
  }
}

function toggleLanguage() {
  currentLanguage =
    currentLanguage === "en" ? "ku" : "en";

  document.body.classList.toggle(
    "rtl",
    currentLanguage === "ku"
  );

  document.documentElement.lang =
    currentLanguage === "ku" ? "ku" : "en";

  const elements = document.querySelectorAll(
    "[data-en][data-ku]"
  );

  elements.forEach((element) => {
    element.textContent =
      currentLanguage === "ku"
        ? element.dataset.ku
        : element.dataset.en;
  });

  const searchInput =
    document.getElementById("searchInput");

  if (searchInput) {
    searchInput.placeholder =
      currentLanguage === "ku"
        ? searchInput.dataset.placeholderKu
        : searchInput.dataset.placeholderEn;
  }

  const languageBtn =
    document.getElementById("languageBtn");

  if (languageBtn) {
    languageBtn.textContent =
      currentLanguage === "ku" ? "English" : "کوردی";
  }

  renderProducts(getFilteredProducts());
  renderCart();
}

function getFilteredProducts() {
  const searchInput =
    document.getElementById("searchInput");

  const categoryFilter =
    document.getElementById("categoryFilter");

  const search = (
    searchInput?.value || ""
  ).toLowerCase().trim();

  const category =
    categoryFilter?.value || "all";

  return products.filter((product) => {
    const matchesSearch =
      !search ||
      String(product.name || "")
        .toLowerCase()
        .includes(search) ||
      String(product.brand || "")
        .toLowerCase()
        .includes(search);

    const matchesCategory =
      category === "all" ||
      String(product.category || "").toLowerCase() ===
        category;

    return matchesSearch && matchesCategory;
  });
}

// ==========================================
// ADMIN
// ==========================================

function setupAdmin() {
  const adminBtn = document.getElementById("adminBtn");
  const closeAdmin = document.getElementById("closeAdmin");
  const logoutBtn = document.getElementById("logoutBtn");
  const loginForm = document.getElementById("loginForm");

  if (adminBtn) {
    adminBtn.addEventListener("click", openAdmin);
  }

  if (closeAdmin) {
    closeAdmin.addEventListener("click", closeAdminModal);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logoutAdmin);
  }

  if (loginForm) {
    loginForm.addEventListener("submit", loginAdmin);
  }

  checkAdminSession();
}

function openAdmin() {
  const modal = document.getElementById("adminModal");

  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closeAdminModal() {
  const modal = document.getElementById("adminModal");

  if (modal) {
    modal.classList.add("hidden");
  }
}

async function loginAdmin(event) {
  event.preventDefault();

  const email =
    document.getElementById("adminEmail")?.value.trim();

  const password =
    document.getElementById("adminPassword")?.value;

  const message =
    document.getElementById("loginMessage");

  if (!email || !password) return;

  if (message) {
    message.textContent = "Signing in...";
  }

  const { data, error } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    console.error("Login error:", error);

    if (message) {
      message.textContent =
        error.message || "Login failed.";
    }

    return;
  }

  console.log("Admin logged in:", data.user);

  if (message) {
    message.textContent = "";
  }

  showAdminPanel();
  renderAdminProducts();
}

async function checkAdminSession() {
  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (session) {
    showAdminPanel();
  } else {
    showLoginPanel();
  }
}

function showAdminPanel() {
  const loginSection =
    document.getElementById("loginSection");

  const adminPanel =
    document.getElementById("adminPanel");

  if (loginSection) {
    loginSection.classList.add("hidden");
  }

  if (adminPanel) {
    adminPanel.classList.remove("hidden");
  }

  renderAdminProducts();
}

function showLoginPanel() {
  const loginSection =
    document.getElementById("loginSection");

  const adminPanel =
    document.getElementById("adminPanel");

  if (loginSection) {
    loginSection.classList.remove("hidden");
  }

  if (adminPanel) {
    adminPanel.classList.add("hidden");
  }
}

async function logoutAdmin() {
  await supabaseClient.auth.signOut();

  resetProductForm();
  showLoginPanel();
}

// ==========================================
// ADMIN PRODUCT FORM
// ==========================================

function setupProductForm() {
  const form = document.getElementById("productForm");
  const category =
    document.getElementById("productCategory");

  const cancel =
    document.getElementById("cancelEditBtn");

  const image =
    document.getElementById("productImage");

  if (form) {
    form.addEventListener("submit", saveProduct);
  }

  if (category) {
    category.addEventListener(
      "change",
      updateSwitchField
    );
  }

  if (cancel) {
    cancel.addEventListener(
      "click",
      resetProductForm
    );
  }

  if (image) {
    image.addEventListener(
      "change",
      previewImage
    );
  }
}

function updateSwitchField() {
  const category =
    document.getElementById("productCategory");

  const field =
    document.getElementById("switchField");

  if (!category || !field) return;

  if (category.value === "keyboard") {
    field.classList.remove("hidden");
  } else {
    field.classList.add("hidden");
  }
}

async function saveProduct(event) {
  event.preventDefault();

  const message =
    document.getElementById("productMessage");

  const button =
    document.getElementById("saveProductBtn");

  const name =
    document.getElementById("productName")?.value.trim();

  const brand =
    document.getElementById("productBrand")?.value.trim();

  const category =
    document.getElementById("productCategory")?.value;

  const usd =
    document.getElementById("productUSD")?.value;

  const iqd =
    document.getElementById("productIQD")?.value;

  const connection =
    document.getElementById("productConnection")?.value;

  const switchType =
    document.getElementById("productSwitch")?.value.trim();

  const imageInput =
    document.getElementById("productImage");

  if (!name || !category || !usd || !iqd) {
    if (message) {
      message.textContent =
        "Please fill in the required fields.";
    }
    return;
  }

  try {
    if (button) {
      button.disabled = true;
      button.textContent =
        editingProductId
          ? "SAVING..."
          : "ADDING...";
    }

    if (message) {
      message.textContent = "";
    }

    let imageUrl = null;

    // If editing, keep the existing image
    // unless a new image is selected.
    if (editingProductId) {
      const oldProduct = products.find(
        (p) =>
          String(p.id) === String(editingProductId)
      );

      imageUrl = oldProduct?.image_url || null;
    }

    // Upload new image if selected.
    if (
      imageInput &&
      imageInput.files &&
      imageInput.files.length > 0
    ) {
      const file = imageInput.files[0];

      const safeName =
        file.name
          .toLowerCase()
          .replace(/[^a-z0-9.-]/g, "-");

      const filePath =
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}-${safeName}`;

      const { error: uploadError } =
        await supabaseClient.storage
          .from("products")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false
          });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicData } =
        supabaseClient.storage
          .from("products")
          .getPublicUrl(filePath);

      imageUrl = publicData.publicUrl;
    }

    const productData = {
      name,
      brand,
      category,
      price_usd: Number(usd),
      price_iqd: Number(iqd),
      image_url: imageUrl,
      connection,
      switch_type:
        category === "keyboard"
          ? switchType
          : null
    };

    let result;

    if (editingProductId) {
      result = await supabaseClient
        .from("products")
        .update(productData)
        .eq("id", editingProductId);
    } else {
      result = await supabaseClient
        .from("products")
        .insert([productData]);
    }

    if (result.error) {
      throw result.error;
    }

    if (message) {
      message.textContent =
        editingProductId
          ? "Product updated successfully!"
          : "Product added successfully!";
      message.style.color = "var(--success)";
    }

    resetProductForm(false);

    await loadProducts();
  } catch (error) {
    console.error("Save product error:", error);

    if (message) {
      message.textContent =
        error.message || "Could not save product.";
      message.style.color = "var(--danger)";
    }
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = editingProductId
        ? "SAVE PRODUCT"
        : "ADD PRODUCT";
    }
  }
}

// ==========================================
// ADMIN PRODUCT LIST
// ==========================================

function renderAdminProducts() {
  const list =
    document.getElementById("adminProductsList");

  if (!list) return;

  list.innerHTML = "";

  if (!products.length) {
    list.innerHTML =
      "<p>No products yet.</p>";
    return;
  }

  products.forEach((product) => {
    const item =
      document.createElement("div");

    item.className = "admin-product-item";

    if (product.image_url) {
      const img =
        document.createElement("img");

      img.src = product.image_url;
      img.alt = product.name || "Product";

      item.appendChild(img);
    }

    const info =
      document.createElement("div");

    info.className = "admin-product-info";

    const title =
      document.createElement("strong");

    title.textContent =
      product.name || "Unnamed Product";

    const details =
      document.createElement("span");

    details.textContent =
      `${product.brand || ""} • $${Number(
        product.price_usd || 0
      ).toFixed(2)}`;

    info.appendChild(title);
    info.appendChild(details);

    const actions =
      document.createElement("div");

    actions.className =
      "admin-product-actions";

    const edit =
      document.createElement("button");

    edit.type = "button";
    edit.textContent = "EDIT";

    edit.addEventListener("click", () => {
      editProduct(product.id);
    });

    const del =
      document.createElement("button");

    del.type = "button";
    del.textContent = "DELETE";
    del.className = "delete";

    del.addEventListener("click", () => {
      deleteProduct(product.id);
    });

    actions.appendChild(edit);
    actions.appendChild(del);

    item.appendChild(info);
    item.appendChild(actions);

    list.appendChild(item);
  });
}

// ==========================================
// EDIT PRODUCT
// ==========================================

function editProduct(productId) {
  const product = products.find(
    (p) => String(p.id) === String(productId)
  );

  if (!product) {
    console.error("Product not found:", productId);
    return;
  }

  editingProductId = product.id;

  document.getElementById("productId").value =
    product.id;

  document.getElementById("productName").value =
    product.name || "";

  document.getElementById("productBrand").value =
    product.brand || "";

  document.getElementById("productCategory").value =
    product.category || "other";

  document.getElementById("productUSD").value =
    product.price_usd || "";

  document.getElementById("productIQD").value =
    product.price_iqd || "";

  document.getElementById("productConnection").value =
    product.connection || "Wired";

  document.getElementById("productSwitch").value =
    product.switch_type || "";

  updateSwitchField();

  const button =
    document.getElementById("saveProductBtn");

  if (button) {
    button.textContent = "SAVE PRODUCT";
  }

  const cancel =
    document.getElementById("cancelEditBtn");

  if (cancel) {
    cancel.classList.remove("hidden");
  }

  const preview =
    document.getElementById("imagePreview");

  if (preview) {
    if (product.image_url) {
      preview.src = product.image_url;
      preview.classList.remove("hidden");
    } else {
      preview.classList.add("hidden");
    }
  }

  const message =
    document.getElementById("productMessage");

  if (message) {
    message.textContent =
      "Editing product...";
    message.style.color = "var(--cyan)";
  }

  const form =
    document.getElementById("productForm");

  if (form) {
    form.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

// ==========================================
// DELETE PRODUCT
// ==========================================

async function deleteProduct(productId) {
  const product = products.find(
    (p) => String(p.id) === String(productId)
  );

  if (!product) {
    console.error("Product not found:", productId);
    return;
  }

  const confirmed = window.confirm(
    `Delete "${product.name}"?`
  );

  if (!confirmed) return;

  try {
    const { error } =
      await supabaseClient
        .from("products")
        .delete()
        .eq("id", productId);

    if (error) {
      throw error;
    }

    console.log(
      "Product deleted:",
      product.name
    );

    if (
      editingProductId &&
      String(editingProductId) ===
        String(productId)
    ) {
      resetProductForm();
    }

    await loadProducts();
  } catch (error) {
    console.error("Delete product error:", error);

    alert(
      error.message ||
        "Could not delete the product."
    );
  }
}

// ==========================================
// RESET FORM
// ==========================================

function resetProductForm(clearMessage = true) {
  editingProductId = null;

  const form =
    document.getElementById("productForm");

  if (form) {
    form.reset();
  }

  const productId =
    document.getElementById("productId");

  if (productId) {
    productId.value = "";
  }

  const button =
    document.getElementById("saveProductBtn");

  if (button) {
    button.textContent = "ADD PRODUCT";
  }

  const cancel =
    document.getElementById("cancelEditBtn");

  if (cancel) {
    cancel.classList.add("hidden");
  }

  const preview =
    document.getElementById("imagePreview");

  if (preview) {
    preview.removeAttribute("src");
    preview.classList.add("hidden");
  }

  updateSwitchField();

  if (clearMessage) {
    const message =
      document.getElementById("productMessage");

    if (message) {
      message.textContent = "";
    }
  }
}

// ==========================================
// IMAGE PREVIEW
// ==========================================

function previewImage(event) {
  const file =
    event.target.files?.[0];

  const preview =
    document.getElementById("imagePreview");

  if (!preview) return;

  if (!file) {
    preview.removeAttribute("src");
    preview.classList.add("hidden");
    return;
  }

  const reader =
    new FileReader();

  reader.onload = (e) => {
    preview.src = e.target.result;
    preview.classList.remove("hidden");
  };

  reader.readAsDataURL(file);
}

// ==========================================
// BUTTONS
// ==========================================

function setupButtons() {
  loadCart();

  const cartBtn =
    document.getElementById("cartBtn");

  const closeCartBtn =
    document.getElementById("closeCart");

  const cartOverlay =
    document.getElementById("cartOverlay");

  const whatsapp =
    document.getElementById("whatsappOrder");

  const closeDetails =
    document.getElementById(
      "closeProductDetails"
    );

  const detailsOverlay =
    document.getElementById(
      "productDetailsOverlay"
    );

  const detailsAdd =
    document.getElementById(
      "detailsAddCart"
    );

  if (cartBtn) {
    cartBtn.addEventListener(
      "click",
      openCart
    );
  }

  if (closeCartBtn) {
    closeCartBtn.addEventListener(
      "click",
      closeCart
    );
  }

  if (cartOverlay) {
    cartOverlay.addEventListener(
      "click",
      closeCart
    );
  }

  if (whatsapp) {
    whatsapp.addEventListener(
      "click",
      sendWhatsAppOrder
    );
  }

  if (closeDetails) {
    closeDetails.addEventListener(
      "click",
      closeProductDetails
    );
  }

  if (detailsOverlay) {
    detailsOverlay.addEventListener(
      "click",
      (event) => {
        if (
          event.target === detailsOverlay
        ) {
          closeProductDetails();
        }
      }
    );
  }

  if (detailsAdd) {
    detailsAdd.addEventListener(
      "click",
      () => {
        if (currentDetailsProduct) {
          addToCart(
            currentDetailsProduct.id
          );
          closeProductDetails();
        }
      }
    );
  }

  renderCart();
}

// ==========================================
// HELPERS
// ==========================================

function formatIQD(value) {
  const number = Number(value || 0);

  return number.toLocaleString("en-US");
}

function capitalize(value) {
  if (!value) return "";

  return (
    String(value).charAt(0).toUpperCase() +
    String(value).slice(1)
  );
}

// ==========================================
// ESC KEY
// ==========================================

document.addEventListener(
  "keydown",
  (event) => {
    if (event.key !== "Escape") return;

    closeCart();
    closeProductDetails();
  }
);
```
