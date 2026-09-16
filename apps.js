// ==========================================
// AH STORE - MAIN JAVASCRIPT
// ==========================================

// SUPABASE
const SUPABASE_URL =
  "https://toeqdxunmvspulvkpdow.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_JsjlGkffizJ1Ap7oPCAQ6Q_8TJ64tw0";

const db = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// AH STORE WHATSAPP
const WHATSAPP =
  "9647701068935";


// ==========================================
// VARIABLES
// ==========================================

let products = [];

let cart = JSON.parse(
  localStorage.getItem("ah_cart") || "[]"
);


// ==========================================
// HELPER
// ==========================================

function $(id) {
  return document.getElementById(id);
}


// Prevent HTML injection in product names
function esc(value) {

  return String(value ?? "").replace(
    /[&<>"']/g,

    function (character) {

      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[character];

    }
  );

}


// ==========================================
// LOAD PRODUCTS
// ==========================================

async function loadProducts() {

  const {
    data,
    error
  } = await db
    .from("products")
    .select("*")
    .order("created_at", {
      ascending: false
    });


  if (error) {

    console.error(error);

    $("productsGrid").innerHTML =
      "<p>Could not load products.</p>";

    return;
  }


  products = data || [];


  renderProducts();

  fillCategories();

  renderAdmin();
}


// ==========================================
// DISPLAY PRODUCTS
// ==========================================

function renderProducts() {

  const search =
    $("search").value
      .toLowerCase();

  const category =
    $("category").value;


  const filtered =
    products.filter(function (product) {

      const searchable =
        `${product.name || ""}
         ${product.brand || ""}
         ${product.category || ""}`
          .toLowerCase();


      const matchesSearch =
        !search ||
        searchable.includes(search);


      const matchesCategory =
        !category ||
        product.category === category;


      return (
        matchesSearch &&
        matchesCategory
      );

    });


  if (!filtered.length) {

    $("productsGrid").innerHTML =
      "<p>No products found.</p>";

    return;
  }


  $("productsGrid").innerHTML =
    filtered.map(function (product) {

      const image =
        product.image_url ||
        "https://placehold.co/600x500/0b1119/18a8ff?text=AH+STORE";


      return `

        <article class="card">

          <img
            src="${image}"
            alt="${esc(product.name)}"
          >

          <div class="card-body">

            <div class="muted">

              ${esc(product.brand || "AH STORE")}

              ·

              ${esc(product.category || "Gaming")}

            </div>


            <h3>
              ${esc(product.name)}
            </h3>


            <div class="price">

              $${Number(
                product.price_usd || 0
              ).toFixed(2)}

            </div>


            <div class="iqd">

              ${Number(
                product.price_iqd || 0
              ).toLocaleString()}

              IQD

            </div>


            <button
              class="primary"
              onclick="addCart('${product.id}')">

              Add to Cart

            </button>

          </div>

        </article>

      `;

    }).join("");

}


// ==========================================
// CATEGORY FILTER
// ==========================================

function fillCategories() {

  const categories = [
    ...new Set(
      products
        .map(product => product.category)
        .filter(Boolean)
    )
  ];


  $("category").innerHTML =

    `<option value="">
      All Categories
    </option>` +

    categories
      .map(function (category) {

        return `
          <option value="${esc(category)}">
            ${esc(category)}
          </option>
        `;

      })
      .join("");

}


// ==========================================
// SEARCH
// ==========================================

$("search").addEventListener(
  "input",
  renderProducts
);


$("category").addEventListener(
  "change",
  renderProducts
);


// ==========================================
// CART
// ==========================================

function addCart(id) {

  const product =
    products.find(
      product => product.id === id
    );


  if (!product) return;


  cart.push(product);


  saveCart();


  openCart();

}


function saveCart() {

  localStorage.setItem(
    "ah_cart",
    JSON.stringify(cart)
  );


  $("cartCount").textContent =
    cart.length;


  renderCart();

}


function renderCart() {

  const cartItems =
    $("cartItems");


  if (!cart.length) {

    cartItems.innerHTML =
      `<p class="muted">
        Your cart is empty.
      </p>`;

  } else {

    cartItems.innerHTML =
      cart.map(function (product, index) {

        const image =
          product.image_url ||
          "https://placehold.co/100x100";


        return `

          <div class="cart-row">

            <img
              src="${image}"
              alt="${esc(product.name)}"
            >

            <div>

              <b>
                ${esc(product.name)}
              </b>

              <div class="muted">

                $${Number(
                  product.price_usd || 0
                ).toFixed(2)}

              </div>

            </div>

            <button
              onclick="removeCart(${index})">

              ×

            </button>

          </div>

        `;

      }).join("");

  }


  const total =
    cart.reduce(
      (sum, product) =>
        sum + Number(
          product.price_usd || 0
        ),
      0
    );


  $("cartTotal").textContent =
    "$" + total.toFixed(2);

}


function removeCart(index) {

  cart.splice(index, 1);

  saveCart();

}


function openCart() {

  $("cart")
    .classList
    .add("open");

}


function closeCart() {

  $("cart")
    .classList
    .remove("open");

}


$("cartBtn").addEventListener(
  "click",
  openCart
);


$("closeCart").addEventListener(
  "click",
  closeCart
);


// ==========================================
// WHATSAPP ORDER
// ==========================================

$("orderBtn").addEventListener(
  "click",
  function () {

    if (!cart.length) {

      alert(
        "Your cart is empty."
      );

      return;
    }


    const total =
      cart.reduce(
        (sum, product) =>
          sum + Number(
            product.price_usd || 0
          ),
        0
      );


    let message =
      "Hello AH STORE! 👋\n\n" +
      "I want to order:\n\n";


    cart.forEach(function (product) {

      message +=
        "• " +
        product.name +
        " - $" +
        Number(
          product.price_usd || 0
        ).toFixed(2) +
        "\n";

    });


    message +=
      "\nTotal: $" +
      total.toFixed(2) +
      "\n\n" +
      "Cash on delivery.";


    const url =
      "https://wa.me/" +
      WHATSAPP +
      "?text=" +
      encodeURIComponent(message);


    window.open(
      url,
      "_blank"
    );

  }
);


// ==========================================
// ADMIN MODAL
// ==========================================

$("adminBtn").addEventListener(
  "click",
  function () {

    $("adminModal")
      .classList
      .remove("hidden");

  }
);


$("closeAdmin").addEventListener(
  "click",
  function () {

    $("adminModal")
      .classList
      .add("hidden");

  }
);


// ==========================================
// ADMIN LOGIN
// ==========================================

$("loginBtn").addEventListener(
  "click",
  async function () {

    const email =
      $("email").value.trim();

    const password =
      $("password").value;


    if (!email || !password) {

      $("loginMsg").textContent =
        "Enter your email and password.";

      return;
    }


    $("loginMsg").textContent =
      "Logging in...";


    const {
      error
    } = await db.auth.signInWithPassword({

      email: email,

      password: password

    });


    if (error) {

      $("loginMsg").textContent =
        error.message;

      return;

    }


    $("loginMsg").textContent =
      "Login successful!";


    showAdmin();

  }
);


// ==========================================
// SHOW ADMIN
// ==========================================

function showAdmin() {

  $("loginPanel")
    .classList
    .add("hidden");


  $("adminPanel")
    .classList
    .remove("hidden");


  renderAdmin();

}


// ==========================================
// LOGOUT
// ==========================================

$("logoutBtn").addEventListener(
  "click",
  async function () {

    await db.auth.signOut();


    $("adminPanel")
      .classList
      .add("hidden");


    $("loginPanel")
      .classList
      .remove("hidden");


    $("loginMsg").textContent =
      "";

  }
);


// ==========================================
// IMAGE UPLOAD
// ==========================================

async function uploadImage(file) {

  if (!file) {

    return null;

  }


  const safeName =
    file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );


  const filePath =
    Date.now() +
    "-" +
    safeName;


  const {
    error
  } = await db.storage
    .from("products")
    .upload(
      filePath,
      file,
      {
        upsert: false
      }
    );


  if (error) {

    throw error;

  }


  const {
    data
  } = db.storage
    .from("products")
    .getPublicUrl(filePath);


  return data.publicUrl;

}


