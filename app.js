const pageLinks = {
  home: "index.html",
  about: "about.html",
  programs: "programs.html",
  trainers: "trainers.html",
  membership: "membership.html",
  journal: "journal.html",
  contact: "contact.html",
  progress: "progress.html",
  account: "account.html"
};

const currentPage = location.pathname.split("/").pop() || "index.html";

document.querySelectorAll("[data-path]").forEach((link) => {
  const destination = pageLinks[link.dataset.path];
  if (destination) link.href = destination;
});

const header = document.querySelector("header");
let navigation = header?.querySelector("nav");

if (header && navigation) {
  navigation.classList.add("fl-nav");

  if (!navigation.querySelector('[data-path="about"]')) {
    const aboutLink = document.createElement("a");
    aboutLink.href = pageLinks.about;
    aboutLink.dataset.path = "about";
    aboutLink.textContent = "About";
    const programsLink = navigation.querySelector('[data-path="programs"]');
    if (programsLink) navigation.insertBefore(aboutLink, programsLink);
    else navigation.append(aboutLink);
  }

  if (!navigation.querySelector('[data-path="progress"]')) {
    const progressLink = document.createElement("a");
    progressLink.href = pageLinks.progress;
    progressLink.dataset.path = "progress";
    progressLink.textContent = "Progress log";
    const trainerLink = navigation.querySelector('[data-path="trainers"]');
    if (trainerLink) trainerLink.after(progressLink);
    else navigation.append(progressLink);
  }

  navigation.querySelectorAll('[data-path="account"]').forEach((link) => link.remove());

  navigation.querySelectorAll("a[data-path]").forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  let menuButton = header.querySelector(".fl-menu-toggle");

  if (!menuButton) {
    const actionGroup = header.querySelector(".flex.items-center.gap-space-md:last-child");
    if (actionGroup) {
      menuButton = document.createElement("button");
      menuButton.type = "button";
      menuButton.className = "fl-menu-toggle";
      menuButton.setAttribute("aria-label", "Open navigation");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-controls", "fitnesslab-navigation");
      menuButton.innerHTML = "<span aria-hidden=\"true\"></span>";
      actionGroup.prepend(menuButton);
    }
  }

  if (navigation.classList.contains("fl-nav") && !navigation.id) {
    navigation.id = "fitnesslab-navigation";
  }

  menuButton?.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!open));
    menuButton.setAttribute("aria-label", currentLanguage === "mk"
      ? (open ? "Отвори навигација" : "Затвори навигација")
      : (open ? "Open navigation" : "Close navigation"));
    navigation.classList.toggle("fl-nav-open", !open);
  });

  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a") && menuButton) {
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", currentLanguage === "mk" ? "Отвори навигација" : "Open navigation");
      navigation.classList.remove("fl-nav-open");
    }
  });
}

document.querySelectorAll(".material-symbols-outlined").forEach((icon) => {
  icon.setAttribute("aria-hidden", "true");
  if (icon.textContent.trim() === "person") {
    icon.parentElement?.remove();
  }
});

document.querySelectorAll("a[href='#']").forEach((link) => {
  const label = link.textContent.trim().toLowerCase();
  const card = link.closest("section#programs .group");
  const heading = card?.querySelector("h3")?.textContent.trim().toLowerCase() ?? "";

  if (link.closest("header")) {
    const destination = pageLinks[link.dataset.path];
    if (destination) link.href = destination;
    return;
  }

  if (label.includes("schedule") && heading.includes("hypertrophy")) {
    link.href = "programs.html#hypertrophy";
  } else if (label.includes("schedule") && heading.includes("conditioning")) {
    link.href = "programs.html#vo2max";
  } else if (label.includes("schedule") && heading.includes("mobility")) {
    link.href = "programs.html#tendon-health";
  } else if (label.includes("consultation") || label.includes("inquir")) {
    link.href = "contact.html#inquiry";
  } else if (heading.includes("bio-tracking")) {
    link.href = "programs.html#assessment";
  } else if (link.closest("footer")) {
    link.href = pageLinks[link.dataset.path] ?? "contact.html";
  } else if (label.includes("overview")) {
    link.href = "index.html";
  } else if (label.includes("regimen")) {
    link.href = "programs.html";
  } else if (label.includes("coach")) {
    link.href = "trainers.html";
  } else if (label.includes("tier")) {
    link.href = "membership.html";
  } else if (label.includes("journal") || label.includes("editorial")) {
    link.href = "journal.html";
  } else {
    link.href = "contact.html";
  }
});

document.querySelectorAll("section#programs .group, section#trainers .flex.flex-col.bg-surface-container-low.rounded-xl").forEach((card) => {
  const action = card.querySelector("a[href]:not([href='#'])");
  if (!action) return;
  card.classList.add("fl-clickable-card");
  action.classList.add("fl-card-stretched-action");
});

document.querySelectorAll("section#memberships .rounded-xl button").forEach((button) => {
  const card = button.closest(".rounded-xl");
  if (!card) return;
  const plan = card.querySelector("h3")?.textContent.trim();
  if (!plan) return;
  const destination = `contact.html?plan=${encodeURIComponent(plan)}#inquiry`;
  card.classList.add("fl-clickable-card");
  button.classList.add("fl-card-stretched-action");
  button.addEventListener("click", () => {
    location.href = destination;
  });
});

document.querySelectorAll("article.fl-card").forEach((card) => {
  const action = card.querySelector("a[href]");
  if (!action) return;
  card.classList.add("fl-clickable-card");
  action.classList.add("fl-card-stretched-action");
});

const query = new URLSearchParams(location.search);
document.querySelector("[data-home-goal-finder]")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const goal = event.currentTarget.elements.goal.value;
  location.href = `${pageLinks.trainers}?goal=${encodeURIComponent(goal)}#goal-match`;
});
const progressNavigationLink = document.createElement("a");
progressNavigationLink.href = pageLinks.progress;
progressNavigationLink.dataset.path = "progress";
progressNavigationLink.textContent = "Progress log";
const footerExplore = document.querySelector("footer .fl-footer-grid > div:nth-child(2)");
const existingFooterProgressLink = footerExplore?.querySelector('a[href="progress.html"]');
if (existingFooterProgressLink) existingFooterProgressLink.dataset.path = "progress";
else if (footerExplore && !footerExplore.querySelector('[data-path="progress"]')) {
  const trainerLink = footerExplore.querySelector('a[href="trainers.html"]');
  if (trainerLink) trainerLink.after(progressNavigationLink);
  else footerExplore.append(progressNavigationLink);
}
const existingFooterAccountLink = footerExplore?.querySelector('a[href="account.html"]');
if (existingFooterAccountLink) existingFooterAccountLink.dataset.path = "account";
else if (footerExplore && !footerExplore.querySelector('[data-path="account"]')) {
  const accountLink = document.createElement("a");
  accountLink.href = pageLinks.account;
  accountLink.dataset.path = "account";
  accountLink.textContent = "Account";
  const progressLink = footerExplore.querySelector('[data-path="progress"]');
  if (progressLink) progressLink.after(accountLink);
  else footerExplore.append(accountLink);
}
const homeFooterExplore = document.querySelector("footer .grid > div:nth-child(2)");
const existingHomeProgressLink = homeFooterExplore?.querySelector('a[href="progress.html"]');
if (existingHomeProgressLink) existingHomeProgressLink.dataset.path = "progress";
else if (homeFooterExplore && !homeFooterExplore.querySelector('[data-path="progress"]')) {
  const trainerLink = homeFooterExplore.querySelector('a[href="trainers.html"]');
  if (trainerLink) {
    const progressLink = progressNavigationLink.cloneNode(true);
    progressLink.className = trainerLink.className;
    trainerLink.after(progressLink);
  }
}
const existingHomeAccountLink = homeFooterExplore?.querySelector('a[href="account.html"]');
if (existingHomeAccountLink) existingHomeAccountLink.dataset.path = "account";
else if (homeFooterExplore && !homeFooterExplore.querySelector('[data-path="account"]')) {
  const trainerLink = homeFooterExplore.querySelector('a[href="trainers.html"]');
  if (trainerLink) {
    const accountLink = document.createElement("a");
    accountLink.href = pageLinks.account;
    accountLink.dataset.path = "account";
    accountLink.textContent = "Account";
    accountLink.className = trainerLink.className;
    const progressLink = homeFooterExplore.querySelector('[data-path="progress"]');
    if (progressLink) progressLink.after(accountLink);
    else trainerLink.after(accountLink);
  }
}
const contactPlan = query.get("plan") ?? query.get("interest");
const planField = document.querySelector("[name='interest']");
if (contactPlan && planField) {
  const matchingOption = [...planField.options].find((option) => option.value === contactPlan || option.textContent.includes(contactPlan));
  if (matchingOption) planField.value = matchingOption.value;
}
const requestedCoach = query.get("coach");
const contactMessage = document.querySelector("[name='message']");
if (requestedCoach && contactMessage) {
  contactMessage.value = `I would like to ask about coaching with ${requestedCoach}.`;
  if (planField) planField.value = "Personal training";
}

