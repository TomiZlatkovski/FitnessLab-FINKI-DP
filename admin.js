const adminLogin = document.querySelector("[data-admin-login]");
const adminDashboard = document.querySelector("[data-admin-dashboard]");

if (adminLogin && adminDashboard) {
  const loginForm = document.querySelector("[data-admin-auth]");
  const loginStatus = loginForm.querySelector("[data-admin-status]");
  const trainerForm = document.querySelector("[data-trainer-form]");
  const trainerFormTitle = adminDashboard.querySelector("[data-trainer-form-title]");
  const trainerStatus = trainerForm.querySelector("[data-trainer-status]");
  const photoPreview = trainerForm.querySelector("[data-photo-preview]");
  const photoUrlField = trainerForm.elements.photo;
  const photoFileField = trainerForm.elements.photoFile;
  const trainerList = document.querySelector("[data-admin-days]");
  const bookingsList = document.querySelector("[data-booking-list]");
  const bookingsStatus = document.createElement("p");
  const state = { password: "", trainers: [] };
  const weekdays = [
    ["Sunday", "Недела"], ["Monday", "Понеделник"], ["Tuesday", "Вторник"],
    ["Wednesday", "Среда"], ["Thursday", "Четврток"], ["Friday", "Петок"], ["Saturday", "Сабота"]
  ];
  const locale = () => document.documentElement.lang === "mk" ? 1 : 0;
  let photoPreviewObjectUrl = "";

  function showStatus(target, message, error = false) {
    target.textContent = message;
    target.classList.toggle("fl-form-status-visible", Boolean(message));
    target.classList.toggle("fl-form-status-error", Boolean(error));
  }

  bookingsStatus.className = "fl-form-status";
  bookingsStatus.setAttribute("role", "status");
  bookingsStatus.setAttribute("aria-live", "polite");
  bookingsList.before(bookingsStatus);

  async function api(url, options = {}) {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json", "X-Admin-Password": state.password, ...(options.headers || {}) },
      ...options
    });
    const body = await response.json();
    if (!response.ok) {
      const error = new Error(body.error?.message || "Request failed.");
      error.status = response.status;
      throw error;
    }
    return body;
  }

  function renderAvailability() {
    const title = document.documentElement.lang === "mk" ? "Достапност" : "Availability";
    trainerList.replaceChildren();
    for (const [weekday, labels] of weekdays.entries()) {
      const row = document.createElement("div");
      row.className = "fl-admin-day";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = `day-${weekday}`;
      checkbox.value = String(weekday);
      checkbox.setAttribute("aria-label", `${title}: ${labels[locale()]}`);
      const label = document.createElement("label");
      const dayName = document.createElement("span");
      dayName.dataset.weekdayEn = labels[0];
      dayName.dataset.weekdayMk = labels[1];
      dayName.textContent = labels[locale()];
      label.append(checkbox, dayName);
      const start = document.createElement("select");
      const end = document.createElement("select");
      start.name = `start-${weekday}`;
      end.name = `end-${weekday}`;
      start.setAttribute("aria-label", `${labels[locale()]} ${document.documentElement.lang === "mk" ? "почеток" : "start"}`);
      end.setAttribute("aria-label", `${labels[locale()]} ${document.documentElement.lang === "mk" ? "крај" : "end"}`);
      for (let hour = 6; hour <= 22; hour += 1) {
        const option = new Option(`${String(hour).padStart(2, "0")}:00`, `${String(hour).padStart(2, "0")}:00`);
        start.add(option);
        end.add(option.cloneNode(true));
      }
      start.value = "09:00";
      end.value = "17:00";
      row.append(label, start, end);
      trainerList.append(row);
    }
  }

  function updateWeekdayLabels() {
    for (const label of trainerList.querySelectorAll("[data-weekday-en]")) {
      label.textContent = document.documentElement.lang === "mk" ? label.dataset.weekdayMk : label.dataset.weekdayEn;
    }
  }

  function updatePhotoPreview(photo) {
    const source = photo.trim();
    if (photoPreviewObjectUrl) {
      URL.revokeObjectURL(photoPreviewObjectUrl);
      photoPreviewObjectUrl = "";
    }
    photoPreview.hidden = !source;
    photoPreview.onerror = () => { photoPreview.hidden = true; };
    if (source) photoPreview.src = source;
    else photoPreview.removeAttribute("src");
  }

  function updatePhotoFilePreview(file) {
    updatePhotoPreview("");
    if (!file) return;
    photoPreviewObjectUrl = URL.createObjectURL(file);
    photoPreview.src = photoPreviewObjectUrl;
    photoPreview.hidden = false;
  }

  function readPhotoFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result));
      reader.addEventListener("error", () => reject(new Error("The selected photo could not be read.")));
      reader.readAsDataURL(file);
    });
  }

  function resetForm() {
    trainerForm.reset();
    updatePhotoPreview("");
    trainerForm.elements.id.value = "";
    trainerForm.elements.active.checked = true;
    trainerFormTitle.textContent = document.documentElement.lang === "mk" ? "Додај тренер" : "Add a trainer";
    trainerForm.querySelector("[data-trainer-submit]").textContent = document.documentElement.lang === "mk" ? "Зачувај тренер" : "Save trainer";
    trainerForm.querySelector("[data-delete-trainer]").hidden = true;
    for (let weekday = 0; weekday <= 6; weekday += 1) {
      trainerForm.elements[`start-${weekday}`].value = "09:00";
      trainerForm.elements[`end-${weekday}`].value = "17:00";
      trainerForm.elements[`day-${weekday}`].checked = false;
    }
    showStatus(trainerStatus, "");
  }

  function fillForm(trainer) {
    resetForm();
    trainerForm.elements.id.value = trainer.id;
    trainerForm.elements.name.value = trainer.name;
    trainerForm.elements.specialty.value = trainer.specialty;
    trainerForm.elements.bio.value = trainer.bio;
    trainerForm.elements.photo.value = trainer.photo || "";
    updatePhotoPreview(trainer.photo || "");
    trainerForm.elements.active.checked = trainer.active;
    trainerFormTitle.textContent = document.documentElement.lang === "mk" ? "Измени тренер" : "Edit trainer";
    trainerForm.querySelector("[data-trainer-submit]").textContent = document.documentElement.lang === "mk" ? "Зачувај измени" : "Save changes";
    trainerForm.querySelector("[data-delete-trainer]").hidden = !trainer.active;
    for (const item of trainer.availability) {
      trainerForm.elements[`day-${item.weekday}`].checked = true;
      trainerForm.elements[`start-${item.weekday}`].value = item.start;
      trainerForm.elements[`end-${item.weekday}`].value = item.end;
    }
  }

  async function loadTrainers() {
    const { trainers } = await api("/api/admin/trainers");
    state.trainers = trainers;
    const existing = adminDashboard.querySelector("[data-existing-trainers]");
    existing?.remove();
    if (trainers.length) {
      const list = document.createElement("div");
      list.className = "fl-admin-trainer-list";
      list.dataset.existingTrainers = "";
      for (const trainer of trainers) {
        const row = document.createElement("div");
        row.className = "fl-admin-trainer";
        const label = document.createElement("span");
        label.textContent = `${trainer.name} · ${trainer.specialty}${trainer.active ? "" : " · " + (document.documentElement.lang === "mk" ? "неактивен" : "inactive")}`;
        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "fl-button";
        edit.textContent = document.documentElement.lang === "mk" ? "Измени" : "Edit";
        edit.addEventListener("click", () => fillForm(trainer));
        row.append(label, edit);
        list.append(row);
      }
      trainerForm.before(list);
    }
  }

  async function loadBookings() {
    const { bookings } = await api("/api/admin/bookings");
    bookingsList.replaceChildren();
    if (!bookings.length) {
      const empty = document.createElement("p");
      empty.className = "fl-note";
      empty.textContent = document.documentElement.lang === "mk" ? "Нема претстојни термини." : "There are no upcoming appointments.";
      bookingsList.append(empty);
      return;
    }
    for (const booking of bookings) {
      const card = document.createElement("article");
      card.className = "fl-admin-booking";
      const heading = document.createElement("h3");
      heading.textContent = `${booking.date} · ${booking.time} · ${booking.trainerName}`;
      const details = document.createElement("p");
      details.textContent = `${booking.clientName} · ${booking.clientEmail}${booking.clientPhone ? ` · ${booking.clientPhone}` : ""}`;
      card.append(heading, details);
      if (booking.message) {
        const message = document.createElement("p");
        message.textContent = booking.message;
        card.append(message);
      }
      if (booking.status === "cancelled") {
        const cancelled = document.createElement("span");
        cancelled.className = "fl-kicker";
        cancelled.textContent = document.documentElement.lang === "mk" ? "ОТКАЖАНО" : "CANCELLED";
        card.append(cancelled);
      } else {
        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.className = "fl-button";
        cancel.textContent = document.documentElement.lang === "mk" ? "Откажи термин" : "Cancel appointment";
        cancel.addEventListener("click", async () => {
          if (!confirm(document.documentElement.lang === "mk" ? "Да го откажам овој термин?" : "Cancel this appointment?")) return;
          try {
            await api(`/api/admin/bookings/${booking.id}/cancel`, { method: "POST", body: "{}" });
            await loadBookings();
            showStatus(bookingsStatus, "");
          } catch (error) {
            showStatus(bookingsStatus, error instanceof Error ? error.message : String(error), true);
          }
        });
        card.append(cancel);
      }
      bookingsList.append(card);
    }
  }

  async function showDashboard() {
    await Promise.all([loadTrainers(), loadBookings()]);
    adminLogin.hidden = true;
    adminDashboard.hidden = false;
    resetForm();
  }

  renderAvailability();
  document.querySelector("[data-new-trainer]").addEventListener("click", resetForm);
  document.querySelector("[data-refresh-bookings]").addEventListener("click", async () => {
    try {
      await loadBookings();
      showStatus(bookingsStatus, "");
    } catch (error) {
      showStatus(bookingsStatus, error instanceof Error ? error.message : String(error), true);
    }
  });
  document.querySelector("[data-admin-logout]").addEventListener("click", () => {
    state.password = "";
    adminDashboard.hidden = true;
    adminLogin.hidden = false;
    loginForm.reset();
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.password = loginForm.elements.password.value;
    try {
      await showDashboard();
      showStatus(loginStatus, "");
      loginForm.reset();
    } catch (error) {
      state.password = "";
      adminDashboard.hidden = true;
      adminLogin.hidden = false;
      const message = error instanceof Error ? error.message : String(error);
      showStatus(loginStatus, error instanceof Error && error.status === 401
        ? (document.documentElement.lang === "mk" ? "Погрешна администраторска лозинка." : "The admin password is incorrect.")
        : `${document.documentElement.lang === "mk" ? "Не може да се вчита администраторскиот панел." : "Couldn't load the admin dashboard."} ${message}`, true);
    }
  });

  trainerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!trainerForm.reportValidity()) return;
    const schedule = [];
    for (let weekday = 0; weekday <= 6; weekday += 1) {
      if (trainerForm.elements[`day-${weekday}`].checked) {
        schedule.push({
          weekday,
          start: trainerForm.elements[`start-${weekday}`].value,
          end: trainerForm.elements[`end-${weekday}`].value
        });
      }
    }
    const id = trainerForm.elements.id.value;
    const save = trainerForm.querySelector("[data-trainer-submit]");
    save.disabled = true;
    try {
      const data = {
        name: trainerForm.elements.name.value,
        specialty: trainerForm.elements.specialty.value,
        bio: trainerForm.elements.bio.value,
        photo: trainerForm.elements.photo.value,
        photoUpload: photoFileField.files[0] ? await readPhotoFile(photoFileField.files[0]) : "",
        active: trainerForm.elements.active.checked,
        schedule
      };
      await api(id ? `/api/admin/trainers/${id}` : "/api/admin/trainers", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(data)
      });
      await loadTrainers();
      resetForm();
      showStatus(trainerStatus, document.documentElement.lang === "mk" ? "Тренерот и достапноста се зачувани." : "Trainer and availability saved.");
    } catch (error) {
      showStatus(trainerStatus, error.message, true);
    } finally {
      save.disabled = false;
    }
  });

  photoUrlField.addEventListener("input", (event) => {
    if (photoFileField.files.length) photoFileField.value = "";
    updatePhotoPreview(event.target.value);
  });
  photoFileField.addEventListener("change", () => {
    const file = photoFileField.files[0];
    if (file && (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 1_500_000)) {
      photoFileField.value = "";
      updatePhotoPreview(photoUrlField.value);
      showStatus(trainerStatus, document.documentElement.lang === "mk"
        ? "Изберете JPEG, PNG или WebP слика до 1,5 MB."
        : "Choose a JPEG, PNG, or WebP photo up to 1.5 MB.", true);
      return;
    }
    if (file) photoUrlField.value = "";
    updatePhotoFilePreview(file);
    showStatus(trainerStatus, "");
  });

  trainerForm.querySelector("[data-delete-trainer]").addEventListener("click", async () => {
    const id = trainerForm.elements.id.value;
    if (!id || !confirm(document.documentElement.lang === "mk" ? "Да го деактивирам тренерот?" : "Deactivate this trainer?")) return;
    try {
      await api(`/api/admin/trainers/${id}`, { method: "DELETE" });
      await loadTrainers();
      resetForm();
    } catch (error) {
      showStatus(trainerStatus, error.message, true);
    }
  });

  window.addEventListener("fitnesslab-language-change", updateWeekdayLabels);
}
