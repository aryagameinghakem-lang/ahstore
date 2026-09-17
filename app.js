```javascript
const SUPABASE_URL = "https://toeqdxunmvspulvkpdow.supabase.co";
const SUPABASE_KEY = "sb_publishable_JsjlGkffizJ1Ap7oPCAQ6Q_8TJ64tw0";
const WHATSAPP = "9647701068935";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let products = [];
let cart = JSON.parse(
  localStorage.getItem("ahstore_cart") || "[]"
);
let language =
  localStorage.getItem("ahstore_language") || "en";
let editingId = null;

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
  setupButtons();
  applyLanguage();
  renderCart();
  loadProducts();
  checkAuth();
});


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

  $("categoryFilter")?.addEventListener(
    "change",
    filterProducts
  );

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

  $("productDetailsOverlay")?.addEventListener(
    "click",
    closeProductDetails
  );

  $("closeProductDetails")?.addEventListener(
    "click",
    closeProductDetails
  );
}


/* PRODUCTS */

async function loadProducts() {

  const { data, error } = await db
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

    $("productsGrid").innerHTML = `
      <div class="loading">
        Unable to load products.
      </div>
    `;

    return;
  }

  products = data || [];

  console.log(
    "Products loaded:",
    products
  );

  renderProducts(products);
  renderAdminProducts();
}


function renderProducts(list) {

  const container =
    $("productsGrid");

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

  container.innerHTML = "";

  list.forEach((product) => {

    const card =
      document.createElement("div");

    card.className =
      "product-card";


    card.addEventListener(
      "click",
      () => {
        openProductDetails(
          product.id
        );
      }
    );


    if (product.image_url) {

      const image =
        document.createElement("img");

      image.className =
        "product-image";

      image.src =
        product.image_url;

      image.alt =
        product.name || "";

      card.appendChild(image);

    } else {

      const noImage =
        document.createElement("div");

      noImage.className =
        "product-image no-image";

      noImage.textContent =
        "AH STORE";

      card.appendChild(noImage);
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

    info.appendChild(
      brand
    );


    const name =
      document.createElement("h3");

    name.className =
      "product-name";

    name.textContent =
      product.name || "";

    info.appendChild(
      name
    );


    const details =
      document.createElement("div");

    details.className =
      "product-details";


    const categoryTag =
      document.createElement("span");

    categoryTag.className =
      "detail-tag";

    categoryTag.textContent =
      product.category || "";

    details.appendChild(
      categoryTag
    );


    if (product.connection) {

      const connectionTag =
        document.createElement("span");

      connectionTag.className =
        "detail-tag";

      connectionTag.textContent =
        product.connection;

      details.appendChild(
        connectionTag
      );
    }


    if (
      product.switch_type &&
      String(product.category).toLowerCase() ===
        "keyboard"
    ) {

      const switchTag =
        document.createElement("span");

      switchTag.className =
        "detail-tag";

      switchTag.textContent =
        product.switch_type +
        " Switch";

      details.appendChild(
        switchTag
      );
    }


    info.appendChild(
      details
    );


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


    price.appendChild(
      usd
    );

    price.appendChild(
      iqd
    );

    info.appendChild(
      price
    );


    const button =
      document.createElement("button");

    button.className =
      "add-cart";

    button.textContent =
      language === "ku"
        ? "➕ زیادکردن بۆ سەبەت"
        : "🛒 Add to Cart";


    button.addEventListener(
      "click",
      (event) => {

        event.stopPropagation();

        addToCart(
          product.id
        );
      }
    );


    info.appendChild(
      button
    );


    card.appendChild(
      info
    );

    container.appendChild(
      card
    );
  });
}


/* SEARCH */

function filterProducts() {

  const search =
    (
      $("searchInput")?.value || ""
    ).toLowerCase();

  const category =
    $("categoryFilter")?.value ||
    "all";


  const filtered =
    products.filter(
      (product) => {

        const text = `
          ${product.name || ""}
          ${product.brand || ""}
          ${product.category || ""}
        `.toLowerCase();


        return (
          text.includes(search) &&
          (
            category === "all" ||
            String(
              product.category || ""
            ).toLowerCase() ===
              category.toLowerCase()
          )
        );
      }
    );


  renderProducts(
    filtered
  );
}


/* DETAILS */

function openProductDetails(id) {

  const product =
    products.find(
      (p) =>
        String(p.id) ===
        String(id)
    );


  if (!product) {

    console.error(
      "Product not found:",
      id
    );

    return;
  }


  const modal =
    $("productDetailsModal");

  const overlay =
    $("productDetailsOverlay");


  if (!modal || !overlay) {

    console.error(
      "Product details HTML missing."
    );

    return;
  }


  const image =
    $("detailsImage");

  const noImage =
    $("detailsNoImage");


  if (image) {

    image.src =
      product.image_url || "";

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


  $("detailsBrand").textContent =
    product.brand || "";

  $("detailsName").textContent =
    product.name || "";

  $("detailsCategory").textContent =
    product.category || "";

  $("detailsConnection").textContent =
    product.connection || "";

  $("detailsUSD").textContent =
    "$" +
    Number(
      product.price_usd || 0
    ).toFixed(2);

  $("detailsIQD").textContent =
    Number(
      product.price_iqd || 0
    ).toLocaleString() +
    " IQD";


  const switchRow =
    $("detailsSwitchRow");


  if (
    product.switch_type &&
    String(
      product.category
    ).toLowerCase() ===
      "keyboard"
  ) {

    switchRow.classList.remove(
      "hidden"
    );

    $("detailsSwitch").textContent =
      product.switch_type;

  } else {

    switchRow.classList.add(
      "hidden"
    );
  }


  $("detailsAddCart").onclick =
    () => {

      addToCart(
        product.id
      );

      closeProductDetails();
    };


  modal.classList.remove(
    "hidden"
  );

  overlay.classList.remove(
    "hidden"
  );

  document.body.style.overflow =
    "hidden";
}


function closeProductDetails() {

  $("productDetailsModal")
    ?.classList.add(
      "hidden"
    );

  $("productDetailsOverlay")
    ?.classList.add(
      "hidden"
    );

  document.body.style.overflow =
    "";
}


/* CART */

function addToCart(id) {

  const product =
    products.find(
      (p) =>
        String(p.id) ===
        String(id)
    );


  if (!product) {

    console.error(
      "Product not found:",
      id,
      products
    );

    return;
  }


  const existing =
    cart.find(
      (item) =>
        String(item.id) ===
        String(id)
    );


  if (existing) {

    existing.quantity += 1;

  } else {

    cart.push({

      id:
        String(product.id),

      name:
        product.name || "",

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
      (item) =>
        String(item.id) ===
        String(id)
    );


  if (!item) return;


  item.quantity +=
    Number(amount);


  if (
    item.quantity <= 0
  ) {

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

      total.textContent =
        "$0";
    }

    return;
  }


  let totalUSD = 0;

  container.innerHTML =
    "";


  cart.forEach(
    (item) => {

      const price =
        Number(
          item.price_usd || 0
        );

      const quantity =
        Number(
          item.quantity || 0
        );


      totalUSD +=
        price * quantity;


      const row =
        document.createElement(
          "div"
        );

      row.className =
        "cart-item";


      if (item.image_url) {

        const image =
          document.createElement(
            "img"
          );

        image.src =
          item.image_url;

        row.appendChild(
          image
        );
      }


      const info =
        document.createElement(
          "div"
        );

      info.className =
        "cart-item-info";


      const name =
        document.createElement(
          "div"
        );

      name.className =
        "cart-item-name";

      name.textContent =
        item.name;


      const itemPrice =
        document.createElement(
          "div"
        );

      itemPrice.className =
        "cart-item-price";

      itemPrice.textContent =
        "$" +
        price.toFixed(2);


      const quantityBox =
        document.createElement(
          "div"
        );

      quantityBox.className =
        "quantity";


      const minus =
        document.createElement(
          "button"
        );

      minus.textContent =
        "−";

      minus.addEventListener(
        "click",
        () =>
          changeQuantity(
            item.id,
            -1
          )
      );


      const quantityText =
        document.createElement(
          "span"
        );

      quantityText.textContent =
        quantity;


      const plus =
        document.createElement(
          "button"
        );

      plus.textContent =
        "+";

      plus.addEventListener(
        "click",
        () =>
          changeQuantity(
            item.id,
            1
          )
      );


      quantityBox.appendChild(
        minus
      );

      quantityBox.appendChild(
        quantityText
      );

      quantityBox.appendChild(
        plus
      );


      info.appendChild(
        name
      );

      info.appendChild(
        itemPrice
      );

      info.appendChild(
        quantityBox
      );


      const remove =
        document.createElement(
          "button"
        );

      remove.className =
        "remove-cart";

      remove.textContent =
        "✕";

      remove.addEventListener(
        "click",
        () =>
          removeFromCart(
            item.id
          )
      );


      row.appendChild(
        info
      );

      row.appendChild(
        remove
      );

      container.appendChild(
        row
      );
    }
  );


  if (total) {

    total.textContent =
      "$" +
      totalUSD.toFixed(2);
  }
}


function openCart() {

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

  $("cartOverlay")
    ?.classList.add(
      "hidden"
    );
}


/* WHATSAPP */

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


  cart.forEach(
    (item) => {

      const price =
        Number(
          item.price_usd || 0
        );

      const quantity =
        Number(
          item.quantity || 0
        );


      totalUSD +=
        price * quantity;


      message +=
        `• ${item.name} x${quantity} - $${price.toFixed(
          2
        )}\n`;
    }
  );


  message +=
    `\nTotal: $${totalUSD.toFixed(
      2
    )}\n`;


  message +=
    language === "ku"
      ? "\nپارەدان لە کاتی وەرگرتن."
      : "\nCash on delivery.";


  window.open(
    "https://wa.me/" +
      WHATSAPP +
      "?text=" +
      encodeURIComponent(
        message
      ),
    "_blank"
  );
}


/* LANGUAGE */

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
    .querySelectorAll(
      "[data-en]"
    )
    .forEach(
      (element) => {

        const text =
          language === "ku"
            ? element.dataset.ku
            : element.dataset.en;


        if (text) {

          element.textContent =
            text;
        }
      }
    );


  const input =
    $("searchInput");


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


/* ADMIN */

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
    data: {
      session
    }
  } =
    await db.auth.getSession();


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


async function loginAdmin(
  event
) {

  event.preventDefault();


  const email =
    $("adminEmail")
      ?.value
      .trim();


  const password =
    $("adminPassword")
      ?.value;


  const message =
    $("loginMessage");


  const {
    error
  } =
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

  showLoginPanel();
}


/* SAVE PRODUCT */

async function saveProduct(
  event
) {

  event.preventDefault();


  const name =
    $("productName")
      .value
      .trim();


  const brand =
    $("productBrand")
      .value
      .trim();


  const category =
    $("productCategory")
      .value;


  const priceUSD =
    Number(
      $("productUSD")
        .value || 0
    );


  const priceIQD =
    Number(
      $("productIQD")
        .value || 0
    );


  const connection =
    $("productConnection")
      .value;


  const switchType =
    $("productSwitch")
      .value
      .trim();


  const imageFile =
    $("productImage")
      .files?.[0];


  let imageUrl = "";


  if (editingId !== null) {

    const oldProduct =
      products.find(
        (p) =>
          String(p.id) ===
          String(editingId)
      );


    imageUrl =
      oldProduct?.image_url ||
      "";
  }


  if (imageFile) {

    const extension =
      imageFile.name
        .split(".")
        .pop()
        .toLowerCase();


    const fileName =
      crypto.randomUUID() +
      "." +
      extension;


    const {
      error
    } =
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


    const {
      data
    } =
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

    return;
  }


  alert(
    editingId !== null
      ? "Product updated!"
      : "Product added!"
  );


  editingId = null;


  $("productForm")
    .reset();


  $("cancelEditBtn")
    ?.classList.add(
      "hidden"
    );


  $("saveProductBtn")
    .textContent =
      "ADD PRODUCT";


  $("imagePreview")
    ?.classList.add(
      "hidden"
    );


  updateSwitchField();

  await loadProducts();
}


/* ADMIN LIST */

function renderAdminProducts() {

  const container =
    $("adminProductsList");


  if (!container) return;


  container.innerHTML =
    "";


  if (!products.length) {

    container.innerHTML =
      "<p>No products yet.</p>";

    return;
  }


  products.forEach(
    (product) => {

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "admin-product";


      if (product.image_url) {

        const image =
          document.createElement(
            "img"
          );

        image.src =
          product.image_url;

        image.alt =
          "";

        row.appendChild(
          image
        );
      }


      const info =
        document.createElement(
          "div"
        );

      info.className =
        "admin-product-info";


      const strong =
        document.createElement(
          "strong"
        );

      strong.textContent =
        product.name || "";


      const small =
        document.createElement(
          "small"
        );

      small.textContent =
        "$" +
        Number(
          product.price_usd || 0
        ).toFixed(2) +
        " / " +
        Number(
          product.price_iqd || 0
        ).toLocaleString() +
        " IQD";


      info.appendChild(
        strong
      );

      info.appendChild(
        small
      );


      const actions =
        document.createElement(
          "div"
        );

      actions.className =
        "admin-actions";


      const editButton =
        document.createElement(
          "button"
        );

      editButton.className =
        "edit-btn";

      editButton.textContent =
        "✏️ Edit";


      editButton.addEventListener(
        "click",
        () =>
          editProduct(
            product.id
          )
      );


      const deleteButton =
        document.createElement(
          "button"
        );

      deleteButton.className =
        "delete-btn";

      deleteButton.textContent =
        "🗑️ Delete";


      deleteButton.addEventListener(
        "click",
        () =>
          deleteProduct(
            product.id
          )
      );


      actions.appendChild(
        editButton
      );

      actions.appendChild(
        deleteButton
      );


      row.appendChild(
        info
      );

      row.appendChild(
        actions
      );


      container.appendChild(
        row
      );
    }
  );
}


/* EDIT */

function editProduct(id) {

  const product =
    products.find(
      (p) =>
        String(p.id) ===
        String(id)
    );


  if (!product) {

    console.error(
      "Product not found:",
      id
    );

    return;
  }


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
    product.price_usd || "";

  $("productIQD").value =
    product.price_iqd || "";

  $("productConnection").value =
    product.connection ||
    "Wired";

  $("productSwitch").value =
    product.switch_type ||
    "";


  $("saveProductBtn")
    .textContent =
      "UPDATE PRODUCT";


  $("cancelEditBtn")
    ?.classList.remove(
      "hidden"
    );


  updateSwitchField();


  $("productForm")
    ?.scrollIntoView({
      behavior:
        "smooth"
    });
}


/* CANCEL EDIT */

function cancelEdit() {

  editingId =
    null;


  $("productForm")
    .reset();


  $("cancelEditBtn")
    ?.classList.add(
      "hidden"
    );


  $("saveProductBtn")
    .textContent =
      "ADD PRODUCT";


  $("imagePreview")
    ?.classList.add(
      "hidden"
    );


  updateSwitchField();
}


/* DELETE */

async function deleteProduct(
  id
) {

  const product =
    products.find(
      (p) =>
        String(p.id) ===
        String(id)
    );


  if (!product) {

    console.error(
      "Product not found:",
      id
    );

    return;
  }


  if (
    !confirm(
      `Delete "${product.name}"?`
    )
  ) {

    return;
  }


  const {
    error
  } =
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


  await loadProducts();
}


/* SWITCH FIELD */

function updateSwitchField() {

  const category =
    $("productCategory")
      ?.value;


  const field =
    $("switchField");


  if (!field) return;


  field.classList.toggle(
    "hidden",
    category !== "keyboard"
  );
}


/* IMAGE */

function previewImage() {

  const file =
    $("productImage")
      ?.files?.[0];


  const preview =
    $("imagePreview");


  if (!file || !preview)
    return;


  preview.src =
    URL.createObjectURL(
      file
    );


  preview.classList.remove(
    "hidden"
  );
}
```
