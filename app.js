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

const $ = (id) => document.getElementById(id);

function sameId(a, b) {
  return String(a) === String(b);
}

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

  $("productCategory")?.addEventListener(
    "change",
    updateSwitchField
  );

  $("productImage")?.addEventListener(
    "change",
    previewImage
  );

  $("productDetailsOverlay")?.addEventListener(
    "click",
    closeProductDetails
  );

  $("closeProductDetails")?.addEventListener(
    "click",
    closeProductDetails
  );
}

/* =========================
   PRODUCTS
========================= */

async function loadProducts() {
  const { data, error } = await db
    .from("products")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error("Products error:", error);

    if ($("productsGrid")) {
      $("productsGrid").innerHTML = `
        <div class="loading">
          Unable to load products.
        </div>
      `;
    }

    return;
  }

  products = data || [];

  console.log("Products loaded:", products);

  renderProducts(products);
  renderAdminProducts();
}

/* =========================
   PRODUCT CARDS
========================= */

function renderProducts(list) {
  const container = $("productsGrid");

  if (!container) return;

  if (!list.length) {
    container.innerHTML = `
      <div class="loading">
        ${
          language === "ku"
            ? "هیچ بەرهەمێک نەدۆزرایەوە"
            : "No products found."
        }
      </div>
    `;

    return;
  }

  container.innerHTML = list
    .map((product) => {
      const id = String(product.id);

      return `
        <div
          class="product-card"
          onclick="openProductDetails(${JSON.stringify(id)})"
        >

          ${
            product.image_url
              ? `
                <img
                  class="product-image"
                  src="${escapeHTML(product.image_url)}"
                  alt="${escapeHTML(product.name)}"
                >
              `
              : `
                <div class="product-image no-image">
                  AH STORE
                </div>
              `
          }

          <div class="product-info">

            <div class="product-brand">
              ${escapeHTML(product.brand || "")}
            </div>

            <h3 class="product-name">
              ${escapeHTML(product.name || "")}
            </h3>

            <div class="product-details">

              <span class="detail-tag">
                ${escapeHTML(product.category || "")}
              </span>

              ${
                product.connection
                  ? `
                    <span class="detail-tag">
                      ${escapeHTML(product.connection)}
                    </span>
                  `
                  : ""
              }

              ${
                product.switch_type &&
                String(product.category).toLowerCase() ===
                  "keyboard"
                  ? `
                    <span class="detail-tag">
                      ${escapeHTML(product.switch_type)}
                      Switch
                    </span>
                  `
                  : ""
              }

            </div>

            <div class="product-price">

              <div class="price-usd">
                $${Number(
                  product.price_usd || 0
                ).toFixed(2)}
              </div>

              <div class="price-iqd">
                ${Number(
                  product.price_iqd || 0
                ).toLocaleString()} IQD
              </div>

            </div>

            <button
              class="add-cart"
              onclick="
                event.stopPropagation();
                addToCart(${JSON.stringify(id)});
              "
            >
              ${
                language === "ku"
                  ? "➕ زیادکردن بۆ سەبەت"
                  : "🛒 Add to Cart"
              }
            </button>

          </div>
        </div>
      `;
    })
    .join("");
}

/* =========================
   SEARCH / FILTER
========================= */

function filterProducts() {
  const search = (
    $("searchInput")?.value || ""
  ).toLowerCase();

  const category =
    $("categoryFilter")?.value || "all";

  const filtered = products.filter((product) => {
    const text = `
      ${product.name || ""}
      ${product.brand || ""}
      ${product.category || ""}
    `.toLowerCase();

    const searchMatch =
      text.includes(search);

    const categoryMatch =
      category === "all" ||
      String(product.category || "").toLowerCase() ===
        category.toLowerCase();

    return searchMatch && categoryMatch;
  });

  renderProducts(filtered);
}

/* =========================
   PRODUCT DETAILS
========================= */

