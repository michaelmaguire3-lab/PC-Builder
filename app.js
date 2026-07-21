// PC Builder — paths, forms, mailto submission
// Change ORDERS_EMAIL below to your real address.

const ORDERS_EMAIL = "michaelmaguire3@gmail.com";
const SUBJECT_PREFIX = "PC Builder order";

const state = {
  path: null, // "fast" | "beginner" | "advanced"
  selectedBuild: null, // for fast track
};

// ---------- Panel switching ----------

function showPath(path) {
  state.path = path;
  // Hide all panels
  document.querySelectorAll(".panel").forEach((p) => p.hidden = true);
  // Hide path cards after selection (re-shown on reset)
  document.querySelector(".path-cards").hidden = true;
  document.querySelector(".chooser__lede").hidden = true;
  document.querySelector(".chooser h2").textContent =
    path === "fast" ? "Pick a build"
    : path === "beginner" ? "Guided build"
    : "Parts mixer";
  const panel = document.querySelector(`.panel[data-panel="${path}"]`);
  if (panel) panel.hidden = false;
  // Scroll to the panel
  panel?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetAll() {
  state.path = null;
  state.selectedBuild = null;
  document.querySelectorAll(".panel").forEach((p) => p.hidden = true);
  document.querySelector(".path-cards").hidden = false;
  document.querySelector(".chooser__lede").hidden = false;
  document.querySelector(".chooser h2").textContent = "How would you like to build?";
  // Reset forms
  document.querySelectorAll("form").forEach((f) => f.reset());
  // Reset wizard to step 1
  document.querySelectorAll(".wizard__step").forEach((s) => s.classList.remove("is-active"));
  document.querySelector('.wizard__step[data-step="1"]')?.classList.add("is-active");
  // Reset mixer summary
  document.querySelectorAll("[data-summary]").forEach((el) => (el.textContent = "\u2014"));
  // Scroll back to the chooser
  document.getElementById("choose")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------- Path chooser ----------

document.querySelectorAll(".path-card").forEach((card) => {
  card.addEventListener("click", () => {
    const path = card.getAttribute("data-path");
    showPath(path);
  });
});

// ---------- Fast track: build selection ----------

document.querySelectorAll("[data-action='select-build']").forEach((btn) => {
  btn.addEventListener("click", () => {
    const build = btn.getAttribute("data-build");
    state.selectedBuild = build;
    // Show a contact form inline by promoting to a quick form
    submitOrder({
      kind: "Fast track",
      summary: `Build: ${build}`,
    });
  });
});

// ---------- Beginner: wizard ----------

const wizard = document.querySelector('.wizard');
if (wizard) {
  const steps = wizard.querySelectorAll(".wizard__step");
  function showStep(n) {
    steps.forEach((s) => s.classList.toggle("is-active", Number(s.dataset.step) === n));
  }
  wizard.addEventListener("click", (e) => {
    const action = e.target.getAttribute("data-action");
    if (action === "next") {
      const current = e.target.closest(".wizard__step");
      const stepNum = Number(current.dataset.step);
      // Validate required inputs on the current step before advancing
      const required = current.querySelectorAll("input[required]");
      for (const input of required) {
        if (!input.checkValidity()) {
          input.reportValidity();
          return;
        }
      }
      showStep(stepNum + 1);
    }
    if (action === "prev") {
      const current = e.target.closest(".wizard__step");
      const stepNum = Number(current.dataset.step);
      showStep(Math.max(1, stepNum - 1));
    }
  });
}

const beginnerForm = document.querySelector('form[data-form="beginner"]');
if (beginnerForm) {
  beginnerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(beginnerForm);
    const priority = fd.get("priority") || "";
    const games = fd.get("games") || "";
    const budget = fd.get("budget") || "";
    const extras = fd.getAll("extras").join(", ") || "None";
    const name = fd.get("name") || "";
    const email = fd.get("email") || "";
    const notes = fd.get("notes") || "";

    if (!email) {
      alert("Please enter your email so I can reply.");
      return;
    }

    const summary = [
      `Priority: ${priority}`,
      `Games: ${games}`,
      `Budget: ${budget}`,
      `Extras: ${extras}`,
    ].join("\n");

    submitOrder({
      kind: "Guided (beginner)",
      summary,
      name,
      email,
      notes,
    });
  });
}

// ---------- Advanced: parts mixer ----------

const mixerForm = document.querySelector('form[data-form="advanced"]');
if (mixerForm) {
  mixerForm.addEventListener("change", (e) => {
    if (e.target.matches('input[type="radio"]')) {
      const name = e.target.name; // cpu, gpu, ram, storage
      const cell = document.querySelector(`[data-summary="${name}"]`);
      if (cell) {
        // Strip the "Budget/Mid/Upper" prefix that I added for clarity in the radio label
        const label = e.target.parentElement.querySelector("span").textContent.trim();
        cell.textContent = label;
      }
    }
  });

  mixerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(mixerForm);
    const cpu = fd.get("cpu") || "Not selected";
    const gpu = fd.get("gpu") || "Not selected";
    const ram = fd.get("ram") || "Not selected";
    const storage = fd.get("storage") || "Not selected";
    const name = fd.get("name") || "";
    const email = fd.get("email") || "";
    const notes = fd.get("notes") || "";

    if (!email) {
      alert("Please enter your email so I can reply.");
      return;
    }
    if (!fd.get("cpu") || !fd.get("gpu") || !fd.get("ram") || !fd.get("storage")) {
      alert("Please pick a part for each group (CPU, GPU, RAM, Storage).");
      return;
    }

    const summary = [
      `CPU: ${cpu}`,
      `GPU: ${gpu}`,
      `RAM: ${ram}`,
      `Storage: ${storage}`,
    ].join("\n");

    submitOrder({
      kind: "Advanced (parts mixer)",
      summary,
      name,
      email,
      notes,
    });
  });
}

// ---------- Submit: open mailto ----------

function submitOrder({ kind, summary, name = "", email = "", notes = "" }) {
  const lines = [
    `New order via PC Builder website`,
    ``,
    `Path: ${kind}`,
    ``,
    summary,
  ];
  if (name) lines.push("", `Name: ${name}`);
  if (email) lines.push(`Email: ${email}`);
  if (notes) lines.push("", `Notes:`, notes);

  const subject = `${SUBJECT_PREFIX} — ${kind}${name ? ` (${name})` : ""}`;
  const body = lines.join("\n");

  const mailto = `mailto:${ORDERS_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  // Open the email client
  window.location.href = mailto;

  // Show the confirmation panel as well
  document.querySelectorAll(".panel").forEach((p) => p.hidden = true);
  const confirm = document.querySelector('.panel[data-panel="confirm"]');
  if (confirm) {
    confirm.hidden = false;
    confirm.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// ---------- Reset button ----------

document.querySelectorAll("[data-action='reset']").forEach((btn) => {
  btn.addEventListener("click", resetAll);
});
