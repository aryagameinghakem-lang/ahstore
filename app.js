const SUPABASE_URL = "https://toeqdxunmvspulvkpdow.supabase.co";
const SUPABASE_KEY = "sb_publishable_JsjlGkffizJ1Ap7oPCAQ6Q_8TJ64tw0";
const WHATSAPP = "9647701068935";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let products = [];
let cart = JSON.parse(localStorage.getItem("ahstore_cart") || "[]");
let language = localStorage.getItem("ahstore_language") || "en";
let editingId = null;
let selectedProductId = null;
let selectedCategory = "all";

/* =========================
HELPER
========================= */

const $ = (id) => document.getElementById(id);

/* =========================
PRODUCTS HEADING ROTATION
========================= */

function startProductsHeadingRotation() {
  const heading = $("productsHeading");

  if (!heading) return;

  const headingTexts = {
    en: [
      "GAMING PRODUCTS",
      "ELECTRONIC PRODUCTS",
      "YOUR DESIRED PRODUCTS"
    ],
    ku: [
      "بەرهەمەکانی گەیمینگ",
      "بەرهەمە ئەلیکترۆنییەکان",
      "بەرهەمە خواستراوەکانت"
    ]
  };

  let headingIndex = 0;

  function updateHeading() {
    heading.textContent =
      headingTexts[language]?.[headingIndex] ||
      headingTexts.en[headingIndex];
  }

  updateHeading();

  setInterval(() => {
    headingIndex =
      (headingIndex + 1) %
      headingTexts[language].length;

    updateHeading();
  }, 4000);
}

/* =========================
START
========================= */

document.addEventListener("DOMContentLoaded", () => {
  setupButtons();
  applyLanguage();
  updateSwitchField();
  renderCart();
  closeCart();
  closeProductDetails();
  startProductsHeadingRotation();
  loadProducts();
  checkAuth();
});

/* =========================
BUTTONS
========================= */

function setupButtons() {
  $("languageBtn")?.addEventListener(
    "click",
    toggleLanguage
  );

  $("cartBtn")?.addEventListener(
    "click",
    openCart
  );

  $("closeCart")?.addEventListener(
    "click",
    closeCart
  );

  $("cartOverlay")?.addEventListener(
    "click",
    closeCart
  );

  $("adminBtn")?.addEventListener(
    "click",
    openAdmin
  );

  $("closeAdmin")?.addEventListener(
    "click",
    closeAdmin
  );

  $("whatsappOrder")?.addEventListener(
    "click",
    checkoutWhatsApp
  );

  $("searchInput")?.addEventListener(
    "input",
    filterProducts
  );

  $("connectionFilter")?.addEventListener(
    "change",
    filterProducts
  );

  $("conditionFilter")?.addEventListener(
    "change",
    filterProducts
  );

  /* =========================
  CUSTOMER CATEGORY BUTTONS
  ========================= */

  document
    .querySelectorAll(".category-btn")
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          selectedCategory =
            button.dataset.category || "all";

          document
            .querySelectorAll(".category-btn")
            .forEach((btn) => {
              btn.classList.remove("active");
            });

          button.classList.add("active");

          filterProducts();
        }
      );
    });

  $("loginForm")?.addEventListener(
    "submit",
    loginAdmin
  );

  $("logoutBtn")?.addEventListener(
    "click",
    logoutAdmin
  );

  $("productForm")?.addEventListener(
    "submit",
    saveProduct
  );

  $("cancelEditBtn")?.addEventListener(
    "click",
    cancelEdit
  );

  $("productCategory")?.addEventListener(
    "change",
    updateSwitchField
  );

  $("productImage")?.addEventListener(
    "change",
    previewImage
  );

  $("closeProductDetails")?.addEventListener(
    "click",
    closeProductDetails
  );

  $("productDetailsOverlay")?.addEventListener(
    "click",
    (event) => {
      if (
        event.target ===
        $("productDetailsOverlay")
      ) {
        closeProductDetails();
      }
    }
  );

  $("detailsAddCart")?.addEventListener(
    "click",
    () => {
      if (selectedProductId !== null) {
        const product =
          findProduct(selectedProductId);

        if (product?.sold) {
          return;
        }

        addToCart(selectedProductId);
        closeProductDetails();
      }
    }
  );
}

