      "Delete failed: " +
      error.message
    );

    return;
  }

  await loadProducts();
}

/* =========================
   SWITCH TYPE
========================= */

function updateSwitchField() {

  const category =
    $("productCategory")?.value;

  const field =
    $("switchField");

  if (!field) return;

  if (category === "keyboard") {
    field.classList.remove("hidden");
  } else {
    field.classList.add("hidden");
  }
}
