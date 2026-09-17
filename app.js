```javascript
// =====================================================
// AH STORE
// Supabase + Products + Cart + Admin + WhatsApp
// =====================================================

const SUPABASE_URL =
  "https://toeqdxunmvspulvkpdow.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_JsjlGkffizJ1Ap7oPCAQ6Q_8TJ64tw0";

const WHATSAPP_NUMBER =
  "9647701068935";

const STORAGE_BUCKET =
  "products";


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


let products = [];
let cart = [];

let currentLanguage =
  localStorage.getItem("ah_language") || "en";

let editingProductId = null;
let currentDetailsProduct = null;


// =====================================================
// START
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    setupButtons();
    setupSearch();
    setupLanguage();
    setupAdmin();
    setupProductForm();
    setupProductDetails();

    updateLanguage();

    // Keep cart closed when website first opens
    closeCartDrawer();

    await loadProducts();

    await checkAdminSession();

    loadCart();

    renderCart();

  }
);


// =====================================================
// BUTTONS
// =====================================================

function setupButtons() {

  const cartBtn =
    document.getElementById("cartBtn");

  const closeCart =
    document.getElementById("closeCart");

  const cartOverlay =
    document.getElementById("cartOverlay");

  const whatsappOrder =
    document.getElementById("whatsappOrder");


  cartBtn?.addEventListener(
    "click",
    openCart
  );

  closeCart?.addEventListener(
    "click",
    closeCartDrawer
  );

  cartOverlay?.addEventListener(
    "click",
    closeCartDrawer
  );

  whatsappOrder?.addEventListener(
    "click",
    sendWhatsAppOrder
  );

}


// =====================================================
// PRODUCTS
// =====================================================

async function loadProducts() {

  const grid =
    document.getElementById("productsGrid");

  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("products")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


    if (error) {
      throw error;
    }


    products = data || [];

    console.log(
      "Products loaded:",
      products
    );


    renderProducts();

  } catch (error) {

    console.error(
      "Product loading error:",
      error
    );

    if (grid) {

      grid.innerHTML = `
        <div class="loading">
          Unable to load products.
        </div>
      `;

    }

  }

}


// =====================================================
// RENDER PRODUCTS
// =====================================================

function renderProducts() {

  const grid =
    document.getElementById("productsGrid");

  if (!grid) return;


  const search =
    (
      document.getElementById("searchInput")
        ?.value || ""
    )
      .toLowerCase()
      .trim();


  const category =
    document.getElementById(
      "categoryFilter"
    )?.value || "all";


  const filtered =
    products.filter(product => {

      const name =
        String(
          product.name || ""
        ).toLowerCase();

      const brand =
        String(
          product.brand || ""
        ).toLowerCase();

      const productCategory =
        String(
          product.category || ""
        ).toLowerCase();


      const matchesSearch =
        !search ||
        name.includes(search) ||
        brand.includes(search) ||
        productCategory.includes(search);


      const matchesCategory =
        category === "all" ||
        productCategory === category;


      return (
        matchesSearch &&
        matchesCategory
      );

    });


  grid.innerHTML = "";


  if (!filtered.length) {

    const empty =
      document.createElement("div");

    empty.className =
      "loading";

    empty.textContent =
      currentLanguage === "ku"
        ? "هیچ بەرهەمێک نەدۆزرایەوە."
        : "No products found.";

    grid.appendChild(empty);

    return;

  }


  filtered.forEach(
    product => {

      const card =
        document.createElement(
          "article"
        );

      card.className =
        "product-card";


      // IMAGE

      const imageBox =
        document.createElement("div");

      imageBox.className =
        "product-image";


      if (product.image_url) {

        const img =
          document.createElement("img");

        img.src =
          product.image_url;

        img.alt =
          product.name || "Product";

        img.loading =
          "lazy";

        imageBox.appendChild(img);

      } else {

        const noImage =
          document.createElement("div");

        noImage.className =
          "no-image";

        noImage.textContent =
          "NO IMAGE";

        imageBox.appendChild(
          noImage
        );

      }


      imageBox.addEventListener(
        "click",
        () => openProductDetails(product)
      );


      // INFO

      const info =
        document.createElement("div");

      info.className =
        "product-info";


      // BRAND

      if (product.brand) {

        const brand =
          document.createElement("div");

        brand.className =
          "product-brand";

        brand.textContent =
          product.brand;

        info.appendChild(brand);

      }


      // NAME

      const name =
        document.createElement("div");

      name.className =
        "product-name";

      name.textContent =
        product.name || "Product";

      name.addEventListener(
        "click",
        () => openProductDetails(product)
      );

      info.appendChild(name);


      // DETAILS

      const details =
        document.createElement("div");

      details.className =
        "product-details";


      if (product.connection) {

        details.appendChild(
          createTag(
            product.connection
          )
        );

      }


      if (
        product.category ===
        "keyboard" &&
        product.switch_type
      ) {

        details.appendChild(
          createTag(
            product.switch_type
          )
        );

      }


      if (product.category) {

        details.appendChild(
          createTag(
            capitalize(
              product.category
            )
          )
        );

      }


      info.appendChild(details);


      // PRICE

      const price =
        document.createElement("div");

      price.className =
        "product-price";


      const priceBox =
        document.createElement("div");


      const usd =
        document.createElement("div");

      usd.className =
        "price-usd";

      usd.textContent =
        "$" +
        formatUSD(
          product.price_usd
        );


      const iqd =
        document.createElement("div");

      iqd.className =
        "price-iqd";

      iqd.textContent =
        formatIQD(
          product.price_iqd
        ) +
        " IQD";


      priceBox.appendChild(usd);
      priceBox.appendChild(iqd);

      price.appendChild(priceBox);

      info.appendChild(price);


      // ADD TO CART

      const add =
        document.createElement("button");

      add.className =
        "add-cart";

      add.textContent =
        currentLanguage === "ku"
          ? "زیادکردن بۆ سەبەت"
          : "ADD TO CART";


      add.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          addToCart(
            product.id
          );

        }
      );


      info.appendChild(add);


      card.appendChild(imageBox);
      card.appendChild(info);

      grid.appendChild(card);

    }
  );

}


// =====================================================
// TAG
// =====================================================

function createTag(text) {

  const tag =
    document.createElement("span");

  tag.className =
    "detail-tag";

  tag.textContent =
    text;

  return tag;

}


// =====================================================
// PRODUCT DETAILS
// =====================================================

function setupProductDetails() {

  const close =
    document.getElementById(
      "closeProductDetails"
    );

  const overlay =
    document.getElementById(
      "productDetailsOverlay"
    );

  const add =
    document.getElementById(
      "detailsAddCart"
    );


  close?.addEventListener(
    "click",
    closeProductDetails
  );


  overlay?.addEventListener(
    "click",
    event => {

      if (
        event.target === overlay
      ) {

        closeProductDetails();

      }

    }
  );


  add?.addEventListener(
    "click",
    () => {

      if (
        currentDetailsProduct
      ) {

        addToCart(
          currentDetailsProduct.id
        );

        closeProductDetails();

      }

    }
  );

}


function openProductDetails(
  product
) {

  currentDetailsProduct =
    product;


  const overlay =
    document.getElementById(
      "productDetailsOverlay"
    );

  const image =
    document.getElementById(
      "detailsImage"
    );

  const noImage =
    document.getElementById(
      "detailsNoImage"
    );

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

  const switchRow =
    document.getElementById(
      "detailsSwitchRow"
    );

  const switchText =
    document.getElementById(
      "detailsSwitch"
    );

  const usd =
    document.getElementById(
      "detailsUSD"
    );

  const iqd =
    document.getElementById(
      "detailsIQD"
    );


  brand.textContent =
    product.brand || "";


  name.textContent =
    product.name || "Product";


  category.textContent =
    capitalize(
      product.category || ""
    );


  connection.textContent =
    product.connection || "";


  usd.textContent =
    "$" +
    formatUSD(
      product.price_usd
    );


  iqd.textContent =
    formatIQD(
      product.price_iqd
    ) +
    " IQD";


  if (
    product.category === "keyboard" &&
    product.switch_type
  ) {

    switchRow.classList.remove(
      "hidden"
    );

    switchText.textContent =
      product.switch_type;

  } else {

    switchRow.classList.add(
      "hidden"
    );

  }


  if (product.image_url) {

    image.src =
      product.image_url;

    image.classList.remove(
      "hidden"
    );

    noImage.classList.add(
      "hidden"
    );

  } else {

    image.removeAttribute(
      "src"
    );

    image.classList.add(
      "hidden"
    );

    noImage.classList.remove(
      "hidden"
    );

  }


  overlay.classList.remove(
    "hidden"
  );

}


function closeProductDetails() {

  document
    .getElementById(
      "productDetailsOverlay"
    )
    ?.classList.add(
      "hidden"
    );

  currentDetailsProduct =
    null;

}


// =====================================================
// SEARCH
// =====================================================

function setupSearch() {

  document
    .getElementById(
      "searchInput"
    )
    ?.addEventListener(
      "input",
      renderProducts
    );


  document
    .getElementById(
      "categoryFilter"
    )
    ?.addEventListener(
      "change",
      renderProducts
    );

}


// =====================================================
// LANGUAGE
// =====================================================

function setupLanguage() {

  document
    .getElementById(
      "languageBtn"
    )
    ?.addEventListener(
      "click",
      () => {

        currentLanguage =
          currentLanguage === "en"
            ? "ku"
            : "en";

        localStorage.setItem(
          "ah_language",
          currentLanguage
        );

        updateLanguage();

        renderProducts();

        renderCart();

      }
    );

}


function updateLanguage() {

  document.documentElement.lang =
    currentLanguage === "ku"
      ? "ku"
      : "en";


  document.documentElement.dir =
    currentLanguage === "ku"
      ? "rtl"
      : "ltr";


  document
    .querySelectorAll(
      "[data-en][data-ku]"
    )
    .forEach(element => {

      element.textContent =
        currentLanguage === "ku"
          ? element.dataset.ku
          : element.dataset.en;

    });


  const languageButton =
    document.getElementById(
      "languageBtn"
    );

  if (languageButton) {

    languageButton.textContent =
      currentLanguage === "en"
        ? "کوردی"
        : "English";

  }


  const search =
    document.getElementById(
      "searchInput"
    );

  if (search) {

    search.placeholder =
      currentLanguage === "ku"
        ? search.dataset.placeholderKu
        : search.dataset.placeholderEn;

  }

}


// =====================================================
// CART
// =====================================================

function loadCart() {

  try {

    cart =
      JSON.parse(
        localStorage.getItem(
          "ah_cart"
        )
      ) || [];

  } catch {

    cart = [];

  }

}


function saveCart() {

  localStorage.setItem(
    "ah_cart",
    JSON.stringify(cart)
  );

}


function addToCart(productId) {

  const product =
    products.find(
      p =>
        String(p.id) ===
        String(productId)
    );


  if (!product) {

    console.error(
      "Product not found:",
      productId
    );

    return;

  }


  const existing =
    cart.find(
      item =>
        String(item.id) ===
        String(product.id)
    );


  if (existing) {

    existing.quantity += 1;

  } else {

    cart.push({

      id: product.id,

      name: product.name,

      price_usd:
        Number(product.price_usd) || 0,

      price_iqd:
        Number(product.price_iqd) || 0,

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
      item =>
        String(item.id) !==
        String(id)
    );

  saveCart();

  renderCart();

}


function changeQuantity(
  id,
  change
) {

  const item =
    cart.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!item) return;


  item.quantity +=
    change;


  if (item.quantity <= 0) {

    removeFromCart(id);

    return;

  }


  saveCart();

  renderCart();

}


function renderCart() {

  const container =
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


  if (!container) return;


  container.innerHTML = "";


  const totalItems =
    cart.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );


  if (count) {

    count.textContent =
      totalItems;

  }


  if (!cart.length) {

    const empty =
      document.createElement("div");

    empty.style.padding =
      "30px 10px";

    empty.style.textAlign =
      "center";

    empty.style.color =
      "#8493a8";

    empty.textContent =
      currentLanguage === "ku"
        ? "سەبەتەکە بەتاڵە."
        : "Your cart is empty.";

    container.appendChild(
      empty
    );


    if (total) {

      total.textContent =
        "$0";

    }

    return;

  }


  let totalUSD = 0;


  cart.forEach(
    item => {

      totalUSD +=
        item.price_usd *
        item.quantity;


      const row =
        document.createElement(
          "div"
        );

      row.className =
        "cart-item";


      if (item.image_url) {

        const img =
          document.createElement("img");

        img.src =
          item.image_url;

        img.alt =
          item.name;

        row.appendChild(img);

      } else {

        const blank =
          document.createElement("div");

        blank.style.width =
          "70px";

        blank.style.height =
          "70px";

        blank.style.background =
          "#050a11";

        blank.style.borderRadius =
          "8px";

        row.appendChild(blank);

      }


      const info =
        document.createElement("div");


      const name =
        document.createElement("div");

      name.className =
        "cart-item-name";

      name.textContent =
        item.name;


      const price =
        document.createElement("div");

      price.className =
        "cart-item-price";

      price.textContent =
        "$" +
        formatUSD(
          item.price_usd
        );


      const quantity =
        document.createElement("div");

      quantity.className =
        "quantity";


      const minus =
        document.createElement("button");

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


      const number =
        document.createElement("span");

      number.textContent =
        item.quantity;


      const plus =
        document.createElement("button");

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

      remove.className =
        "remove-cart";

      remove.textContent =
        currentLanguage === "ku"
          ? "سڕینەوە"
          : "REMOVE";

      remove.addEventListener(
        "click",
        () =>
          removeFromCart(
            item.id
          )
      );


      info.appendChild(name);
      info.appendChild(price);
      info.appendChild(quantity);
      info.appendChild(remove);


      row.appendChild(info);

      container.appendChild(row);

    }
  );


  if (total) {

    total.textContent =
      "$" +
      formatUSD(totalUSD);

  }

}


// =====================================================
// CART OPEN/CLOSE
// =====================================================

function openCart() {

  document
    .getElementById(
      "cartDrawer"
    )
    ?.classList.remove(
      "hidden"
    );

  document
    .getElementById(
      "cartDrawer"
    )
    ?.classList.add(
      "open"
    );

  document
    .getElementById(
      "cartOverlay"
    )
    ?.classList.remove(
      "hidden"
    );

}


function closeCartDrawer() {

  document
    .getElementById(
      "cartDrawer"
    )
    ?.classList.remove(
      "open"
    );

  document
    .getElementById(
      "cartDrawer"
    )
    ?.classList.add(
      "hidden"
    );

  document
    .getElementById(
      "cartOverlay"
    )
    ?.classList.add(
      "hidden"
    );

}


// =====================================================
// WHATSAPP
// =====================================================

function sendWhatsAppOrder() {

  if (!cart.length) {

    alert(
      currentLanguage === "ku"
        ? "سەبەتەکە بەتاڵە."
        : "Your cart is empty."
    );

    return;

  }


  let message =
    currentLanguage === "ku"
      ? "سڵاو AH STORE، ئەمانە دەوێت داوا بکەم:\n\n"
      : "Hello AH STORE, I would like to order:\n\n";


  let total =
    0;


  cart.forEach(
    item => {

      const lineTotal =
        item.price_usd *
        item.quantity;

      total +=
        lineTotal;


      message +=
        `• ${item.name} x${item.quantity} - $${formatUSD(lineTotal)}\n`;

    }
  );


  message +=
    `\nTotal: $${formatUSD(total)}`;


  message +=
    currentLanguage === "ku"
      ? "\n\nناونیشانی گەیاندن:\n"
      : "\n\nDelivery address:\n";


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
// ADMIN
// =====================================================

function setupAdmin() {

  const adminBtn =
    document.getElementById(
      "adminBtn"
    );

  const closeAdmin =
    document.getElementById(
      "closeAdmin"
    );

  const logout =
    document.getElementById(
      "logoutBtn"
    );


  adminBtn?.addEventListener(
    "click",
    openAdmin
  );


  closeAdmin?.addEventListener(
    "click",
    closeAdminModal
  );


  logout?.addEventListener(
    "click",
    logoutAdmin
  );


  document
    .getElementById(
      "adminModal"
    )
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target.id ===
          "adminModal"
        ) {

          closeAdminModal();

        }

      }
    );

}


function openAdmin() {

  document
    .getElementById(
      "adminModal"
    )
    ?.classList.remove(
      "hidden"
    );

}


function closeAdminModal() {

  document
    .getElementById(
      "adminModal"
    )
    ?.classList.add(
      "hidden"
    );

}


async function checkAdminSession() {

  const {
    data
  } =
    await supabaseClient
      .auth
      .getSession();


  if (
    data?.session
  ) {

    showAdminPanel();

  }

}


// =====================================================
// LOGIN
// =====================================================

function setupLoginForm() {

  const form =
    document.getElementById(
      "loginForm"
    );


  form?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const email =
        document.getElementById(
          "adminEmail"
        ).value.trim();


      const password =
        document.getElementById(
          "adminPassword"
        ).value;


      const message =
        document.getElementById(
          "loginMessage"
        );


      message.textContent =
        "Signing in...";


      const {
        error
      } =
        await supabaseClient
          .auth
          .signInWithPassword({
            email,
            password
          });


      if (error) {

        console.error(error);

        message.textContent =
          error.message;

        return;

      }


      message.textContent =
        "Login successful.";

      showAdminPanel();

    }
  );

}


async function logoutAdmin() {

  await supabaseClient
    .auth
    .signOut();


  document
    .getElementById(
      "loginSection"
    )
    ?.classList.remove(
      "hidden"
    );


  document
    .getElementById(
      "adminPanel"
    )
    ?.classList.add(
      "hidden"
    );

}


// =====================================================
// ADMIN PRODUCT FORM
// =====================================================

function setupProductForm() {

  setupLoginForm();


  const form =
    document.getElementById(
      "productForm"
    );


  const imageInput =
    document.getElementById(
      "productImage"
    );


  const cancel =
    document.getElementById(
      "cancelEditBtn"
    );


  form?.addEventListener(
    "submit",
    saveProduct
  );


  imageInput?.addEventListener(
    "change",
    previewImage
  );


  cancel?.addEventListener(
    "click",
    resetProductForm
  );


  document
    .getElementById(
      "productCategory"
    )
    ?.addEventListener(
      "change",
      updateSwitchField
    );


  updateSwitchField();

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


function showAdminPanel() {

  document
    .getElementById(
      "loginSection"
    )
    ?.classList.add(
      "hidden"
    );


  document
    .getElementById(
      "adminPanel"
    )
    ?.classList.remove(
      "hidden"
    );


  renderAdminProducts();

}


function previewImage(event) {

  const file =
    event.target.files?.[0];


  const preview =
    document.getElementById(
      "imagePreview"
    );


  if (!file) {

    preview?.classList.add(
      "hidden"
    );

    return;

  }


  const reader =
    new FileReader();


  reader.onload =
    () => {

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


// =====================================================
// SAVE PRODUCT
// =====================================================

async function saveProduct(
  event
) {

  event.preventDefault();


  const message =
    document.getElementById(
      "productMessage"
    );


  const saveButton =
    document.getElementById(
      "saveProductBtn"
    );


  const id =
    document.getElementById(
      "productId"
    ).value.trim();


  const name =
    document.getElementById(
      "productName"
    ).value.trim();


  const brand =
    document.getElementById(
      "productBrand"
    ).value.trim();


  const category =
    document.getElementById(
      "productCategory"
    ).value;


  const priceUSD =
    Number(
      document.getElementById(
        "productUSD"
      ).value
    );


  const priceIQD =
    Number(
      document.getElementById(
        "productIQD"
      ).value
    );


  const connection =
    document.getElementById(
      "productConnection"
    ).value;


  const switchType =
    document.getElementById(
      "productSwitch"
    ).value.trim();


  const imageFile =
    document.getElementById(
      "productImage"
    ).files?.[0];


  saveButton.disabled =
    true;

  message.textContent =
    "Saving...";


  try {

    let imageUrl = "";


    // ---------------------------------------------
    // EDIT EXISTING PRODUCT
    // ---------------------------------------------

    if (id) {

      const oldProduct =
        products.find(
          p =>
            String(p.id) ===
            String(id)
        );


      imageUrl =
        oldProduct?.image_url ||
        "";


      // Upload new image

      if (imageFile) {

        imageUrl =
          await uploadProductImage(
            imageFile
          );

      }


      const {
        error
      } =
        await supabaseClient
          .from("products")
          .update({

            name,

            brand,

            category,

            price_usd:
              priceUSD,

            price_iqd:
              priceIQD,

            image_url:
              imageUrl,

            connection,

            switch_type:
              category === "keyboard"
                ? switchType
                : null

          })
          .eq(
            "id",
            id
          );


      if (error) {

        throw error;

      }


      message.textContent =
        "Product updated successfully.";

    }


    // ---------------------------------------------
    // ADD NEW PRODUCT
    // ---------------------------------------------

    else {

      if (imageFile) {

        imageUrl =
          await uploadProductImage(
            imageFile
          );

      }


      const {
        error
      } =
        await supabaseClient
          .from("products")
          .insert({

            name,

            brand,

            category,

            price_usd:
              priceUSD,

            price_iqd:
              priceIQD,

            image_url:
              imageUrl,

            connection,

            switch_type:
              category === "keyboard"
                ? switchType
                : null

          });


      if (error) {

        throw error;

      }


      message.textContent =
        "Product added successfully.";

    }


    resetProductForm();

    await loadProducts();

    renderAdminProducts();


  } catch (error) {

    console.error(
      "Save product error:",
      error
    );


    message.textContent =
      error.message ||
      "Could not save product.";

  }


  saveButton.disabled =
    false;

}


// =====================================================
// IMAGE UPLOAD
// =====================================================

async function uploadProductImage(
  file
) {

  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();


  const fileName =
    `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}.${extension}`;


  const {
    error
  } =
    await supabaseClient
      .storage
      .from(STORAGE_BUCKET)
      .upload(
        fileName,
        file,
        {
          cacheControl: "3600",
          upsert: false
        }
      );


  if (error) {

    throw error;

  }


  const {
    data
  } =
    supabaseClient
      .storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(
        fileName
      );


  return data.publicUrl;

}


// =====================================================
// ADMIN PRODUCTS
// =====================================================

function renderAdminProducts() {

  const container =
    document.getElementById(
      "adminProductsList"
    );


  if (!container) return;


  container.innerHTML = "";


  if (!products.length) {

    container.innerHTML =
      "<p>No products yet.</p>";

    return;

  }


  products.forEach(
    product => {

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "admin-product";


      if (product.image_url) {

        const img =
          document.createElement(
            "img"
          );

        img.src =
          product.image_url;

        img.alt =
          product.name;

        row.appendChild(img);

      } else {

        const blank =
          document.createElement(
            "div"
          );

        blank.style.width =
          "60px";

        blank.style.height =
          "60px";

        blank.style.background =
          "#050a11";

        blank.style.borderRadius =
          "7px";

        row.appendChild(blank);

      }


      const info =
        document.createElement(
          "div"
        );

      info.className =
        "admin-product-info";


      const title =
        document.createElement(
          "strong"
        );

      title.textContent =
        product.name;


      const small =
        document.createElement(
          "small"
        );

      small.textContent =
        "$" +
        formatUSD(
          product.price_usd
        ) +
        " • " +
        formatIQD(
          product.price_iqd
        ) +
        " IQD";


      info.appendChild(title);
      info.appendChild(small);


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

      edit.textContent =
        "EDIT";

      edit.addEventListener(
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

      deleteButton.textContent =
        "DELETE";

      deleteButton.className =
        "delete";

      deleteButton.addEventListener(
        "click",
        () =>
          deleteProduct(
            product.id
          )
      );


      actions.appendChild(edit);
      actions.appendChild(
        deleteButton
      );


      row.appendChild(info);
      row.appendChild(actions);


      container.appendChild(row);

    }
  );

}


// =====================================================
// EDIT PRODUCT
// =====================================================

function editProduct(id) {

  const product =
    products.find(
      p =>
        String(p.id) ===
        String(id)
    );


  if (!product) return;


  editingProductId =
    product.id;


  document.getElementById(
    "productId"
  ).value =
    product.id;


  document.getElementById(
    "productName"
  ).value =
    product.name || "";


  document.getElementById(
    "productBrand"
  ).value =
    product.brand || "";


  document.getElementById(
    "productCategory"
  ).value =
    product.category || "other";


  document.getElementById(
    "productUSD"
  ).value =
    product.price_usd || "";


  document.getElementById(
    "productIQD"
  ).value =
    product.price_iqd || "";


  document.getElementById(
    "productConnection"
  ).value =
    product.connection || "Wired";


  document.getElementById(
    "productSwitch"
  ).value =
    product.switch_type || "";


  updateSwitchField();


  const button =
    document.getElementById(
      "saveProductBtn"
    );

  button.textContent =
    "UPDATE PRODUCT";


  document
    .getElementById(
      "cancelEditBtn"
    )
    ?.classList.remove(
      "hidden"
    );


  const preview =
    document.getElementById(
      "imagePreview"
    );


  if (
    product.image_url &&
    preview
  ) {

    preview.src =
      product.image_url;

    preview.classList.remove(
      "hidden"
    );

  }


  document
    .getElementById(
      "productForm"
    )
    ?.scrollIntoView({
      behavior: "smooth"
    });

}


// =====================================================
// DELETE PRODUCT
// =====================================================

async function deleteProduct(
  id
) {

  const product =
    products.find(
      p =>
        String(p.id) ===
        String(id)
    );


  if (!product) return;


  const confirmed =
    confirm(
      currentLanguage === "ku"
        ? `دڵنیایت دەتەوێت "${product.name}" بسڕیتەوە؟`
        : `Are you sure you want to delete "${product.name}"?`
    );


  if (!confirmed) return;


  try {

    const {
      error
    } =
      await supabaseClient
        .from("products")
        .delete()
        .eq(
          "id",
          id
        );


    if (error) {

      throw error;

    }


    await loadProducts();

    renderAdminProducts();


  } catch (error) {

    console.error(
      "Delete error:",
      error
    );


    alert(
      error.message ||
      "Could not delete product."
    );

  }

}


// =====================================================
// RESET PRODUCT FORM
// =====================================================

function resetProductForm() {

  editingProductId =
    null;


  const form =
    document.getElementById(
      "productForm"
    );


  form?.reset();


  document.getElementById(
    "productId"
  ).value =
    "";


  document.getElementById(
    "productCategory"
  ).value =
    "keyboard";


  document.getElementById(
    "productConnection"
  ).value =
    "Wired";


  const preview =
    document.getElementById(
      "imagePreview"
    );


  preview?.classList.add(
    "hidden"
  );


  preview?.removeAttribute(
    "src"
  );


  document.getElementById(
    "saveProductBtn"
  ).textContent =
    "ADD PRODUCT";


  document
    .getElementById(
      "cancelEditBtn"
    )
    ?.classList.add(
      "hidden"
    );


  const message =
    document.getElementById(
      "productMessage"
    );


  if (message) {

    message.textContent =
      "";

  }


  updateSwitchField();

}


// =====================================================
// KEYBOARD ESCAPE
// =====================================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      closeCartDrawer();

      closeProductDetails();

      closeAdminModal();

    }

  }
);


// =====================================================
// HELPERS
// =====================================================

function formatUSD(value) {

  const number =
    Number(value) || 0;

  return number.toFixed(2);

}


function formatIQD(value) {

  const number =
    Number(value) || 0;

  return new Intl.NumberFormat(
    "en-US"
  ).format(
    Math.round(number)
  );

}


function capitalize(value) {

  if (!value) return "";

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );

}


// =====================================================
// SUPABASE AUTH STATE
// =====================================================

supabaseClient
  .auth
  .onAuthStateChange(
    (
      event,
      session
    ) => {

      if (session) {

        showAdminPanel();

      } else {

        document
          .getElementById(
            "loginSection"
          )
          ?.classList.remove(
            "hidden"
          );

        document
          .getElementById(
            "adminPanel"
          )
          ?.classList.add(
            "hidden"
          );

      }

    }
  );
```