/* =========================
PRODUCTS
========================= */

async function loadProducts() {
  const container =
    $("productsGrid");

  if (container) {
    container.innerHTML =
      `<div class="loading">No products yet.</div>`;
  }

  const { data, error } =
    await db
      .from("products")
      .select("*")
      .order("created_at", {
        ascending: false
      });

  if (error) {
    console.error(
      "Products error:",
      error
    );

    if (container) {
      container.innerHTML =
        `<div class="loading">
          Unable to load products.
        </div>`;
    }

    return;
  }

  products = data || [];

  console.log(
    "Products loaded:",
    products
  );

  renderProducts(
    getFilteredProducts()
  );

  renderAdminProducts();
}

/* =========================
PRODUCT DISPLAY
========================= */

function renderProducts(list) {
  const container =
    $("productsGrid");

  if (!container) return;

  if (!list || !list.length) {
    container.innerHTML =
      `<div class="loading">
        ${
          language === "ku"
            ? "هیچ بەرهەمێک نییە."
            : "No products yet."
        }
      </div>`;

    return;
  }

  container.innerHTML = "";

  list.forEach((product) => {
    const card =
      document.createElement("div");

    card.className =
      "product-card";

    const imageArea =
      document.createElement("div");

    imageArea.className =
      "product-image";

    if (product.image_url) {
      const img =
        document.createElement("img");

      img.src =
        product.image_url;

      img.alt =
        product.name || "Product";

      imageArea.appendChild(img);

    } else {
      const noImage =
        document.createElement("div");

      noImage.className =
        "no-image";

      noImage.textContent =
        "AHSTORE";

      imageArea.appendChild(
        noImage
      );
    }

    /* =========================
    SOLD LABEL
    ========================= */

    if (product.sold) {
      const soldLabel =
        document.createElement("div");

      soldLabel.className =
        "product-sold";

      soldLabel.textContent =
        language === "ku"
          ? "فرۆشراوە"
          : "SOLD";

      imageArea.appendChild(
        soldLabel
      );
    }

    const info =
      document.createElement("div");

    info.className =
      "product-info";

    const brand =
      document.createElement("div");

    brand.className =
      "product-brand";

    brand.textContent =
      product.brand || "";

    const name =
      document.createElement("h3");

    name.textContent =
      product.name || "";

    const meta =
      document.createElement("div");

    meta.className =
      "product-meta";

    const category =
      document.createElement("span");

    category.textContent =
      formatCategory(
        product.category
      );

    meta.appendChild(category);

    if (product.connection) {
      const connection =
        document.createElement("span");

      connection.textContent =
        product.connection;

      meta.appendChild(
        connection
      );
    }

    info.appendChild(brand);
    info.appendChild(name);
    info.appendChild(meta);

    if (
      product.switch_type &&
      String(product.category)
        .toLowerCase() ===
        "keyboard"
    ) {
      const switchType =
        document.createElement("div");

      switchType.className =
        "switch-type";

      switchType.textContent =
        `${
          language === "ku"
            ? "سویچە"
            : "Switch"
        }: ${product.switch_type}`;

      info.appendChild(
        switchType
      );
    }

    const price =
      document.createElement("div");

    price.className =
      "price";

    const usd =
      document.createElement("span");

    usd.textContent =
      `$${Number(
        product.price_usd || 0
      ).toFixed(2)}`;

    const iqd =
      document.createElement("small");

    iqd.textContent =
      `${Number(
        product.price_iqd || 0
      ).toLocaleString()} IQD`;

    price.appendChild(usd);
    price.appendChild(iqd);

    info.appendChild(price);

    if (!product.sold) {
      const addButton =
        document.createElement("button");

      addButton.className =
        "add-cart";

      addButton.type =
        "button";

      addButton.textContent =
        language === "ku"
          ? "زیادکردن بۆ سەبەت"
          : "Add to Cart";

      addButton.addEventListener(
        "click",
        (event) => {
          event.stopPropagation();

          addToCart(product.id);
        }
      );

      info.appendChild(
        addButton
      );

    } else {
      const soldButton =
        document.createElement("button");

      soldButton.className =
        "add-cart";

      soldButton.type =
        "button";

      soldButton.disabled =
        true;

      soldButton.textContent =
        language === "ku"
          ? "فرۆشراوە"
          : "SOLD";

      info.appendChild(
        soldButton
      );
    }

    card.appendChild(
      imageArea
    );

    card.appendChild(
      info
    );

    card.addEventListener(
      "click",
      () => {
        openProductDetails(
          product.id
        );
      }
    );

    container.appendChild(
      card
    );
  });
}

