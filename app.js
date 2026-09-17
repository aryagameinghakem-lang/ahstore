```javascript
// =====================================================
// AH STORE - BRAND NEW APP.JS
// =====================================================

const SUPABASE_URL = "https://toeqdxunmvspulvkpdow.supabase.co";
const SUPABASE_KEY = "sb_publishable_JsjlGkffizJ1Ap7oPCAQ6Q_8TJ64tw0";
const WHATSAPP_NUMBER = "9647701068935";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// =====================================================
// STATE
// =====================================================

let products = [];
let cart = [];
let language = localStorage.getItem("ahstore_language") || "en";
let selectedProduct = null;
let editingId = null;

// Load saved cart safely
try {
  cart = JSON.parse(
    localStorage.getItem("ahstore_cart") || "[]"
  );

  if (!Array.isArray(cart)) {
    cart = [];
  }
} catch {
  cart = [];
}

// =====================================================
// START
// =====================================================

document.addEventListener("DOMContentLoaded", startApp);

async function startApp() {
  console.log("AH STORE starting...");

  setupButtons();
  setLanguage();
  closeCart();
  closeProductModal();
  closeAdmin();

  updateCart();

  await loadProducts();
  await checkLogin();

  console.log("AH STORE ready.");
}

// =====================================================
// BUTTONS / EVENTS
// =====================================================

function setupButtons() {
  const languageButton = document.getElementById("languageBtn");
  const cartButton = document.getElementById("cartBtn");
  const closeCartButton = document.getElementById("closeCart");
  const cartOverlay = document.getElementById("cartOverlay");

  const whatsappButton =
    document.getElementById("whatsappOrder");

  const adminButton = document.getElementById("adminBtn");
  const closeAdminButton = document.getElementById("closeAdmin");

  const loginForm = document.getElementById("loginForm");
  const logoutButton = document.getElementById("logoutBtn");

  const searchInput = document.getElementById("searchInput");
  const categoryFilter =
    document.getElementById("categoryFilter");

  const closeDetailsButton =
    document.getElementById("closeProductDetails");

  const detailsOverlay =
    document.getElementById("productDetailsOverlay");

  const detailsAddButton =
    document.getElementById("detailsAddCart");

  const productForm =
    document.getElementById("productForm");

  const cancelEditButton =
    document.getElementById("cancelEditBtn");

  // Language
  if (languageButton) {
    languageButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();

      language = language === "en" ? "ku" : "en";

      localStorage.setItem(
        "ahstore_language",
        language
      );

      setLanguage();
      renderProducts();
      updateCart();
    });
  }

  // Cart
  if (cartButton) {
    cartButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();

      openCart();
    });
  }

  if (closeCartButton) {
    closeCartButton.addEventListener(
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

  // WhatsApp
  if (whatsappButton) {
    whatsappButton.addEventListener(
      "click",
      sendOrder
    );
  }

  // Admin
  if (adminButton) {
    adminButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();

      openAdmin();
    });
  }

  if (closeAdminButton) {
    closeAdminButton.addEventListener(
      "click",
      closeAdmin
    );
  }

  if (loginForm) {
    loginForm.addEventListener(
      "submit",
      login
    );
  }

  if (logoutButton) {
    logoutButton.addEventListener(
      "click",
      logout
    );
  }

  // Search
  if (searchInput) {
    searchInput.addEventListener(
      "input",
      renderProducts
    );
  }

  // Category
  if (categoryFilter) {
    categoryFilter.addEventListener(
      "change",
      renderProducts
    );
  }

  // Product details
  if (closeDetailsButton) {
    closeDetailsButton.addEventListener(
      "click",
      closeProductModal
    );
  }

  if (detailsOverlay) {
    detailsOverlay.addEventListener(
      "click",
      function (event) {
        if (event.target === detailsOverlay) {
          closeProductModal();
        }
      }
    );
  }

  if (detailsAddButton) {
    detailsAddButton.addEventListener(
      "click",
      function () {
        if (!selectedProduct) return;

        addToCart(selectedProduct.id);
        closeProductModal();
      }
    );
  }

  // Product manager
  if (productForm) {
    productForm.addEventListener(
      "submit",
      saveProduct
    );
  }

  if (cancelEditButton) {
    cancelEditButton.addEventListener(
      "click",
      cancelEdit
    );
  }

  // Image/category changes
  document.addEventListener(
    "change",
    handleChange
  );

  // Escape key
  document.addEventListener(
    "keydown",
    function (event) {
      if (event.key === "Escape") {
        closeCart();
        closeProductModal();
        closeAdmin();
      }
    }
  );
}

// =====================================================
// LANGUAGE
// =====================================================

function setLanguage() {
  document.documentElement.lang =
    language === "ku" ? "ku" : "en";

  document.documentElement.dir =
    language === "ku" ? "rtl" : "ltr";

  document.querySelectorAll("[data-en]").forEach(
    function (element) {
      const text =
        language === "ku"
          ? element.getAttribute("data-ku")
          : element.getAttribute("data-en");

      if (text !== null) {
        element.textContent = text;
      }
    }
  );

  document
    .querySelectorAll("[data-placeholder-en]")
    .forEach(function (element) {
      const placeholder =
        language === "ku"
          ? element.getAttribute(
              "data-placeholder-ku"
            )
          : element.getAttribute(
              "data-placeholder-en"
            );

      if (placeholder !== null) {
        element.placeholder = placeholder;
      }
    });

  const languageButton =
    document.getElementById("languageBtn");

  if (languageButton) {
    languageButton.textContent =
      language === "en"
        ? "کوردی"
        : "English";
  }
}

// =====================================================
// PRODUCTS
// =====================================================

async function loadProducts() {
  const grid =
    document.getElementById("productsGrid");

  if (grid) {
    grid.innerHTML =
      '<div class="loading">Loading products...</div>';
  }

  const result = await db
    .from("products")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (result.error) {
    console.error(
      "SUPABASE PRODUCTS ERROR:",
      result.error
    );

    if (grid) {
      grid.innerHTML =
        '<div class="loading">Unable to load products.</div>';
    }

    return;
  }

  products = result.data || [];

  console.log(
    "Products loaded:",
    products
  );

  renderProducts();
  renderAdminProducts();
}

function renderProducts() {
  const grid =
    document.getElementById("productsGrid");

  if (!grid) return;

  const searchInput =
    document.getElementById("searchInput");

  const categoryFilter =
    document.getElementById("categoryFilter");

  const search =
    searchInput
      ? searchInput.value
          .trim()
          .toLowerCase()
      : "";

  const category =
    categoryFilter
      ? categoryFilter.value
      : "all";

  const filteredProducts =
    products.filter(function (product) {
      const name =
        String(product.name || "")
          .toLowerCase();

      const brand =
        String(product.brand || "")
          .toLowerCase();

      const productCategory =
        String(product.category || "")
          .toLowerCase();

      const matchesSearch =
        !search ||
        name.includes(search) ||
        brand.includes(search);

      const matchesCategory =
        category === "all" ||
        productCategory ===
          category.toLowerCase();

      return (
        matchesSearch &&
        matchesCategory
      );
    });

  grid.innerHTML = "";

  if (!filteredProducts.length) {
    grid.innerHTML =
      '<div class="loading">No products found.</div>';

    return;
  }

  filteredProducts.forEach(
    function (product) {
      const card =
        document.createElement("div");

      card.className =
        "product-card";

      // -------------------------
      // IMAGE
      // -------------------------

      const imageArea =
        document.createElement("div");

      imageArea.className =
        "product-image";

      if (product.image_url) {
        const image =
          document.createElement("img");

        image.src =
          product.image_url;

        image.alt =
          product.name || "Product";

        image.loading = "lazy";

        imageArea.appendChild(image);
      } else {
        const noImage =
          document.createElement("div");

        noImage.className =
          "no-image";

        noImage.textContent =
          "NO IMAGE";

        imageArea.appendChild(
          noImage
        );
      }

      // -------------------------
      // CONTENT
      // -------------------------

      const content =
        document.createElement("div");

      content.className =
        "product-content";

      const brand =
        document.createElement("div");

      brand.className =
        "product-brand";

      brand.textContent =
        product.brand || "AH STORE";

      const name =
        document.createElement("h3");

      name.textContent =
        product.name || "Product";

      // -------------------------
      // DETAILS
      // -------------------------

      const details =
        document.createElement("div");

      details.className =
        "product-details";

      if (product.connection) {
        const connection =
          document.createElement("span");

        connection.textContent =
          product.connection;

        details.appendChild(
          connection
        );
      }

      if (
        String(product.category || "")
          .toLowerCase() ===
          "keyboard" &&
        product.switch_type
      ) {
        const switchType =
          document.createElement("span");

        switchType.textContent =
          product.switch_type +
          " Switch";

        details.appendChild(
          switchType
        );
      }

      // -------------------------
      // PRICE
      // -------------------------

      const price =
        document.createElement("div");

      price.className =
        "product-price";

      const usd =
        document.createElement("div");

      usd.className =
        "price-usd";

      usd.textContent =
        "$" +
        Number(
          product.price_usd || 0
        ).toFixed(2);

      const iqd =
        document.createElement("div");

      iqd.className =
        "price-iqd";

      iqd.textContent =
        Number(
          product.price_iqd || 0
        ).toLocaleString() +
        " IQD";

      price.appendChild(usd);
      price.appendChild(iqd);

      // -------------------------
      // BUTTONS
      // -------------------------

      const buttons =
        document.createElement("div");

      buttons.className =
        "product-buttons";

      const addButton =
        document.createElement("button");

      addButton.type = "button";
      addButton.className =
        "add-cart";

      addButton.textContent =
        language === "ku"
          ? "زیادکردن بۆ سەبەت"
          : "ADD TO CART";

      addButton.addEventListener(
        "click",
        function (event) {
          event.preventDefault();
          event.stopPropagation();

          addToCart(product.id);
        }
      );

      const detailsButton =
        document.createElement("button");

      detailsButton.type = "button";
      detailsButton.className =
        "details-btn";

      detailsButton.textContent =
        language === "ku"
          ? "وردەکاری"
          : "DETAILS";

      detailsButton.addEventListener(
        "click",
        function (event) {
          event.preventDefault();
          event.stopPropagation();

          openProductModal(
            product.id
          );
        }
      );

      buttons.appendChild(
        addButton
      );

      buttons.appendChild(
        detailsButton
      );

      // -------------------------
      // BUILD CARD
      // -------------------------

      content.appendChild(brand);
      content.appendChild(name);
      content.appendChild(details);
      content.appendChild(price);
      content.appendChild(buttons);

      card.appendChild(imageArea);
      card.appendChild(content);

      card.addEventListener(
        "click",
        function () {
          openProductModal(
            product.id
          );
        }
      );

      grid.appendChild(card);
    }
  );
}

// =====================================================
// CART
// =====================================================

function openCart() {
  const drawer =
    document.getElementById(
      "cartDrawer"
    );

  const overlay =
    document.getElementById(
      "cartOverlay"
    );

  if (drawer) {
    drawer.classList.remove(
      "hidden"
    );

    drawer.classList.add(
      "open"
    );
  }

  if (overlay) {
    overlay.classList.remove(
      "hidden"
    );

    overlay.classList.add(
      "open"
    );
  }

  updateCart();
}

function closeCart() {
  const drawer =
    document.getElementById(
      "cartDrawer"
    );

  const overlay =
    document.getElementById(
      "cartOverlay"
    );

  if (drawer) {
    drawer.classList.remove(
      "open"
    );

    drawer.classList.add(
      "hidden"
    );
  }

  if (overlay) {
    overlay.classList.remove(
      "open"
    );

    overlay.classList.add(
      "hidden"
    );
  }
}

function addToCart(id) {
  const product =
    products.find(function (item) {
      return String(item.id) ===
        String(id);
    });

  if (!product) {
    console.error(
      "Could not find product:",
      id
    );

    return;
  }

  const existing =
    cart.find(function (item) {
      return String(item.id) ===
        String(product.id);
    });

  if (existing) {
    existing.quantity =
      Number(existing.quantity || 0) +
      1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price_usd:
        Number(
          product.price_usd || 0
        ),
      price_iqd:
        Number(
          product.price_iqd || 0
        ),
      image_url:
        product.image_url || "",
      quantity: 1
    });
  }

  saveCart();
  updateCart();
}

function removeFromCart(id) {
  cart =
    cart.filter(function (item) {
      return String(item.id) !==
        String(id);
    });

  saveCart();
  updateCart();
}

function changeQuantity(
  id,
  amount
) {
  const item =
    cart.find(function (cartItem) {
      return String(cartItem.id) ===
        String(id);
    });

  if (!item) return;

  item.quantity =
    Number(item.quantity || 0) +
    amount;

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
  const items =
    document.getElementById(
      "cartItems"
    );

  const count =
    document.getElementById(
      "cartCount"
    );

  const total =
    document.getElementById(
      "cartTotal"
    );

  const itemCount =
    cart.reduce(function (
      sum,
      item
    ) {
      return (
        sum +
        Number(
          item.quantity || 0
        )
      );
    }, 0);

  if (count) {
    count.textContent =
      itemCount;
  }

  if (!items || !total) {
    return;
  }

  items.innerHTML = "";

  if (!cart.length) {
    items.innerHTML =
      '<div class="empty-cart">Your cart is empty.</div>';

    total.textContent =
      "$0";

    return;
  }

  let totalUSD = 0;

  cart.forEach(function (item) {
    const quantity =
      Number(
        item.quantity || 0
      );

    const price =
      Number(
        item.price_usd || 0
      );

    totalUSD +=
      price * quantity;

    const row =
      document.createElement(
        "div"
      );

    row.className =
      "cart-item";

    // Image
    const imageBox =
      document.createElement(
        "div"
      );

    imageBox.className =
      "cart-item-image";

    if (item.image_url) {
      const image =
        document.createElement(
          "img"
        );

      image.src =
        item.image_url;

      image.alt =
        item.name || "Product";

      imageBox.appendChild(
        image
      );
    }

    // Info
    const info =
      document.createElement(
        "div"
      );

    info.className =
      "cart-item-info";

    const name =
      document.createElement(
        "strong"
      );

    name.textContent =
      item.name || "Product";

    const itemPrice =
      document.createElement(
        "span"
      );

    itemPrice.textContent =
      "$" +
      price.toFixed(2);

    // Quantity
    const quantityBox =
      document.createElement(
        "div"
      );

    quantityBox.className =
      "cart-quantity";

    const minus =
      document.createElement(
        "button"
      );

    minus.type = "button";
    minus.textContent = "−";

    minus.addEventListener(
      "click",
      function (event) {
        event.stopPropagation();

        changeQuantity(
          item.id,
          -1
        );
      }
    );

    const number =
      document.createElement(
        "span"
      );

    number.textContent =
      quantity;

    const plus =
      document.createElement(
        "button"
      );

    plus.type = "button";
    plus.textContent = "+";

    plus.addEventListener(
      "click",
      function (event) {
        event.stopPropagation();

        changeQuantity(
          item.id,
          1
        );
      }
    );

    quantityBox.appendChild(
      minus
    );

    quantityBox.appendChild(
      number
    );

    quantityBox.appendChild(
      plus
    );

    // Remove
    const remove =
      document.createElement(
        "button"
      );

    remove.type = "button";
    remove.className =
      "cart-remove";

    remove.textContent =
      language === "ku"
        ? "سڕینەوە"
        : "Remove";

    remove.addEventListener(
      "click",
      function (event) {
        event.stopPropagation();

        removeFromCart(
          item.id
        );
      }
    );

    info.appendChild(name);
    info.appendChild(itemPrice);
    info.appendChild(
      quantityBox
    );
    info.appendChild(remove);

    row.appendChild(
      imageBox
    );

    row.appendChild(
      info
    );

    items.appendChild(
      row
    );
  });

  total.textContent =
    "$" +
    totalUSD.toFixed(2);
}

// =====================================================
// WHATSAPP
// =====================================================

function sendOrder() {
  if (!cart.length) {
    alert(
      language === "ku"
        ? "سەبەتەکەت بەتاڵە."
        : "Your cart is empty."
    );

    return;
  }

  let message =
    language === "ku"
      ? "سڵاو، دەمەوێت ئەم بەرهەمانە داوا بکەم:\n\n"
      : "Hello, I would like to order:\n\n";

  let total = 0;

  cart.forEach(function (item) {
    const price =
      Number(
        item.price_usd || 0
      );

    const quantity =
      Number(
        item.quantity || 0
      );

    const itemTotal =
      price * quantity;

    total += itemTotal;

    message +=
      "• " +
      item.name +
      " x" +
      quantity +
      " - $" +
      itemTotal.toFixed(2) +
      "\n";
  });

  message +=
    "\n" +
    (
      language === "ku"
        ? "کۆی گشتی: $"
        : "Total: $"
    ) +
    total.toFixed(2);

  const url =
    "https://wa.me/" +
    WHATSAPP_NUMBER +
    "?text=" +
    encodeURIComponent(
      message
    );

  window.open(
    url,
    "_blank"
  );
}

// =====================================================
// PRODUCT DETAILS
// =====================================================

function openProductModal(id) {
  const product =
    products.find(function (item) {
      return String(item.id) ===
        String(id);
    });

  if (!product) return;

  selectedProduct =
    product;

  const overlay =
    document.getElementById(
      "productDetailsOverlay"
    );

  if (!overlay) return;

  const brand =
    document.getElementById(
      "detailsBrand"
    );

  const name =
    document.getElementById(
      "detailsName"
    );

  const category =
    document.getElementById(
      "detailsCategory"
    );

  const connection =
    document.getElementById(
      "detailsConnection"
    );

  const usd =
    document.getElementById(
      "detailsUSD"
    );

  const iqd =
    document.getElementById(
      "detailsIQD"
    );

  const switchRow =
    document.getElementById(
      "detailsSwitchRow"
    );

  const switchText =
    document.getElementById(
      "detailsSwitch"
    );

  const image =
    document.getElementById(
      "detailsImage"
    );

  const noImage =
    document.getElementById(
      "detailsNoImage"
    );

  if (brand) {
    brand.textContent =
      product.brand ||
      "AH STORE";
  }

  if (name) {
    name.textContent =
      product.name ||
      "";
  }

  if (category) {
    category.textContent =
      product.category ||
      "";
  }

  if (connection) {
    connection.textContent =
      product.connection ||
      "";
  }

  if (usd) {
    usd.textContent =
      "$" +
      Number(
        product.price_usd || 0
      ).toFixed(2);
  }

  if (iqd) {
    iqd.textContent =
      Number(
        product.price_iqd || 0
      ).toLocaleString() +
      " IQD";
  }

  if (
    String(
      product.category || ""
    ).toLowerCase() ===
      "keyboard" &&
    product.switch_type
  ) {
    if (switchText) {
      switchText.textContent =
        product.switch_type +
        " Switch";
    }

    if (switchRow) {
      switchRow.classList.remove(
        "hidden"
      );
    }
  } else {
    if (switchText) {
      switchText.textContent =
        "";
    }

    if (switchRow) {
      switchRow.classList.add(
        "hidden"
      );
    }
  }

  if (product.image_url) {
    if (image) {
      image.src =
        product.image_url;

      image.classList.remove(
        "hidden"
      );
    }

    if (noImage) {
      noImage.classList.add(
        "hidden"
      );
    }
  } else {
    if (image) {
      image.removeAttribute(
        "src"
      );

      image.classList.add(
        "hidden"
      );
    }

    if (noImage) {
      noImage.classList.remove(
        "hidden"
      );
    }
  }

  overlay.classList.remove(
    "hidden"
  );
}

function closeProductModal() {
  const overlay =
    document.getElementById(
      "productDetailsOverlay"
    );

  if (overlay) {
    overlay.classList.add(
      "hidden"
    );
  }

  selectedProduct =
    null;
}

// =====================================================
// ADMIN
// =====================================================

function openAdmin() {
  const modal =
    document.getElementById(
      "adminModal"
    );

  if (modal) {
    modal.classList.remove(
      "hidden"
    );
  }
}

function closeAdmin() {
  const modal =
    document.getElementById(
      "adminModal"
    );

  if (modal) {
    modal.classList.add(
      "hidden"
    );
  }
}

async function checkLogin() {
  const result =
    await db.auth.getSession();

  const session =
    result.data?.session;

  if (session) {
    showAdminPanel();
  } else {
    showLogin();
  }
}

function showLogin() {
  const login =
    document.getElementById(
      "loginSection"
    );

  const panel =
    document.getElementById(
      "adminPanel"
    );

  if (login) {
    login.classList.remove(
      "hidden"
    );
  }

  if (panel) {
    panel.classList.add(
      "hidden"
    );
  }
}

function showAdminPanel() {
  const login =
    document.getElementById(
      "loginSection"
    );

  const panel =
    document.getElementById(
      "adminPanel"
    );

  if (login) {
    login.classList.add(
      "hidden"
    );
  }

  if (panel) {
    panel.classList.remove(
      "hidden"
    );
  }

  renderAdminProducts();
}

async function login(event) {
  event.preventDefault();

  const emailInput =
    document.getElementById(
      "adminEmail"
    );

  const passwordInput =
    document.getElementById(
      "adminPassword"
    );

  const message =
    document.getElementById(
      "loginMessage"
    );

  const email =
    emailInput
      ? emailInput.value.trim()
      : "";

  const password =
    passwordInput
      ? passwordInput.value
      : "";

  if (!email || !password) {
    return;
  }

  if (message) {
    message.textContent =
      "Signing in...";
  }

  const result =
    await db.auth.signInWithPassword({
      email: email,
      password: password
    });

  if (result.error) {
    console.error(
      "LOGIN ERROR:",
      result.error
    );

    if (message) {
      message.textContent =
        result.error.message;
    }

    return;
  }

  if (message) {
    message.textContent =
      "";
  }

  showAdminPanel();

  await loadProducts();
}

async function logout() {
  await db.auth.signOut();

  showLogin();
}

// =====================================================
// ADMIN PRODUCT LIST
// =====================================================

function renderAdminProducts() {
  const list =
    document.getElementById(
      "adminProductsList"
    );

  if (!list) return;

  list.innerHTML = "";

  if (!products.length) {
    list.innerHTML =
      "<p>No products yet.</p>";

    return;
  }

  products.forEach(
    function (product) {
      const item =
        document.createElement(
          "div"
        );

      item.className =
        "admin-product";

      const info =
        document.createElement(
          "div"
        );

      info.className =
        "admin-product-info";

      const name =
        document.createElement(
          "strong"
        );

      name.textContent =
        product.name ||
        "Product";

      const details =
        document.createElement(
          "span"
        );

      details.textContent =
        (product.brand || "") +
        " • " +
        (product.category || "") +
        " • $" +
        Number(
          product.price_usd || 0
        ).toFixed(2);

      info.appendChild(name);
      info.appendChild(details);

      const actions =
        document.createElement(
          "div"
        );

      actions.className =
        "admin-product-actions";

      const edit =
        document.createElement(
          "button"
        );

      edit.type = "button";
      edit.textContent =
        "EDIT";

      edit.addEventListener(
        "click",
        function () {
          editProduct(
            product.id
          );
        }
      );

      const remove =
        document.createElement(
          "button"
        );

      remove.type = "button";
      remove.textContent =
        "DELETE";

      remove.addEventListener(
        "click",
        function () {
          deleteProduct(
            product.id
          );
        }
      );

      actions.appendChild(
        edit
      );

      actions.appendChild(
        remove
      );

      item.appendChild(
        info
      );

      item.appendChild(
        actions
      );

      list.appendChild(
        item
      );
    }
  );
}

// =====================================================
// EDIT PRODUCT
// =====================================================

function editProduct(id) {
  const product =
    products.find(function (item) {
      return String(item.id) ===
        String(id);
    });

  if (!product) return;

  editingId =
    product.id;

  setValue(
    "productId",
    product.id
  );

  setValue(
    "productName",
    product.name || ""
  );

  setValue(
    "productBrand",
    product.brand || ""
  );

  setValue(
    "productCategory",
    product.category || "other"
  );

  setValue(
    "productUSD",
    product.price_usd || ""
  );

  setValue(
    "productIQD",
    product.price_iqd || ""
  );

  setValue(
    "productConnection",
    product.connection || "Wired"
  );

  setValue(
    "productSwitch",
    product.switch_type || ""
  );

  const preview =
    document.getElementById(
      "imagePreview"
    );

  if (preview) {
    if (product.image_url) {
      preview.src =
        product.image_url;

      preview.classList.remove(
        "hidden"
      );
    } else {
      preview.src = "";

      preview.classList.add(
        "hidden"
      );
    }
  }

  const saveButton =
    document.getElementById(
      "saveProductBtn"
    );

  const cancelButton =
    document.getElementById(
      "cancelEditBtn"
    );

  if (saveButton) {
    saveButton.textContent =
      "SAVE CHANGES";
  }

  if (cancelButton) {
    cancelButton.classList.remove(
      "hidden"
    );
  }

  updateSwitchField();
}

function cancelEdit() {
  editingId =
    null;

  const form =
    document.getElementById(
      "productForm"
    );

  if (form) {
    form.reset();
  }

  const productId =
    document.getElementById(
      "productId"
    );

  if (productId) {
    productId.value =
      "";
  }

  const preview =
    document.getElementById(
      "imagePreview"
    );

  if (preview) {
    preview.src = "";

    preview.classList.add(
      "hidden"
    );
  }

  const saveButton =
    document.getElementById(
      "saveProductBtn"
    );

  const cancelButton =
    document.getElementById(
      "cancelEditBtn"
    );

  if (saveButton) {
    saveButton.textContent =
      "ADD PRODUCT";
  }

  if (cancelButton) {
    cancelButton.classList.add(
      "hidden"
    );
  }

  updateSwitchField();
}

function setValue(
  id,
  value
) {
  const element =
    document.getElementById(id);

  if (element) {
    element.value =
      value;
  }
}

// =====================================================
// SAVE PRODUCT
// =====================================================

async function saveProduct(event) {
  event.preventDefault();

  const message =
    document.getElementById(
      "productMessage"
    );

  const saveButton =
    document.getElementById(
      "saveProductBtn"
    );

  const name =
    document.getElementById(
      "productName"
    )?.value.trim() || "";

  const brand =
    document.getElementById(
      "productBrand"
    )?.value.trim() || "";

  const category =
    document.getElementById(
      "productCategory"
    )?.value || "other";

  const priceUSD =
    Number(
      document.getElementById(
        "productUSD"
      )?.value || 0
    );

  const priceIQD =
    Number(
      document.getElementById(
        "productIQD"
      )?.value || 0
    );

  const connection =
    document.getElementById(
      "productConnection"
    )?.value || "Wired";

  const switchType =
    document.getElementById(
      "productSwitch"
    )?.value.trim() || "";

  const imageInput =
    document.getElementById(
      "productImage"
    );

  if (!name) {
    if (message) {
      message.textContent =
        "Product name is required.";
    }

    return;
  }

  if (message) {
    message.textContent =
      "Saving...";
  }

  if (saveButton) {
    saveButton.disabled =
      true;
  }

  let imageUrl =
    null;

  // Existing image
  if (editingId) {
    const oldProduct =
      products.find(function (item) {
        return String(item.id) ===
          String(editingId);
      });

    if (oldProduct) {
      imageUrl =
        oldProduct.image_url ||
        null;
    }
  }

  // New image
  if (
    imageInput &&
    imageInput.files &&
    imageInput.files.length
  ) {
    const file =
      imageInput.files[0];

    const extension =
      file.name.includes(".")
        ? file.name
            .split(".")
            .pop()
        : "jpg";

    const path =
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .substring(2) +
      "." +
      extension;

    const upload =
      await db.storage
        .from("products")
        .upload(
          path,
          file,
          {
            upsert: false
          }
        );

    if (upload.error) {
      console.error(
        "IMAGE UPLOAD ERROR:",
        upload.error
      );

      if (message) {
        message.textContent =
          "Image upload failed: " +
          upload.error.message;
      }

      if (saveButton) {
        saveButton.disabled =
          false;
      }

      return;
    }

    const publicURL =
      db.storage
        .from("products")
        .getPublicUrl(path);

    imageUrl =
      publicURL.data.publicUrl;
  }

  const data = {
    name: name,
    brand: brand,
    category: category,
    price_usd: priceUSD,
    price_iqd: priceIQD,
    image_url: imageUrl,
    connection: connection,
    switch_type:
      category === "keyboard"
        ? switchType
        : null
  };

  let result;

  if (editingId) {
    result =
      await db
        .from("products")
        .update(data)
        .eq("id", editingId);
  } else {
    result =
      await db
        .from("products")
        .insert(data);
  }

  if (result.error) {
    console.error(
      "PRODUCT SAVE ERROR:",
      result.error
    );

    if (message) {
      message.textContent =
        "Error: " +
        result.error.message;
    }

    if (saveButton) {
      saveButton.disabled =
        false;
    }

    return;
  }

  if (message) {
    message.textContent =
      editingId
        ? "Product updated!"
        : "Product added!";
  }

  editingId =
    null;

  cancelEdit();

  if (saveButton) {
    saveButton.disabled =
      false;
  }

  await loadProducts();
}

// =====================================================
// DELETE PRODUCT
// =====================================================

async function deleteProduct(id) {
  const product =
    products.find(function (item) {
      return String(item.id) ===
        String(id);
    });

  if (!product) return;

  const confirmed =
    window.confirm(
      "Delete " +
        product.name +
        "?"
    );

  if (!confirmed) return;

  const result =
    await db
      .from("products")
      .delete()
      .eq("id", id);

  if (result.error) {
    console.error(
      "DELETE ERROR:",
      result.error
    );

    alert(
      "Delete failed: " +
        result.error.message
    );

    return;
  }

  products =
    products.filter(function (
      item
    ) {
      return String(item.id) !==
        String(id);
    });

  renderProducts();
  renderAdminProducts();
}

// =====================================================
// IMAGE PREVIEW / CATEGORY
// =====================================================

function handleChange(event) {
  const target =
    event.target;

  if (!target) return;

  // Image preview
  if (
    target.id ===
    "productImage"
  ) {
    const file =
      target.files?.[0];

    const preview =
      document.getElementById(
        "imagePreview"
      );

    if (!preview) return;

    if (!file) {
      preview.src = "";

      preview.classList.add(
        "hidden"
      );

      return;
    }

    const reader =
      new FileReader();

    reader.onload =
      function () {
        preview.src =
          reader.result;

        preview.classList.remove(
          "hidden"
        );
      };

    reader.readAsDataURL(
      file
    );
  }

  // Category
  if (
    target.id ===
    "productCategory"
  ) {
    updateSwitchField();
  }
}

function updateSwitchField() {
  const category =
    document.getElementById(
      "productCategory"
    )?.value;

  const field =
    document.getElementById(
      "switchField"
    );

  if (!field) return;

  if (category === "keyboard") {
    field.classList.remove(
      "hidden"
    );
  } else {
    field.classList.add(
      "hidden"
    );
  }
}

// =====================================================
// SUPABASE LOGIN STATE
// =====================================================

db.auth.onAuthStateChange(
  function (event, session) {
    if (session) {
      showAdminPanel();
    } else {
      showLogin();
    }
  }
);

console.log(
  "AH STORE app.js loaded successfully."
);
```
