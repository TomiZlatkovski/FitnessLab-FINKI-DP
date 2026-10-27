const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { URL } = require("node:url");
const { promisify } = require("node:util");

process.env.TZ ||= "Europe/Skopje";

const root = __dirname;
const dataDirectory = path.join(root, "data");
const databasePath = path.resolve(process.env.DATABASE_PATH || path.join(dataDirectory, "fitnesslab.sqlite"));
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";
const adminPassword = process.env.ADMIN_PASSWORD || "";
const memberCookieName = "fitnesslab_session";
const memberSessionDays = 7;
const memberPasswordMinLength = 12;
const memberAuthAttempts = new Map();
const scrypt = promisify(crypto.scrypt);
const sessionMinutes = 8 * 60;
const bookingDuration = 60;
const slotIncrement = 60;
const bookingRateLimit = new Map();
const adminFailures = new Map();
const mimeTypes = new Map([
  [".avif", "image/avif"],
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"]
]);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}
if (adminPassword.length < 12) {
  throw new Error("Set ADMIN_PASSWORD to a private value at least 12 characters long.");
}

fs.mkdirSync(path.dirname(databasePath), { recursive: true });
const db = new DatabaseSync(databasePath);
db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;
  CREATE TABLE IF NOT EXISTS trainers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 80),
    specialty TEXT NOT NULL CHECK (length(specialty) BETWEEN 2 AND 120),
    bio TEXT NOT NULL DEFAULT '' CHECK (length(bio) <= 500),
    photo TEXT NOT NULL DEFAULT '' CHECK (length(photo) <= 500),
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS weekly_availability (
    id INTEGER PRIMARY KEY,
    trainer_id TEXT NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
    start_minute INTEGER NOT NULL CHECK (start_minute >= 0 AND start_minute < 1440),
    end_minute INTEGER NOT NULL CHECK (end_minute > 0 AND end_minute <= 1440),
    UNIQUE (trainer_id, weekday),
    CHECK (end_minute > start_minute)
  );
  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    trainer_id TEXT NOT NULL REFERENCES trainers(id),
    session_date TEXT NOT NULL,
    start_minute INTEGER NOT NULL CHECK (start_minute >= 0 AND start_minute < 1440),
    duration INTEGER NOT NULL DEFAULT 60 CHECK (duration = 60),
    client_name TEXT NOT NULL CHECK (length(client_name) BETWEEN 2 AND 100),
    client_email TEXT NOT NULL CHECK (length(client_email) BETWEEN 3 AND 254),
    client_phone TEXT NOT NULL CHECK (length(client_phone) <= 40),
    message TEXT NOT NULL DEFAULT '' CHECK (length(message) <= 1000),
    language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'mk')),
    status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS bookings_date_idx ON bookings(session_date, status);
  CREATE INDEX IF NOT EXISTS bookings_trainer_date_idx ON bookings(trainer_id, session_date, status, start_minute);
  CREATE TABLE IF NOT EXISTS member_accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 80),
    email TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK (length(email) BETWEEN 3 AND 254),
    password_salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS member_sessions (
    token_hash TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES member_accounts(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS member_sessions_expiry_idx ON member_sessions(expires_at);
  CREATE TABLE IF NOT EXISTS progress_entries (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES member_accounts(id) ON DELETE CASCADE,
    entry_date TEXT NOT NULL,
    focus TEXT NOT NULL CHECK (focus IN ('strength', 'aerobic', 'movement', 'general')),
    sessions INTEGER NOT NULL CHECK (sessions BETWEEN 0 AND 14),
    measure_name TEXT NOT NULL DEFAULT '' CHECK (length(measure_name) <= 60),
    measure_value REAL,
    measure_unit TEXT NOT NULL DEFAULT '' CHECK (length(measure_unit) <= 16),
    note TEXT NOT NULL DEFAULT '' CHECK (length(note) <= 240),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS progress_account_date_idx ON progress_entries(account_id, entry_date DESC);
`);

if (!db.prepare("PRAGMA table_info(trainers)").all().some((column) => column.name === "photo")) {
  db.exec("ALTER TABLE trainers ADD COLUMN photo TEXT NOT NULL DEFAULT '' CHECK (length(photo) <= 500)");
}
if (!db.prepare("PRAGMA table_info(bookings)").all().some((column) => column.name === "account_id")) {
  db.exec("ALTER TABLE bookings ADD COLUMN account_id TEXT REFERENCES member_accounts(id) ON DELETE SET NULL");
}
db.exec("CREATE INDEX IF NOT EXISTS bookings_account_date_idx ON bookings(account_id, session_date DESC, start_minute DESC)");

const adminPasswordHash = crypto.createHash("sha256").update(adminPassword).digest();
const defaultCoaches = [
  {
    id: "8a419e57-d24a-4e16-9b21-7f80d4820001",
    name: "Mila Petrova",
    specialty: "Strength & hypertrophy",
    bio: "Build strength and muscle with progressive, well-measured training that fits your routine.",
    photo: "/assets/coaches/mila-petrova.jpg",
    schedule: [[1, "08:00", "12:00"], [3, "14:00", "19:00"], [5, "09:00", "15:00"]]
  },
  {
    id: "8a419e57-d24a-4e16-9b21-7f80d4820002",
    name: "Stefan Iliev",
    specialty: "Conditioning & VO₂ fitness",
    bio: "Structured conditioning sessions with steady progressions and room to recover.",
    photo: "/assets/coaches/stefan-iliev.jpg",
    schedule: [[2, "10:00", "18:00"], [4, "10:00", "18:00"], [6, "09:00", "13:00"]]
  },
  {
    id: "8a419e57-d24a-4e16-9b21-7f80d4820003",
    name: "Elena Markova",
    specialty: "Movement & mobility",
    bio: "Practical movement coaching and strength work adapted to your starting point.",
    photo: "/assets/coaches/elena-markova.jpg",
    schedule: [[1, "12:00", "18:00"], [3, "08:00", "14:00"], [5, "12:00", "18:00"]]
  },
  {
    id: "8a419e57-d24a-4e16-9b21-7f80d4820004",
    name: "Andrej Stojanov",
    specialty: "Strength & performance",
    bio: "Focused strength sessions built around good technique and gradual progression.",
    photo: "/assets/coaches/andrej-stojanov.jpg",
    schedule: [[2, "08:00", "14:00"], [4, "08:00", "14:00"], [6, "10:00", "16:00"]]
  },
  {
    id: "8a419e57-d24a-4e16-9b21-7f80d4820005",
    name: "Sara Nikolovska",
    specialty: "Personal training",
    bio: "Supportive one-to-one coaching for building confidence, consistency, and strength.",
    photo: "/assets/coaches/sara-nikolovska.jpg",
    schedule: [[1, "09:00", "15:00"], [3, "10:00", "16:00"], [6, "09:00", "13:00"]]
  }
];

function sendJson(response, status, body, headers = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers
  });
  response.end(JSON.stringify(body));
}

function respondError(response, status, code, message) {
  sendJson(response, status, { error: { code, message } });
}

function readJson(request, maximumSize = 12_000) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > maximumSize) {
        reject(Object.assign(new Error("Request is too large."), { status: 413, code: "request_too_large" }));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(Object.assign(new Error("Expected a JSON request body."), { status: 400, code: "invalid_json" }));
      }
    });
    request.on("error", reject);
  });
}

function safeText(value, maximum) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function memberPublicProfile(account) {
  return { id: account.id, name: account.name, email: account.email };
}

function memberSessionCookie(token, maximumAge) {
  const secure = process.env.COOKIE_SECURE === "1" || process.env.NODE_ENV === "production";
  return `${memberCookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maximumAge}${secure ? "; Secure" : ""}`;
}

function memberTokenFromRequest(request) {
  const cookieHeader = request.headers.cookie || "";
  const cookie = cookieHeader.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${memberCookieName}=`));
  const token = cookie?.slice(memberCookieName.length + 1) || "";
  return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : "";
}