/* =========================
CATEGORY
========================= */

function formatCategory(category) {
  if (!category) return "";

  if (language !== "ku") {
    return category;
  }

  const translations = {
    keyboard: "کیبۆرد",
    mouse: "ماوس",
    headset: "هێدسێت",
    mousepad: "ماوس پاد",
    controller: "کۆنتڕۆڵەر",
    monitor: "مۆنیتەر",
    accessories: "ئاکسسواری",
    other: "هی تر"
  };

  return (
    translations[
      String(category).toLowerCase()
    ] || category
  );
}

/* =========================
CUSTOMER CATEGORY GROUPS
========================= */

const customerCategoryGroups = {
  phones: [
    "iphone",
    "android",
    "ipad",
    "tablet"
  ],

  laptops: [
    "laptop",
    "laptop cooling stand",
    "phone cooling fan"
  ],

  watches: [
    "apple watch",
    "smart watch",
    "android watch",
    "normal watch"
  ],

  gaming: [
    "keyboard",
    "mouse",
    "mousepad",
    "headset",
    "controller"
  ],

  audio: [
    "mic",
    "microphone",
    "earphones",
    "airpods",
    "airbuds"
  ],

  cameras: [
    "camera",
    "dashcam"
  ],

  car: [
    "obd car scanner"
  ],

  lighting: [
    "led light",
    "rgb led",
    "flashlight"
  ],

  accessories: [
    "powerbank"
  ],

  home: [
    "air fryer",
    "iron",
    "vacuum"
  ]
};

function matchesCustomerCategory(product) {
  if (
    selectedCategory === "all"
  ) {
    return true;
  }

  const category =
    String(
      product.category || ""
    )
      .trim()
      .toLowerCase();

  const group =
    customerCategoryGroups[
      selectedCategory
    ];

  if (!group) {
    return true;
  }

  return group.includes(
    category
  );
}

/* =========================
SEARCH / FILTER
========================= */

function filterProducts() {
  const search =
    (
      $("searchInput")?.value ||
      ""
    ).toLowerCase();

  const connection =
    $("connectionFilter")?.value ||
    "all";

  const condition =
    $("conditionFilter")?.value ||
    "all";

  const filtered =
    products.filter((product) => {
      const text =
        `
        ${product.name || ""}
        ${product.brand || ""}
        ${product.category || ""}
        ${product.connection || ""}
        ${product.switch_type || ""}
        `.toLowerCase();

      const searchMatch =
        text.includes(search);

      const connectionMatch =
        connection === "all" ||
        String(
          product.connection || ""
        ).toLowerCase() ===
          connection.toLowerCase();

      const conditionMatch =
        condition === "all" ||
        String(
          product.condition || ""
        ).toLowerCase() ===
          condition.toLowerCase();

      const categoryMatch =
        matchesCustomerCategory(
          product
        );

      return (
        searchMatch &&
        connectionMatch &&
        conditionMatch &&
        categoryMatch
      );
    });

  renderProducts(
    filtered
  );
}

