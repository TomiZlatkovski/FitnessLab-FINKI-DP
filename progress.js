const progressForm = document.querySelector("[data-progress-form]");

if (progressForm) {
  const legacyStorageKey = "fitnesslab-progress-log-v1";
  const status = document.querySelector("[data-progress-status]");
  const summary = document.querySelector("[data-progress-summary]");
  const entries = document.querySelector("[data-progress-entries]");
  const comparison = document.querySelector("[data-progress-comparison]");
  const accountRequired = document.querySelector("[data-progress-auth-required]");
  const accountContent = document.querySelector("[data-progress-account-content]");
  const focusLabels = {
    strength: ["Strength & muscle", "Сила и мускули"],
    aerobic: ["Aerobic fitness", "Аеробна подготвеност"],
    movement: ["Movement & mobility", "Движење и подвижност"],
    general: ["General consistency", "Општа доследност"]
  };
  const macedonianMonths = ["јануари", "февруари", "март", "април", "мај", "јуни", "јули", "август", "септември", "октомври", "ноември", "декември"];
  const language = () => document.documentElement.lang === "mk" ? 1 : 0;
  const text = (english, macedonian) => language() ? macedonian : english;
  const dateField = progressForm.elements.date;
  const todayInSkopje = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Skopje",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
  const todayDate = new Date(`${todayInSkopje}T12:00:00Z`);
  const daysSinceMonday = (todayDate.getUTCDay() + 6) % 7;
  dateField.value = new Date(todayDate.getTime() - daysSinceMonday * 86_400_000).toISOString().slice(0, 10);
  dateField.max = todayInSkopje;
  let items = [];
  let authenticated = false;

  function setStatus(message, error = false) {
    status.textContent = message;
    status.classList.toggle("fl-form-status-visible", Boolean(message));
    status.classList.toggle("fl-form-status-error", error);
  }

  async function api(path, options = {}) {
    const response = await fetch(path, {
      headers: options.body ? { "Content-Type": "application/json" } : {},
      ...options
    });
    const body = await response.json();
    if (!response.ok) {
      const error = new Error(body.error?.message || text("Request failed.", "Барањето не успеа."));
      error.code = body.error?.code;
      if (language()) {
        error.message = ({
          authentication_required: "Најавете се за да го користите дневникот за напредок.",
          invalid_progress_entries: "Еден или повеќе записи за напредок не се валидни.",
          rate_limited: "Премногу обиди. Почекајте и обидете се повторно."
        })[error.code] || "Барањето не успеа. Проверете ја врската и обидете се повторно.";
      }
      throw error;
    }
    return body;
  }

  function validateEntries(value) {
    if (!Array.isArray(value) || value.some((entry) =>
      typeof entry.id !== "string" || typeof entry.date !== "string" || !focusLabels[entry.focus]
      || !Number.isInteger(entry.sessions) || entry.sessions < 0 || entry.sessions > 14
      || typeof entry.note !== "string" || typeof entry.measureName !== "string"
      || !(entry.measureValue === null || (typeof entry.measureValue === "number" && Number.isFinite(entry.measureValue)))
      || typeof entry.measureUnit !== "string")) {
      throw new Error(text(
        "The saved log has an unexpected format. It was left unchanged.",
        "Зачуваниот дневник е во неочекуван формат. Не е променет."
      ));
    }
    return value;
  }

  function formatDate(value) {
    if (language()) {
      const [year, month, day] = value.split("-").map(Number);
      return `${day} ${macedonianMonths[month - 1]} ${year}`;
    }
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC"
    }).format(new Date(`${value}T12:00:00Z`));
  }

  function render() {
    const orderedItems = [...items].sort((a, b) => b.date.localeCompare(a.date));
    const totalSessions = orderedItems.reduce((total, entry) => total + entry.sessions, 0);
    summary.replaceChildren();
    for (const [label, value] of [
      [text("Check-ins", "Записи"), orderedItems.length],
      [text("Sessions logged", "Забележани тренинзи"), totalSessions]
    ]) {
      const card = document.createElement("article");
      card.className = "fl-progress-stat";
      const number = document.createElement("strong");
      number.textContent = String(value);
      const caption = document.createElement("span");
      caption.textContent = label;
      card.append(number, caption);
      summary.append(card);
    }

    entries.replaceChildren();
    const datedEntries = [...orderedItems].sort((a, b) => a.date.localeCompare(b.date));
    const latestMeasure = [...datedEntries].reverse().find((entry) => entry.measureName && entry.measureValue !== null);
    const previousMeasure = latestMeasure && [...datedEntries].reverse().find((entry) =>
      entry.measureName.toLowerCase() === latestMeasure.measureName.toLowerCase()
      && entry.measureUnit.toLowerCase() === latestMeasure.measureUnit.toLowerCase()
      && entry.measureValue !== null && entry.id !== latestMeasure.id);
    if (latestMeasure && previousMeasure) {
      const difference = latestMeasure.measureValue - previousMeasure.measureValue;
      const sign = difference > 0 ? "+" : "";
      const unit = latestMeasure.measureUnit || previousMeasure.measureUnit;
      comparison.textContent = text(
        `“${latestMeasure.measureName}” changed by ${sign}${difference}${unit ? ` ${unit}` : ""} between ${formatDate(previousMeasure.date)} and ${formatDate(latestMeasure.date)}. This is a record to discuss—not a score or diagnosis.`,
        `„${latestMeasure.measureName}“ се промени за ${sign}${difference}${unit ? ` ${unit}` : ""} помеѓу ${formatDate(previousMeasure.date)} и ${formatDate(latestMeasure.date)}. Ова е евиденција за разговор, а не оценка или дијагноза.`
      );
    } else {
      comparison.textContent = orderedItems.length
        ? text("Your log is a personal record, not a score. Add the same optional milestone again later to compare your notes.", "Дневникот е лична евиденција, а не оценка. Подоцна повторно внесете го истото достигнување за да ги споредите белешките.")
        : text("Add a check-in to start noticing your training pattern. You can delete entries or clear the log at any time.", "Додајте запис за да почнете да ги забележувате навиките во тренингот. Можете да ги избришете записите или целиот дневник во секое време.");
    }
    if (!orderedItems.length) {
      const empty = document.createElement("p");
      empty.className = "fl-note";
      empty.textContent = text("No check-ins yet. Your first small note is a useful start.", "Сè уште нема записи. И мала белешка е добар почеток.");
      entries.append(empty);
      return;
    }

    for (const entry of orderedItems) {
      const card = document.createElement("article");
      card.className = "fl-progress-entry";
      const header = document.createElement("div");
      header.className = "fl-progress-entry-head";
      const title = document.createElement("h3");
      title.textContent = formatDate(entry.date);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "fl-progress-delete";
      remove.textContent = text("Delete", "Избриши");
      remove.setAttribute("aria-label", `${text("Delete check-in from", "Избриши запис од")} ${formatDate(entry.date)}`);
      remove.addEventListener("click", async () => {
        remove.disabled = true;
        try {
          await api(`/api/account/progress/${encodeURIComponent(entry.id)}`, { method: "DELETE" });
          items = items.filter((item) => item.id !== entry.id);
          setStatus("");
          render();
        } catch (error) {
          remove.disabled = false;
          setStatus(error.message, true);
        }
      });
      header.append(title, remove);
      const details = document.createElement("p");
      details.textContent = `${focusLabels[entry.focus][language()]} · ${entry.sessions} ${text("sessions", "тренинзи")}`;
      card.append(header, details);
      if (entry.measureName && entry.measureValue !== null) {
        const measure = document.createElement("p");
        measure.className = "fl-progress-measure-result";
        measure.textContent = `${entry.measureName}: ${entry.measureValue}${entry.measureUnit ? ` ${entry.measureUnit}` : ""}`;
        card.append(measure);
      }
      if (entry.note) {
        const note = document.createElement("p");
        note.textContent = entry.note;
        card.append(note);
      }
      entries.append(card);
    }
  }

  async function importLegacyEntries() {
    let saved;
    try {
      saved = localStorage.getItem(legacyStorageKey);
    } catch (error) {
      setStatus(error.message || text("Browser storage could not be checked for an older log.", "Не може да се провери складиштето на прелистувачот за постар дневник."), true);
      return;
    }
    if (!saved) return;
    let legacyEntries;
    try {
      legacyEntries = validateEntries(JSON.parse(saved));
    } catch (error) {
      setStatus(error.message, true);
      return;
    }
    if (!legacyEntries.length) {
      try {
        localStorage.removeItem(legacyStorageKey);
      } catch (error) {
        setStatus(error.message || text("The empty local log could not be cleared.", "Празниот локален дневник не може да се избрише."), true);
      }
      return;
    }
    const prompt = text(
      `Import ${legacyEntries.length} check-in(s) saved in this browser into your account database? This copies them to your account and removes the local copy after success.`,
      `Да ги увезам ${legacyEntries.length} записи зачувани во овој прелистувач во базата на вашата сметка? По успешниот увоз, локалните копии ќе се избришат.`
    );
    if (!window.confirm(prompt)) return;
    try {
      for (let offset = 0; offset < legacyEntries.length; offset += 500) {
        await api("/api/account/progress", {
          method: "POST",
          body: JSON.stringify({ entries: legacyEntries.slice(offset, offset + 500) })
        });
      }
    } catch (error) {
      setStatus(error.message, true);
      return;
    }
    try {
      localStorage.removeItem(legacyStorageKey);
      setStatus(text("Your existing check-ins were imported into your account.", "Постојните записи се увезени во вашата сметка."));
    } catch (error) {
      setStatus(error.message || text("The import succeeded, but the old local copy could not be removed.", "Увозот успеа, но старата локална копија не може да се избрише."), true);
    }
  }

  async function initialize() {
    try {
      const { user } = await api("/api/auth/me");
      authenticated = Boolean(user);
      accountRequired.hidden = authenticated;
      accountContent.hidden = !authenticated;
      if (!authenticated) return;
      await importLegacyEntries();
      const result = await api("/api/account/progress");
      items = validateEntries(result.entries);
      render();
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  progressForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!authenticated) {
      setStatus(text("Sign in to save this check-in to your account.", "Најавете се за да го зачувате овој запис во сметката."), true);
      return;
    }
    if (!progressForm.reportValidity()) return;
    const measureName = progressForm.elements.measureName.value.trim();
    const measureValue = progressForm.elements.measureValue.value;
    if (Boolean(measureName) !== Boolean(measureValue)) {
      setStatus(text("Add both a milestone name and a value, or leave both blank.", "Внесете и име и вредност на достигнувањето или оставете ги двете полиња празни."), true);
      return;
    }
    const entry = {
      id: crypto.randomUUID(),
      date: dateField.value,
      focus: progressForm.elements.focus.value,
      sessions: Number(progressForm.elements.sessions.value),
      measureName,
      measureValue: measureValue ? Number(measureValue) : null,
      measureUnit: progressForm.elements.measureUnit.value.trim(),
      note: progressForm.elements.note.value.trim()
    };
    const submit = progressForm.querySelector("[type=submit]");
    submit.disabled = true;
    try {
      await api("/api/account/progress", {
        method: "POST",
        body: JSON.stringify({ entries: [entry] })
      });
      items.push(entry);
      progressForm.elements.sessions.value = "0";
      progressForm.elements.measureName.value = "";
      progressForm.elements.measureValue.value = "";
      progressForm.elements.measureUnit.value = "";
      progressForm.elements.note.value = "";
      setStatus(text("Check-in saved to your FitnessLab account.", "Записот е зачуван во вашата сметка на FitnessLab."));
      render();
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      submit.disabled = false;
    }
  });

  document.querySelector("[data-progress-clear]").addEventListener("click", async () => {
    if (!items.length) {
      setStatus(text("Your log is already empty.", "Дневникот веќе е празен."));
      return;
    }
    if (!window.confirm(text("Clear all progress notes saved to your account?", "Да ги избришам сите белешки за напредок зачувани во сметката?"))) return;
    try {
      await api("/api/account/progress", { method: "DELETE" });
      items = [];
      setStatus(text("Your account progress log has been cleared.", "Дневникот за напредок во вашата сметка е избришан."));
      render();
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  window.addEventListener("fitnesslab-language-change", () => {
    if (authenticated) render();
  });

  initialize();
}
