const accountAuth = document.querySelector("[data-account-auth]");

if (accountAuth) {
  const accountDashboard = document.querySelector("[data-account-dashboard]");
  const accountStatus = document.querySelector("[data-account-status]");
  const bookingList = document.querySelector("[data-account-bookings]");
  const greeting = document.querySelector("[data-account-greeting]");
  const emailText = document.querySelector("[data-account-email]");
  const language = () => document.documentElement.lang === "mk" ? 1 : 0;
  const text = (english, macedonian) => language() ? macedonian : english;
  const macedonianMonths = ["јануари", "февруари", "март", "април", "мај", "јуни", "јули", "август", "септември", "октомври", "ноември", "декември"];
  let bookings = [];
  let currentUser = null;

  async function api(path, options = {}) {
    const response = await fetch(path, {
      headers: options.body ? { "Content-Type": "application/json" } : {},
      ...options
    });
    const body = await response.json();
    if (!response.ok) {
      const error = new Error(body.error?.message || text("Request failed.", "Барањето не успеа."));
      error.code = body.error?.code;
      throw error;
    }
    return body;
  }

  function setStatus(message, error = false) {
    accountStatus.textContent = message;
    accountStatus.classList.toggle("fl-form-status-visible", Boolean(message));
    accountStatus.classList.toggle("fl-form-status-error", error);
  }

  function formatDate(value) {
    if (language()) {
      const [year, month, day] = value.split("-").map(Number);
      return `${day} ${macedonianMonths[month - 1]} ${year}`;
    }
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "long",
      timeZone: "Europe/Skopje"
    }).format(new Date(`${value}T12:00:00Z`));
  }

  function displayAccountError(error) {
    if (!language()) return error.message;
    return ({
      account_exists: "Сметка со оваа е-пошта веќе постои. Најавете се.",
      authentication_required: "Најавете се за да ја видите сметката.",
      invalid_account_details: "Внесете валидна е-пошта и лозинка од 12 до 128 знаци.",
      invalid_credentials: "Е-поштата или лозинката не се точни.",
      rate_limited: "Премногу обиди. Почекајте 15 минути и обидете се повторно."
    })[error.code] || "Не успеавме да ја обработиме сметката. Проверете ја врската и обидете се повторно.";
  }

  function renderAccountHeader() {
    if (!currentUser) return;
    greeting.textContent = text(`Welcome, ${currentUser.name}.`, `Добредојдовте, ${currentUser.name}.`);
    emailText.textContent = currentUser.email;
  }

  function renderBookings() {
    bookingList.replaceChildren();
    if (!bookings.length) {
      const empty = document.createElement("p");
      empty.className = "fl-note";
      empty.textContent = text(
        "No bookings are linked to your account yet. Sign in before booking to see future sessions here.",
        "Сè уште нема закажувања поврзани со вашата сметка. Најавете се пред закажување за тука да ги гледате термините."
      );
      bookingList.append(empty);
      return;
    }
    for (const booking of bookings) {
      const item = document.createElement("article");
      item.className = "fl-account-booking";
      const heading = document.createElement("h4");
      heading.textContent = booking.trainerName;
      const date = formatDate(booking.date);
      const detail = document.createElement("p");
      detail.textContent = `${date} · ${booking.time} · ${booking.duration} ${text("minutes", "минути")}`;
      const state = document.createElement("span");
      state.className = `fl-account-booking-state${booking.upcoming ? " fl-account-booking-upcoming" : ""}`;
      state.textContent = booking.status === "cancelled"
        ? text("Cancelled", "Откажан")
        : booking.upcoming ? text("Upcoming", "Претстои") : text("Completed", "Завршен");
      item.append(heading, detail, state);
      bookingList.append(item);
    }
  }

  function showAccount(user, nextBookings) {
    currentUser = user;
    accountAuth.hidden = true;
    accountDashboard.hidden = false;
    renderAccountHeader();
    bookings = nextBookings;
    renderBookings();
  }

  async function loadAccount() {
    try {
      const { user } = await api("/api/auth/me");
      if (!user) {
        accountAuth.hidden = false;
        accountDashboard.hidden = true;
        return;
      }
      const data = await api("/api/account");
      showAccount(data.user, data.bookings);
      setStatus("");
    } catch (error) {
      if (error.code === "authentication_required") {
        accountAuth.hidden = false;
        accountDashboard.hidden = true;
        return;
      }
      setStatus(displayAccountError(error), true);
    }
  }

  function redirectAfterSignIn() {
    const destination = new URLSearchParams(location.search).get("return");
    if (destination === "progress.html" || destination === "trainers.html") {
      location.replace(destination);
    }
  }

  for (const [selector, endpoint] of [
    ["[data-account-login]", "/api/auth/login"],
    ["[data-account-register]", "/api/auth/register"]
  ]) {
    const form = document.querySelector(selector);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const submit = form.querySelector("[type=submit]");
      submit.disabled = true;
      setStatus(text("Connecting to your account…", "Поврзување со сметката…"));
      try {
        const { user } = await api(endpoint, {
          method: "POST",
          body: JSON.stringify(Object.fromEntries(new FormData(form)))
        });
        form.reset();
        window.dispatchEvent(new Event("fitnesslab-auth-change"));
        redirectAfterSignIn();
        await loadAccount();
        setStatus(text(`Signed in as ${user.email}.`, `Најавени сте како ${user.email}.`));
      } catch (error) {
        setStatus(displayAccountError(error), true);
      } finally {
        submit.disabled = false;
      }
    });
  }

  document.querySelector("[data-account-logout]").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await api("/api/auth/logout", { method: "POST", body: "{}" });
      window.dispatchEvent(new Event("fitnesslab-auth-change"));
      accountDashboard.hidden = true;
      accountAuth.hidden = false;
      currentUser = null;
      bookings = [];
      setStatus(text("You have signed out.", "Одјавени сте."));
    } catch (error) {
      setStatus(displayAccountError(error), true);
    } finally {
      button.disabled = false;
    }
  });

  window.addEventListener("fitnesslab-language-change", () => {
    renderAccountHeader();
    renderBookings();
  });
  loadAccount();
}