/* =========================
GET FILTERED PRODUCTS
========================= */

function getFilteredProducts() {
  const search =
    (
      $("searchInput")?.value ||
      ""
    ).toLowerCase();

  const connection =
    $("connectionFilter")?.value ||
    "all";

  const condition =
    $("conditionFilter")?.value ||
    "all";

  return products.filter(
    (product) => {
      const text =
        `
        ${product.name || ""}
        ${product.brand || ""}
        ${product.category || ""}
        ${product.connection || ""}
        ${product.switch_type || ""}
        `.toLowerCase();

      const searchMatch =
        text.includes(search);

      const connectionMatch =
        connection === "all" ||
        String(
          product.connection || ""
        ).toLowerCase() ===
          connection.toLowerCase();

      const conditionMatch =
        condition === "all" ||
        String(
          product.condition || ""
        ).toLowerCase() ===
          condition.toLowerCase();

      const categoryMatch =
        matchesCustomerCategory(
          product
        );

      return (
        searchMatch &&
        connectionMatch &&
        conditionMatch &&
        categoryMatch
      );
    }
  );
}

/* =========================
PRODUCT DETAILS
========================= */

function openProductDetails(id) {
  const product =
    findProduct(id);

  if (!product) return;

  selectedProductId =
    product.id;

  const overlay =
    $("productDetailsOverlay");

  if (!overlay) return;

  const image =
    $("detailsImage");

  const noImage =
    $("detailsNoImage");

  if (image) {
    if (product.image_url) {
      image.src =
        product.image_url;

      image.alt =
        product.name ||
        "Product";

      image.classList.remove(
        "hidden"
      );

      noImage?.classList.add(
        "hidden"
      );

    } else {
      image.removeAttribute(
        "src"
      );

      image.classList.add(
        "hidden"
      );

      noImage?.classList.remove(
        "hidden"
      );
    }
  }

  if ($("detailsBrand")) {
    $("detailsBrand").textContent =
      product.brand || "";
  }

  if ($("detailsName")) {
    $("detailsName").textContent =
      product.name || "";
  }

  if ($("detailsCategory")) {
    $("detailsCategory").textContent =
      formatCategory(
        product.category
      );
  }

  if ($("detailsConnection")) {
    $("detailsConnection").textContent =
      product.connection || "";
  }

  const switchRow =
    $("detailsSwitchRow");

  const switchText =
    $("detailsSwitch");

  if (
    product.switch_type &&
    String(product.category)
      .toLowerCase() ===
      "keyboard"
  ) {
    if (switchText) {
      switchText.textContent =
        `${
          language === "ku"
            ? "سویچە"
            : "Switch"
        }: ${product.switch_type}`;
    }

    switchRow?.classList.remove(
      "hidden"
    );

  } else {
    switchRow?.classList.add(
      "hidden"
    );
  }

  if ($("detailsUSD")) {
    $("detailsUSD").textContent =
      `$${Number(
        product.price_usd || 0
      ).toFixed(2)}`;
  }

  if ($("detailsIQD")) {
    $("detailsIQD").textContent =
      `${Number(
        product.price_iqd || 0
      ).toLocaleString()} IQD`;
  }

  if ($("detailsAddCart")) {
    if (product.sold) {
      $("detailsAddCart").textContent =
        language === "ku"
          ? "فرۆشراوە"
          : "SOLD";

      $("detailsAddCart").disabled =
        true;

    } else {
      $("detailsAddCart").textContent =
        language === "ku"
          ? "زیادکردن بۆ سەبەت"
          : "ADD TO CART";

      $("detailsAddCart").disabled =
        false;
    }
  }

  overlay.classList.remove(
    "hidden"
  );
}