function openProductDetails(id) {
  const product = products.find((p) =>
    sameId(p.id, id)
  );

  if (!product) {
    console.error(
      "Product not found for details:",
      id,
      products
    );

    return;
  }

  const modal = $("productDetailsModal");
  const overlay = $("productDetailsOverlay");

  if (!modal || !overlay) {
    console.error(
      "Product details HTML is missing."
    );

    return;
  }

  const image = $("detailsImage");
  const noImage = $("detailsNoImage");

  if (image) {
    image.src = product.image_url || "";
    image.classList.toggle(
      "hidden",
      !product.image_url
    );
  }

  if (noImage) {
    noImage.classList.toggle(
      "hidden",
      !!product.image_url
    );
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
      product.category || "";
  }

  if ($("detailsConnection")) {
    $("detailsConnection").textContent =
      product.connection || "";
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

  const switchRow =
    $("detailsSwitchRow");

  if (
    switchRow &&
    String(product.category).toLowerCase() ===
      "keyboard" &&
    product.switch_type
  ) {
    switchRow.classList.remove("hidden");

    if ($("detailsSwitch")) {
      $("detailsSwitch").textContent =
        product.switch_type;
    }
  } else if (switchRow) {
    switchRow.classList.add("hidden");
  }

  if ($("detailsAddCart")) {
    $("detailsAddCart").onclick = () => {
      addToCart(product.id);
      closeProductDetails();
    };
  }

  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");

  document.body.style.overflow = "hidden";
}

function closeProductDetails() {
  $("productDetailsModal")?.classList.add(
    "hidden"
  );

  $("productDetailsOverlay")?.classList.add(
    "hidden"
  );

  document.body.style.overflow = "";
}

/* =========================
   CART
========================= */

function addToCart(id) {
  const product = products.find((p) =>
    sameId(p.id, id)
  );

  if (!product) {
    console.error(
      "Product not found:",
      id,
      products
    );

    alert(
      language === "ku"
        ? "بەرهەمەکە نەدۆزرایەوە."
        : "Product could not be found."
    );

    return;
  }

  const existing = cart.find((item) =>
    sameId(item.id, id)
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: String(product.id),
      name: product.name || "",
      price_usd: Number(
        product.price_usd || 0
      ),
      price_iqd: Number(
        product.price_iqd || 0
      ),
      image_url:
        product.image_url || "",
      quantity: 1
    });
  }

  saveCart();
  renderCart();
  openCart();
}

function removeFromCart(id) {
  cart = cart.filter(
    (item) => !sameId(item.id, id)
  );

  saveCart();
  renderCart();
}

function changeQuantity(id, amount) {
  const item = cart.find((item) =>
    sameId(item.id, id)
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
  const container = $("cartItems");
  const count = $("cartCount");
  const total = $("cartTotal");

  if (!container) return;

  const totalItems = cart.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0),
    0
  );

  if (count) {
    count.textContent = totalItems;
  }

  if (!cart.length) {
    container.innerHTML = `
      <div class="loading">
        ${
          language === "ku"
            ? "سەبەتەکە بەتاڵە"
            : "Your cart is empty"
        }
      </div>
    `;

    if (total) {
      total.textContent = "$0";
    }

    return;
  }

  let totalUSD = 0;

  container.innerHTML = cart
    .map((item) => {
      const price =
        Number(item.price_usd || 0);

      const quantity =
        Number(item.quantity || 0);

      totalUSD += price * quantity;

      return `
        <div class="cart-item">

          ${
            item.image_url
              ? `
                <img
                  src="${escapeHTML(
                    item.image_url
                  )}"
                  alt=""
                >
              `
              : ""
          }

          <div class="cart-item-info">

            <div class="cart-item-name">
              ${escapeHTML(
                item.name
              )}
            </div>

            <div class="cart-item-price">
              $${price.toFixed(2)}
            </div>

            <div class="quantity">

              <button
                onclick="
                  changeQuantity(
                    ${JSON.stringify(
                      String(item.id)
                    )},
                    -1
                  )
                "
              >
                −
              </button>

              <span>
                ${quantity}
              </span>

              <button
                onclick="
                  changeQuantity(
                    ${JSON.stringify(
                      String(item.id)
                    )},
                    1
                  )
                "
              >
                +
              </button>

            </div>

          </div>

          <button
            class="remove-cart"
            onclick="
              removeFromCart(
                ${JSON.stringify(
                  String(item.id)
                )}
              )
            "
          >
            ✕
          </button>

        </div>
      `;
    })
    .join("");

  if (total) {
    total.textContent =
      `$${totalUSD.toFixed(2)}`;
  }
}

function openCart() {
  $("cartDrawer")?.classList.add("open");
  $("cartOverlay")?.classList.remove(
    "hidden"
  );
}