function getMemberAccount(request) {
  const token = memberTokenFromRequest(request);
  if (!token) return null;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const row = db.prepare(
    "SELECT a.id, a.name, a.email FROM member_sessions s JOIN member_accounts a ON a.id = s.account_id WHERE s.token_hash = ? AND s.expires_at > ?"
  ).get(tokenHash, new Date().toISOString());
  if (!row) db.prepare("DELETE FROM member_sessions WHERE token_hash = ?").run(tokenHash);
  return row || null;
}

function issueMemberSession(accountId) {
  db.prepare("DELETE FROM member_sessions WHERE expires_at <= ?").run(new Date().toISOString());
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + memberSessionDays * 86_400_000).toISOString();
  db.prepare("INSERT INTO member_sessions (token_hash, account_id, expires_at) VALUES (?, ?, ?)")
    .run(crypto.createHash("sha256").update(token).digest("hex"), accountId, expiresAt);
  return memberSessionCookie(token, memberSessionDays * 86_400);
}

function deleteMemberSession(request) {
  const token = memberTokenFromRequest(request);
  if (token) {
    db.prepare("DELETE FROM member_sessions WHERE token_hash = ?")
      .run(crypto.createHash("sha256").update(token).digest("hex"));
  }
}

function allowMemberAuthAttempt(request, response) {
  const address = request.socket.remoteAddress || "unknown";
  const now = Date.now();
  const previous = memberAuthAttempts.get(address);
  if (!previous || now - previous.startedAt >= 15 * 60_000) {
    memberAuthAttempts.set(address, { count: 1, startedAt: now });
    return true;
  }
  if (previous.count >= 10) {
    respondError(response, 429, "rate_limited", "Too many account attempts. Please wait 15 minutes before trying again.");
    return false;
  }
  previous.count += 1;
  return true;
}