// ==========================================
// ADD / EDIT PRODUCT
// ==========================================

$("productForm").addEventListener(
  "submit",
  async function (event) {

    event.preventDefault();


    try {

      const editId =
        $("editId").value;


      const existing =
        products.find(
          product =>
            product.id === editId
        );


      let image =
        existing?.image_url || null;


      const imageFile =
        $("pImage").files[0];


      if (imageFile) {

        image =
          await uploadImage(
            imageFile
          );

      }


      const product = {

        name:
          $("pName").value.trim(),

        brand:
          $("pBrand").value.trim(),

        category:
          $("pCategory").value.trim(),

        price_usd:
          Number(
            $("pUsd").value
          ),

        price_iqd:
          Number(
            $("pIqd").value
          ),

        connection:
          $("pConnection").value.trim(),

        switch_type:
          $("pSwitch").value.trim(),

        image_url:
          image

      };


      let result;


      if (editId) {

        result =
          await db
            .from("products")
            .update(product)
            .eq("id", editId);

      } else {

        result =
          await db
            .from("products")
            .insert(product);

      }


      if (result.error) {

        throw result.error;

      }


      $("productForm").reset();

      $("editId").value =
        "";


      $("cancelEdit")
        .classList
        .add("hidden");


      await loadProducts();


      alert(
        editId
          ? "Product updated!"
          : "Product added!"
      );


    } catch (error) {

      console.error(error);

      alert(
        "Error: " +
        error.message
      );

    }

  }
);