function closeCart() {
  $("cartDrawer")?.classList.remove(
    "open"
  );

  $("cartOverlay")?.classList.add(
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

  let totalUSD = 0;

  cart.forEach((item) => {
    const price =
      Number(item.price_usd || 0);

    const quantity =
      Number(item.quantity || 0);

    totalUSD += price * quantity;

    message +=
      `• ${item.name} x${quantity} - $${price.toFixed(
        2
      )}\n`;
  });

  message +=
    `\nTotal: $${totalUSD.toFixed(2)}\n`;

  message +=
    language === "ku"
      ? "\nپارەدان لە کاتی وەرگرتن."
      : "\nCash on delivery.";

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
  filterProducts();
  renderCart();
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

  document.body.classList.toggle(
    "rtl",
    language === "ku"
  );

  document
    .querySelectorAll("[data-en]")
    .forEach((element) => {
      const text =
        language === "ku"
          ? element.dataset.ku
          : element.dataset.en;

      if (text) {
        element.textContent = text;
      }
    });

  const input = $("searchInput");

  if (input) {
    input.placeholder =
      language === "ku"
        ? input.dataset.placeholderKu
        : input.dataset.placeholderEn;
  }

  const button =
    $("languageBtn");

  if (button) {
    button.textContent =
      language === "ku"
        ? "English"
        : "کوردی";
  }
}

/* =========================
   ADMIN
========================= */

function openAdmin() {
  $("adminModal")?.classList.remove(
    "hidden"
  );

  checkAuth();
}

function closeAdmin() {
  $("adminModal")?.classList.add(
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
  $("loginSection")?.classList.remove(
    "hidden"
  );

  $("adminPanel")?.classList.add(
    "hidden"
  );
}

function showAdminPanel() {
  $("loginSection")?.classList.add(
    "hidden"
  );

  $("adminPanel")?.classList.remove(
    "hidden"
  );

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
    message.textContent = "";
  }

  showAdminPanel();
}

async function logoutAdmin() {
  await db.auth.signOut();

  showLoginPanel();
}

/* =========================
   ADD / EDIT PRODUCT
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
    Number(
      $("productUSD").value || 0
    );

  const priceIQD =
    Number(
      $("productIQD").value || 0
    );

  const connection =
    $("productConnection").value;

  const switchType =
    $("productSwitch").value.trim();

  const imageFile =
    $("productImage").files?.[0];

  let imageUrl = "";

  if (editingId !== null) {
    const oldProduct =
      products.find((p) =>
        sameId(p.id, editingId)
      );

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
        .getPublicUrl(
          fileName
        );

    imageUrl =
      data.publicUrl;
  }

  const productData = {
    name,
    brand,
    category,
    price_usd: priceUSD,
    price_iqd: priceIQD,
    connection,
    switch_type:
      category === "keyboard"
        ? switchType
        : null,
    image_url: imageUrl
  };

  let result;

  if (editingId !== null) {
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
    editingId !== null
      ? "Product updated!"
      : "Product added!"
  );

  editingId = null;

  $("productForm").reset();

  $("cancelEditBtn")?.classList.add(
    "hidden"
  );

  $("saveProductBtn").textContent =
    "ADD PRODUCT";

  $("imagePreview")?.classList.add(
    "hidden"
  );

  updateSwitchField();

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
    products
      .map((product) => {
        const id =
          String(product.id);

        return `
          <div class="admin-product">

            ${
              product.image_url
                ? `
                  <img
                    src="${escapeHTML(
                      product.image_url
                    )}"
                    alt=""
                  >
                `
                : ""
            }

            <div class="admin-product-info">

              <strong>
                ${escapeHTML(
                  product.name || ""
                )}
              </strong>

              <small>
                $${Number(
                  product.price_usd || 0
                ).toFixed(2)}
                /
                ${Number(
                  product.price_iqd || 0
                ).toLocaleString()}
                IQD
              </small>

            </div>

            <div class="admin-actions">

              <button
                class="edit-btn"
                onclick="
                  editProduct(
                    ${JSON.stringify(id)}
                  )
                "
              >
                ✏️ Edit
              </button>

              <button
                class="delete-btn"
                onclick="
                  deleteProduct(
                    ${JSON.stringify(id)}
                  )
                "
              >
                🗑️ Delete
              </button>

            </div>

          </div>
        `;
      })
      .join("");
}

/* =========================
   EDIT
========================= */

function editProduct(id) {
  const product =
    products.find((p) =>
      sameId(p.id, id)
    );

  if (!product) {
    console.error(
      "Product not found for edit:",
      id
    );

    return;
  }

  editingId = product.id;

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

  $("cancelEditBtn")?.classList.remove(
    "hidden"
  );

  updateSwitchField();

  $("productForm")?.scrollIntoView({
    behavior: "smooth"
  });
}

/* =========================
   CANCEL EDIT
========================= */

function cancelEdit() {
  editingId = null;

  $("productForm").reset();

  $("cancelEditBtn")?.classList.add(
    "hidden"
  );

  $("saveProductBtn").textContent =
    "ADD PRODUCT";

  $("imagePreview")?.classList.add(
    "hidden"
  );

  updateSwitchField();
}

/* =========================
   DELETE
========================= */

async function deleteProduct(id) {
  const product =
    products.find((p) =>
      sameId(p.id, id)
    );

  if (!product) {
    console.error(
      "Product not found for delete:",
      id
    );

    return;
  }

  const confirmed =
    confirm(
      `Delete "${product.name}"?`
    );

  if (!confirmed) return;

  const { error } =
    await db
      .from("products")
      .delete()
      .eq("id", product.id);

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
   SWITCH FIELD
========================= */

function updateSwitchField() {
  const category =
    $("productCategory")?.value;

  const field =
    $("switchField");

  if (!field) return;

  field.classList.toggle(
    "hidden",
    category !== "keyboard"
  );
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

  preview.classList.remove(
    "hidden"
  );
}

/* =========================
   SECURITY
========================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
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
