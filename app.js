```javascript
const SUPABASE_URL = "https://toeqdxunmvspulvkpdow.supabase.co";
const SUPABASE_KEY = "sb_publishable_JsjlGkffizJ1Ap7oPCAQ6Q_8TJ64tw0";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const WHATSAPP_NUMBER = "9647701068935";

let products = [];
let cart = JSON.parse(localStorage.getItem("ahstore_cart") || "[]");
let currentLanguage = localStorage.getItem("ahstore_language") || "en";
let currentProduct = null;
let editingProductId = null;

document.addEventListener("DOMContentLoaded", () => {
  setupEvents();
  updateLanguage();
  closeCartDrawer();
  loadProducts();
  checkAdminSession();
  updateCart();
});

function setupEvents() {
  const languageBtn = document.getElementById("languageBtn");
  const cartBtn = document.getElementById("cartBtn");
  const closeCart = document.getElementById("closeCart");
  const cartOverlay = document.getElementById("cartOverlay");
  const whatsappOrder = document.getElementById("whatsappOrder");
  const adminBtn = document.getElementById("adminBtn");
  const closeAdmin = document.getElementById("closeAdmin");
  const loginForm = document.getElementById("loginForm");
  const logoutBtn = document.getElementById("logoutBtn");
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const closeProductDetails = document.getElementById("closeProductDetails");
  const productDetailsOverlay =
    document.getElementById("productDetailsOverlay");
  const detailsAddCart = document.getElementById("detailsAddCart");
  const productForm = document.getElementById("productForm");
  const cancelEditBtn = document.getElementById("cancelEditBtn");

  if (languageBtn) {
    languageBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      currentLanguage = currentLanguage === "en" ? "ku" : "en";

      localStorage.setItem("ahstore_language", currentLanguage);

      updateLanguage();
      renderProducts();
      updateCart();
    });
  }

  if (cartBtn) {
    cartBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      openCart();
    });
  }

  if (closeCart) {
    closeCart.addEventListener("click", closeCartDrawer);
  }

  if (cartOverlay) {
    cartOverlay.addEventListener("click", closeCartDrawer);
  }

  if (whatsappOrder) {
    whatsappOrder.addEventListener("click", sendWhatsAppOrder);
  }

  if (adminBtn) {
    adminBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      openAdmin();
    });
  }

  if (closeAdmin) {
    closeAdmin.addEventListener("click", closeAdminModal);
  }

  if (loginForm) {
    loginForm.addEventListener("submit", loginAdmin);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logoutAdmin);
  }

  if (searchInput) {
    searchInput.addEventListener("input", renderProducts);
  }

  if (categoryFilter) {
    categoryFilter.addEventListener("change", renderProducts);
  }

  if (closeProductDetails) {
    closeProductDetails.addEventListener("click", closeProductModal);
  }

  if (productDetailsOverlay) {
    productDetailsOverlay.addEventListener("click", (e) => {
      if (e.target === productDetailsOverlay) {
        closeProductModal();
      }
    });
  }

  if (detailsAddCart) {
    detailsAddCart.addEventListener("click", () => {
      if (currentProduct) {
        addToCart(currentProduct.id);
        closeProductModal();
      }
    });
  }

  if (productForm) {
    productForm.addEventListener("submit", saveProduct);
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", cancelEdit);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeCartDrawer();
      closeProductModal();
      closeAdminModal();
    }
  });

  document.addEventListener("change", handleDocumentChange);
}

function updateLanguage() {
  document.documentElement.dir =
    currentLanguage === "ku" ? "rtl" : "ltr";

  document.documentElement.lang =
    currentLanguage === "ku" ? "ku" : "en";

  document.querySelectorAll("[data-en]").forEach((element) => {
    const value =
      currentLanguage === "ku"
        ? element.dataset.ku
        : element.dataset.en;

    if (value !== undefined) {
      element.textContent = value;
    }
  });

  document.querySelectorAll("[data-placeholder-en]").forEach((element) => {
    element.placeholder =
      currentLanguage === "ku"
        ? element.dataset.placeholderKu
        : element.dataset.placeholderEn;
  });

  const languageBtn = document.getElementById("languageBtn");

  if (languageBtn) {
    languageBtn.textContent =
      currentLanguage === "en" ? "کوردی" : "English";
  }
}

async function loadProducts() {
  const grid = document.getElementById("productsGrid");

  if (grid) {
    grid.innerHTML =
      '<div class="loading">Loading products...</div>';
  }

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Products error:", error);

    if (grid) {
      grid.innerHTML =
        '<div class="loading">Unable to load products.</div>';
    }

    return;
  }

  products = data || [];

  console.log("Products loaded:", products);

  renderProducts();
  renderAdminProducts();
}

function renderProducts() {
  const grid = document.getElementById("productsGrid");

  if (!grid) {
    return;
  }

  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");

  const search = searchInput
    ? searchInput.value.trim().toLowerCase()
    : "";

  const category = categoryFilter
    ? categoryFilter.value
    : "all";

  const filtered = products.filter((product) => {
    const name = String(product.name || "").toLowerCase();
    const brand = String(product.brand || "").toLowerCase();

    const matchesSearch =
      !search ||
      name.includes(search) ||
      brand.includes(search);

    const matchesCategory =
      category === "all" ||
      String(product.category || "").toLowerCase() ===
        category.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  if (!filtered.length) {
    grid.innerHTML =
      '<div class="loading">No products found.</div>';

    return;
  }

  grid.innerHTML = "";

  filtered.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";

    const imageArea = document.createElement("div");
    imageArea.className = "product-image";

    if (product.image_url) {
      const img = document.createElement("img");

      img.src = product.image_url;
      img.alt = product.name || "Product";
      img.loading = "lazy";

      imageArea.appendChild(img);
    } else {
      const noImage = document.createElement("div");

      noImage.className = "no-image";
      noImage.textContent = "NO IMAGE";

      imageArea.appendChild(noImage);
    }

    const content = document.createElement("div");
    content.className = "product-content";

    const brand = document.createElement("div");
    brand.className = "product-brand";
    brand.textContent = product.brand || "AH STORE";

    const name = document.createElement("h3");
    name.textContent = product.name || "Product";

    const details = document.createElement("div");
    details.className = "product-details";

    if (product.connection) {
      const connection = document.createElement("span");

      connection.textContent = product.connection;

      details.appendChild(connection);
    }

    if (
      String(product.category || "").toLowerCase() === "keyboard" &&
      product.switch_type
    ) {
      const switchType = document.createElement("span");

      switchType.textContent =
        product.switch_type + " Switch";

      details.appendChild(switchType);
    }

    const price = document.createElement("div");
    price.className = "product-price";

    const usd = document.createElement("div");
    usd.className = "price-usd";

    usd.textContent =
      "$" + Number(product.price_usd || 0).toFixed(2);

    const iqd = document.createElement("div");
    iqd.className = "price-iqd";

    iqd.textContent =
      Number(product.price_iqd || 0).toLocaleString() +
      " IQD";

    price.appendChild(usd);
    price.appendChild(iqd);

    const buttons = document.createElement("div");
    buttons.className = "product-buttons";

    const addButton = document.createElement("button");

    addButton.className = "add-cart";
    addButton.type = "button";

    addButton.textContent =
      currentLanguage === "ku"
        ? "زیادکردن بۆ سەبەت"
        : "ADD TO CART";

    addButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      addToCart(product.id);
    });

    const detailsButton = document.createElement("button");

    detailsButton.className = "details-btn";
    detailsButton.type = "button";

    detailsButton.textContent =
      currentLanguage === "ku"
        ? "وردەکاری"
        : "DETAILS";

    detailsButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      openProductDetails(product.id);
    });

    buttons.appendChild(addButton);
    buttons.appendChild(detailsButton);

    content.appendChild(brand);
    content.appendChild(name);
    content.appendChild(details);
    content.appendChild(price);
    content.appendChild(buttons);

    card.appendChild(imageArea);
    card.appendChild(content);

    card.addEventListener("click", () => {
      openProductDetails(product.id);
    });

    grid.appendChild(card);
  });
}

function openCart() {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartOverlay");

  if (!drawer) {
    return;
  }

  drawer.classList.remove("hidden");
  drawer.classList.add("open");

  if (overlay) {
    overlay.classList.remove("hidden");
    overlay.classList.add("open");
  }

  updateCart();
}

function closeCartDrawer() {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartOverlay");

  if (drawer) {
    drawer.classList.remove("open");
    drawer.classList.add("hidden");
  }

  if (overlay) {
    overlay.classList.remove("open");
    overlay.classList.add("hidden");
  }
}

function addToCart(id) {
  const product = products.find(
    (p) => String(p.id) === String(id)
  );

  if (!product) {
    console.error("Product not found:", id);
    return;
  }

  const existing = cart.find(
    (item) => String(item.id) === String(product.id)
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price_usd: Number(product.price_usd || 0),
      price_iqd: Number(product.price_iqd || 0),
      image_url: product.image_url,
      quantity: 1
    });
  }

  saveCart();
  updateCart();
}

function removeFromCart(id) {
  cart = cart.filter(
    (item) => String(item.id) !== String(id)
  );

  saveCart();
  updateCart();
}

function changeQuantity(id, amount) {
  const item = cart.find(
    (product) => String(product.id) === String(id)
  );

  if (!item) {
    return;
  }

  item.quantity += amount;

  if (item.quantity <= 0) {
    removeFromCart(id);
    return;
  }

  saveCart();
  updateCart();
}

function saveCart() {
  localStorage.setItem(
    "ahstore_cart",
    JSON.stringify(cart)
  );
}

function updateCart() {
  const cartItems = document.getElementById("cartItems");
  const cartCount = document.getElementById("cartCount");
  const cartTotal = document.getElementById("cartTotal");

  if (cartCount) {
    cartCount.textContent = cart.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    );
  }

  if (!cartItems || !cartTotal) {
    return;
  }

  if (!cart.length) {
    cartItems.innerHTML =
      '<div class="empty-cart">Your cart is empty.</div>';

    cartTotal.textContent = "$0";

    return;
  }

  cartItems.innerHTML = "";

  let totalUSD = 0;

  cart.forEach((item) => {
    const quantity = Number(item.quantity || 0);
    const priceUSD = Number(item.price_usd || 0);

    totalUSD += priceUSD * quantity;

    const row = document.createElement("div");
    row.className = "cart-item";

    const image = document.createElement("div");
    image.className = "cart-item-image";

    if (item.image_url) {
      const img = document.createElement("img");

      img.src = item.image_url;
      img.alt = item.name || "Product";

      image.appendChild(img);
    }

    const info = document.createElement("div");
    info.className = "cart-item-info";

    const name = document.createElement("strong");
    name.textContent = item.name || "Product";

    const price = document.createElement("span");
    price.textContent =
      "$" + priceUSD.toFixed(2);

    const quantityBox = document.createElement("div");
    quantityBox.className = "cart-quantity";

    const minus = document.createElement("button");

    minus.type = "button";
    minus.textContent = "−";

    minus.addEventListener("click", (e) => {
      e.stopPropagation();

      changeQuantity(item.id, -1);
    });

    const number = document.createElement("span");
    number.textContent = quantity;

    const plus = document.createElement("button");

    plus.type = "button";
    plus.textContent = "+";

    plus.addEventListener("click", (e) => {
      e.stopPropagation();

      changeQuantity(item.id, 1);
    });

    quantityBox.appendChild(minus);
    quantityBox.appendChild(number);
    quantityBox.appendChild(plus);

    const remove = document.createElement("button");

    remove.className = "cart-remove";
    remove.type = "button";
    remove.textContent =
      currentLanguage === "ku"
        ? "سڕینەوە"
        : "Remove";

    remove.addEventListener("click", (e) => {
      e.stopPropagation();

      removeFromCart(item.id);
    });

    info.appendChild(name);
    info.appendChild(price);
    info.appendChild(quantityBox);
    info.appendChild(remove);

    row.appendChild(image);
    row.appendChild(info);

    cartItems.appendChild(row);
  });

  cartTotal.textContent =
    "$" + totalUSD.toFixed(2);
}

function sendWhatsAppOrder() {
  if (!cart.length) {
    alert(
      currentLanguage === "ku"
        ? "سەبەتەکەت بەتاڵە."
        : "Your cart is empty."
    );

    return;
  }

  let message =
    currentLanguage === "ku"
      ? "سڵاو، دەمەوێت ئەم بەرهەمانە داوا بکەم:\n\n"
      : "Hello, I would like to order:\n\n";

  let total = 0;

  cart.forEach((item) => {
    const itemTotal =
      Number(item.price_usd || 0) *
      Number(item.quantity || 0);

    total += itemTotal;

    message +=
      "• " +
      item.name +
      " x" +
      item.quantity +
      " - $" +
      itemTotal.toFixed(2) +
      "\n";
  });

  message +=
    "\n" +
    (currentLanguage === "ku"
      ? "کۆی گشتی: $"
      : "Total: $") +
    total.toFixed(2);

  const whatsappURL =
    "https://wa.me/" +
    WHATSAPP_NUMBER +
    "?text=" +
    encodeURIComponent(message);

  window.open(whatsappURL, "_blank");
}

function openProductDetails(id) {
  const product = products.find(
    (p) => String(p.id) === String(id)
  );

  if (!product) {
    return;
  }

  currentProduct = product;

  const overlay =
    document.getElementById("productDetailsOverlay");

  if (!overlay) {
    return;
  }

  const detailsBrand =
    document.getElementById("detailsBrand");

  const detailsName =
    document.getElementById("detailsName");

  const detailsCategory =
    document.getElementById("detailsCategory");

  const detailsConnection =
    document.getElementById("detailsConnection");

  const detailsUSD =
    document.getElementById("detailsUSD");

  const detailsIQD =
    document.getElementById("detailsIQD");

  const switchRow =
    document.getElementById("detailsSwitchRow");

  const switchType =
    document.getElementById("detailsSwitch");

  const image =
    document.getElementById("detailsImage");

  const noImage =
    document.getElementById("detailsNoImage");

  if (detailsBrand) {
    detailsBrand.textContent =
      product.brand || "AH STORE";
  }

  if (detailsName) {
    detailsName.textContent =
      product.name || "";
  }

  if (detailsCategory) {
    detailsCategory.textContent =
      product.category || "";
  }

  if (detailsConnection) {
    detailsConnection.textContent =
      product.connection || "";
  }

  if (detailsUSD) {
    detailsUSD.textContent =
      "$" + Number(product.price_usd || 0).toFixed(2);
  }

  if (detailsIQD) {
    detailsIQD.textContent =
      Number(product.price_iqd || 0).toLocaleString() +
      " IQD";
  }

  if (
    String(product.category || "").toLowerCase() ===
      "keyboard" &&
    product.switch_type
  ) {
    if (switchType) {
      switchType.textContent =
        product.switch_type + " Switch";
    }

    if (switchRow) {
      switchRow.classList.remove("hidden");
    }
  } else {
    if (switchType) {
      switchType.textContent = "";
    }

    if (switchRow) {
      switchRow.classList.add("hidden");
    }
  }

  if (product.image_url) {
    if (image) {
      image.src = product.image_url;
      image.classList.remove("hidden");
    }

    if (noImage) {
      noImage.classList.add("hidden");
    }
  } else {
    if (image) {
      image.removeAttribute("src");
      image.classList.add("hidden");
    }

    if (noImage) {
      noImage.classList.remove("hidden");
    }
  }

  overlay.classList.remove("hidden");
}

function closeProductModal() {
  const overlay =
    document.getElementById("productDetailsOverlay");

  if (overlay) {
    overlay.classList.add("hidden");
  }

  currentProduct = null;
}

function openAdmin() {
  const modal =
    document.getElementById("adminModal");

  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closeAdminModal() {
  const modal =
    document.getElementById("adminModal");

  if (modal) {
    modal.classList.add("hidden");
  }
}

async function checkAdminSession() {
  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (session) {
    showAdminPanel();
  } else {
    showLogin();
  }
}

function showLogin() {
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

async function loginAdmin(e) {
  e.preventDefault();

  const email =
    document.getElementById("adminEmail")?.value.trim();

  const password =
    document.getElementById("adminPassword")?.value;

  const message =
    document.getElementById("loginMessage");

  if (!email || !password) {
    return;
  }

  if (message) {
    message.textContent = "Signing in...";
  }

  const { error } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    console.error(error);

    if (message) {
      message.textContent = error.message;
    }

    return;
  }

  if (message) {
    message.textContent = "";
  }

  showAdminPanel();

  await loadProducts();
}

async function logoutAdmin() {
  await supabaseClient.auth.signOut();

  showLogin();

  const email =
    document.getElementById("adminEmail");

  const password =
    document.getElementById("adminPassword");

  if (email) {
    email.value = "";
  }

  if (password) {
    password.value = "";
  }
}

function renderAdminProducts() {
  const list =
    document.getElementById("adminProductsList");

  if (!list) {
    return;
  }

  if (!products.length) {
    list.innerHTML = "<p>No products yet.</p>";
    return;
  }

  list.innerHTML = "";

  products.forEach((product) => {
    const item = document.createElement("div");

    item.className = "admin-product";

    const info = document.createElement("div");

    info.className = "admin-product-info";

    const name = document.createElement("strong");

    name.textContent =
      product.name || "Product";

    const details = document.createElement("span");

    details.textContent =
      (product.brand || "") +
      " • " +
      (product.category || "") +
      " • $" +
      Number(product.price_usd || 0).toFixed(2);

    info.appendChild(name);
    info.appendChild(details);

    const actions = document.createElement("div");

    actions.className =
      "admin-product-actions";

    const edit = document.createElement("button");

    edit.type = "button";
    edit.textContent = "EDIT";

    edit.addEventListener("click", () => {
      editProduct(product.id);
    });

    const remove = document.createElement("button");

    remove.type = "button";
    remove.textContent = "DELETE";

    remove.addEventListener("click", () => {
      deleteProduct(product.id);
    });

    actions.appendChild(edit);
    actions.appendChild(remove);

    item.appendChild(info);
    item.appendChild(actions);

    list.appendChild(item);
  });
}

function editProduct(id) {
  const product = products.find(
    (p) => String(p.id) === String(id)
  );

  if (!product) {
    return;
  }

  editingProductId = product.id;

  const productId =
    document.getElementById("productId");

  const productName =
    document.getElementById("productName");

  const productBrand =
    document.getElementById("productBrand");

  const productCategory =
    document.getElementById("productCategory");

  const productUSD =
    document.getElementById("productUSD");

  const productIQD =
    document.getElementById("productIQD");

  const productConnection =
    document.getElementById("productConnection");

  const productSwitch =
    document.getElementById("productSwitch");

  if (productId) {
    productId.value = product.id;
  }

  if (productName) {
    productName.value = product.name || "";
  }

  if (productBrand) {
    productBrand.value = product.brand || "";
  }

  if (productCategory) {
    productCategory.value =
      product.category || "other";
  }

  if (productUSD) {
    productUSD.value =
      product.price_usd || "";
  }

  if (productIQD) {
    productIQD.value =
      product.price_iqd || "";
  }

  if (productConnection) {
    productConnection.value =
      product.connection || "Wired";
  }

  if (productSwitch) {
    productSwitch.value =
      product.switch_type || "";
  }

  const preview =
    document.getElementById("imagePreview");

  if (preview && product.image_url) {
    preview.src = product.image_url;
    preview.classList.remove("hidden");
  }

  const saveButton =
    document.getElementById("saveProductBtn");

  const cancelButton =
    document.getElementById("cancelEditBtn");

  if (saveButton) {
    saveButton.textContent =
      "SAVE CHANGES";
  }

  if (cancelButton) {
    cancelButton.classList.remove("hidden");
  }

  updateSwitchField();
}

function cancelEdit() {
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

  const preview =
    document.getElementById("imagePreview");

  if (preview) {
    preview.src = "";
    preview.classList.add("hidden");
  }

  const saveButton =
    document.getElementById("saveProductBtn");

  const cancelButton =
    document.getElementById("cancelEditBtn");

  if (saveButton) {
    saveButton.textContent =
      "ADD PRODUCT";
  }

  if (cancelButton) {
    cancelButton.classList.add("hidden");
  }

  updateSwitchField();
}

async function saveProduct(e) {
  e.preventDefault();

  const message =
    document.getElementById("productMessage");

  const saveButton =
    document.getElementById("saveProductBtn");

  const name =
    document.getElementById("productName").value.trim();

  const brand =
    document.getElementById("productBrand").value.trim();

  const category =
    document.getElementById("productCategory").value;

  const priceUSD =
    Number(document.getElementById("productUSD").value);

  const priceIQD =
    Number(document.getElementById("productIQD").value);

  const connection =
    document.getElementById("productConnection").value;

  const switchType =
    document.getElementById("productSwitch").value.trim();

  const imageInput =
    document.getElementById("productImage");

  if (message) {
    message.textContent = "Saving...";
  }

  if (saveButton) {
    saveButton.disabled = true;
  }

  let imageUrl = null;

  const existingProduct = editingProductId
    ? products.find(
        (p) =>
          String(p.id) ===
          String(editingProductId)
      )
    : null;

  if (existingProduct) {
    imageUrl =
      existingProduct.image_url || null;
  }

  if (imageInput?.files?.length) {
    const file = imageInput.files[0];

    const extension =
      file.name.split(".").pop();

    const filePath =
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .substring(2) +
      "." +
      extension;

    const { error: uploadError } =
      await supabaseClient.storage
        .from("products")
        .upload(filePath, file, {
          upsert: false
        });

    if (uploadError) {
      console.error(uploadError);

      if (message) {
        message.textContent =
          "Image upload failed: " +
          uploadError.message;
      }

      if (saveButton) {
        saveButton.disabled = false;
      }

      return;
    }

    const { data: publicUrlData } =
      supabaseClient.storage
        .from("products")
        .getPublicUrl(filePath);

    imageUrl =
      publicUrlData.publicUrl;
  }

  const productData = {
    name,
    brand,
    category,
    price_usd: priceUSD,
    price_iqd: priceIQD,
    image_url: imageUrl,
    connection,
    switch_type:
      category === "keyboard"
        ? switchType
        : null
  };

  let error = null;

  if (editingProductId) {
    const result =
      await supabaseClient
        .from("products")
        .update(productData)
        .eq("id", editingProductId);

    error = result.error;
  } else {
    const result =
      await supabaseClient
        .from("products")
        .insert(productData);

    error = result.error;
  }

  if (error) {
    console.error(error);

    if (message) {
      message.textContent =
        "Error: " + error.message;
    }

    if (saveButton) {
      saveButton.disabled = false;
    }

    return;
  }

  if (message) {
    message.textContent =
      editingProductId
        ? "Product updated!"
        : "Product added!";
  }

  cancelEdit();

  if (saveButton) {
    saveButton.disabled = false;
  }

  await loadProducts();
}

async function deleteProduct(id) {
  const product = products.find(
    (p) => String(p.id) === String(id)
  );

  if (!product) {
    return;
  }

  const confirmed = confirm(
    "Delete " +
      product.name +
      "?"
  );

  if (!confirmed) {
    return;
  }

  const { error } =
    await supabaseClient
      .from("products")
      .delete()
      .eq("id", id);

  if (error) {
    console.error(error);

    alert(
      "Delete failed: " +
      error.message
    );

    return;
  }

  products = products.filter(
    (p) => String(p.id) !== String(id)
  );

  renderProducts();
  renderAdminProducts();
}

function handleDocumentChange(e) {
  if (e.target?.id === "productImage") {
    const file =
      e.target.files?.[0];

    const preview =
      document.getElementById("imagePreview");

    if (!preview) {
      return;
    }

    if (!file) {
      preview.src = "";
      preview.classList.add("hidden");

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      preview.src = reader.result;
      preview.classList.remove("hidden");
    };

    reader.readAsDataURL(file);
  }

  if (e.target?.id === "productCategory") {
    updateSwitchField();
  }
}

function updateSwitchField() {
  const category =
    document.getElementById(
      "productCategory"
    )?.value;

  const switchField =
    document.getElementById("switchField");

  if (!switchField) {
    return;
  }

  if (category === "keyboard") {
    switchField.classList.remove("hidden");
  } else {
    switchField.classList.add("hidden");
  }
}

supabaseClient.auth.onAuthStateChange(
  (event, session) => {
    if (session) {
      showAdminPanel();
    } else {
      showLogin();
    }
  }
);
```