document.querySelectorAll("[data-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const cookieBanner = document.querySelector("[data-cookie-banner]");
const cookieKey = "fitnesslab-cookie-choice";

if (cookieBanner && localStorage.getItem(cookieKey) !== "accepted") {
  cookieBanner.hidden = false;
}

document.querySelector("[data-cookie-accept]")?.addEventListener("click", () => {
  localStorage.setItem(cookieKey, "accepted");
  if (cookieBanner) cookieBanner.hidden = true;
});

document.querySelectorAll("[data-lab-form]").forEach((form) => {
  const returnField = form.querySelector("[name='_next']");
  let status = form.querySelector("[data-form-status]");
  if (!status) {
    status = document.createElement("p");
    status.className = "fl-form-status";
    status.dataset.formStatus = "";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.textContent = "Submitting sends the details in this form to FormSubmit, which forwards them to support@fitnesslab.com. Do not include sensitive health or confidential information.";
    form.append(status);
  }
  const submitted = query.get("sent") === "1";
  const returnUrl = new URL(location.pathname, location.origin);
  returnUrl.searchParams.set("sent", "1");
  returnUrl.hash = "inquiry";
  if (returnField) {
    if (location.protocol === "file:") {
      returnField.disabled = true;
    } else {
      returnField.value = returnUrl.href;
    }
  }

  if (submitted && status) {
    status.textContent = "Your enquiry was submitted. If this is the first submission, FitnessLab must confirm the form activation email before messages can be delivered.";
    status.classList.add("fl-form-status-visible");
  }

  const fields = form.querySelectorAll("input:not([name^='_']), select, textarea");
  fields.forEach((field, index) => {
    if (!field.name) field.name = ["name", "email", "interest", "message"][index] ?? `field-${index + 1}`;
    if (field.type === "email") {
      field.autocomplete = "email";
      field.name = "_replyto";
    }
    else if (field.type === "text") field.autocomplete = "name";
  });
});

const mkTranslations = Object.fromEntries([
  ["Skip to content", "Прескокни до содржината"],
  ["Open navigation", "Отвори навигација"],
  ["Close navigation", "Затвори навигација"],
  ["Main navigation", "Главна навигација"],
  ["Home", "Почетна"],
  ["About", "За нас"],
  ["Programs", "Програми"],
  ["Trainers", "Тренери"],
  ["Membership", "Членство"],
  ["Journal", "Блог"],
  ["Get in touch", "Контактирајте нè"],
  ["Explore", "Истражете"],
  ["Programs & lab", "Програми и лабораторија"],
  ["Coaches", "Тренери"],
  ["Plan a visit", "Закажете посета"],
  ["Useful", "Корисни информации"],
  ["Privacy & cookies", "Приватност и колачиња"],
  ["Our approach", "Нашиот пристап"],
  ["Curious about training. Serious about people.", "Љубопитни за тренингот. Посветени на луѓето."],
  ["Visit", "Посетете нè"],
  ["Visit FitnessLab in Skopje - Aerodrom.", "Посетете го FitnessLab во Скопје - Аеродром."],
  ["©", "©"],
  ["Training information is educational, not medical advice.", "Информациите за тренинг се едукативни, а не медицински совет."],
  ["Privacy details", "Детали за приватност"],
  ["Got it", "Во ред"],
  ["Your space to get stronger", "Ваш простор за поголема сила"],
  ["Move with", "Движете се со"],
  ["purpose.", "цел."],
  ["Feel the", "Почувствувајте ја"],
  ["difference.", "разликата."],
  ["A training studio built around good measurement, careful coaching, and the science of getting stronger over time.", "Тренинг-студио засновано на внимателно мерење, стручно водство и наука за постепено зголемување на силата."],
  ["Explore memberships", "Разгледајте ги членствата"],
  ["Explore our programs", "Разгледајте ги програмите"],
  ["FITNESSLAB • ATHLETIC SPACES", "FITNESSLAB • ПРОСТОРИ ЗА ТРЕНИНГ"],
  ["Show Up For You", "Посветете се себеси"],
  ["Athletic Guild", "Атлетски клуб"],
  ["Facility Access", "Пристап до просторот"],
  ["Coaching Depth", "Стручно водство"],
  ["Coach details and qualifications should be verified.", "Проверете ги податоците и квалификациите на тренерите."],
  ["Curated Sessions", "Осмислени тренинзи"],
  ["Satisfaction", "Напредок"],
  ["Progress and training plans vary by person.", "Напредокот и плановите за тренинг се разликуваат од човек до човек."],
  ["Facility Amenities", "Содржини во просторот"],
  ["Boutique Strength Floor", "Специјализирана сала за сила"],
  ["Recovery options vary", "Опциите за опоравување се разликуваат"],
  ["Coach-led movement", "Вежби со тренер"],
  ["Strength training", "Тренинг за сила"],
  ["Progress reviews", "Следење на напредокот"],
  ["Scientific Regimens", "Научно засновани програми"],
  ["Signature Conditioning Programs", "Препознатливи програми за кондиција"],
  ["Structured around progressive overload, biomechanical efficiency, and restorative tissue intervals.", "Засновани на постепено зголемување на оптоварувањето, биомеханичка ефикасност и соодветен одмор за ткивата."],
  ["Strength & Hypertrophy", "Сила и хипертрофија"],
  ["60 MIN", "60 МИН"],
  ["Tier 1 Intensity", "Интензитет: ниво 1"],
  ["Level 02–04", "Ниво 02–04"],
  ["Functional Hypertrophy", "Функционална хипертрофија"],
  ["Compound movement patterns paired with strict mechanical tension to build structural density and resilient joints.", "Сложени движења со контролирано механичко оптоварување за развој на мускулната маса и отпорноста на зглобовите."],
  ["Metabolic Engine", "Метаболички капацитет"],
  ["50 MIN", "50 МИН"],
  ["Tier 2 Hybrid", "Хибридно ниво 2"],
  ["All Levels", "За сите нивоа"],
  ["Athletic Conditioning", "Атлетска кондиција"],
  ["Build aerobic fitness with coach-led intervals paced to your current ability. VO₂ testing is available only with appropriate screening and qualified supervision.", "Подобрете ја аеробната подготвеност со интервали водени од тренер и приспособени на вашата способност. VO₂ тестирање се нуди само по соодветна проценка и под стручен надзор."],
  ["Longevity & FRC", "Долгорочна подвижност и FRC"],
  ["45 MIN", "45 МИН"],
  ["Tier 0 Restoration", "Ниво 0: обновување"],
  ["Essential", "Основно"],
  ["Mobility & Recovery", "Подвижност и опоравување"],
  ["Build comfortable movement and progressive tendon capacity with coach-led mobility and strength work. This is training, not injury treatment.", "Развивајте удобност во движењето и постепена носивост на тетивите со вежби за подвижност и сила под водство на тренер. Ова е тренинг, а не лекување повреди."],
  ["Private Roadmap", "Индивидуален план"],
  ["Custom", "По мерка"],
  ["Bespoke Protocol", "Персонализирана програма"],
  ["1-on-1 Dedicated", "Индивидуално водство"],
  ["Personal Bio-Tracking", "Индивидуално следење на напредокот"],
  ["A coach-guided plan can track agreed strength, conditioning, and movement measures over time. Testing is optional, screened, and not a medical diagnosis.", "План со тренер може да ги следи договорените показатели за сила, кондиција и движење. Тестирањето е изборно, со претходна проценка, и не претставува медицинска дијагноза."],
  ["Request Consultation", "Побарајте консултација"],
  ["Our Philosophy", "Нашата филозофија"],
  ["The FitnessLab Difference", "По што се разликува FitnessLab"],
  ["A physical training environment freed from performance gimmicks. We engineer longevity through empirical conditioning and intentional spaces.", "Простор за тренинг без празни ветувања за перформанси. Долгорочната подготвеност ја градиме преку осмислена кондициска работа и внимателно уреден простор."],
  ["Science-Driven Protocols", "Програми водени од науката"],
  ["Training starts with a conversation about your experience, goals, and schedule. Measures such as strength, pace, and heart-rate response help guide adjustments; individual results vary.", "Тренингот започнува со разговор за вашето искуство, целите и распоредот. Показатели како сила, темпо и срцев ритам помагаат во приспособувањето; резултатите се индивидуални."],
  ["Progress over time", "Напредок низ време"],
  ["Individual training", "Индивидуален тренинг"],
  ["Elite Coaches, Zero Ego", "Стручни тренери, без его"],
  ["Coach qualifications vary; ask our team", "Квалификациите на тренерите се разликуваат; прашајте го нашиот тим"],
  ["Private Recovery Suites", "Приватни простории за опоравување"],
  ["Recovery supports consistent training. We focus on sleep, sensible training loads, and gradual progression; no recovery device or amenity is presented as a medical treatment.", "Опоравувањето помага за редовен тренинг. Се фокусираме на сон, разумно оптоварување и постепен напредок; ниедна опрема или услуга не ја претставуваме како медицински третман."],
  ["Digital Performance Hub", "Дигитален центар за напредок"],
  ["Continuous Micro-Telemetry v3.4", "Континуирани микро-показатели v3.4"],
  ["Explore App →", "Разгледајте ја апликацијата →"],
  ["World-Class Mentorship", "Менторство на високо ниво"],
  ["Featured Master Trainers", "Избрани главни тренери"],
  ["Guidance tailored to human biomechanics, neuromuscular efficiency, and mental grit.", "Водство приспособено на човечката биомеханика, нервно-мускулната ефикасност и менталната издржливост."],
  ["12 Yrs Experience", "12 години искуство"],
  ["Head of Athletic Performance", "Раководител за атлетски перформанси"],
  ["“True strength is not how much load you move once; it is how sustainably your kinetic chain performs under sustained fatigue.”", "„Вистинската сила не е товарот што ќе го подигнете еднаш, туку колку одржливо функционира вашето тело при замор.“"],
  ["Specialty: Olympic Lifting & Speed", "Специјалност: олимписко кревање и брзина"],
  ["10 Yrs Experience", "10 години искуство"],
  ["Mobility & Biomechanics Lead", "Раководител за подвижност и биомеханика"],
  ["“You only own the movement range that you can actively control without compensations. We build freedom of movement first.”", "„Навистина го контролирате само оној опсег на движење што можете активно да го користите без компензации. Прво градиме слобода на движење.“"],
  ["Specialty: Joint Health & Fascia", "Специјалност: зглобови и фасција"],
  ["8 Yrs Experience", "8 години искуство"],
  ["Director of Conditioning", "Раководител за кондиција"],
  ["“Aerobic capacity is the engine that speeds up cellular recovery. Train your heart like you train your skeletal muscle.”", "„Аеробниот капацитет е моторот што го забрзува клеточното опоравување. Тренирајте го срцето како и скелетните мускули.“"],
  ["Specialty: Hybrid Energy Systems", "Специјалност: хибридни енергетски системи"],
  ["Membership Tiers", "Нивоа на членство"],
  ["Tier 01", "Ниво 01"],
  ["Standard", "Стандардно"],
  ["Core Studio", "Core Studio"],
  ["Obsidian Private", "Obsidian – индивидуално членство"],
  ["Ideal for autonomous athletes who require premium equipment and unlimited standard gym access.", "Идеално за самостојни вежбачи кои сакаат квалитетна опрема и неограничен пристап до салата."],
  ["/ month", "/ месечно"],
  ["Open gym during published hours", "Слободен тренинг во објавеното работно време"],
  ["Intro session with a coach", "Воведен тренинг со тренер"],
  ["Training notes with a coach", "Белешки за тренинг со тренер"],
  ["Signature Group Classes included", "Вклучени се групни тренинзи"],
  ["Private Cold Plunge & Infrared Sauna", "Приватен ладен базен и инфрацрвена сауна"],
  ["Select Core Tier", "Изберете Core"],
  ["Most Popular Choice", "Најпопуларен избор"],
  ["Tier 02", "Ниво 02"],
  ["All-Access", "Целосен пристап"],
  ["Performance", "Performance"],
  ["Full spectrum conditioning for the dedicated lifter wanting guided signature programming.", "Сеопфатна кондициска подготовка за посветени вежбачи со тренинзи водени од тренер."],
  ["Unlimited Signature Group Regimens", "Неограничени групни тренинзи"],
  ["Optional recovery services, if available", "Изборни услуги за опоравување, доколку се достапни"],
  ["Periodic plan review with your coach", "Периодично разгледување на планот со тренер"],
  ["Priority bay reservation via mobile app", "Приоритетна резервација преку мобилна апликација"],
  ["Join Performance Now", "Изберете Performance"],
  ["Tier 03", "Ниво 03"],
  ["Bespoke", "По мерка"],
  ["Obsidian Private", "Obsidian Private"],
  ["High-touch 1-on-1 private coaching, personalized biometrics, and concierge locker facilities.", "Индивидуално тренерско водство, персонализирани биометриски податоци и дополнителни услуги."],
  ["Ask", "Прашајте"],
  ["Includes all Performance Tier privileges", "Ги вклучува сите поволности од Performance"],
  ["4 Dedicated 1-on-1 Master Coach sessions/mo", "4 индивидуални тренинзи со главен тренер месечно"],
  ["Discuss recovery options with the team", "Разговарајте со тимот за опциите за опоравување"],
  ["Flexible one-to-one coaching sessions", "Флексибилни индивидуални тренинзи со тренер"],
  ["Agreed training progress reviews", "Следење на договорени показатели за напредок"],
  ["Inquire for Obsidian", "Прашајте за Obsidian"],
  ["Progress, measured over time", "Напредок што се следи низ време"],
  ["“The clear plan and welcoming coaching helped me make training a regular part of my week.”", "„Јасниот план и пријатното водство ми помогнаа тренингот да стане редовен дел од неделата.“"],
  ["Member since Jan 2023 • Performance Tier", "Член од јануари 2023 • Performance"],
  ["“Consistent coaching helped me build confidence with strength training over time.”", "„Редовното водство ми помогна постепено да стекнам самодоверба во тренингот за сила.“"],
  ["Member since Oct 2022 • Obsidian Private", "Член од октомври 2022 • Obsidian Private"],
  ["A calm, well-organized training space makes it easier for me to focus on my session.", "Мирниот и уреден простор ми помага подобро да се фокусирам на тренингот."],
  ["Member since May 2024 • Core Studio", "Член од мај 2024 • Core Studio"],
  ["Ready to redefine your baseline?", "Подготвени да ја утврдите почетната точка?"],
  ["Experience the studio firsthand. Start with a conversation about your goals and training history. If appropriate, a qualified coach can discuss optional fitness assessments; these are not medical tests.", "Запознајте се со студиото. Разговарајте за целите и претходното тренинг-искуство. Ако е соодветно, квалификуван тренер може да предложи изборна проценка на физичката подготвеност; тоа не е медицински тест."],
  ["Zero sales harassment", "Без притисок за продажба"],
  ["Includes recovery suite pass", "Вклучува пристап до просторијата за опоравување"],
  ["Claim Your Session", "Закажете тренинг"],
  ["Select your preferred training discipline:", "Изберете ја посакуваната област на тренинг:"],
  ["Full Name", "Име и презиме"],
  ["Email Address", "Е-пошта"],
  ["Primary Conditioning Goal", "Главна цел за кондиција"],
  ["Functional Strength & Hypertrophy", "Функционална сила и хипертрофија"],
  ["Metabolic Conditioning & VO2 Max", "Метаболичка кондиција и VO₂ max"],
  ["Mobility, Posture & Joint Longevity", "Подвижност, држење на телото и здравје на зглобовите"],
  ["Private 1-on-1 Biometric Coaching", "Индивидуален биометриски тренинг со тренер"],
  ["Evidence-informed training, thoughtful coaching, and progress that respects the person.", "Тренинг заснован на докази, внимателно водство и напредок што го почитува човекот."],
  ["Athletic Lab & Performance Center", "Атлетска лабораторија и центар за перформанси"],
  ["Navigation", "Навигација"],
  ["Overview", "Преглед"],
  ["Programs & Regimens", "Програми и тренинг-планови"],
  ["Master Coaches", "Главни тренери"],
  ["Tiers & Access", "Членства и пристап"],
  ["Editorial Journal", "Стручни статии"],
  ["Mon – Fri", "Пон. – пет."],
  ["Saturday", "Сабота"],
  ["Sunday", "Недела"],
  ["Opening hours and recovery amenities shown here are examples; verify before publication.", "Работното време и содржините за опоравување се примери; проверете ги пред објавување."],
  ["Dispatches", "Билтен"],
  ["All rights reserved.", "Сите права се задржани."],
  ["Editorial Protocol", "Уреднички принципи"],
  ["Terms of Access", "Услови за пристап"],
  ["Inquiries", "Прашања"],
  ["Questions are a great place to start", "Прашањата се добар почеток"],
  ["Let’s find your", "Да го пронајдеме вашиот"],
  ["next step.", "следен чекор."],
  ["Ask about programs, memberships, or a first visit. Send a message directly to the FitnessLab team.", "Прашајте за програмите, членствата или првата посета. Испратете порака директно до тимот на FitnessLab."],
  ["Contact details", "Контакт-информации"],
  ["Come by or", "Повелете или"],
  ["say hello.", "јавете ни се."],
  ["Visit the studio", "Посетете го студиото"],
  ["Skopje - Aerodrom, North Macedonia", "Скопје - Аеродром, Северна Македонија"],
  ["Open a map ↗", "Отворете мапа ↗"],
  ["Reach the team", "Контактирајте го тимот"],
  ["Saturday–Sunday, 08:00–16:00", "сабота–недела, 08:00–16:00"],
  ["Send an enquiry", "Испратете прашање"],
  ["What would you like", "Што би сакале"],
  ["to know?", "да дознаете?"],
  ["Name", "Име"],
  ["Email address", "Е-пошта"],
  ["I’m interested in", "Ме интересира"],
  ["Choose a topic", "Изберете тема"],
  ["VO2 assessment", "VO₂ проценка"],
  ["Personal training", "Индивидуален тренинг"],
  ["Starter visit", "Воведна посета"],
  ["Personal Coaching", "Индивидуално тренерско водство"],
  ["Message", "Порака"],
  ["Prepare enquiry", "Испрати прашање"],
  ["Your enquiry will be delivered to FitnessLab through a form relay. Your name, email address, selected topic, and message are sent to the relay and forwarded to support@fitnesslab.com. The first submission requires the recipient to confirm the relay activation email.", "Вашето прашање ќе биде испратено до FitnessLab преку надворешна услуга за формулари. Името, е-поштата, избраната тема и пораката се испраќаат до услугата и се проследуваат до support@fitnesslab.com. При првото испраќање, примачот треба да ја потврди активациската е-порака."],
  ["Submitting sends the details in this form to FormSubmit, which forwards them to support@fitnesslab.com. Do not include sensitive health or confidential information.", "Со испраќање, податоците од формата се праќаат до FormSubmit, кој ги проследува до support@fitnesslab.com. Не внесувајте чувствителни здравствени или доверливи информации."],
  ["Your enquiry was submitted. If this is the first submission, FitnessLab must confirm the form activation email before messages can be delivered.", "Вашето прашање е испратено. Ако ова е првото испраќање, FitnessLab треба да ја потврди активациската е-порака пред да може да прима пораки."],
  ["A training studio with a lab mindset", "Тренинг-студио со лабораториски пристап"],
  ["Curious by design.", "Љубопитноста е во нашиот пристап."],
  ["Human by nature.", "Човечноста е во нашата природа."],
  ["FitnessLab brings thoughtful coaching and useful measurements together. We use science to ask better questions—not to promise shortcuts or treat people like data points.", "FitnessLab ги обединува внимателното тренерско водство и корисните мерења. Науката ни помага да поставуваме подобри прашања, а не да ветуваме кратенки или да ги сведуваме луѓето на бројки."],
  ["The FitnessLab idea", "Идејата на FitnessLab"],
  ["Better training starts with", "Подобриот тренинг започнува со"],
  ["better questions.", "подобри прашања."],
  ["What are you working toward? What does your week really allow? How are you responding to training? Those answers matter more than a one-size-fits-all plan.", "Што сакате да постигнете? Колку време навистина имате? Како реагирате на тренингот? Одговорите се поважни од универзален план."],
  ["Our coaches use clear progressions and agreed measures to help members build strength, aerobic fitness, movement skill, and consistency. Measurements support coaching; they do not define your value or diagnose a health condition.", "Нашите тренери користат јасни прогресии и договорени показатели за развој на сила, аеробна подготвеност, моторички вештини и доследност. Мерењата го поддржуваат водството; тие не ја одредуваат вашата вредност и не дијагностицираат здравствена состојба."],
  ["Explore the programs", "Разгледајте ги програмите"],
  ["Observe. Train. Review.", "Набљудувај. Тренирај. Прегледај."],
  ["We begin with a conversation and an appropriate starting point, build a plan you can follow, then review how it feels and what is changing.", "Започнуваме со разговор и соодветна почетна точка, составуваме план што можете да го следите, па проверуваме како се чувствувате и што се менува."],
  ["Progress at a pace that fits the person", "Напредок со темпо приспособено на човекот"],
  ["Strength and conditioning with a clear purpose", "Тренинг за сила и кондиција со јасна цел"],
  ["Honest communication about what assessments can—and cannot—tell you", "Искрен разговор за тоа што може, а што не може да покаже проценката"],
  ["The lab, without the hype", "Лабораториски пристап, без сензационализам"],
  ["Four ways to make progress.", "Четири начини за напредок."],
  ["01 / MUSCLE", "01 / МУСКУЛИ"],
  ["Hypertrophy & strength", "Хипертрофија и сила"],
  ["Progressive resistance training built around technique, manageable effort, and a volume you can recover from.", "Прогресивен тренинг со отпор заснован на техника, контролирано оптоварување и обем од кој можете да се опоравите."],
  ["How we train", "Како тренираме"],
  ["02 / ENGINE", "02 / АЕРОБЕН КАПАЦИТЕТ"],
  ["Aerobic capacity", "Аеробен капацитет"],
  ["Build an engine with repeatable training. A VO₂ assessment is an option for planning, not a finish line.", "Градете издржливост со редовен тренинг. VO₂ проценката е алатка за планирање, а не крајна цел."],
  ["Explore conditioning", "Разгледајте ја кондициската подготовка"],
  ["03 / DURABILITY", "03 / ИЗДРЖЛИВОСТ"],
  ["Tendon & movement capacity", "Капацитет на тетивите и движењето"],
  ["Use gradual, appropriately coached loading to build capacity over time—without promising injury prevention.", "Со постепено оптоварување и стручно водство развивајте капацитет низ време, без ветувања за спречување повреди."],
  ["Read the approach", "Прочитајте за пристапот"],
  ["Good data. Better conversations.", "Добри податоци. Подобри разговори."],
  ["Train for your life, not for a", "Тренирајте за вашиот живот, а не за"],
  ["dashboard.", "контролна табла."],
  ["Come meet us", "Запознајте нè"],
  ["Programs / assessments / progression", "Програми / проценки / прогресија"],
  ["Train the signal.", "Тренирајте го сигналот."],
  ["Respect the response.", "Почитувајте го одговорот."],
  ["Choose a starting point and let good coaching help shape the plan. Lab-style testing is optional, useful only when it answers a real question, and never a substitute for medical care.", "Изберете почетна точка и дозволете доброто тренерско водство да го обликува планот. Лабораториското тестирање е изборно, корисно само кога одговара на конкретно прашање и никогаш не ја заменува медицинската грижа."],
  ["Signature training", "Препознатливи тренинзи"],
  ["Build capacity, one block at a time.", "Градете капацитет, еден циклус по еден."],
  ["Ask a coach", "Прашајте тренер"],
  ["01 / STRENGTH & MUSCLE", "01 / СИЛА И МУСКУЛИ"],
  ["Progressive hypertrophy", "Прогресивна хипертрофија"],
  ["Practice sound technique, apply challenging but manageable effort, and progress training volume in a way you can recover from.", "Вежбајте правилна техника, вложувајте предизвикувачки но контролирани напори и зголемувајте го обемот на тренинг соодветно на опоравувањето."],
  ["Explore the method", "Разгледајте го методот"],
  ["02 / AEROBIC ENGINE", "02 / АЕРОБЕН КАПАЦИТЕТ"],
  ["Conditioning & VO₂", "Кондиција и VO₂"],
  ["Build a broader aerobic base, then add appropriately paced intervals. A lab assessment may help establish an initial reference.", "Прво изградете поширока аеробна основа, а потоа додајте интервали со соодветно темпо. Лабораториската проценка може да помогне при утврдување почетна вредност."],
  ["Explore testing", "Разгледајте го тестирањето"],
  ["03 / MOVEMENT CAPACITY", "03 / КАПАЦИТЕТ НА ДВИЖЕЊЕ"],
  ["Tendon-friendly loading", "Оптоварување приспособено за тетивите"],
  ["Develop strength gradually with coach-led loading and recovery. Training supports capacity; it is not injury treatment.", "Постепено развивајте сила со оптоварување и опоравување под водство на тренер. Тренингот го развива капацитетот, но не лекува повреди."],
  ["Learn the principles", "Запознајте се со принципите"],
  ["04 / YOUR PLAN", "04 / ВАШ ПЛАН"],
  ["Personal coaching", "Индивидуален тренинг со тренер"],
  ["One-to-one coaching can adapt training around experience, goals, schedule, and the equipment you have available.", "Индивидуалниот тренинг може да се приспособи на вашето искуство, цели, распоред и достапната опрема."],
  ["Meet a coach", "Запознајте тренер"],
  ["05 / MOVE WELL", "05 / ДВИЖЕТЕ СЕ ДОБРО"],
  ["Mobility & control", "Подвижност и контрола"],
  ["Build useful, controlled ranges of motion that support the activities you care about.", "Развивајте корисен и контролиран опсег на движење за активностите што ви значат."],
  ["Explore mobility", "Разгледајте ја подвижноста"],
  ["06 / MEASURE WITH PURPOSE", "06 / МЕРЕЊА СО ЦЕЛ"],
  ["Fitness assessments", "Проценки на физичката подготвеност"],
  ["Discuss simple, repeatable measures with a qualified coach before deciding whether testing is right for you.", "Разговарајте со квалификуван тренер за едноставни и повторливи мерења пред да одлучите дали тестирањето е соодветно за вас."],
  ["How assessment works", "Како функционира проценката"],
  ["Muscle growth / strength", "Мускулен раст / сила"],
  ["Hypertrophy is a process,", "Хипертрофијата е процес,"],
  ["not a trick.", "а не трик."],
  ["Muscle growth is influenced by repeated resistance-training stimulus, enough challenging work, nutrition, sleep, and time. The right volume and frequency depend on the individual and can change as training experience builds.", "Мускулниот раст зависи од повторлив стимул со тренинг со отпор, доволно предизвикувачка работа, исхрана, сон и време. Соодветниот обем и зачестеност зависат од човекот и може да се менуваат со тренинг-искуството."],
  ["We focus on controllable basics: repeatable exercise technique, gradual progression, sufficient recovery, and keeping a record of training. Failure on every set, exotic equipment, or a specific “pump” is not required.", "Се фокусираме на основите што може да се контролираат: стабилна техника, постепен напредок, доволно опоравување и водење евиденција. Не е неопходно секој сет да се прави до отказ, ниту е потребна специјална опрема или чувство на „напумпаност“."],
  ["Read the research overview →", "Прочитајте го прегледот на истражувањата →"],
  ["What a coach can help tune", "Со што може да помогне тренерот"],
  ["Exercise choice and technique that suit your experience", "Избор на вежби и техника соодветни на вашето искуство"],
  ["Weekly training volume and a manageable effort level", "Неделен обем на тренинг и контролирано ниво на напор"],
  ["Progression and recovery checkpoints", "Проверки на напредокот и опоравувањето"],
  ["When to adjust a plan based on how you feel and perform", "Кога да го приспособите планот според тоа како се чувствувате и вежбате"],
  ["Aerobic fitness / VO₂ max", "Аеробна подготвеност / VO₂ max"],
  ["Measure the engine,", "Измерете го капацитетот,"],
  ["not your worth.", "а не вашата вредност."],
  ["VO₂ max describes the highest rate at which the body can use oxygen during intense exercise. A properly conducted assessment can help describe aerobic fitness, but the result depends on the equipment, protocol, effort, and person being tested.", "VO₂ max ја опишува највисоката стапка со која телото користи кислород при интензивно вежбање. Правилно спроведената проценка може да ја опише аеробната подготвеност, но резултатот зависи од опремата, протоколот, напорот и лицето што се тестира."],
  ["Before any hard test", "Пред интензивен тест"],
  ["We would first discuss your exercise history and any relevant health concerns. If maximal exercise is not appropriate, a coach can suggest a non-maximal training alternative. Seek medical advice for symptoms or health conditions before strenuous testing.", "Прво би разговарале за вашето искуство со вежбање и за релевантни здравствени прашања. Ако максималниот напор не е соодветен, тренер може да предложи полесна алтернатива. Пред интензивно тестирање, побарајте медицински совет ако имате симптоми или здравствени состојби."],
  ["Ask about assessment", "Прашајте за проценката"],
  ["Tendon capacity / loading", "Капацитет на тетивите / оптоварување"],
  ["Progressive loading takes", "Постепеното оптоварување бара"],
  ["patience.", "трпение."],
  ["Tendons respond to mechanical loading, but adaptations are gradual and differ from person to person. Appropriate resistance training can improve tendon mechanical properties; it does not guarantee that an injury will be prevented or resolve pain.", "Тетивите реагираат на механичко оптоварување, но приспособувањето е постепено и индивидуално. Соодветниот тренинг со отпор може да ги подобри механичките својства на тетивите; не гарантира спречување повреди ниту отстранување на болката."],
  ["Our training approach emphasizes tolerable loads, clear progression, and recovery. Persistent or worsening pain needs assessment by a qualified healthcare professional—not an internet protocol or a gym assessment.", "Нашиот пристап нагласува подносливо оптоварување, јасна прогресија и опоравување. Постојаната или засилена болка треба да ја процени квалификуван здравствен работник, а не интернет-протокол или проценка во сала."],
  ["See tendon research notes →", "Прочитајте ги белешките за истражување на тетивите →"],
  ["Training principles", "Принципи на тренинг"],
  ["Start with a load and range you can control", "Започнете со оптоварување и опсег што можете да ги контролирате"],
  ["Increase training demands progressively, not all at once", "Зголемувајте го оптоварувањето постепено, не одеднаш"],
  ["Monitor symptoms and recovery between sessions", "Следете ги симптомите и опоравувањето меѓу тренинзите"],
  ["Refer health concerns to the right clinician", "За здравствени прашања обратете се кај соодветен клиничар"],
  ["A schedule that leaves room to recover.", "Распоред со доволно време за опоравување."],
  ["This is an example only; confirm availability with the studio.", "Ова е само пример; проверете ја достапноста во студиото."],
  ["Day", "Ден"],
  ["Morning", "Утро"],
  ["Midday", "Напладне"],
  ["Evening", "Вечер"],
  ["Monday", "Понеделник"],
  ["Tuesday", "Вторник"],
  ["Wednesday", "Среда"],
  ["Thursday", "Четврток"],
  ["Strength foundations", "Основи на силата"],
  ["07:00 · Coach-led", "07:00 · Со тренер"],
  ["Open gym", "Слободен тренинг"],
  ["By availability", "Според достапноста"],
  ["Conditioning intervals", "Кондициски интервали"],
  ["18:00 · Scaled options", "18:00 · Приспособливи опции"],
  ["Mobility & control", "Подвижност и контрола"],
  ["07:30 · Coach-led", "07:30 · Со тренер"],
  ["Personal coaching", "Индивидуален тренинг со тренер"],
  ["By appointment", "Со закажување"],
  ["Hypertrophy training", "Тренинг за хипертрофија"],
  ["18:30 · Small group", "18:30 · Мала група"],
  ["Aerobic base", "Аеробна основа"],
  ["18:00 · Coach-led", "18:00 · Со тренер"],
  ["07:30 · Scaled options", "07:30 · Приспособливи опции"],
  ["Saturday", "Сабота"],
  ["Community session", "Тренинг за заедницата"],
  ["09:00 · All levels", "09:00 · За сите нивоа"],
  ["Assessment boundary:", "Ограничувања на проценката:"],
  ["Fitness testing and training are not medical diagnosis or treatment. Obtain informed consent, use appropriate screening and qualified personnel, and refer health questions to healthcare professionals.", "Тестирањето на подготвеноста и тренингот не се медицинска дијагноза или третман. Обезбедете информирана согласност, соодветна проценка и квалификуван персонал; здравствените прашања упатете ги до здравствени работници."],
  ["Let's find a good starting point", "Да пронајдеме добра почетна точка"],
  ["Progress begins with a", "Напредокот започнува со"],
  ["conversation.", "разговор."],
  ["Meet your coaching team", "Запознајте го тренерскиот тим"],
  ["Good coaching.", "Добро тренерско водство."],
  ["No ego required.", "Без непотребно его."],
  ["STRENGTH / HYPERTROPHY", "СИЛА / ХИПЕРТРОФИЈА"],
  ["Focuses on clear lifting technique, progressive resistance training, and building sustainable strength habits.", "Се фокусира на правилна техника на кревање, прогресивен тренинг со отпор и одржливи навики за сила."],
  ["Strength foundations", "Основи на силата"],
  ["Ask about coaching", "Прашајте за тренерско водство"],
  ["MOBILITY / MOVEMENT", "ПОДВИЖНОСТ / ДВИЖЕЊЕ"],
  ["Helps members develop controlled movement and build confidence with appropriately scaled strength work.", "Им помага на членовите да развијат контролирано движење и самодоверба преку соодветно приспособен тренинг за сила."],
  ["Mobility", "Подвижност"],
  ["Movement skill", "Моторички вештини"],
  ["CONDITIONING / AEROBIC FITNESS", "КОНДИЦИЈА / АЕРОБНА ПОДГОТВЕНОСТ"],
  ["Builds conditioning plans around repeatable effort, sensible progressions, and the member’s starting point.", "Изработува планови за кондиција засновани на повторлив напор, разумна прогресија и почетната точка на членот."],
  ["Aerobic training", "Аеробен тренинг"],
  ["Intervals", "Интервали"],
  ["A good fit matters", "Важно е да најдете соодветен тренер"],
  ["Meet a coach before you", "Запознајте тренер пред да"],
  ["choose a plan.", "изберете план."],
  ["Plan an introduction", "Закажете воведен разговор"],
  ["Simple / flexible / built around you", "Едноставно / флексибилно / приспособено за вас"],
  ["Memberships for", "Членства за"],
  ["how you train.", "вашиот начин на тренирање."],
  ["Choose the level of coaching and access that suits your routine. Start with a conversation before committing.", "Изберете го нивото на тренерско водство и пристап што одговара на вашата рутина. Пред да се обврзете, започнете со разговор."],
  ["01 / INDEPENDENT TRAINING", "01 / САМОСТОЕН ТРЕНИНГ"],
  ["For members who want access to the training floor and a steady independent routine.", "За членови кои сакаат пристап до салата и редовна самостојна рутина."],
  ["/ month · example", "/ месечно · пример"],
  ["Month-to-month example plan", "Пример-план со месечно плаќање"],
  ["Ask about Core", "Прашајте за Core"],
  ["02 / COACHED ROUTINE", "02 / РУТИНА СО ТРЕНЕР"],
  ["A balanced mix of group sessions, independent training, and check-ins with your coach.", "Балансирана комбинација од групни тренинзи, самостојно вежбање и консултации со тренер."],
  ["Everything in Core Studio", "Сè што е вклучено во Core Studio"],
  ["Regular plan review", "Редовно разгледување на планот"],
  ["Progress at a sustainable pace", "Напредок со одржливо темпо"],
  ["Ask about Performance", "Прашајте за Performance"],
  ["03 / ONE-TO-ONE", "03 / ИНДИВИДУАЛНО"],
  ["Dedicated sessions with an individual plan shaped around your goals and availability.", "Посебни тренинзи со индивидуален план приспособен на вашите цели и достапност."],
  ["By plan", "Според план"],
  ["/ discuss with a coach", "/ разговарајте со тренер"],
  ["One-to-one coaching sessions", "Индивидуални тренинзи со тренер"],
  ["Personalized strength or conditioning plan", "Персонализиран план за сила или кондиција"],
  ["Agreed measures and plan reviews", "Договорени показатели и преглед на планот"],
  ["Flexible session packages", "Флексибилни пакети за тренинзи"],
  ["Talk through options", "Разговарајте за опциите"],
  ["Good to know", "Корисни информации"],
  ["Membership questions.", "Прашања за членството."],
  ["Can I try a session before joining?", "Може ли да пробам тренинг пред да се зачленам?"],
  ["Yes. Contact the studio to arrange an introductory visit and ask any questions before choosing a plan.", "Да. Контактирајте го студиото за воведна посета и поставете прашања пред да изберете план."],
  ["Do I need training experience to join?", "Дали ми треба претходно тренинг-искуство?"],
  ["No. Talk to a coach about your experience and goals. Sessions should be scaled to your current ability and comfort.", "Не. Разговарајте со тренер за вашето искуство и цели. Тренинзите треба да се приспособат на вашата способност и удобност."],
  ["Can I pause or cancel a plan?", "Може ли да го паузирам или откажам планот?"],
  ["Are fitness assessments included?", "Дали се вклучени проценки на подготвеноста?"],
  ["Testing is not necessary for everyone. Ask what a test measures, who conducts it, what it costs, and how the result would change your training plan.", "Тестирањето не е неопходно за секого. Прашајте што мери тестот, кој го спроведува, колку чини и како резултатот би го променил вашиот план."],
  ["Not sure which option fits?", "Не сте сигурни која опција ви одговара?"],
  ["Start with the", "Започнете со"],
  ["conversation.", "разговор."],
  ["Talk to the team", "Разговарајте со тимот"],
  ["Notes from the training floor", "Белешки од тренинг-салата"],
  ["Curiosity backed", "Љубопитност поткрепена"],
  ["by evidence.", "со докази."],
  ["Plain-language notes on the research behind strength, muscle growth, aerobic fitness, and tendon adaptation—with caveats included.", "Разбирливи белешки за истражувањата на сила, мускулен раст, аеробна подготвеност и приспособување на тетивите, со важните ограничувања."],
  ["01 / RESISTANCE TRAINING", "01 / ТРЕНИНГ СО ОТПОР"],
  ["Muscle growth: the useful fundamentals.", "Мускулен раст: корисни основи."],
  ["Resistance training can increase muscle size across a range of loads when sets provide a sufficiently challenging stimulus. More weekly sets can help up to a point, but volume is not a magic number and individual response and recovery matter. Start with manageable work, learn the movements, and adjust gradually.", "Тренингот со отпор може да ја зголеми мускулната маса при различни оптоварувања ако сериите даваат доволно силен стимул. Повеќе неделни серии може да помогнат до одредена мера, но обемот не е магичен број; важни се индивидуалниот одговор и опоравувањето. Започнете со поднослив обем, научете ги движењата и постепено приспособувајте."],
  ["Protein and overall nutrition also matter, but no single supplement or training style is essential for everyone. For medical or dietary needs, seek advice from an appropriately qualified professional.", "Важни се и протеините и вкупната исхрана, но ниту еден додаток или стил на тренинг не е неопходен за секого. За медицински или диететски потреби побарајте совет од соодветно квалификуван професионалец."],
  ["Research:", "Истражување:"],
  ["02 / TENDON ADAPTATION", "02 / ПРИСПОСОБУВАЊЕ НА ТЕТИВИТЕ"],
  ["Tendons adapt on their own timeline.", "Тетивите се приспособуваат со свое темпо."],
  ["Tendons respond to mechanical loading, and resistance training can improve tendon mechanical properties in healthy adults. Adaptation takes time and the evidence does not mean a given exercise prevents injury, treats a painful tendon, or suits every person. Progression, load management, symptoms, and individual health history all deserve attention.", "Тетивите реагираат на механичко оптоварување, а тренингот со отпор може да ги подобри нивните механички својства кај здрави возрасни лица. Приспособувањето бара време; доказите не значат дека одредена вежба спречува повреда, лекува болна тетива или одговара на секого. Важни се прогресијата, управувањето со оптоварувањето, симптомите и здравствената историја."],
  ["In practice, build training demands gradually and seek assessment from a clinician for persistent pain or injury concerns. A coach can support general exercise planning but should not diagnose or rehabilitate outside their qualifications.", "Во пракса, зголемувајте ги барањата постепено и побарајте проценка од клиничар за постојана болка или сомнеж за повреда. Тренер може да помогне со општо планирање на вежбањето, но не треба да поставува дијагноза или да спроведува рехабилитација надвор од своите квалификации."],
  ["03 / AEROBIC FITNESS", "03 / АЕРОБНА ПОДГОТВЕНОСТ"],
  ["VO₂ max is a measure, not a grade.", "VO₂ max е мерка, а не оценка."],
  ["VO₂ max is a measure of maximal oxygen uptake during exercise. Direct measurement uses gas-analysis equipment during a structured test; consumer wearables provide estimates and should not be described as equivalent clinical measurements. Test results depend on protocol, effort, equipment, and testing conditions.", "VO₂ max ја мери максималната потрошувачка на кислород за време на вежбање. Директното мерење користи опрема за анализа на гасови при структуриран тест; паметните уреди даваат проценки што не се еднакви на клинички мерења. Резултатите зависат од протоколот, напорот, опремата и условите."],
  ["Training can improve cardiorespiratory fitness, but hard exercise tests are not appropriate for everyone. Use qualified staff, sensible pre-test screening, and medical guidance where health concerns warrant it.", "Тренингот може да ја подобри кардиореспираторната подготвеност, но интензивните тестови не се соодветни за секого. Користете квалификуван персонал, разумна проценка пред тестирањето и медицинско водство кога тоа го бара здравствената состојба."],
  ["04 / NUTRITION & RECOVERY", "04 / ИСХРАНА И ОПОРАВУВАЊЕ"],
  ["Support training outside the gym.", "Поддржете го тренингот и надвор од салата."],
  ["Consistent training, adequate recovery, and a sustainable nutrition pattern work together. A meta-analysis found that protein supplementation can modestly support resistance-training adaptations when paired with exercise, with benefits depending on total intake and context. It is not a requirement to buy supplements.", "Редовниот тренинг, соодветното опоравување и одржливата исхрана делуваат заедно. Мета-анализа покажала дека протеинските додатоци може умерено да го поддржат приспособувањето на тренингот со отпор, зависно од вкупниот внес и контекстот. Не мора да купувате додатоци."],
  ["This journal is general education, not medical advice. Research findings do not predict an individual outcome; study methods and populations vary. Speak with a healthcare professional about symptoms, medical conditions, or nutrition needs.", "Овој блог нуди општа едукација, а не медицински совет. Истражувањата не го предвидуваат исходот кај поединец; методите и испитуваните групи се разликуваат. За симптоми, здравствени состојби или потреби во исхраната разговарајте со здравствен работник."],
  ["Put principles into practice", "Применете ги принципите во пракса"],
  ["Bring a question to your", "Понесете прашање на"],
  ["next session.", "следниот тренинг."],
  ["Talk to a coach", "Разговарајте со тренер"],
  ["Project privacy information", "Информации за приватноста на проектот"],
  ["Clear about", "Јасни информации за"],
  ["the details.", "деталите."],
  ["This is not legal advice and is not a substitute for a real privacy notice. Update it to reflect the actual operator, jurisdiction, services, and applicable law before publishing.", "Ова не е правен совет и не ја заменува вистинската политика за приватност. Пред објавување, ажурирајте ја според вистинскиот оператор, надлежност, услуги и применливи закони."],
  ["Contact forms", "Контакт-форми"],
  ["When you submit an enquiry, your name, email address, selected topic, and message are sent to FormSubmit (formsubmit.co), which processes and forwards them to support@fitnesslab.com. Do not include sensitive health or other confidential information. FormSubmit may process and retain submissions under its own terms and privacy policy. The recipient must activate the form by confirming the service’s first verification email before delivery is enabled. Contact FormSubmit for questions about its processing or retention; contact FitnessLab to ask about your enquiry.", "Кога ќе испратите прашање, вашето име, е-пошта, избраната тема и пораката се испраќаат до FormSubmit (formsubmit.co), кој ги обработува и проследува до support@fitnesslab.com. Не внесувајте чувствителни здравствени или други доверливи информации. FormSubmit може да ги обработува и чува податоците според сопствените услови и политика за приватност. Примачот мора да ја потврди првата верификациска е-порака за да се активира испраќањето. За обработката или чувањето контактирајте го FormSubmit; за вашето прашање контактирајте го FitnessLab."],
  ["Cookie notice preference", "Избор за известувањето за колачиња"],
  ["External resources", "Надворешни ресурси"],
  ["Google Fonts, externally hosted photographs, and linked research pages may be loaded from or opened at third-party services. Those providers may receive technical information according to their own policies. Consider self-hosting fonts and images and review external-link choices before launch.", "Google Fonts, фотографии хостирани надворешно и поврзани истражувачки страници може да се вчитаат од услуги на трети страни. Тие провајдери може да добијат технички информации според сопствените политики. Пред објавување, размислете за локално хостирање на фонтови и слики и проверете ги надворешните врски."],
  ["Fitness and health information", "Информации за физичка подготвеност и здравје"],
  ["Training articles and assessment descriptions are general educational material, not medical advice. Do not use a website assessment to diagnose a condition or replace advice from a qualified healthcare professional.", "Статиите за тренинг и описите на проценките се општ едукативен материјал, а не медицински совет. Не користете веб-проценка за дијагноза или како замена за совет од квалификуван здравствен работник."],
  ["Questions", "Прашања"],
  ["Contact FitnessLab at", "Контактирајте го FitnessLab на"],
  ["About FitnessLab — Train with intent", "За FitnessLab — Тренирајте со намера"],
  ["Programs & lab — FitnessLab", "Програми и лабораторија — FitnessLab"],
  ["Coaches — FitnessLab", "Тренери — FitnessLab"],
  ["Membership — FitnessLab", "Членство — FitnessLab"],
  ["Journal — FitnessLab", "Блог — FitnessLab"],
  ["Contact FitnessLab — Start a conversation", "Контактирајте го FitnessLab — Започнете разговор"],
  ["Privacy & cookies — FitnessLab", "Приватност и колачиња — FitnessLab"],
  ["FitnessLab — Training, measured with care", "FitnessLab — Тренинг со внимателно следење"],
  ["The FitnessLab approach: evidence-informed strength, conditioning, and human-first coaching.", "Пристапот на FitnessLab: сила и кондиција засновани на докази и тренерско водство со човекот во преден план."],
  ["Explore FitnessLab strength, hypertrophy, aerobic fitness, VO2 assessment, tendon-capacity, and personal coaching programs.", "Разгледајте ги програмите на FitnessLab за сила, хипертрофија, аеробна подготвеност, VO₂ проценка, капацитет на тетивите и индивидуален тренинг."],
  ["Evidence-informed FitnessLab notes about hypertrophy, aerobic fitness, tendon adaptation, and practical training.", "Белешки на FitnessLab засновани на докази за хипертрофија, аеробна подготвеност, приспособување на тетивите и практичен тренинг."],
  ["Contact FitnessLab to ask about training, memberships, lab assessments, or arranging an introductory visit.", "Контактирајте го FitnessLab за прашања за тренинг, членства, лабораториски проценки или воведна посета."],
  ["Enter your email", "Внесете ја вашата е-пошта"],
  ["NO ONE-SIZE-FITS-ALL PLAN", "НЕМА УНИВЕРЗАЛЕН ПЛАН"],
  ["Coaching that fits real life.", "Тренерско водство што одговара на реалниот живот."],
  ["ONE-TO-ONE", "ЕДЕН НА ЕДЕН"],
  ["Start with your goals and experience. Build a plan you can learn and repeat.", "Започнете со вашите цели и искуство. Изградете план што можете да го научите и повторувате."],
  ["Talk through a plan", "Разговарајте за планот"],
  ["SMALL GROUPS", "МАЛИ ГРУПИ"],
  ["Coach-led classes", "Тренинзи со тренер"],
  ["Strength and conditioning sessions with clear coaching and ways to scale the work.", "Тренинзи за сила и кондиција со јасно водство и можност за приспособување."],
  ["FIRST SESSION", "ПРВ ТРЕНИНГ"],
  ["Start with a conversation", "Започнете со разговор"],
  ["Tell us what you are looking for and ask questions before choosing a membership.", "Кажете ни што барате и поставете прашања пред да изберете членство."],
  ["Plan an intro", "Закажете воведен тренинг"],
  ["LET'S FIND A GOOD STARTING POINT", "ДА ПРОНАЈДЕМЕ ДОБРА ПОЧЕТНА ТОЧКА"],
  ["journal.html#muscle-growth", "journal.html#muscle-growth"],
  ["Hypertrophy is a process, ", "Хипертрофијата е процес, "],
  ["not a trick.", "а не трик."],
  ["what are you", "што сакате"],
  ["Muscle Growth: the useful fundamentals.", "Мускулен раст: корисни основи."],
  ["Schoenfeld, Ogborn & Krieger (2017),", "Schoenfeld, Ogborn & Krieger (2017),"],
  ["Dose-response relationship between weekly resistance training volume and increases in muscle mass", "Односот меѓу неделниот обем на тренинг со отпор и зголемувањето на мускулната маса"],
  ["Journal of Sports Sciences ↗", "Journal of Sports Sciences ↗"],
  ["Mechanical, material and morphological adaptations of healthy lower limb tendons to mechanical loading: a systematic review and meta-analysis", "Механичко и морфолошко приспособување на здравите тетиви на долните екстремитети кон оптоварување: систематски преглед и мета-анализа"],
  ["Journal of Applied Physiology ↗", "Journal of Applied Physiology ↗"],
  ["CDC physical activity guidance ↗", "Упатства на CDC за физичка активност ↗"],
  ["British Journal of Sports Medicine ↗", "British Journal of Sports Medicine ↗"],
  ["Journal of Sports Sciences", "Journal of Sports Sciences"],
  ["FitnessLab is committed to helping you build strength.", "FitnessLab ви помага да ја развивате силата."],
  ["A TRAINING STUDIO WITH A LAB MINDSET", "ТРЕНИНГ-СТУДИО СО ЛАБОРАТОРИСКИ ПРИСТАП"],
  ["THE FITNESSLAB IDEA", "ИДЕЈАТА НА FITNESSLAB"],
  ["THE LAB, WITHOUT THE HYPE", "ЛАБОРАТОРИЈА БЕЗ СЕНЗАЦИОНАЛИЗАМ"],
  ["GOOD DATA. BETTER CONVERSATIONS.", "ДОБРИ ПОДАТОЦИ. ПОДОБРИ РАЗГОВОРИ."],
  ["SIGNATURE TRAINING", "ПРЕПОЗНАТЛИВИ ТРЕНИНЗИ"],
  ["MUSCLE GROWTH / STRENGTH", "МУСКУЛЕН РАСТ / СИЛА"],
  ["TENDON CAPACITY / LOADING", "КАПАЦИТЕТ НА ТЕТИВИТЕ / ОПТОВАРУВАЊЕ"],
  ["Conditioning", "Кондиција"],
  ["MEET YOUR COACHING TEAM", "ЗАПОЗНАЈТЕ ГО ТРЕНЕРСКИОТ ТИМ"],
  ["Hypertrophy", "Хипертрофија"],
  ["A GOOD FIT MATTERS", "ВАЖНО Е ДА НАЈДЕТЕ СООДВЕТЕН ТРЕНЕР"],
  ["SIMPLE / FLEXIBLE / BUILT AROUND YOU", "ЕДНОСТАВНО / ФЛЕКСИБИЛНО / ПРИСПОСОБЕНО ЗА ВАС"],
  ["Training notes to help you track sessions", "Белешки за следење на тренинзите"],
  ["GOOD TO KNOW", "КОРИСНИ ИНФОРМАЦИИ"],
  ["NOT SURE WHICH OPTION FITS?", "НЕ СТЕ СИГУРНИ КОЈА ОПЦИЈА ВИ ОДГОВАРА?"],
  ["NOTES FROM THE TRAINING FLOOR", "БЕЛЕШКИ ОД ТРЕНИНГ-САЛАТА"],
  ["For a practical overview, see the", "За практичен преглед, погледнете ги"],
  ["A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains", "Систематски преглед, мета-анализа и мета-регресија за влијанието на протеинските додатоци врз придобивките од тренингот со отпор"],
  ["PUT PRINCIPLES INTO PRACTICE", "ПРИМЕНЕТЕ ГИ ПРИНЦИПИТЕ ВО ПРАКСА"],
  ["QUESTIONS ARE A GREAT PLACE TO START", "ПРАШАЊАТА СЕ ДОБАР ПОЧЕТОК"],
  ["CONTACT DETAILS", "КОНТАКТ-ИНФОРМАЦИИ"],
  ["SEND AN ENQUIRY", "ИСПРАТЕТЕ ПРАШАЊЕ"],
  ["or +389 70 214 761.", "или +389 70 214 761."],
  ["BASELINE", "ПОЧЕТНА ВРЕДНОСТ"],
  ["COACH-LED", "СО ТРЕНЕР"],
  ["Find your trainer.", "Пронајдете го вашиот тренер."],
  ["Choose a coach, view their current weekly availability, and reserve a one-hour training session.", "Изберете тренер, проверете ја неговата неделна достапност и закажете едночасовен тренинг."],
  ["COACHING / AVAILABILITY / BOOKINGS", "ТРЕНЕРСКО ВОДСТВО / ДОСТАПНОСТ / ЗАКАЖУВАЊА"],
  ["THE TEAM", "ТИМОТ"],
  ["Meet your coaches.", "Запознајте ги тренерите."],
  ["Loading trainers…", "Тренерите се вчитуваат…"],
  ["BOOK A SESSION", "ЗАКАЖЕТЕ ТРЕНИНГ"],
  ["Choose a time that", "Изберете термин што"],
  ["works for you.", "ви одговара."],
  ["After booking, call", "По закажувањето, јавете се на"],
  ["if you need to change or cancel your session.", "ако треба да го промените или откажете терминот."],
  ["Trainer", "Тренер"],
  ["Choose a trainer and date", "Изберете тренер и датум"],
  ["Available time", "Слободен термин"],
  ["Your name", "Вашето име"],
  ["Phone number", "Телефонски број"],
  ["What would you like to work on?", "На што би сакале да работите?"],
  ["Book training session", "Закажете тренинг"],
  ["Your booking details are saved to FitnessLab’s appointment database.", "Податоците за закажувањето се зачувуваат во базата за термини на FitnessLab."],
  ["Appointments will be available after FitnessLab adds its trainers and weekly availability.", "Закажувањето ќе биде достапно откако FitnessLab ќе ги додаде тренерите и нивната неделна достапност."],
  ["The booking service is unavailable. Try again later or call +389 70 214 761.", "Услугата за закажување не е достапна. Обидете се подоцна или јавете се на +389 70 214 761."],
  ["Your appointment is booked and saved. To change or cancel it, call +389 70 214 761.", "Терминот е закажан и зачуван. За промена или откажување, јавете се на +389 70 214 761."],
  ["Saving your appointment…", "Терминот се зачувува…"],
  ["We couldn't complete the request. Check your connection or contact FitnessLab.", "Барањето не можеше да се заврши. Проверете ја врската или контактирајте го FitnessLab."],
  ["Choose a valid trainer and a date in the next 60 days.", "Изберете тренер и датум во следните 60 дена."],
  ["That trainer has no matching availability for this session.", "Тренерот нема достапност за овој термин."],
  ["That session was just booked. Please choose another time.", "Овој термин штотуку е закажан. Изберете друго време."],
  ["Choose a date within the next 60 days.", "Изберете датум во следните 60 дена."],
  ["BOOK A SESSION", "ЗАКАЖЕТЕ ТРЕНИНГ"],
  ["Trainer admin — FitnessLab", "Администратор на тренери — FitnessLab"],
  ["FITNESSLAB / STAFF ACCESS", "FITNESSLAB / ПРИСТАП ЗА ПЕРСОНАЛ"],
  ["Trainer schedule.", "Распоред на тренери."],
  ["Add and update team profiles, set weekly hours, and review or cancel upcoming appointments.", "Додавајте и ажурирајте профили, поставувајте неделна достапност и прегледувајте или откажувајте термини."],
  ["Trainer bookings", "Закажувања со тренери"],
  ["Sign in to manage bookings.", "Најавете се за да управувате со термините."],
  ["Admin password", "Администраторска лозинка"],
  ["Sign in", "Најави се"],
  ["TRAINER DETAILS", "ПОДАТОЦИ ЗА ТРЕНЕРОТ"],
  ["Add a trainer", "Додај тренер"],
  ["New trainer", "Нов тренер"],
  ["Short biography", "Кратка биографија"],
  ["Weekly availability · 60-minute appointments", "Неделна достапност · едночасовни термини"],
  ["Choose one continuous block on each available day. Start and end times use whole hours.", "Изберете еден непрекинат временски блок за секој достапен ден. Почетокот и крајот се на цел час."],
  ["Accept new appointments", "Прифаќајте нови закажувања"],
  ["Save trainer", "Зачувај тренер"],
  ["Deactivate trainer", "Деактивирај тренер"],
  ["UPCOMING", "ПРЕТСТОЈНИ"],
  ["Booked sessions", "Закажани тренинзи"],
  ["Refresh", "Освежи"],
  ["Bookings are stored on this server.", "Термините се зачувуваат на овој сервер."],
  ["Choose a trainer", "Изберете тренер"],
  ["No available times", "Нема слободни термини"],
  ["Couldn't load times", "Термините не можеа да се вчитаат"],
  ["Choose a time", "Изберете термин"],
  ["Couldn't load trainers.", "Тренерите не можеа да се вчитаат."],
  ["There are no upcoming appointments.", "Нема претстојни термини."],
  ["Edit trainer", "Измени тренер"],
  ["Save changes", "Зачувај измени"],
  ["Edit", "Измени"],
  ["inactive", "неактивен"],
  ["Trainer and availability saved.", "Тренерот и достапноста се зачувани."],
  ["Cancel appointment", "Откажи термин"],
  ["CANCELLED", "ОТКАЖАНО"],
  ["Cancel this appointment?", "Да го откажам овој термин?"],
  ["The admin password is incorrect.", "Администраторската лозинка е погрешна."],
  ["Couldn't load the admin dashboard.", "Администраторскиот панел не може да се вчита."],
  ["Couldn't save that trainer.", "Тренерот не може да се зачува."],
  ["The schedule must include at least one day with one or more 60-minute slots.", "Распоредот мора да вклучува најмалку еден ден со достапен термин од 60 минути."],
  ["Couldn't save that booking. Please contact FitnessLab.", "Терминот не може да се зачува. Контактирајте го FitnessLab."],
  ["Trainers — FitnessLab", "Тренери — FitnessLab"],
  ["Meet the FitnessLab trainers, check live availability, and book a training session.", "Запознајте ги тренерите на FitnessLab, проверете ја достапноста и закажете тренинг."],
  ["Appointment saved.", "Терминот е зачуван."],
  ["The trainer schedule could not be saved.", "Распоредот на тренерот не може да се зачува."],
  ["The scheduled time is not available.", "Избраниот термин не е достапен."],
  ["New appointments", "Нови закажувања"],
  ["Monday", "Понеделник"],
  ["Tuesday", "Вторник"],
  ["Wednesday", "Среда"],
  ["Thursday", "Четврток"],
  ["Friday", "Петок"],
  ["Saturday", "Сабота"],
  ["Sunday", "Недела"]
]);

Object.assign(mkTranslations, Object.fromEntries([
  ["Your cookie-notice choice is saved in your browser.", "Вашиот избор за известувањето за колачиња се зачувува во прелистувачот."],
  ["Start with a conversation", "Започнете со разговор"],
  ["Training", "Тренинг"],
  ["Coaching", "Тренерско водство"],
  ["Measurement", "Мерење"],
  ["Progress", "Напредок"],
  ["Strength, aerobic fitness, and movement.", "Сила, аеробна подготвеност и движење."],
  ["Plans shaped around your goals and experience.", "Планови приспособени на вашите цели и искуство."],
  ["Measure only when it helps guide training.", "Мерете само кога мерењето помага во планирањето на тренингот."],
  ["Build gradually and make room to recover.", "Напредувајте постепено и оставете време за опоравување."],
  ["Training Principles", "Принципи на тренинг"],
  ["Progressive training", "Прогресивен тренинг"],
  ["Tendon capacity", "Капацитет на тетивите"],
  ["Evidence-Informed Training", "Тренинг заснован на докази"],
  ["Training Approaches", "Пристапи кон тренингот"],
  ["Strength, aerobic fitness, and movement practice shaped around progressive training and recovery.", "Сила, аеробна подготвеност и движење, со прогресивен тренинг и соодветно опоравување."],
  ["PROGRESSIVE LOAD", "ПРОГРЕСИВНО ОПТОВАРУВАЊЕ"],
  ["STRENGTH / MUSCLE", "СИЛА / МУСКУЛИ"],
  ["Individual progression", "Индивидуална прогресија"],
  ["Resistance training can support muscle growth when effort, volume, and recovery are appropriate to the individual.", "Тренингот со отпор може да го поддржи мускулниот раст кога напорот, обемот и опоравувањето се соодветни за поединецот."],
  ["Explore hypertrophy training", "Истражете го тренингот за хипертрофија"],
  ["AEROBIC FITNESS", "АЕРОБНА ПОДГОТВЕНОСТ"],
  ["AEROBIC CAPACITY", "АЕРОБЕН КАПАЦИТЕТ"],
  ["Training principle", "Принцип на тренинг"],
  ["Aerobic training can range from easy, sustainable efforts to harder intervals. Match the work to your fitness and experience.", "Аеробниот тренинг може да се движи од лесни, одржливи напори до поинтензивни интервали. Приспособете го на вашата подготвеност и искуство."],
  ["Explore aerobic fitness", "Истражете ја аеробната подготвеност"],
  ["MOVEMENT", "ДВИЖЕЊЕ"],
  ["TENDON CAPACITY", "КАПАЦИТЕТ НА ТЕТИВИТЕ"],
  ["Progress gradually", "Напредувајте постепено"],
  ["Comfortable movement and gradual loading can help build capacity over time. Training is not injury treatment.", "Удобното движење и постепеното оптоварување можат да помогнат во развојот на капацитетот. Тренингот не е лекување повреди."],
  ["Explore tendon loading", "Истражете го оптоварувањето на тетивите"],
  ["Personal Coaching", "Индивидуално тренерско водство"],
  ["TRAINING NOTES", "БЕЛЕШКИ ЗА ТРЕНИНГ"],
  ["Usefully measured", "Мерење со цел"],
  ["Progress you can understand", "Напредок што можете да го разберете"],
  ["Training notes and repeatable measures can help make progress easier to discuss. No single measure defines health or fitness.", "Белешките за тренинг и повторливите мерења можат да го олеснат разговорот за напредокот. Ниту едно мерење само по себе не ја одредува здравствената или физичката подготвеност."],
  ["Discuss personal training", "Прашајте за индивидуален тренинг"],
  ["A training-lab mindset: use evidence, individual context, and clear progressions instead of performance gimmicks.", "Лабораториски пристап кон тренингот: докази, индивидуален контекст и јасни прогресии наместо трикови за перформанси."],
  ["Coaching begins with listening", "Тренерското водство започнува со слушање"],
  ["Good coaching starts with your goals, experience, schedule, and questions. View current trainer profiles and availability before booking.", "Доброто тренерско водство ги зема предвид вашите цели, искуство, распоред и прашања. Разгледајте ги профилите и достапноста пред да закажете."],
  ["View the current trainer team ↗", "Погледнете го тренерскиот тим ↗"],
  ["Recovery supports progress", "Опоравувањето го поддржува напредокот"],
  ["Sleep, manageable training loads, and time between hard sessions all contribute to recovery. Training should leave room to adapt.", "Сонот, контролираното оптоварување и времето меѓу интензивните тренинзи придонесуваат за опоравување. Тренингот треба да овозможи адаптација."],
  ["Sleep", "Сон"],
  ["Gradual progression", "Постепена прогресија"],
  ["Measure with purpose", "Мерете со цел"],
  ["Keep the person in the picture", "Секогаш имајте го човекот предвид"],
  ["Measurements can inform a conversation, but they cannot tell the whole story. Ask what a test measures and how its results will be used.", "Мерењата можат да помогнат во разговорот, но не ја кажуваат целата приказна. Прашајте што мери тестот и како ќе се користат резултатите."],
  ["Context matters", "Контекстот е важен"],
  ["Ask a question →", "Поставете прашање →"],
  ["Training Team", "Тренерски тим"],
  ["Meet your trainer.", "Запознајте го вашиот тренер."],
  ["View current trainer profiles, check live availability, and request a session online.", "Погледнете ги профилите на тренерите, проверете ја достапноста и побарајте термин онлајн."],
  ["Meet the team and book a session", "Запознајте го тимот и закажете тренинг"],
  ["Membership", "Членство"],
  ["Find your starting point", "Пронајдете ја вашата почетна точка"],
  ["Ask the team about current access, coaching options, availability, and membership terms.", "Прашајте го тимот за моменталниот пристап, тренерските опции, достапноста и условите за членство."],
  ["01 / TRAINING", "01 / ТРЕНИНГ"],
  ["Independent training", "Самостоен тренинг"],
  ["Ask about available gym access, facilities, opening hours, and the terms that apply.", "Прашајте за пристапот до салата, достапните содржини, работното време и важечките услови."],
  ["Ask about access", "Прашајте за пристап"],
  ["02 / COACHING", "02 / ТРЕНЕРСКО ВОДСТВО"],
  ["Coached training", "Тренинг со тренер"],
  ["Discuss your goals and ask which coaching or group options are currently available.", "Разговарајте за вашите цели и прашајте кои индивидуални или групни опции се достапни."],
  ["Ask about coaching", "Прашајте за тренерско водство"],
  ["03 / ONE-TO-ONE", "03 / ИНДИВИДУАЛНО"],
  ["Share your goals and ask about one-to-one training availability and current rates.", "Споделете ги вашите цели и прашајте за достапноста и цените на индивидуалните тренинзи."],
  ["Ask about personal training", "Прашајте за индивидуален тренинг"],
  ["Current availability", "Тековна достапност"],
  ["Book with a trainer.", "Закажете тренинг со тренер."],
  ["Available times are shown from the team’s current schedule.", "Прикажаните термини се според тековниот распоред на тимот."],
  ["Choose an active trainer and a suitable time to request a one-hour session. Bookings are confirmed against live availability.", "Изберете активен тренер и соодветен термин за да побарате едночасовен тренинг. Закажувањата се проверуваат според достапноста."],
  ["View trainer availability", "Погледнете ја достапноста на тренерите"],
  ["Can I visit before joining?", "Може ли да посетам пред да се зачленам?"],
  ["Contact the team to ask about visiting and any current introductory options.", "Контактирајте го тимот за посета и моменталните воведни опции."],
  ["What are the membership terms?", "Кои се условите за членство?"],
  ["Ask the team for current pricing, billing, cancellation, and pause terms before joining.", "Пред зачленување, прашајте за тековните цени, наплата, откажување и паузирање."],
  ["This notice explains how information is handled when you contact FitnessLab or request a training appointment.", "Ова известување објаснува како се обработуваат податоците кога контактирате со FitnessLab или барате термин за тренинг."],
  ["This notice explains how information is handled when you contact FitnessLab, create an account, or request a training appointment.", "Ова известување објаснува како се обработуваат податоците кога контактирате со FitnessLab, создавате сметка или барате термин за тренинг."],
  ["Enquiries submitted through the website are sent to FormSubmit (formsubmit.co), which processes and forwards them to support@fitnesslab.com. The information submitted may include your name, email address, selected topic, and message. FormSubmit handles submissions under its own terms and privacy policy. Do not include sensitive health or confidential information in an enquiry.", "Прашањата испратени преку веб-страницата се доставуваат до FormSubmit (formsubmit.co), кој ги обработува и проследува до support@fitnesslab.com. Податоците може да ги вклучуваат вашето име, е-пошта, избраната тема и пораката. FormSubmit ги обработува пријавите според сопствените услови и политика за приватност. Не внесувајте чувствителни здравствени или доверливи информации."],
  ["When you request an appointment, the website stores your name, email address, selected trainer and appointment time, and any optional phone number or message in the FitnessLab booking database. When you book while signed in, the appointment is also linked to your account so you can view it on your account page. Authorized staff can view and manage bookings. Booking details are not automatically sent by email. Contact FitnessLab to ask about, change, or cancel a booking.", "Кога барате термин, веб-страницата ги зачувува вашето име, е-пошта, избраниот тренер и време, како и изборниот телефонски број или порака, во базата за закажувања на FitnessLab. Кога закажувате додека сте најавени, терминот се поврзува со вашата сметка за да можете да го прегледате на страницата на сметката. Овластениот персонал може да ги прегледува и управува термините. Деталите за закажување не се испраќаат автоматски по е-пошта. Контактирајте го FitnessLab за прашања, промена или откажување."],
  ["When you request an appointment, the website stores your name, email address, selected trainer and appointment time, and any optional phone number or message in the FitnessLab booking database. If you book while signed in, the appointment is linked to your account and appears on your account page. Authorized staff can view and manage bookings. Booking details are not automatically sent by email. Contact FitnessLab to ask about, change, or cancel a booking.", "Кога барате термин, веб-страницата ги зачувува вашето име, е-пошта, избраниот тренер и време, како и изборниот телефонски број или порака, во базата за закажувања на FitnessLab. Ако закажувате додека сте најавени, терминот се поврзува со вашата сметка и се прикажува на нејзината страница. Овластениот персонал може да ги прегледува и управува термините. Деталите за закажување не се испраќаат автоматски по е-пошта. Контактирајте го FitnessLab за прашања, промена или откажување."],
  ["Progress entries and account-linked bookings are stored in the FitnessLab database. Progress is available when you sign in on another device, and is separate from bookings. You can delete progress entries individually or clear your full log from the progress page. Account-linked bookings appear on your account page. Contact FitnessLab at", "Записите за напредок и закажувањата поврзани со сметката се чуваат во базата на FitnessLab. Напредокот е достапен кога ќе се најавите на друг уред и е одделен од закажувањата. Записите може да ги бришете поединечно или да го избришете целиот дневник од страницата за напредок. Закажувањата поврзани со сметката се прикажуваат на страницата на сметката. За прашања за податоците контактирајте го FitnessLab на"],
  ["with questions about account data. Do not enter medical or highly sensitive details.", "за прашања за податоците од сметката. Не внесувајте медицински или многу чувствителни податоци."],
  ["Account registration collects your name, email address, and password. Passwords are stored as salted, one-way hashes. Sign-in sessions use an HttpOnly cookie and expire after seven days. Account progress entries and bookings linked while signed in are stored in the FitnessLab database. Do not enter medical or highly sensitive information in progress notes.", "При регистрацијата на сметка се собираат вашето име, адреса на е-пошта и лозинка. Лозинките се чуваат како еднонасочни хеш-вредности со сол. Сесиите за најава користат HttpOnly колаче и истекуваат по седум дена. Записите за напредок и закажувањата поврзани со сметката додека сте најавени се чуваат во базата на FitnessLab. Не внесувајте медицински или многу чувствителни информации во белешките за напредок."],
  ["Account and progress data are stored in the FitnessLab database. Your account is available across devices. The progress log is separate from bookings unless you book while signed in, in which case the appointment is linked to your account. Do not enter medical or highly sensitive details.", "Податоците за сметката и напредокот се чуваат во базата на FitnessLab. Сметката е достапна од различни уреди. Дневникот за напредок е одделен од закажувањата, освен кога закажувате додека сте најавени — тогаш терминот се поврзува со сметката. Не внесувајте медицински или многу чувствителни податоци."],
  ["Your language selection and cookie-notice preference are saved in your browser’s local storage. These preferences are not submitted to FitnessLab. This website does not intentionally use advertising or analytics cookies.", "Избраниот јазик и поставката за известување за колачиња се зачувуваат во локалното складиште на прелистувачот. Овие поставки не се испраќаат до FitnessLab. Веб-страницата намерно не користи рекламни или аналитички колачиња."],
  ["Account and progress records are stored in the FitnessLab database. Sign in to your account to access them across devices. Progress entries can be deleted individually or cleared from the progress page. Account-linked bookings can be viewed on your account page. Contact FitnessLab at support@fitnesslab.com for questions about account data.", "Податоците за сметката и напредокот се чуваат во базата на FitnessLab. Најавете се за да им пристапите од различни уреди. Записите за напредок може да се бришат поединечно или да се избрише целиот дневник. Закажувањата поврзани со сметката може да се прегледаат на страницата на сметката. За прашања во врска со податоците од сметката, контактирајте го FitnessLab на support@fitnesslab.com."],
  ["Google Fonts and externally hosted photographs may be loaded from third-party services. Links to maps and research pages open external websites. Those providers may receive technical information according to their own policies.", "Google Fonts и фотографии хостирани надворешно може да се вчитуваат од услуги на трети страни. Линковите до мапи и истражувања отвораат надворешни веб-страници. Тие провајдери може да добијат технички информации според сопствените политики."],
  ["Current availability", "Тековна достапност"],
  ["Find a session time", "Пронајдете термин"],
  ["View current trainer availability and request a one-hour appointment.", "Погледнете ја тековната достапност на тренерите и побарајте едночасовен термин."],
  ["View availability", "Погледнете ја достапноста"],
  ["Tell us what you are looking for and ask the team about current options, availability, and membership terms.", "Кажете ни што барате и прашајте го тимот за моменталните опции, достапност и услови за членство."],
  ["Train independently", "Тренирајте самостојно"],
  ["Ask about current options.", "Прашајте за моменталните опции."],
  ["Ask us", "Прашајте нè"],
  ["current availability", "тековна достапност"],
  ["Confirm current access options", "Проверете ги опциите за пристап"],
  ["Ask which facilities are available", "Прашајте кои содржини се достапни"],
  ["Review membership terms before joining", "Прегледајте ги условите пред зачленување"],
  ["Train with a coach", "Тренирајте со тренер"],
  ["Talk through your training experience", "Разговарајте за вашето тренинг-искуство"],
  ["Ask about coaching formats and schedules", "Прашајте за видовите тренинг и распоредите"],
  ["Agree what suits your goals", "Договорете што одговара на вашите цели"],
  ["Personal training", "Индивидуален тренинг"],
  ["Discuss your goals and experience", "Разговарајте за вашите цели и искуство"],
  ["Ask about session times and rates", "Прашајте за термините и цените"],
  ["Review the plan before you book", "Прегледајте го планот пред да закажете"],
  ["Progress, measured over time", "Напредок што се следи низ време"],
  ["What guides a useful plan", "Што го насочува добриот план"],
  ["01 / CONTEXT", "01 / КОНТЕКСТ"],
  ["Start with the person", "Започнете од човекот"],
  ["Goals, experience, schedule, and preferences all help shape an appropriate starting point.", "Целите, искуството, распоредот и преференциите помагаат да се избере соодветна почетна точка."],
  ["02 / MEASUREMENT", "02 / МЕРЕЊЕ"],
  ["Ask a clear question", "Поставете јасно прашање"],
  ["Use a measure only when it can help explain progress or guide a training decision.", "Користете мерење само кога може да го објасни напредокот или да насочи одлука за тренинг."],
  ["03 / ADAPTATION", "03 / АДАПТАЦИЈА"],
  ["Make room to recover", "Оставете време за опоравување"],
  ["Progressive training works over time. Adjust effort and volume to suit the individual.", "Прогресивниот тренинг делува со текот на времето. Приспособете го напорот и обемот на поединецот."],
  ["Find a good place to begin.", "Пронајдете добра почетна точка."],
  ["Tell us what you are looking for and ask about current programs, training options, or memberships. For a trainer appointment, view live availability.", "Кажете ни што барате и прашајте за тековните програми, тренинг-опции или членства. За термин со тренер, проверете ја достапноста."],
  ["View trainer availability ↗", "Погледнете ја достапноста на тренерите ↗"],
  ["Your message is sent to the FitnessLab team by email.", "Вашата порака се испраќа по е-пошта до тимот на FitnessLab."],
  ["Send enquiry", "Испратете прашање"],
  ["What is the membership policy?", "Која е политиката за членство?"],
  ["Explore FitnessLab training options and contact the team about current availability and membership details.", "Разгледајте ги опциите за тренинг на FitnessLab и прашајте го тимот за тековна достапност и условите за членство."],
  ["FitnessLab pairs thoughtful strength training, aerobic conditioning, and movement coaching with honest progress tracking.", "FitnessLab ги поврзува внимателниот тренинг за сила, аеробната кондиција и тренингот за движење со искрено следење на напредокот."],
  ["Contact FitnessLab to ask about training, memberships, lab assessments, or arranging an introductory visit.", "Контактирајте го FitnessLab за тренинг, членства, лабораториски проценки или воведна посета."],
  ["How FitnessLab handles website enquiries, training bookings, and browser preferences.", "Како FitnessLab ги обработува прашањата, закажувањата и поставките на прелистувачот."],
  ["PRIVACY INFORMATION", "ИНФОРМАЦИИ ЗА ПРИВАТНОСТА"],
  ["Contact enquiries", "Прашања преку контакт-формата"],
  ["Browser preferences", "Поставки на прелистувачот"],
  ["Training articles and assessment descriptions are general educational information, not medical advice. Do not use a website assessment to diagnose a condition or replace advice from a qualified healthcare professional.", "Написите за тренинг и описите на проценките се општи едукативни информации, а не медицински совет. Не користете веб-проценка за дијагноза или како замена за совет од квалификуван здравствен работник."],
  ["Find your", "Пронајдете го вашиот"],
  ["trainer.", "тренер."],
  ["starting point.", "почеток."],
  ["AEROBIC FITNESS / VO₂ MAX", "АЕРОБНА ПОДГОТВЕНОСТ / VO₂ MAX"],
  ["Aerobic fitness", "Аеробна подготвеност"],
  ["CURRENT AVAILABILITY", "ТЕКОВНА ДОСТАПНОСТ"],
  ["Training bookings", "Термини за тренинг"],
  ["Wearable estimates are not the same as a supervised exercise test. Any maximal test requires suitable equipment, qualified personnel, informed consent, and appropriate safety screening. Contact the team to ask whether this assessment is currently available.", "Проценките од носливи уреди не се исто што и надгледуван тест. За максимален тест се потребни соодветна опрема, квалификуван персонал, информирана согласност и безбедносна проверка. Контактирајте го тимот за да прашате дали оваа проценка е достапна."],
  ["Discuss your exercise history and relevant health concerns with a qualified professional before strenuous testing. If maximal exercise is not appropriate, choose a suitable non-maximal alternative. Seek medical advice for symptoms or health conditions.", "Пред интензивно тестирање, разговарајте со квалификуван професионалец за вашето искуство и здравствени грижи. Ако максималното оптоварување не е соодветно, изберете немаксимална алтернатива. Побарајте медицински совет за симптоми или здравствени состојби."],
  ["Share your goals and experience, then ask the team about current one-to-one training options.", "Споделете ги вашите цели и искуство, а потоа прашајте го тимот за тековните индивидуални опции за тренинг."],
  ["TRAINER AVAILABILITY", "ДОСТАПНОСТ НА ТРЕНЕРИ"],
  ["Contact the team", "Контактирајте го тимот"],
  ["Sessions are one hour. Available times are based on each trainer’s published weekly schedule and update as sessions are booked. All times are local to Skopje.", "Тренинзите траат еден час. Слободните термини се според неделниот распоред на тренерите и се ажурираат при секое закажување. Сите термини се по локално време во Скопје."],
  ["TRAINING / COACHING / MEMBERSHIP", "ТРЕНИНГ / ТРЕНЕРСКО ВОДСТВО / ЧЛЕНСТВО"],
  ["/ current availability", "/ тековна достапност"],
  ["02 / COACHED TRAINING", "02 / ТРЕНИНГ СО ТРЕНЕР"],
  ["Discuss your goals and ask what coaching or group options are currently available.", "Разговарајте за вашите цели и прашајте кои индивидуални или групни опции се достапни."],
  ["View trainer availability and request a session ↗", "Погледнете ја достапноста на тренерите и побарајте термин ↗"],
  ["Trainer appointment", "Термин со тренер"],
  ["Your name, email, selected topic, and message are sent to FormSubmit and forwarded to support@fitnesslab.com. Do not include sensitive health or confidential information.", "Вашето име, е-пошта, избраната тема и пораката се испраќаат до FormSubmit и се проследуваат до support@fitnesslab.com. Не внесувајте чувствителни здравствени или доверливи информации."],
  ["Contact", "Контакт"],
  ["Ask the team about current opening hours, training options, and membership terms.", "Прашајте го тимот за тековното работно време, тренинг-опциите и условите за членство."],
  ["Ask a question ↗", "Поставете прашање ↗"],
  ["schedule.", "распоред."],
  ["Photo URL (optional)", "Адреса до фотографија (незадолжително)"],
  ["Use an HTTPS image URL or a path to an image in this site.", "Користете HTTPS адреса до слика или патека до слика на оваа веб-страница."],
  ["https://… or /assets/coaches/photo.jpg", "https://… или /assets/coaches/photo.jpg"],
  ["Upload a photo (optional)", "Поставете фотографија (незадолжително)"],
  ["JPEG, PNG, or WebP · up to 1.5 MB. A selected upload replaces the photo URL.", "JPEG, PNG или WebP · до 1,5 MB. Поставената слика ја заменува адресата до фотографијата."],
  ["Sign out", "Одјави се"]
]));
Object.assign(mkTranslations, Object.fromEntries([
  ["Progress log", "Дневник за напредок"],
  ["Find a coach", "Пронајдете тренер"],
  ["Choose your goal", "Изберете ја вашата цел"],
  ["Explore programs", "Разгледајте ги програмите"],
  ["A clear path forward", "Јасен пат напред"],
  ["Choose a goal. Build a plan. Review progress.", "Изберете цел. Изградете план. Следете го напредокот."],
  ["FitnessLab brings coaching, useful measures, and repeatable training together. Start with what matters to you; testing is optional and only useful when it helps guide a decision.", "FitnessLab ги обединува тренерското водство, корисните мерења и редовниот тренинг. Започнете со она што ви е важно; тестирањето е изборно и корисно само кога помага при одлука."],
  ["What would you like to work on?", "На што би сакале да работите?"],
  ["Strength & muscle", "Сила и мускули"],
  ["Aerobic fitness", "Аеробна подготвеност"],
  ["Movement & mobility", "Движење и подвижност"],
  ["I’m not sure yet", "Сè уште не сум сигурен/сигурна"],
  ["01 / START WITH CONTEXT", "01 / ЗАПОЧНЕТЕ СО КОНТЕКСТ"],
  ["Choose a useful starting point", "Изберете корисна почетна точка"],
  ["Share your goal, experience, schedule, and what you want to get from training.", "Споделете ја целта, искуството, распоредот и што сакате да постигнете со тренингот."],
  ["Explore assessments", "Разгледајте ги проценките"],
  ["02 / TRAIN WITH A COACH", "02 / ТРЕНИРАЈТЕ СО ТРЕНЕР"],
  ["Turn the goal into a plan", "Претворете ја целта во план"],
  ["Meet the team, find a coaching focus that fits, and book an available session.", "Запознајте го тимот, најдете тренерски пристап што ви одговара и закажете слободен термин."],
  ["03 / NOTICE WHAT CHANGES", "03 / ЗАБЕЛЕЖЕТЕ ГИ ПРОМЕНИТЕ"],
  ["Keep a simple training log", "Водете едноставен дневник за тренинг"],
  ["Record sessions and personal milestones, then review your consistency over time.", "Запишувајте тренинзи и лични достигнувања, а потоа следете ја доследноста низ време."],
  ["Open progress log", "Отворете го дневникот за напредок"],
  ["START WITH YOUR GOAL", "ЗАПОЧНЕТЕ СО ВАШАТА ЦЕЛ"],
  ["Find a coach for your focus.", "Најдете тренер за вашата цел."],
  ["Choose an area and we’ll highlight coaches whose listed specialties are the closest match. It’s a starting point, not a medical assessment.", "Изберете област и ќе ги истакнеме тренерите чии наведени специјалности најмногу одговараат. Ова е почетна насока, а не медицинска проценка."],
  ["Show matching coaches", "Прикажи соодветни тренери"],
  ["Coaches matching your selected focus are highlighted below. Choose a coach to view booking options.", "Подолу се истакнати тренерите што одговараат на избраната цел. Изберете тренер за да ги видите опциите за закажување."],
  ["Here are all coaches. A conversation can help you choose a starting point.", "Еве ги сите тренери. Разговорот може да ви помогне да изберете почетна точка."],
  ["No coach is listed for this focus yet. View everyone or contact the team.", "Сè уште нема тренер наведен за оваа цел. Разгледајте ги сите или контактирајте го тимот."],
  ["MEASURE WITH PURPOSE", "МЕРЕТЕ СО ЦЕЛ"],
  ["Every measure should answer a question.", "Секое мерење треба да даде одговор."],
  ["STRENGTH / CONSISTENCY", "СИЛА / ДОСЛЕДНОСТ"],
  ["Training record", "Евиденција за тренинг"],
  ["Can show:", "Може да покаже:"],
  ["completed sessions, exercise choices, and changes in loads or repetitions over time.", "завршени тренинзи, избор на вежби и промени во оптоварувањето или повторувањата низ време."],
  ["Cannot show:", "Не може да покаже:"],
  ["overall health, technique quality, or why a particular day felt harder.", "општа здравствена состојба, квалитет на техниката или зошто одреден ден бил потежок."],
  ["Use it to:", "Користете го за:"],
  ["review consistency and decide whether a gradual adjustment makes sense.", "да ја прегледате доследноста и да одлучите дали постепено приспособување има смисла."],
  ["AEROBIC FITNESS", "АЕРОБНА ПОДГОТВЕНОСТ"],
  ["Repeatable effort", "Повторлив напор"],
  ["how a familiar, submaximal route or session feels at a repeatable pace.", "како се чувствувате при позната, субмаксимална рута или тренинг со повторливо темпо."],
  ["a direct VO₂ max value or a diagnosis.", "директна вредност на VO₂ max или дијагноза."],
  ["adjust general conditioning. Maximal testing needs suitable equipment, screening, and qualified supervision.", "да ја приспособите општата кондиција. Максималното тестирање бара соодветна опрема, проценка и стручен надзор."],
  ["MOVEMENT / CAPACITY", "ДВИЖЕЊЕ / КАПАЦИТЕТ"],
  ["Comfort and control", "Удобност и контрола"],
  ["how comfortably and consistently you perform a chosen movement.", "колку удобно и доследно изведувате избрано движење."],
  ["a medical cause for pain or whether an injury is present.", "медицинска причина за болка или дали има повреда."],
  ["choose a manageable training variation and review it over time.", "да изберете изводлива варијација на вежба и да ја прегледате низ време."],
  ["private progress log", "приватниот дневник за напредок"],
  ["Your next step is set.", "Вашиот следен чекор е договорен."],
  ["SESSION REQUEST SAVED", "БАРАЊЕТО ЗА ТРЕНИНГ Е ЗАЧУВАНО"],
  ["To change or cancel, call", "За промена или откажување, јавете се на"],
  ["Keep your training notes in your private progress log.", "Чувајте ги белешките за тренинг во вашиот приватен дневник за напредок."],
  ["Your training,", "Вашиот тренинг,"],
  ["over time.", "низ време."],
  ["NOTICE WHAT CHANGES", "ЗАБЕЛЕЖЕТЕ ГИ ПРОМЕНИТЕ"],
  ["Keep a simple record of sessions and personal milestones. Review consistency and changes at your own pace.", "Водете едноставна евиденција за тренинзите и личните достигнувања. Следете ја доследноста и промените со сопствено темпо."],
  ["Private account log:", "Приватен дневник во сметката:"],
  ["entries are saved to your FitnessLab account in the FitnessLab database and are available when you sign in on another device. They are separate from booking details. Do not enter medical or highly sensitive details.", "записите се зачувуваат во вашата сметка на FitnessLab, во базата на FitnessLab, и се достапни кога ќе се најавите на друг уред. Тие се одделени од деталите за закажување. Не внесувајте медицински или многу чувствителни податоци."],
  ["Check-ins", "Записи"],
  ["Sessions logged", "Забележани тренинзи"],
  ["A QUICK CHECK-IN", "КРАТКА НЕДЕЛНА БЕЛЕШКА"],
  ["Record a training week.", "Забележете ја тренинг-неделата."],
  ["Week starting", "Почеток на неделата"],
  ["Main focus", "Главен фокус"],
  ["General consistency", "Општа доследност"],
  ["Training sessions completed", "Завршени тренинзи"],
  ["Optional personal milestone", "Изборно лично достигнување"],
  ["What did you track?", "Што следевте?"],
  ["For example: working weight or run time", "На пример: работна тежина или време на трчање"],
  ["Value", "Вредност"],
  ["Unit", "Единица"],
  ["kg, reps, min", "кг, повторувања, мин"],
  ["Note to yourself (optional)", "Белешка за себе (изборно)"],
  ["What felt good? What would you like to repeat?", "Што беше добро? Што би сакале да повторите?"],
  ["Save check-in to my account", "Зачувај запис во мојата сметка"],
  ["YOUR RECORD", "ВАШАТА ЕВИДЕНЦИЈА"],
  ["Review the pattern.", "Прегледајте го образецот."],
  ["Clear log", "Избриши го дневникот"],
  ["KEEP THE LOOP GOING", "ПРОДОЛЖЕТЕ ГО ЦИКЛУСОТ"],
  ["Review your plan with", "Прегледајте го планот со"],
  ["a coach.", "тренер."],
  ["This journal is general education, not medical advice. Research findings do not predict an individual outcome; study methods and populations vary. Speak with a healthcare professional about symptoms, medical conditions, or nutrition needs.", "Овој блог нуди општа едукација, а не медицински совет. Истражувањата не го предвидуваат исходот кај поединец; методите и испитуваните групи се разликуваат. За симптоми, здравствени состојби или потреби во исхраната разговарајте со здравствен работник."],
  ["Account and progress records are stored in the FitnessLab database. Sign in to your account to access them across devices. Progress entries can be deleted individually or cleared from the progress page. Account-linked bookings can be viewed on your account page. Contact FitnessLab at support@fitnesslab.com for questions about account data.", "Податоците за сметката и напредокот се чуваат во базата на FitnessLab. Најавете се за да им пристапите од различни уреди. Записите за напредок може да се бришат поединечно или да се избрише целиот дневник. Закажувањата поврзани со сметката може да се прегледаат на страницата на сметката. За прашања во врска со податоците од сметката, контактирајте го FitnessLab на support@fitnesslab.com."],
  ["Progress log — FitnessLab", "Дневник за напредок — FitnessLab"],
  ["How FitnessLab handles website enquiries, training bookings, account registration, browser preferences, and progress records.", "Како FitnessLab постапува со прашањата, закажувањата, регистрацијата на сметки, поставките на прелистувачот и записите за напредок."],
  ["Account", "Сметка"],
  ["Sign in / Sign up", "Најава / Регистрација"],
  ["Your account — FitnessLab", "Вашата сметка — FitnessLab"],
  ["Create a FitnessLab account to save your training progress and keep track of sessions booked with your account.", "Создадете сметка на FitnessLab за да го зачувате напредокот во тренингот и да ги следите термините закажани преку вашата сметка."],
  ["How FitnessLab handles website enquiries, training bookings, account registration, browser preferences, and progress records.", "Како FitnessLab постапува со прашањата, закажувањата, регистрацијата на сметки, поставките на прелистувачот и записите за напредок."],
  ["Keep a private, simple record of training consistency and personal milestones in your FitnessLab account.", "Водете приватна, едноставна евиденција за доследноста во тренингот и личните достигнувања во вашата сметка на FitnessLab."],
  ["Your training,", "Вашиот тренинг,"],
  ["over time.", "со текот на времето."],
  ["Keep a simple record of sessions and personal milestones in your account. Sign in to review your log across devices.", "Водете едноставна евиденција за тренинзите и личните достигнувања во вашата сметка. Најавете се за да го прегледате дневникот на различни уреди."],
  ["Private account log:", "Приватен дневник во сметката:"],
  ["entries are saved to your FitnessLab account in the FitnessLab database and are available when you sign in on another device. They are separate from booking details. Do not enter medical or highly sensitive details.", "записите се зачувуваат во вашата сметка на FitnessLab, во базата на FitnessLab, и се достапни кога ќе се најавите на друг уред. Тие се одделени од деталите за закажување. Не внесувајте медицински или многу чувствителни податоци."],
  ["Sign in to use your personal log.", "Најавете се за да го користите личниот дневник."],
  ["Sign in or create an account", "Најавете се или создадете сметка"],
  ["to save and review check-ins.", "за да зачувувате и прегледувате записи."],
  ["A QUICK CHECK-IN", "БРЗА ЕВИДЕНЦИЈА"],
  ["Record a training week.", "Евидентирајте ја тренинг-неделата."],
  ["Week starting", "Недела што започнува"],
  ["Main focus", "Главен фокус"],
  ["Training sessions completed", "Завршени тренинг-сесии"],
  ["Optional personal milestone", "Изборно лично достигнување"],
  ["What did you track?", "Што следевте?"],
  ["For example: working weight or run time", "На пример: работна тежина или време на трчање"],
  ["Value", "Вредност"],
  ["Unit", "Единица"],
  ["kg, reps, min", "кг, повторувања, мин"],
  ["Note to yourself (optional)", "Белешка за себе (изборно)"],
  ["What felt good? What would you like to repeat?", "Што беше добро? Што би сакале да повторите?"],
  ["Save check-in to my account", "Зачувај запис во мојата сметка"],
  ["YOUR RECORD", "ВАШАТА ЕВИДЕНЦИЈА"],
  ["Review the pattern.", "Прегледајте ги навиките."],
  ["Clear log", "Избриши го дневникот"],
  ["Check-in saved to your FitnessLab account.", "Записот е зачуван во вашата сметка на FitnessLab."],
  ["Your account is protected by a password. Progress notes and account-linked bookings are stored in FitnessLab’s database. Do not enter medical or highly sensitive details.", "Сметката е заштитена со лозинка. Белешките за напредок и закажувањата поврзани со сметката се чуваат во базата на FitnessLab. Не внесувајте медицински или многу чувствителни податоци."],
  ["Accounts and progress records", "Сметки и евиденција за напредок"],
  ["Account registration collects your name, email address, and password. Passwords are stored as salted, one-way hashes, not as plain text. Sign-in sessions use an HttpOnly cookie and expire after seven days. Email addresses are not currently verified, and password reset is not available on the website; contact FitnessLab for help with account access.", "При регистрацијата на сметка се собираат вашето име, адреса на е-пошта и лозинка. Лозинките се чуваат како еднонасочни хеш-вредности со сол, а не како обичен текст. Сесиите за најава користат HttpOnly колаче и истекуваат по седум дена. Адресите на е-пошта моментално не се потврдуваат, а на веб-страницата нема опција за промена на заборавена лозинка; контактирајте го FitnessLab за помош со пристапот до сметката."],
  ["Progress entries and account-linked bookings are stored in the FitnessLab database. Progress is available when you sign in on another device, and is separate from bookings. You can delete progress entries individually or clear your full log from the progress page. Account-linked bookings appear on your account page. Contact FitnessLab at support@fitnesslab.com with questions about account data. Do not enter medical or highly sensitive details.", "Записите за напредок и закажувањата поврзани со сметката се чуваат во базата на FitnessLab. Напредокот е достапен кога ќе се најавите на друг уред и е одделен од закажувањата. Записите може да ги бришете поединечно или да го избришете целиот дневник од страницата за напредок. Закажувањата поврзани со сметката се прикажуваат на страницата на сметката. За прашања за податоците контактирајте го FitnessLab на support@fitnesslab.com. Не внесувајте медицински или многу чувствителни податоци."],
  ["Your FitnessLab space", "Вашиот простор во FitnessLab"],
  ["YOUR FITNESSLAB SPACE", "ВАШИОТ ПРОСТОР ВО FITNESSLAB"],
  ["Your training, your account.", "Вашиот тренинг, вашата сметка."],
  ["your account.", "вашата сметка."],
  ["Save personal training check-ins to your account, access them across devices, and keep track of sessions booked while signed in.", "Зачувајте ги личните белешки за тренинг во сметката, пристапете им од различни уреди и следете ги термините закажани додека сте најавени."],
  ["WELCOME BACK", "ДОБРЕДОЈДОВТЕ НАЗАД"],
  ["Sign in.", "Најавете се."],
  ["Email address", "Е-пошта"],
  ["Password", "Лозинка"],
  ["Sign in", "Најави се"],
  ["START YOUR ACCOUNT", "СОЗДАДЕТЕ СМЕТКА"],
  ["Create account.", "Создадете сметка."],
  ["Your name", "Вашето име"],
  ["Use at least 12 characters. Choose a unique password you do not use elsewhere.", "Користете најмалку 12 знаци. Изберете уникатна лозинка што не ја користите на друго место."],
  ["Create account", "Создај сметка"],
  ["YOUR SPACE", "ВАШИОТ ПРОСТОР"],
  ["Sign out", "Одјави се"],
  ["Open progress log", "Отвори го дневникот за напредок"],
  ["Book a training session", "Закажи тренинг"],
  ["Your bookings", "Вашите закажувања"],
  ["Sign in or create an account to link this booking to your account, or continue as a guest.", "Најавете се или создадете сметка за да го поврзете закажувањето со сметката, или продолжете како гостин."],
  ["Sign in or", "Најавете се или"],
  ["create an account", "создадете сметка"],
  ["to link this booking to your account, or continue as a guest.", "за да го поврзете закажувањето со сметката, или продолжете како гостин."],
  ["Sign in or create an account to link this booking to your account, or continue as a guest.", "Најавете се или создадете сметка за да го поврзете закажувањето со сметката, или продолжете како гостин."],
  ["This booking will be linked to your account.", "Ова закажување ќе биде поврзано со вашата сметка."],
  ["Your session is linked to your account.", "Терминот е поврзан со вашата сметка."],
  ["To change or cancel, call +389 70 214 761. Keep your training notes in your private progress log.", "За промена или откажување јавете се на +389 70 214 761. Чувајте ги белешките за тренинг во приватниот дневник за напредок."],
  ["To change or cancel, call", "За промена или откажување јавете се на"],
  [". Keep your training notes in your private progress log.", ". Чувајте ги белешките за тренинг во приватниот дневник за напредок."],
  ["View your account", "Погледнете ја вашата сметка"],
  ["Your session is linked to your account.", "Терминот е поврзан со вашата сметка."],
  ["No bookings are linked to your account yet. Sign in before booking to see future sessions here.", "Сè уште нема закажувања поврзани со вашата сметка. Најавете се пред закажување за тука да ги гледате термините."],
  ["minutes", "минути"],
  ["Cancelled", "Откажан"],
  ["Upcoming", "Претстои"],
  ["Completed", "Завршен"],
  ["Make it a routine", "Претворете го во навика"],
  ["MAKE IT A ROUTINE", "ПРЕТВОРЕТЕ ГО ВО НАВИКА"],
  ["Build your next step with a coach.", "Изградете го следниот чекор со тренер."],
  ["Build your next step", "Изградете го следниот чекор"],
  ["with a coach.", "со тренер."],
  ["Make it a routine", "Претворете го во навика"],
  ["MAKE IT A ROUTINE", "ПРЕТВОРЕТЕ ГО ВО НАВИКА"],
  ["Date", "Датум"],
  ["Keep your training notes in your private progress log.", "Чувајте ги белешките за тренинг во приватниот дневник за напредок."],
  ["Meet the coaches", "Запознајте ги тренерите"],
  ["You have signed out.", "Одјавени сте."],
  ["This is a record to discuss—not a score or diagnosis.", "Ова е евиденција за разговор, а не оценка или дијагноза."],
  ["Your log is a personal record, not a score. Add the same optional milestone again later to compare your notes.", "Дневникот е лична евиденција, а не оценка. Подоцна повторно внесете го истото достигнување за да ги споредите белешките."],
  ["Add a check-in to start noticing your training pattern. You can delete entries or clear the log at any time.", "Додајте запис за да почнете да ги забележувате навиките во тренингот. Можете да ги избришете записите или целиот дневник во секое време."],
  ["Add both a milestone name and a value, or leave both blank.", "Внесете и име и вредност на достигнувањето или оставете ги двете полиња празни."],
  ["The saved log has an unexpected format. It was left unchanged.", "Зачуваниот дневник е во неочекуван формат. Не е променет."],
  ["Check-in saved to your FitnessLab account.", "Записот е зачуван во вашата сметка на FitnessLab."],
  ["Your log is already empty.", "Дневникот веќе е празен."],
  ["Clear all progress notes saved to your account?", "Да ги избришам сите белешки за напредок зачувани во сметката?"],
  ["Your account progress log has been cleared.", "Дневникот за напредок во вашата сметка е избришан."],
  ["The progress log could not be cleared.", "Дневникот не може да се избрише."],
  ["sessions", "тренинзи"],
  ["Booking reference", "Референца за термин"],
  ["Book another session", "Закажете уште еден тренинг"]
]));

const originalTextNodes = [];
const originalTextValues = new Map();
const pageTextWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
let pageTextNode;
while ((pageTextNode = pageTextWalker.nextNode())) {
  if (!pageTextNode.parentElement?.closest("script, style, [aria-hidden='true'], [data-language-switch]")) {
    originalTextNodes.push({ node: pageTextNode, value: pageTextNode.nodeValue });
    originalTextValues.set(pageTextNode, pageTextNode.nodeValue);
  }
}

const localeKey = "fitnesslab-language";
const languageToggle = document.createElement("button");
languageToggle.className = "fl-language-toggle";
languageToggle.type = "button";
languageToggle.dataset.languageSwitch = "";
languageToggle.setAttribute("aria-label", "Switch language");

const headerRow = header?.querySelector(".fl-header-row") ?? header?.firstElementChild;
const accountLink = document.createElement("a");
accountLink.className = "fl-header-account fl-header-account-guest";
accountLink.href = pageLinks.account;
accountLink.dataset.path = "account";
accountLink.innerHTML = "<svg aria-hidden=\"true\" viewBox=\"0 0 24 24\" fill=\"none\"><circle cx=\"12\" cy=\"8\" r=\"3.5\"></circle><path d=\"M4.75 20a7.25 7.25 0 0 1 14.5 0\"></path></svg><span data-header-account-label>Sign in / Sign up</span>";
if (currentPage === pageLinks.account) accountLink.setAttribute("aria-current", "page");

let currentLanguage = localStorage.getItem(localeKey) === "mk" ? "mk" : "en";
let headerAccountUser = null;
function updateHeaderAccount() {
  const isMacedonian = currentLanguage === "mk";
  const label = accountLink.querySelector("[data-header-account-label]");
  const guestLabel = isMacedonian ? "Најава / Регистрација" : "Sign in / Sign up";
  const accountLabel = isMacedonian ? "Сметка" : "Account";
  label.textContent = headerAccountUser ? accountLabel : guestLabel;
  accountLink.classList.toggle("fl-header-account-guest", !headerAccountUser);
  accountLink.setAttribute("aria-label", headerAccountUser ? accountLabel : guestLabel);
  accountLink.title = headerAccountUser ? accountLabel : guestLabel;
}

if (headerRow) {
  const cta = headerRow.querySelector(".fl-header-cta");
  if (cta) {
    const headerActions = document.createElement("div");
    headerActions.className = "fl-header-actions";
    headerRow.insertBefore(headerActions, cta);
    headerActions.append(languageToggle, cta, accountLink);
  } else {
    const actionGroup = headerRow.querySelector(".flex.items-center.gap-space-md:last-child");
    if (actionGroup) actionGroup.append(languageToggle, accountLink);
  }
}

function refreshHeaderAccount() {
  fetch("/api/auth/me")
    .then((response) => {
      if (!response.ok) throw new Error(`Account status request failed (${response.status}).`);
      return response.json();
    })
    .then(({ user }) => {
      headerAccountUser = user;
      updateHeaderAccount();
    })
    .catch((error) => console.error("Could not check the FitnessLab account session:", error));
}

window.addEventListener("fitnesslab-auth-change", refreshHeaderAccount);
refreshHeaderAccount();

const englishTitle = document.title;
const descriptionMeta = document.querySelector('meta[name="description"]');
const englishDescription = descriptionMeta?.content;
const translatableAttributes = ["aria-label", "aria-description", "title", "placeholder", "alt"];
const originalAttributes = [...document.querySelectorAll(translatableAttributes.map((name) => `[${name}]`).join(","))]
  .filter((element) => !element.hasAttribute("data-language-switch"))
  .flatMap((element) => translatableAttributes
    .filter((name) => element.hasAttribute(name))
    .map((name) => ({ element, name, value: element.getAttribute(name) })));

function setLanguage(language) {
  currentLanguage = language === "mk" ? "mk" : "en";
  const isMacedonian = currentLanguage === "mk";
  const urlMap = isMacedonian ? mkTranslations : {};

  const dynamicTextWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let dynamicTextNode;
  while ((dynamicTextNode = dynamicTextWalker.nextNode())) {
    if (!dynamicTextNode.parentElement?.closest("script, style, [aria-hidden='true'], [data-language-switch]")
      && !originalTextValues.has(dynamicTextNode)) {
      originalTextValues.set(dynamicTextNode, dynamicTextNode.nodeValue);
    }
  }

  for (const { node, value } of originalTextNodes) {
    originalTextValues.set(node, value);
  }
  for (const [node, value] of originalTextValues) {
    if (!node.isConnected) continue;
    const content = value.trim();
    if (!content) continue;
    const translated = urlMap[content] ?? content;
    const start = value.indexOf(content);
    node.nodeValue = `${value.slice(0, start)}${translated}${value.slice(start + content.length)}`;
  }
  for (const { element, name, value } of originalAttributes) {
    element.setAttribute(name, isMacedonian ? (urlMap[value] ?? value) : value);
  }

  document.documentElement.lang = currentLanguage;
  document.title = isMacedonian ? (mkTranslations[englishTitle] ?? englishTitle) : englishTitle;
  if (descriptionMeta && englishDescription) {
    descriptionMeta.content = isMacedonian ? (mkTranslations[englishDescription] ?? englishDescription) : englishDescription;
  }
  languageToggle.textContent = isMacedonian ? "EN" : "MK";
  languageToggle.setAttribute("aria-label", isMacedonian ? "Префрли го јазикот на англиски" : "Switch language to Macedonian");
  languageToggle.title = isMacedonian ? "English" : "Macedonian";
  updateHeaderAccount();
  const subject = document.querySelector("[name='_subject']");
  if (subject) subject.value = isMacedonian ? "Ново прашање за FitnessLab" : "New FitnessLab enquiry";
  window.dispatchEvent(new Event("fitnesslab-language-change"));
}

languageToggle.addEventListener("click", () => {
  const nextLanguage = currentLanguage === "en" ? "mk" : "en";
  localStorage.setItem(localeKey, nextLanguage);
  setLanguage(nextLanguage);
});

setLanguage(currentLanguage);