function validProgressEntry(entry) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)
    || !/^[0-9a-f-]{36}$/i.test(entry.id || "")
    || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date || "")
    || !["strength", "aerobic", "movement", "general"].includes(entry.focus)
    || !Number.isInteger(entry.sessions) || entry.sessions < 0 || entry.sessions > 14
    || typeof entry.note !== "string" || entry.note.length > 240
    || typeof entry.measureName !== "string" || entry.measureName.length > 60
    || typeof entry.measureUnit !== "string" || entry.measureUnit.length > 16
    || !(entry.measureValue === null || (typeof entry.measureValue === "number"
      && Number.isFinite(entry.measureValue) && entry.measureValue >= 0))
    || Boolean(entry.measureName) !== (entry.measureValue !== null)) return false;
  const timestamp = Date.parse(`${entry.date}T12:00:00Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== entry.date) return false;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Skopje",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
  return entry.date <= today;
}

function getDateContext(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const timestamp = Date.parse(`${date}T12:00:00Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date) return null;
  const todayText = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Skopje",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
  const dayOffset = (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${todayText}T00:00:00Z`)) / 86_400_000;
  if (!Number.isInteger(dayOffset) || dayOffset < 0 || dayOffset > 60) return null;
  const localNow = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Skopje",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date()).map((part) => [part.type, part.value]));
  return {
    weekday: new Date(timestamp).getUTCDay(),
    today: date === todayText,
    currentMinute: Number(localNow.hour) * 60 + Number(localNow.minute)
  };
}

function parseTime(value) {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):00$/.test(value)) return null;
  return Number(value.slice(0, 2)) * 60;
}

function formatTime(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function validWeeklySchedule(schedule) {
  if (!Array.isArray(schedule) || schedule.length < 1 || schedule.length > 7) return null;
  const days = new Set();
  const normalized = [];
  for (const entry of schedule) {
    const startMinute = parseTime(entry.start);
    const endMinute = parseTime(entry.end);
    if (!Number.isInteger(entry.weekday) || entry.weekday < 0 || entry.weekday > 6
      || days.has(entry.weekday) || startMinute === null || endMinute === null
      || endMinute - startMinute < bookingDuration) {
      return null;
    }
    days.add(entry.weekday);
    normalized.push({ weekday: entry.weekday, startMinute, endMinute });
  }
  return normalized;
}

function transaction(callback) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = callback();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function seedDefaultCoaches() {
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM trainers").get();
  if (count !== 0) return;
  transaction(() => {
    const addTrainer = db.prepare(
      "INSERT INTO trainers (id, name, specialty, bio, photo) VALUES (?, ?, ?, ?, ?)"
    );
    const addAvailability = db.prepare(
      "INSERT INTO weekly_availability (trainer_id, weekday, start_minute, end_minute) VALUES (?, ?, ?, ?)"
    );
    for (const coach of defaultCoaches) {
      addTrainer.run(coach.id, coach.name, coach.specialty, coach.bio, coach.photo);
      for (const [weekday, start, end] of coach.schedule) {
        addAvailability.run(coach.id, weekday, parseTime(start), parseTime(end));
      }
    }
  });
}

seedDefaultCoaches();

function getAvailableSlots(trainerId, date) {
  const context = getDateContext(date);
  if (!context) return null;
  const trainer = db.prepare("SELECT id FROM trainers WHERE id = ? AND active = 1").get(trainerId);
  if (!trainer) return null;
  const availability = db.prepare(
    "SELECT start_minute, end_minute FROM weekly_availability WHERE trainer_id = ? AND weekday = ?"
  ).get(trainerId, context.weekday);
  if (!availability) return [];

  const bookedRows = db.prepare(
    "SELECT start_minute FROM bookings WHERE trainer_id = ? AND session_date = ? AND status = 'booked'"
  ).all(trainerId, date);
  const booked = new Set(bookedRows.map((row) => row.start_minute));
  const slots = [];
  for (let minute = availability.start_minute; minute + bookingDuration <= availability.end_minute; minute += slotIncrement) {
    if (!booked.has(minute) && (!context.today || minute > context.currentMinute)) slots.push(formatTime(minute));
  }
  return slots;
}

function validateTrainer(body) {
  const name = safeText(body?.name, 80);
  const specialty = safeText(body?.specialty, 120);
  const bio = safeText(body?.bio, 500);
  const photo = safeText(body?.photo, 500);
  let photoUpload = null;
  if (body?.photoUpload) {
    const match = typeof body.photoUpload === "string"
      && body.photoUpload.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!match) return { error: "Upload a JPEG, PNG, or WebP photo up to 1.5 MB." };
    const buffer = Buffer.from(match[2], "base64");
    const validSignature = match[1] === "jpeg"
      ? buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
      : match[1] === "png"
        ? buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
    if (!validSignature || buffer.length > 1_500_000) {
      return { error: "Upload a valid JPEG, PNG, or WebP photo up to 1.5 MB." };
    }
    photoUpload = { buffer, extension: match[1] === "jpeg" ? "jpg" : match[1] };
  }
  const schedule = validWeeklySchedule(body?.schedule);
  let validPhoto = photo.length === 0;
  if (photo.startsWith("/") && !photo.startsWith("//")) {
    validPhoto = /^\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.(?:avif|gif|jpe?g|png|webp)$/i.test(photo);
  } else if (photo) {
    try {
      const url = new URL(photo);
      validPhoto = url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
    } catch {
      validPhoto = false;
    }
  }
  if (!validPhoto) {
    return { error: "Provide a secure HTTPS photo URL or a local image path, or leave it blank." };
  }
  if (name.length < 2 || specialty.length < 2 || !schedule) {
    return { error: "Provide a valid trainer name, specialty, and weekly schedule. Use whole-hour start/end times and at least one 60-minute block." };
  }
  return { name, specialty, bio, photo, photoUpload, schedule, active: body.active !== false };
}

function saveTrainerPhoto(id, photoUpload) {
  const directory = path.join(root, "assets", "coaches", "uploads");
  const filename = path.join(directory, `${id}.${photoUpload.extension}`);
  const temporaryFilename = `${filename}.${crypto.randomUUID()}.tmp`;
  fs.mkdirSync(directory, { recursive: true });
  try {
    fs.writeFileSync(temporaryFilename, photoUpload.buffer, { flag: "wx" });
    fs.renameSync(temporaryFilename, filename);
  } catch (error) {
    if (fs.existsSync(temporaryFilename)) fs.unlinkSync(temporaryFilename);
    throw error;
  }
  return `/assets/coaches/uploads/${id}.${photoUpload.extension}`;
}

function getAdminPassword(request) {
  const supplied = request.headers["x-admin-password"];
  if (typeof supplied !== "string") return false;
  const suppliedHash = crypto.createHash("sha256").update(supplied).digest();
  return crypto.timingSafeEqual(suppliedHash, adminPasswordHash);
}

function authenticateAdmin(request, response) {
  const address = request.socket.remoteAddress || "unknown";
  const now = Date.now();
  const previous = adminFailures.get(address);
  if (previous && now - previous.startedAt > 60_000) adminFailures.delete(address);
  const failure = adminFailures.get(address);
  if (failure && failure.count >= 8) {
    respondError(response, 429, "too_many_attempts", "Too many failed attempts. Try again in one minute.");
    return false;
  }
  if (getAdminPassword(request)) {
    adminFailures.delete(address);
    return true;
  }
  if (failure) failure.count += 1;
  else adminFailures.set(address, { count: 1, startedAt: now });
  respondError(response, 401, "unauthorized", "The admin password is incorrect.");
  return false;
}

function allowSameOrigin(request, response) {
  const origin = request.headers.origin;
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    if (parsed.host === request.headers.host && ["http:", "https:"].includes(parsed.protocol)) return true;
  } catch {
    // Invalid origins are rejected below.
  }
  respondError(response, 403, "origin_not_allowed", "This request origin is not allowed.");
  return false;
}

function requestLimit(request, response) {
  const address = request.socket.remoteAddress || "unknown";
  const now = Date.now();
  const previous = bookingRateLimit.get(address);
  if (!previous || now - previous.startedAt > 10 * 60_000) {
    bookingRateLimit.set(address, { count: 1, startedAt: now });
    return true;
  }
  if (previous.count >= 12) {
    respondError(response, 429, "rate_limited", "Please wait a few minutes before trying again.");
    return false;
  }
  previous.count += 1;
  return true;
}

function getAvailabilityForTrainer(trainerId) {
  return db.prepare(
    "SELECT weekday, start_minute, end_minute FROM weekly_availability WHERE trainer_id = ? ORDER BY weekday"
  ).all(trainerId).map((row) => ({
    weekday: row.weekday,
    start: formatTime(row.start_minute),
    end: formatTime(row.end_minute)
  }));
}

async function handleApi(request, response, url) {
  const route = `${request.method} ${url.pathname}`;

  if (route === "GET /api/auth/me") {
    const account = getMemberAccount(request);
    sendJson(response, 200, { user: account ? memberPublicProfile(account) : null });
    return;
  }

  if (route === "POST /api/auth/register" || route === "POST /api/auth/login") {
    if (!allowSameOrigin(request, response) || !allowMemberAuthAttempt(request, response)) return;
    if (!request.headers["content-type"]?.toLowerCase().startsWith("application/json")) {
      respondError(response, 415, "json_required", "Submit account details as JSON.");
      return;
    }
    let body;
    try {
      body = await readJson(request, 10_000);
    } catch (error) {
      respondError(response, error.status || 400, error.code || "invalid_request", error.message);
      return;
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      respondError(response, 400, "invalid_account_details", "Submit account details as a JSON object.");
      return;
    }
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < memberPasswordMinLength
      || password.length > 128 || Buffer.byteLength(password, "utf8") > 512) {
      respondError(response, 400, "invalid_account_details", "Enter a valid email address and a password between 12 and 128 characters.");
      return;
    }

    if (route === "POST /api/auth/register") {
      const name = safeText(body.name, 80);
      if (name.length < 2) {
        respondError(response, 400, "invalid_account_details", "Enter your name using at least 2 characters.");
        return;
      }
      if (db.prepare("SELECT id FROM member_accounts WHERE email = ?").get(email)) {
        respondError(response, 409, "account_exists", "An account with that email already exists. Sign in instead.");
        return;
      }
      const id = crypto.randomUUID();
      const salt = crypto.randomBytes(16);
      const passwordHash = await scrypt(password, salt, 64, { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
      try {
        db.prepare("INSERT INTO member_accounts (id, name, email, password_salt, password_hash) VALUES (?, ?, ?, ?, ?)")
          .run(id, name, email, salt.toString("base64url"), passwordHash.toString("base64url"));
        const account = { id, name, email };
        deleteMemberSession(request);
        sendJson(response, 201, { user: memberPublicProfile(account) }, { "Set-Cookie": issueMemberSession(id) });
      } catch (error) {
        if (String(error.message).includes("UNIQUE constraint failed: member_accounts.email")) {
          respondError(response, 409, "account_exists", "An account with that email already exists. Sign in instead.");
          return;
        }
        throw error;
      }
      return;
    }

    const account = db.prepare("SELECT id, name, email, password_salt, password_hash FROM member_accounts WHERE email = ?")
      .get(email);
    const salt = account ? Buffer.from(account.password_salt, "base64url") : Buffer.from("fitnesslab-account-login");
    const expectedHash = account ? Buffer.from(account.password_hash, "base64url") : Buffer.alloc(64);
    const suppliedHash = await scrypt(password, salt, 64, { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
    if (!account || !crypto.timingSafeEqual(suppliedHash, expectedHash)) {
      respondError(response, 401, "invalid_credentials", "Email or password is incorrect.");
      return;
    }
    deleteMemberSession(request);
    sendJson(response, 200, { user: memberPublicProfile(account) }, { "Set-Cookie": issueMemberSession(account.id) });
    return;
  }

  if (route === "POST /api/auth/logout") {
    if (!allowSameOrigin(request, response)) return;
    deleteMemberSession(request);
    sendJson(response, 200, { loggedOut: true }, { "Set-Cookie": memberSessionCookie("", 0) });
    return;
  }

  if (route === "GET /api/account") {
    const account = getMemberAccount(request);
    if (!account) {
      respondError(response, 401, "authentication_required", "Sign in to view your account.");
      return;
    }
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Skopje",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());
    const bookings = db.prepare(
      "SELECT b.id, b.session_date AS date, b.start_minute, b.duration, b.status, t.name AS trainerName FROM bookings b JOIN trainers t ON t.id = b.trainer_id WHERE b.account_id = ? ORDER BY b.session_date DESC, b.start_minute DESC LIMIT 100"
    ).all(account.id).map((booking) => ({
      ...booking,
      time: formatTime(booking.start_minute),
      upcoming: booking.date >= today && booking.status === "booked"
    }));
    sendJson(response, 200, { user: memberPublicProfile(account), bookings });
    return;
  }

  if (url.pathname === "/api/account/progress" || /^\/api\/account\/progress\/[0-9a-f-]{36}$/i.test(url.pathname)) {
    const account = getMemberAccount(request);
    if (!account) {
      respondError(response, 401, "authentication_required", "Sign in to access your progress log.");
      return;
    }
    if (route === "GET /api/account/progress") {
      const entries = db.prepare(
        "SELECT id, entry_date AS date, focus, sessions, measure_name AS measureName, measure_value AS measureValue, measure_unit AS measureUnit, note FROM progress_entries WHERE account_id = ? ORDER BY entry_date DESC, created_at DESC"
      ).all(account.id);
      sendJson(response, 200, { entries });
      return;
    }
    if (!allowSameOrigin(request, response)) return;
    if (request.method === "DELETE") {
      const entryRoute = url.pathname.match(/^\/api\/account\/progress\/([0-9a-f-]{36})$/i);
      if (entryRoute) {
        const result = db.prepare("DELETE FROM progress_entries WHERE id = ? AND account_id = ?")
          .run(entryRoute[1], account.id);
        sendJson(response, 200, { deleted: result.changes > 0 });
      } else {
        db.prepare("DELETE FROM progress_entries WHERE account_id = ?").run(account.id);
        sendJson(response, 200, { cleared: true });
      }
      return;
    }
    if (route !== "POST /api/account/progress") {
      respondError(response, 405, "method_not_allowed", "Use GET, POST, or DELETE for progress entries.");
      return;
    }
    if (!request.headers["content-type"]?.toLowerCase().startsWith("application/json")) {
      respondError(response, 415, "json_required", "Submit progress entries as JSON.");
      return;
    }
    let body;
    try {
      body = await readJson(request, 300_000);
    } catch (error) {
      respondError(response, error.status || 400, error.code || "invalid_request", error.message);
      return;
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      respondError(response, 400, "invalid_progress_entries", "Submit progress entries as a JSON object.");
      return;
    }
    if (!Array.isArray(body.entries) || body.entries.length < 1 || body.entries.length > 500
      || body.entries.some((entry) => !validProgressEntry(entry))) {
      respondError(response, 400, "invalid_progress_entries", "One or more progress entries are invalid.");
      return;
    }
    transaction(() => {
      const insert = db.prepare(
        "INSERT INTO progress_entries (id, account_id, entry_date, focus, sessions, measure_name, measure_value, measure_unit, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING"
      );
      for (const entry of body.entries) {
        insert.run(entry.id, account.id, entry.date, entry.focus, entry.sessions, entry.measureName,
          entry.measureValue, entry.measureUnit, entry.note);
      }
    });
    sendJson(response, 201, { saved: body.entries.length });
    return;
  }

  if (route === "GET /api/trainers") {
    const trainers = db.prepare(
      "SELECT id, name, specialty, bio, photo FROM trainers WHERE active = 1 ORDER BY name"
    ).all().map((trainer) => ({ ...trainer, availability: getAvailabilityForTrainer(trainer.id) }));
    sendJson(response, 200, { trainers });
    return;
  }

  if (route === "GET /api/availability") {
    const trainerId = url.searchParams.get("trainer") || "";
    const date = url.searchParams.get("date") || "";
    if (!/^[0-9a-f-]{36}$/i.test(trainerId) || !getDateContext(date)) {
      respondError(response, 400, "invalid_date_or_trainer", "Choose a valid trainer and a date in the next 60 days.");
      return;
    }
    if (!db.prepare("SELECT id FROM trainers WHERE id = ? AND active = 1").get(trainerId)) {
      respondError(response, 404, "trainer_not_found", "That trainer is not available.");
      return;
    }
    sendJson(response, 200, { slots: getAvailableSlots(trainerId, date) });
    return;
  }

  if (route === "POST /api/bookings") {
    if (!allowSameOrigin(request, response) || !requestLimit(request, response)) return;
    if (!request.headers["content-type"]?.toLowerCase().startsWith("application/json")) {
      respondError(response, 415, "json_required", "Submit the booking form again.");
      return;
    }
    let body;
    try {
      body = await readJson(request);
    } catch (error) {
      respondError(response, error.status || 400, error.code || "invalid_request", error.message);
      return;
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      respondError(response, 400, "invalid_booking", "Submit booking details as a JSON object.");
      return;
    }

    const account = getMemberAccount(request);
    const name = account ? account.name : safeText(body.name, 100);
    const email = account ? account.email : safeText(body.email, 254);
    const phone = safeText(body.phone, 40);
    const message = safeText(body.message, 1000);
    const trainerId = safeText(body.trainerId, 36);
    const date = safeText(body.date, 10);
    const startMinute = parseTime(body.time);
    const language = body.language === "mk" ? "mk" : "en";

    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || (phone && !/^[+()\d\s-]{6,40}$/.test(phone))
      || !/^[0-9a-f-]{36}$/i.test(trainerId) || !getDateContext(date)
      || startMinute === null) {
      respondError(response, 400, "invalid_booking", "Check your contact details, trainer, date, and available session time.");
      return;
    }

    try {
      const bookingId = crypto.randomUUID();
      transaction(() => {
        const trainer = db.prepare(
          "SELECT id FROM trainers WHERE id = ? AND active = 1"
        ).get(trainerId);
        const context = getDateContext(date);
        const availability = context && db.prepare(
          "SELECT start_minute, end_minute FROM weekly_availability WHERE trainer_id = ? AND weekday = ?"
        ).get(trainerId, context.weekday);
        const fitsAvailability = availability
          && startMinute >= availability.start_minute
          && startMinute + bookingDuration <= availability.end_minute
          && (startMinute - availability.start_minute) % slotIncrement === 0
          && (!context.today || startMinute > context.currentMinute);
        if (!trainer || !fitsAvailability) {
          throw Object.assign(new Error("That trainer has no matching availability for this session."), { status: 409, code: "slot_unavailable" });
        }
        const overlappingBooking = db.prepare(
          "SELECT id FROM bookings WHERE trainer_id = ? AND session_date = ? AND status = 'booked' AND start_minute < ? AND start_minute + duration > ?"
        ).get(trainerId, date, startMinute + bookingDuration, startMinute);
        if (overlappingBooking) {
          throw Object.assign(new Error("That session was just booked. Please choose another time."), { status: 409, code: "slot_taken" });
        }
        db.prepare(
          "INSERT INTO bookings (id, trainer_id, session_date, start_minute, duration, client_name, client_email, client_phone, message, language, account_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).run(bookingId, trainerId, date, startMinute, bookingDuration, name, email, phone, message, language, account?.id || null);
      });
      sendJson(response, 201, { booking: { id: bookingId, date, time: formatTime(startMinute), duration: bookingDuration, linkedToAccount: Boolean(account) } });
    } catch (error) {
      if (error.status) respondError(response, error.status, error.code, error.message);
      else {
        console.error("Booking save failed:", error);
        respondError(response, 500, "booking_save_failed", "We couldn't save that booking. Please contact FitnessLab.");
      }
    }
    return;
  }

  if (url.pathname.startsWith("/api/admin/")) {
    if (!authenticateAdmin(request, response)) return;

    if (route === "GET /api/admin/bookings") {
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Skopje",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(new Date());
      const bookings = db.prepare(
        "SELECT b.id, b.session_date AS date, b.start_minute, b.duration, b.client_name AS clientName, b.client_email AS clientEmail, b.client_phone AS clientPhone, b.message, b.status, t.name AS trainerName FROM bookings b JOIN trainers t ON t.id = b.trainer_id WHERE b.session_date >= ? ORDER BY b.session_date, b.start_minute LIMIT 200"
      ).all(today).map((booking) => ({ ...booking, time: formatTime(booking.start_minute) }));
      sendJson(response, 200, { bookings });
      return;
    }

    if (route === "GET /api/admin/trainers") {
      const trainers = db.prepare("SELECT id, name, specialty, bio, photo, active FROM trainers ORDER BY name").all()
        .map((trainer) => ({ ...trainer, active: Boolean(trainer.active), availability: getAvailabilityForTrainer(trainer.id) }));
      sendJson(response, 200, { trainers });
      return;
    }

    const trainerRoute = url.pathname.match(/^\/api\/admin\/trainers\/([0-9a-f-]{36})$/i);
    if (route === "POST /api/admin/trainers" || (trainerRoute && request.method === "PUT")) {
      if (!allowSameOrigin(request, response)) return;
      if (!request.headers["content-type"]?.toLowerCase().startsWith("application/json")) {
        respondError(response, 415, "json_required", "Submit JSON data.");
        return;
      }
      let body;
      try {
        body = await readJson(request, 2_100_000);
      } catch (error) {
        respondError(response, error.status || 400, error.code || "invalid_request", error.message);
        return;
      }
      const trainer = validateTrainer(body);
      if (trainer.error) {
        respondError(response, 400, "invalid_trainer", trainer.error);
        return;
      }
      const id = trainerRoute ? trainerRoute[1] : crypto.randomUUID();
      try {
        const photo = trainer.photoUpload ? saveTrainerPhoto(id, trainer.photoUpload) : trainer.photo;
        transaction(() => {
          if (trainerRoute && !db.prepare("SELECT id FROM trainers WHERE id = ?").get(id)) {
            throw Object.assign(new Error("Trainer not found."), { status: 404, code: "trainer_not_found" });
          }
          if (trainerRoute) {
            db.prepare("UPDATE trainers SET name = ?, specialty = ?, bio = ?, photo = ?, active = ? WHERE id = ?")
              .run(trainer.name, trainer.specialty, trainer.bio, photo, Number(trainer.active), id);
            db.prepare("DELETE FROM weekly_availability WHERE trainer_id = ?").run(id);
          } else {
            db.prepare("INSERT INTO trainers (id, name, specialty, bio, photo, active) VALUES (?, ?, ?, ?, ?, ?)")
              .run(id, trainer.name, trainer.specialty, trainer.bio, photo, Number(trainer.active));
          }
          const addAvailability = db.prepare(
            "INSERT INTO weekly_availability (trainer_id, weekday, start_minute, end_minute) VALUES (?, ?, ?, ?)"
          );
          for (const entry of trainer.schedule) {
            addAvailability.run(id, entry.weekday, entry.startMinute, entry.endMinute);
          }
        });
        const { photoUpload, ...savedTrainer } = trainer;
        sendJson(response, trainerRoute ? 200 : 201, { trainer: { id, ...savedTrainer, photo } });
      } catch (error) {
        if (error.status) respondError(response, error.status, error.code, error.message);
        else {
          console.error("Trainer save failed:", error);
          respondError(response, 500, "trainer_save_failed", "We couldn't save that trainer.");
        }
      }
      return;
    }

    if (trainerRoute && request.method === "DELETE") {
      if (!allowSameOrigin(request, response)) return;
      const result = db.prepare("UPDATE trainers SET active = 0 WHERE id = ?").run(trainerRoute[1]);
      if (Number(result.changes) === 0) {
        respondError(response, 404, "trainer_not_found", "Trainer not found.");
        return;
      }
      sendJson(response, 200, { ok: true });
      return;
    }

    const bookingRoute = url.pathname.match(/^\/api\/admin\/bookings\/([0-9a-f-]{36})\/cancel$/i);
    if (bookingRoute && request.method === "POST") {
      if (!allowSameOrigin(request, response)) return;
      const result = db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ? AND status = 'booked'")
        .run(bookingRoute[1]);
      if (Number(result.changes) === 0) {
        respondError(response, 404, "booking_not_found", "The booking was not found or is already cancelled.");
        return;
      }
      sendJson(response, 200, { ok: true });
      return;
    }

    respondError(response, 404, "not_found", "That admin endpoint does not exist.");
    return;
  }

  respondError(response, 404, "not_found", "That API endpoint does not exist.");
}

function serveStatic(request, response, url) {
  let requested;
  try {
    requested = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }
  if (requested === "/") requested = "/index.html";
  const filename = path.resolve(root, `.${requested}`);
  if (!filename.startsWith(`${root}${path.sep}`) || path.basename(filename).startsWith(".")
    || filename === databasePath) {
    response.writeHead(404).end("Not found");
    return;
  }
  fs.stat(filename, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404).end("Not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type": mimeTypes.get(path.extname(filename)) || "application/octet-stream",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    });
    fs.createReadStream(filename).pipe(response);
  });
}

const server = http.createServer((request, response) => {
  let url;
  try {
    url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }
  if (url.pathname.startsWith("/api/")) {
    handleApi(request, response, url).catch((error) => {
      console.error("API request failed:", error);
      if (!response.headersSent) respondError(response, 500, "server_error", "An unexpected server error occurred.");
      else response.destroy();
    });
    return;
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end("Method not allowed");
    return;
  }
  serveStatic(request, response, url);
});

server.listen(port, host, () => {
  console.log(`FitnessLab is running at http://${host}:${port}`);
  console.log(`Trainer administration: http://${host}:${port}/admin.html`);
  console.log(`Booking database: ${databasePath}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => {
      db.close();
      process.exit(0);
    });
  });
}
