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

const $ = (id) => document.getElementById(id);

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
loadProducts();
checkAuth();