// ==========================================
// ADMIN PRODUCT LIST
// ==========================================

function renderAdmin() {

  const container =
    $("adminProducts");


  if (!container) return;


  container.innerHTML =
    products.map(function (product) {

      return `

        <div class="admin-item">

          <span>

            <b>
              ${esc(product.name)}
            </b>

            <br>

            <small>
              ${esc(
                product.category || ""
              )}
            </small>

          </span>


          <span>

            <button
              onclick="editProduct('${product.id}')">

              Edit

            </button>


            <button
              onclick="deleteProduct('${product.id}')">

              Delete

            </button>

          </span>

        </div>

      `;

    }).join("");

}


// ==========================================
// EDIT PRODUCT
// ==========================================

function editProduct(id) {

  const product =
    products.find(
      product => product.id === id
    );


  if (!product) return;


  $("editId").value =
    product.id;


  $("pName").value =
    product.name || "";


  $("pBrand").value =
    product.brand || "";


  $("pCategory").value =
    product.category || "";


  $("pUsd").value =
    product.price_usd || "";


  $("pIqd").value =
    product.price_iqd || "";


  $("pConnection").value =
    product.connection || "";


  $("pSwitch").value =
    product.switch_type || "";


  $("cancelEdit")
    .classList
    .remove("hidden");

}


// ==========================================
// CANCEL EDIT
// ==========================================

$("cancelEdit").addEventListener(
  "click",
  function () {

    $("productForm").reset();

    $("editId").value =
      "";

    $("cancelEdit")
      .classList
      .add("hidden");

  }
);


// ==========================================
// DELETE PRODUCT
// ==========================================

async function deleteProduct(id) {

  const confirmed =
    confirm(
      "Are you sure you want to delete this product?"
    );


  if (!confirmed) return;


  const {
    error
  } = await db
    .from("products")
    .delete()
    .eq("id", id);


  if (error) {

    alert(
      "Error: " +
      error.message
    );

    return;

  }


  await loadProducts();

}


// ==========================================
// LANGUAGE BUTTON
// ==========================================

$("langBtn").addEventListener(
  "click",
  function () {

    alert(
      "Kurdish language support will be added next."
    );

  }
);


// ==========================================
// CHECK EXISTING ADMIN SESSION
// ==========================================

db.auth.getSession()
  .then(function ({ data }) {

    if (data.session) {

      showAdmin();

    }

  });


// ==========================================
// START WEBSITE
// ==========================================

saveCart();

loadProducts();
