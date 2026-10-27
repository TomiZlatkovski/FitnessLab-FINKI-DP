const bookingForm = document.querySelector("[data-booking-form]");

if (bookingForm) {
  const trainerSelect = bookingForm.elements.trainerId;
  const dateField = bookingForm.elements.date;
  const timeSelect = bookingForm.elements.time;
  const status = bookingForm.querySelector("[data-booking-status]");
  const trainerList = document.querySelector("[data-trainer-list]");
  const trainerListStatus = document.querySelector("[data-trainer-list-status]");
  const submitButton = bookingForm.querySelector("[type=submit]");
  const goalForm = document.querySelector("[data-goal-finder]");
  const goalMatchStatus = document.querySelector("[data-goal-match-status]");
  const bookingConfirmation = document.querySelector("[data-booking-confirmation]");
  const confirmationDetails = document.querySelector("[data-confirmation-details]");
  const confirmationReference = document.querySelector("[data-confirmation-reference]");
  const accountNote = document.querySelector("[data-booking-account-note]");
  const accountConfirmation = document.querySelector("[data-booking-account-confirmation]");
  const bookingName = bookingForm.elements.name;
  const bookingEmail = bookingForm.elements.email;
  let selectedGoal = new URLSearchParams(location.search).get("goal") || "";
  const weekdayNames = [
    ["Sunday", "Недела"], ["Monday", "Понеделник"], ["Tuesday", "Вторник"],
    ["Wednesday", "Среда"], ["Thursday", "Четврток"], ["Friday", "Петок"], ["Saturday", "Сабота"]
  ];
  const daysBetween = (first, second) => Math.round((Date.parse(`${second}T00:00:00Z`) - Date.parse(`${first}T00:00:00Z`)) / 86_400_000);
  const dateInSkopje = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Skopje",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
  const maxDate = new Date(Date.parse(`${dateInSkopje}T00:00:00Z`) + 60 * 86_400_000).toISOString().slice(0, 10);
  dateField.min = dateInSkopje;
  dateField.max = maxDate;

  function say(message, error = false) {
    status.textContent = message;
    status.classList.toggle("fl-form-status-visible", Boolean(message));
    status.classList.toggle("fl-form-status-error", error);
  }

  function applyGoalMatch() {
    if (!goalForm || !goalMatchStatus || !selectedGoal) return;
    const goal = goalForm.elements.goal.value;
    const terms = {
      strength: ["strength", "hypertrophy", "performance", "personal"],
      aerobic: ["conditioning", "vo₂", "vo2", "aerobic"],
      movement: ["movement", "mobility"],
      general: []
    }[goal] || [];
    let matches = 0;
    for (const card of trainerList.querySelectorAll(".fl-trainer-card")) {
      const trainer = window.fitnesslabTrainers?.find((item) => item.name === card.querySelector("h3")?.textContent);
      const profile = trainer ? `${trainer.specialty} ${trainer.bio}`.toLowerCase() : "";
      const matched = goal === "general" || terms.some((term) => profile.includes(term));
      card.hidden = !matched;
      if (matched) matches += 1;
    }
    goalMatchStatus.textContent = matches
      ? goal === "general"
        ? (document.documentElement.lang === "mk" ? "Еве ги сите тренери. Разговорот може да ви помогне да изберете почетна точка." : "Here are all coaches. A conversation can help you choose a starting point.")
        : (document.documentElement.lang === "mk" ? "Подолу се истакнати тренерите што одговараат на избраната цел. Изберете тренер за да ги видите опциите за закажување." : "Coaches matching your selected focus are highlighted below. Choose a coach to view booking options.")
      : (document.documentElement.lang === "mk" ? "Сè уште нема тренер наведен за оваа цел. Разгледајте ги сите или контактирајте го тимот." : "No coach is listed for this focus yet. View everyone or contact the team.");
    goalMatchStatus.classList.add("fl-form-status-visible");
  }

  async function api(path, options = {}) {
    const response = await fetch(path, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });
    const body = await response.json();
    if (!response.ok) {
      const error = new Error(body.error?.message || "Request failed.");
      error.code = body.error?.code;
      throw error;
    }
    return body;
  }

  async function updateBookingAccount() {
    try {
      const { user } = await api("/api/auth/me");
      bookingName.readOnly = Boolean(user);
      bookingEmail.readOnly = Boolean(user);
      if (user) {
        bookingName.value = user.name;
        bookingEmail.value = user.email;
        if (accountNote) {
          accountNote.textContent = document.documentElement.lang === "mk"
            ? "Ова закажување ќе биде поврзано со вашата сметка."
            : "This booking will be linked to your account.";
        }
      }
    } catch (error) {
      if (accountNote) {
        accountNote.textContent = document.documentElement.lang === "mk"
          ? "Не може да се провери сметката. Обидете се повторно пред да закажете."
          : `Couldn't check account status: ${error.message}`;
        accountNote.classList.add("fl-form-status-error");
      }
    }
  }

  function displayApiError(error) {
    const messages = document.documentElement.lang === "mk"
      ? {
          slot_taken: "Овој термин штотуку е закажан. Изберете друг термин.",
          slot_unavailable: "Тренерот нема достапност за овој термин.",
          invalid_date_or_trainer: "Изберете тренер и датум во следните 60 дена.",
          rate_limited: "Почекајте неколку минути пред повторно да се обидете."
        }
      : {
          slot_taken: "That time was just booked. Please choose another slot.",
          slot_unavailable: "This trainer is not available for that session.",
          invalid_date_or_trainer: "Choose a trainer and a date within the next 60 days.",
          rate_limited: "Please wait a few minutes before trying again."
        };
    return messages[error.code] || (document.documentElement.lang === "mk"
      ? "Не успеавме да го завршиме барањето. Проверете ја врската или контактирајте го FitnessLab."
      : "We couldn't complete the request. Check your connection or contact FitnessLab.");
  }

  function renderTrainers(trainers) {
    trainerList.replaceChildren();
    if (!trainers.length) {
      trainerListStatus.textContent = document.documentElement.lang === "mk"
        ? "Термините ќе бидат достапни откако FitnessLab ќе ги додаде тренерите и нивната неделна достапност."
        : "Appointments will be available after FitnessLab adds its trainers and weekly availability.";
      return;
    }
    trainerListStatus.textContent = "";
    for (const [index, trainer] of trainers.entries()) {
      const card = document.createElement("article");
      card.className = `fl-card fl-trainer-card${index % 3 === 1 ? " fl-card-dark" : index % 3 === 2 ? " fl-card-lime" : ""}`;
      if (trainer.photo) {
        const photo = document.createElement("img");
        photo.className = "fl-trainer-photo";
        photo.src = trainer.photo;
        photo.alt = trainer.name;
        photo.loading = "lazy";
        photo.decoding = "async";
        photo.referrerPolicy = "no-referrer";
        photo.addEventListener("error", () => photo.remove(), { once: true });
        card.append(photo);
      }
      const specialty = document.createElement("span");
      specialty.className = "fl-kicker";
      specialty.textContent = trainer.specialty;
      const name = document.createElement("h3");
      name.textContent = trainer.name;
      card.append(specialty, name);
      if (trainer.bio) {
        const bio = document.createElement("p");
        bio.textContent = trainer.bio;
        card.append(bio);
      }
      const schedule = document.createElement("div");
      schedule.className = "fl-trainer-schedule";
      for (const hours of trainer.availability) {
        const item = document.createElement("span");
        item.textContent = `${weekdayNames[hours.weekday][document.documentElement.lang === "mk" ? 1 : 0]} · ${hours.start}–${hours.end}`;
        schedule.append(item);
      }
      card.append(schedule);
      const book = document.createElement("button");
      book.type = "button";
      book.className = "fl-button fl-button-dark";
      book.textContent = document.documentElement.lang === "mk" ? "Закажи тренинг" : "Book this trainer";
      book.addEventListener("click", () => {
        trainerSelect.value = trainer.id;
        trainerSelect.dispatchEvent(new Event("change"));
        document.querySelector("#book-session").scrollIntoView({ behavior: "smooth" });
      });
      card.append(book);
      trainerList.append(card);
    }
  }

  function clearSlots(placeholder) {
    timeSelect.replaceChildren(new Option(placeholder, ""));
    timeSelect.disabled = true;
    submitButton.disabled = true;
  }

  async function loadSlots() {
    clearSlots(document.documentElement.lang === "mk" ? "Изберете термин" : "Choose a time");
    say("");
    if (!trainerSelect.value || !dateField.value) return;
    try {
      const { slots } = await api(`/api/availability?trainer=${encodeURIComponent(trainerSelect.value)}&date=${encodeURIComponent(dateField.value)}`);
      if (!slots.length) {
        clearSlots(document.documentElement.lang === "mk" ? "Нема слободни термини" : "No available times");
        return;
      }
      for (const slot of slots) timeSelect.add(new Option(slot, slot));
      timeSelect.disabled = false;
      submitButton.disabled = false;
    } catch (error) {
      clearSlots(document.documentElement.lang === "mk" ? "Не може да се вчитаат термините" : "Couldn't load times");
      say(displayApiError(error), true);
    }
  }

  async function loadTrainers() {
    try {
      const { trainers } = await api("/api/trainers");
      window.fitnesslabTrainers = trainers;
      if (goalForm) {
        const requestedGoal = new URLSearchParams(location.search).get("goal");
        if (requestedGoal && [...goalForm.elements.goal.options].some((option) => option.value === requestedGoal)) {
          goalForm.elements.goal.value = requestedGoal;
          selectedGoal = requestedGoal;
        }
      }
      trainerSelect.replaceChildren(new Option(
        document.documentElement.lang === "mk" ? "Изберете тренер" : "Choose a trainer",
        ""
      ));
      for (const trainer of trainers) {
        const option = new Option(`${trainer.name} — ${trainer.specialty}`, trainer.id);
        trainerSelect.add(option);
      }
      renderTrainers(trainers);
      applyGoalMatch();
      if (trainers.length) {
        trainerSelect.disabled = false;
        dateField.disabled = false;
        trainerSelect.value = new URLSearchParams(location.search).get("trainer") || "";
      } else {
        trainerSelect.disabled = true;
        dateField.disabled = true;
        say(document.documentElement.lang === "mk"
          ? "Термините ќе бидат достапни откако FitnessLab ќе ги додаде тренерите и нивната неделна достапност."
          : "Appointments will be available after FitnessLab adds its trainers and weekly availability.");
      }
    } catch (error) {
      trainerSelect.disabled = true;
      dateField.disabled = true;
      trainerList.replaceChildren();
      trainerListStatus.textContent = document.documentElement.lang === "mk"
        ? "Не може да се вчитаат тренерите."
        : "Couldn't load trainers.";
      say(document.documentElement.lang === "mk"
        ? "Системот за закажување не е достапен. Обидете се подоцна или јавете се на +389 70 214 761."
        : "The booking service is unavailable. Try again later or call +389 70 214 761.", true);
    }
  }

  trainerSelect.addEventListener("change", loadSlots);
  goalForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    selectedGoal = goalForm.elements.goal.value;
    applyGoalMatch();
    trainerList.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  dateField.addEventListener("change", loadSlots);
  timeSelect.addEventListener("change", () => { submitButton.disabled = !timeSelect.value; });
  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!bookingForm.reportValidity()) return;
    if (daysBetween(dateInSkopje, dateField.value) < 0 || daysBetween(dateInSkopje, dateField.value) > 60) {
      say(document.documentElement.lang === "mk" ? "Изберете датум во следните 60 дена." : "Choose a date within the next 60 days.", true);
      return;
    }

    submitButton.disabled = true;
    if (bookingConfirmation) bookingConfirmation.hidden = true;
    say(document.documentElement.lang === "mk" ? "Се зачувува терминот…" : "Saving your appointment…");
    const data = Object.fromEntries(new FormData(bookingForm));
    data.language = document.documentElement.lang;
    try {
      const { booking } = await api("/api/bookings", { method: "POST", body: JSON.stringify(data) });
      const coach = window.fitnesslabTrainers?.find((trainer) => trainer.id === data.trainerId);
      if (bookingConfirmation && booking) {
        const date = new Intl.DateTimeFormat(document.documentElement.lang === "mk" ? "mk-MK" : "en-GB", {
          dateStyle: "long",
          timeZone: "Europe/Skopje"
        }).format(new Date(`${booking.date}T12:00:00`));
        confirmationDetails.textContent = `${coach?.name || data.trainerId} · ${date} · ${booking.time}`;
        confirmationReference.textContent = `${document.documentElement.lang === "mk" ? "Референца за термин" : "Booking reference"}: ${booking.id}`;
        if (accountConfirmation) accountConfirmation.hidden = !booking.linkedToAccount;
        bookingConfirmation.hidden = false;
        bookingConfirmation.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      bookingForm.reset();
      await updateBookingAccount();
      trainerSelect.value = data.trainerId;
      dateField.value = data.date;
      await loadSlots();
      say(document.documentElement.lang === "mk"
        ? "Терминот е закажан и зачуван. За промена или откажување јавете се на +389 70 214 761."
        : "Your appointment is booked and saved. To change or cancel it, call +389 70 214 761.");
    } catch (error) {
      await loadSlots();
      say(displayApiError(error), true);
    } finally {
      submitButton.disabled = !timeSelect.value;
    }
  });
  document.querySelector("[data-book-another]")?.addEventListener("click", () => {
    if (bookingConfirmation) bookingConfirmation.hidden = true;
    bookingForm.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  window.addEventListener("fitnesslab-language-change", () => {
    if (!trainerSelect.value) trainerSelect.options[0].textContent = document.documentElement.lang === "mk" ? "Изберете тренер" : "Choose a trainer";
    if (!timeSelect.value && timeSelect.options[0]) {
      timeSelect.options[0].textContent = document.documentElement.lang === "mk" ? "Изберете термин" : "Choose a time";
    }
    trainerList.querySelectorAll(".fl-trainer-card").forEach((card, index) => {
      const trainer = window.fitnesslabTrainers?.[index];
      if (trainer) card.querySelector("button").textContent = document.documentElement.lang === "mk" ? "Закажи тренинг" : "Book this trainer";
    });
    if (window.fitnesslabTrainers) renderTrainers(window.fitnesslabTrainers);
    applyGoalMatch();
    if (trainerSelect.value && dateField.value) loadSlots();
    updateBookingAccount();
  });

  loadTrainers();
  updateBookingAccount();
}