function closeProductDetails() {
  $("productDetailsOverlay")
    ?.classList.add("hidden");

  selectedProductId =
    null;
}

/* =========================
PRODUCT FINDER
========================= */

function findProduct(id) {
  return products.find(
    (product) =>
      String(product.id) ===
      String(id)
  );
}

/* =========================
CART
========================= */

function addToCart(id) {
  const product =
    findProduct(id);

  if (!product) {
    console.error(
      "Product not found:",
      id
    );

    return;
  }

  if (product.sold) {
    alert(
      language === "ku"
        ? "ئەم بەرهەمە فرۆشراوە."
        : "This product is sold."
    );

    return;
  }

  const existing =
    cart.find(
      (item) =>
        String(item.id) ===
        String(product.id)
    );

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price_usd:
        product.price_usd,
      price_iqd:
        product.price_iqd,
      quantity: 1
    });
  }

  saveCart();
  renderCart();
  openCart();
}

function removeFromCart(id) {
  cart =
    cart.filter(
      (item) =>
        String(item.id) !==
        String(id)
    );

  saveCart();
  renderCart();
}

function changeQuantity(
  id,
  amount
) {
  const item =
    cart.find(
      (cartItem) =>
        String(cartItem.id) ===
        String(id)
    );

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
  const container =
    $("cartItems");

  const count =
    $("cartCount");

  const total =
    $("cartTotal");

  if (!container) return;

  const totalItems =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity || 0
        ),
      0
    );

  if (count) {
    count.textContent =
      totalItems;
  }

  if (!cart.length) {
    container.innerHTML =
      `<div class="loading">
        ${
          language === "ku"
            ? "سەبەتەکە بەتاڵە"
            : "Your cart is empty"
        }
      </div>`;

    if (total) {
      total.textContent =
        "$0";
    }

    return;
  }

  let totalUSD = 0;

  container.innerHTML = "";

  cart.forEach((item) => {
    totalUSD +=
      Number(
        item.price_usd || 0
      ) *
      Number(
        item.quantity || 0
      );

    const cartItem =
      document.createElement(
        "div"
      );

    cartItem.className =
      "cart-item";

    const info =
      document.createElement(
        "div"
      );

    const name =
      document.createElement(
        "strong"
      );

    name.textContent =
      item.name || "";

    const price =
      document.createElement(
        "div"
      );

    price.textContent =
      `$${Number(
        item.price_usd || 0
      ).toFixed(2)}`;

    info.appendChild(name);
    info.appendChild(price);

    const quantity =
      document.createElement(
        "div"
      );

    quantity.className =
      "quantity";

    const minus =
      document.createElement(
        "button"
      );

    minus.type =
      "button";

    minus.textContent =
      "−";

    minus.addEventListener(
      "click",
      () => {
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
      item.quantity;

    const plus =
      document.createElement(
        "button"
      );

    plus.type =
      "button";

    plus.textContent =
      "+";

    plus.addEventListener(
      "click",
      () => {
        changeQuantity(
          item.id,
          1
        );
      }
    );

    quantity.appendChild(
      minus
    );

    quantity.appendChild(
      number
    );

    quantity.appendChild(
      plus
    );

    const remove =
      document.createElement(
        "button"
      );

    remove.type =
      "button";

    remove.className =
      "remove-cart";

    remove.textContent =
      "×";

    remove.addEventListener(
      "click",
      () => {
        removeFromCart(
          item.id
        );
      }
    );

    cartItem.appendChild(
      info
    );

    cartItem.appendChild(
      quantity
    );

    cartItem.appendChild(
      remove
    );

    container.appendChild(
      cartItem
    );
  });

  if (total) {
    total.textContent =
      `$${totalUSD.toFixed(2)}`;
  }
}

function openCart() {
  $("cartDrawer")
    ?.classList.remove(
      "hidden"
    );

  $("cartDrawer")
    ?.classList.add(
      "open"
    );

  $("cartOverlay")
    ?.classList.remove(
      "hidden"
    );
}

function closeCart() {
  $("cartDrawer")
    ?.classList.remove(
      "open"
    );

  $("cartDrawer")
    ?.classList.add(
      "hidden"
    );

  $("cartOverlay")
    ?.classList.add(
      "hidden"
    );
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

  cart.forEach((item) => {
    message +=
      `• ${item.name} x${item.quantity}\n`;
  });

  message +=
    language === "ku"
      ? "\nتکایە زانیارییەکانی داواکارییەکەم بۆ بنێرە."
      : "\nPlease send me the order details.";

  const url =
    `https://wa.me/${WHATSAPP}?text=` +
    encodeURIComponent(
      message
    );

  window.open(
    url,
    "_blank"
  );
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

  renderProducts(
    getFilteredProducts()
  );

  renderCart();

  if (
    selectedProductId !== null
  ) {
    openProductDetails(
      selectedProductId
    );
  }
}

function applyLanguage() {
  document.documentElement.lang =
    language === "ku"
      ? "ku"
      : "en";

  document.documentElement.dir =
    language === "ku"
      ? "rtl"
      : "ltr";

  document
    .querySelectorAll(
      "[data-en]"
    )
    .forEach((element) => {

      /* Do not overwrite the rotating products heading */
      if (
        element.id ===
        "productsHeading"
      ) {
        return;
      }

      const text =
        language === "ku"
          ? element.dataset.ku
          : element.dataset.en;

      if (text) {
        element.textContent =
          text;
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
  $("adminModal")
    ?.classList.remove(
      "hidden"
    );

  checkAuth();
}

function closeAdmin() {
  $("adminModal")
    ?.classList.add(
      "hidden"
    );
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
  $("loginSection")
    ?.classList.remove(
      "hidden"
    );

  $("adminPanel")
    ?.classList.add(
      "hidden"
    );
}

function showAdminPanel() {
  $("loginSection")
    ?.classList.add(
      "hidden"
    );

  $("adminPanel")
    ?.classList.remove(
      "hidden"
    );

  renderAdminProducts();
}

async function loginAdmin(event) {
  event.preventDefault();

  const email =
    $("adminEmail")
      ?.value.trim();

  const password =
    $("adminPassword")
      ?.value;

  const message =
    $("loginMessage");

  if (!email || !password) {
    return;
  }

  if (message) {
    message.textContent =
      "Signing in...";
  }

  const { error } =
    await db.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    if (message) {
      message.textContent =
        "Login failed: " +
        error.message;
    }

    return;
  }

  if (message) {
    message.textContent =
      "";
  }

  showAdminPanel();
}

async function logoutAdmin() {
  await db.auth.signOut();

  editingId = null;

  showLoginPanel();
}

/* =========================
SAVE PRODUCT
========================= */

async function saveProduct(event) {
  event.preventDefault();

  const name =
    $("productName")
      ?.value.trim();

  const brand =
    $("productBrand")
      ?.value.trim();

  const category =
    $("productCategory")
      ?.value;

  const priceUSD =
    Number(
      $("productUSD")
        ?.value || 0
    );

  const priceIQD =
    Number(
      $("productIQD")
        ?.value || 0
    );

  const connection =
    $("productConnection")
      ?.value;

  const condition =
    $("productCondition")
      ?.value;

  const switchType =
    $("productSwitch")
      ?.value.trim();

  const imageFile =
    $("productImage")
      ?.files?.[0];

  const message =
    $("productMessage");

  const saveButton =
    $("saveProductBtn");

  if (!name) {
    if (message) {
      message.textContent =
        "Product name is required.";
    }

    return;
  }

  if (saveButton) {
    saveButton.disabled =
      true;

    saveButton.textContent =
      editingId
        ? "UPDATING..."
        : "ADDING...";
  }

  let imageUrl = "";

  /* =========================
  KEEP OLD IMAGE
  ========================= */

  if (editingId !== null) {
    const oldProduct =
      findProduct(
        editingId
      );

    imageUrl =
      oldProduct?.image_url ||
      "";
  }

  /* =========================
  IMAGE UPLOAD
  ========================= */

  if (imageFile) {
    const extension =
      imageFile.name
        .split(".")
        .pop()
        .toLowerCase();

    const fileName =
      `${crypto.randomUUID()}.${extension}`;

    const {
      error: uploadError
    } =
      await db.storage
        .from("products")
        .upload(
          fileName,
          imageFile
        );

    if (uploadError) {
      alert(
        "Image upload failed: " +
        uploadError.message
      );

      if (saveButton) {
        saveButton.disabled =
          false;

        saveButton.textContent =
          editingId
            ? "UPDATE PRODUCT"
            : "ADD PRODUCT";
      }

      return;
    }

    const {
      data: publicData
    } =
      db.storage
        .from("products")
        .getPublicUrl(
          fileName
        );

    imageUrl =
      publicData?.publicUrl ||
      "";
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

    condition,

    switch_type:
      category === "keyboard"
        ? switchType
        : null,

    image_url:
      imageUrl
  };

  let result;

  if (editingId !== null) {
    result =
      await db
        .from("products")
        .update(
          productData
        )
        .eq(
          "id",
          editingId
        );

  } else {
    result =
      await db
        .from("products")
        .insert(
          productData
        );
  }

  if (result.error) {
    alert(
      "Could not save product: " +
      result.error.message
    );

    if (saveButton) {
      saveButton.disabled =
        false;

      saveButton.textContent =
        editingId !== null
          ? "UPDATE PRODUCT"
          : "ADD PRODUCT";
    }

    return;
  }

  alert(
    editingId !== null
      ? "Product updated!"
      : "Product added!"
  );

  editingId = null;

  $("productForm")
    ?.reset();

  $("cancelEditBtn")
    ?.classList.add(
      "hidden"
    );

  if (saveButton) {
    saveButton.disabled =
      false;

    saveButton.textContent =
      "ADD PRODUCT";
  }

  const preview =
    $("imagePreview");

  if (preview) {
    preview.src = "";

    preview.classList.add(
      "hidden"
    );
  }

  updateSwitchField();

  if (message) {
    message.textContent =
      "";
  }

  await loadProducts();
}

/* =========================
ADMIN PRODUCTS
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

  container.innerHTML = "";

  products.forEach((product) => {
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

    const name =
      document.createElement(
        "strong"
      );

    name.textContent =
      product.name || "";

    const price =
      document.createElement(
        "small"
      );

    price.textContent =
      `$${Number(
        product.price_usd || 0
      ).toFixed(2)} / ${Number(
        product.price_iqd || 0
      ).toLocaleString()} IQD`;

    info.appendChild(name);
    info.appendChild(price);

    /* =========================
    SOLD STATUS
    ========================= */

    const status =
      document.createElement(
        "small"
      );

    status.textContent =
      product.sold
        ? "SOLD"
        : "AVAILABLE";

    status.style.display =
      "block";

    info.appendChild(status);

    const actions =
      document.createElement(
        "div"
      );

    const edit =
      document.createElement(
        "button"
      );

    edit.type =
      "button";

    edit.textContent =
      "Edit";

    edit.addEventListener(
      "click",
      () => {
        editProduct(
          product.id
        );
      }
    );

    const sold =
      document.createElement(
        "button"
      );

    sold.type =
      "button";

    sold.textContent =
      product.sold
        ? "MARK AVAILABLE"
        : "MARK SOLD";

    sold.addEventListener(
      "click",
      () => {
        toggleSold(
          product.id
        );
      }
    );

    const remove =
      document.createElement(
        "button"
      );

    remove.type =
      "button";

    remove.textContent =
      "Delete";

    remove.addEventListener(
      "click",
      () => {
        deleteProduct(
          product.id
        );
      }
    );

    actions.appendChild(
      edit
    );

    actions.appendChild(
      sold
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

    container.appendChild(
      item
    );
  });
}

/* =========================
TOGGLE SOLD
========================= */

async function toggleSold(id) {
  const product =
    findProduct(id);

  if (!product) return;

  const newStatus =
    !Boolean(
      product.sold
    );

  const { error } =
    await db
      .from("products")
      .update({
        sold: newStatus
      })
      .eq(
        "id",
        product.id
      );

  if (error) {
    alert(
      "Could not change sold status: " +
      error.message
    );

    return;
  }

  product.sold =
    newStatus;

  renderProducts(
    getFilteredProducts()
  );

  renderAdminProducts();
}

/* =========================
EDIT PRODUCT
========================= */

function editProduct(id) {
  const product =
    findProduct(id);

  if (!product) return;

  editingId =
    product.id;

  $("productName").value =
    product.name || "";

  $("productBrand").value =
    product.brand || "";

  $("productCategory").value =
    product.category ||
    "other";

  $("productUSD").value =
    product.price_usd ?? "";

  $("productIQD").value =
    product.price_iqd ?? "";

  $("productConnection").value =
    product.connection ||
    "Wired";

  if ($("productCondition")) {
    $("productCondition").value =
      product.condition ||
      "New";
  }

  $("productSwitch").value =
    product.switch_type ||
    "";

  const preview =
    $("imagePreview");

  if (
    preview &&
    product.image_url
  ) {
    preview.src =
      product.image_url;

    preview.classList.remove(
      "hidden"
    );
  }

  $("saveProductBtn").textContent =
    "UPDATE PRODUCT";

  $("cancelEditBtn")
    ?.classList.remove(
      "hidden"
    );

  updateSwitchField();
}

/* =========================
CANCEL EDIT
========================= */

function cancelEdit() {
  editingId = null;

  $("productForm")
    ?.reset();

  $("cancelEditBtn")
    ?.classList.add(
      "hidden"
    );

  $("saveProductBtn").textContent =
    "ADD PRODUCT";

  const preview =
    $("imagePreview");

  if (preview) {
    preview.src = "";

    preview.classList.add(
      "hidden"
    );
  }

  updateSwitchField();
}

/* =========================
DELETE PRODUCT
========================= */

async function deleteProduct(id) {
  const product =
    findProduct(id);

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
      .eq(
        "id",
        product.id
      );

  if (error) {
    alert(
      "Delete failed: " +
      error.message
    );

    return;
  }

  if (
    editingId !== null &&
    String(editingId) ===
      String(product.id)
  ) {
    cancelEdit();
  }

  await loadProducts();
}

/* =========================
SWITCH FIELD
========================= */

function updateSwitchField() {
  const category =
    $("productCategory")
      ?.value;

  const field =
    $("switchField");

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

/* =========================
IMAGE PREVIEW
========================= */

function previewImage() {
  const file =
    $("productImage")
      ?.files?.[0];

  const preview =
    $("imagePreview");

  if (!file || !preview) {
    return;
  }

  if (
    preview.dataset.objectUrl
  ) {
    URL.revokeObjectURL(
      preview.dataset.objectUrl
    );
  }

  const objectUrl =
    URL.createObjectURL(
      file
    );

  preview.dataset.objectUrl =
    objectUrl;

  preview.src =
    objectUrl;

  preview.classList.remove(
    "hidden"
  );
}

/* =========================
GLOBAL FUNCTIONS
========================= */

window.addToCart =
  addToCart;

window.removeFromCart =
  removeFromCart;

window.changeQuantity =
  changeQuantity;

window.editProduct =
  editProduct;

window.deleteProduct =
  deleteProduct;

window.openProductDetails =
  openProductDetails;

window.closeProductDetails =
  closeProductDetails;
