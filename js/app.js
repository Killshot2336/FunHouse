import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  update,
  push,
  onValue,
  get
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

/* =========================
   FIREBASE CONFIG
   ========================= */

const firebaseConfig = {
  apiKey: "PASTE_HERE",
  authDomain: "PASTE_HERE",
  databaseURL: "PASTE_HERE",
  projectId: "PASTE_HERE",
  storageBucket: "PASTE_HERE",
  messagingSenderId: "PASTE_HERE",
  appId: "PASTE_HERE"
};

/* CHANGE THIS PASSWORD */
const HOUSE_PASSWORD = "change-this-password";

const HOUSE_ID = "edward-jamie-aden-house";
const BASE = `houses/${HOUSE_ID}`;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

/* =========================
   STATE
   ========================= */

let currentUser = localStorage.getItem("housegrid-user") || "Aden";
let currentTheme = localStorage.getItem("housegrid-theme") || "aden-skyrim";

let groceryState = [];
let billsState = [];
let fundState = [];
let shiftState = [];
let stressState = { Aden: 2, Edward: 2, Jamie: 2 };

let xpState = {
  totals: { Aden: 0, Edward: 0, Jamie: 0 },
  completions: {},
  lastWinner: null
};

/* =========================
   DEFAULT DATABASE DATA
   ========================= */

const defaultData = {
  groceries: {
    g1: { name: "Milk", price: 4, priority: "High", person: "Jamie", bought: false, createdAt: Date.now() },
    g2: { name: "Bread", price: 3, priority: "Low", person: "Edward", bought: false, createdAt: Date.now() },
    g3: { name: "Dog Food", price: 18, priority: "High", person: "Aden", bought: false, createdAt: Date.now() }
  },

  bills: {
    b1: { name: "Rent", amount: 750, dueIn: 9, paid: false, payer: "Edward" },
    b2: { name: "Electric", amount: 118, dueIn: 2, paid: false, payer: "Jamie" },
    b3: { name: "Water", amount: 46, dueIn: 5, paid: false, payer: "Edward" },
    b4: { name: "Internet", amount: 65, dueIn: 12, paid: true, payer: "Jamie" },
    b5: { name: "Car Insurance", amount: 140, dueIn: 3, paid: false, payer: "Aden" },
    b6: { name: "Phone", amount: 95, dueIn: 15, paid: true, payer: "Edward" }
  },

  fund: {
    f1: { person: "Edward", amount: 25, reason: "gas", createdAt: Date.now() },
    f2: { person: "Jamie", amount: 80, reason: "Soul Coin", createdAt: Date.now() },
    f3: { person: "Aden", amount: 40, reason: "groceries", createdAt: Date.now() }
  },

  shifts: {
    s1: { person: "Aden", job: "Sonic", day: "Monday", start: "16:00", end: "23:00", createdAt: Date.now() },
    s2: { person: "Edward", job: "Sonic", day: "Monday", start: "10:00", end: "18:00", createdAt: Date.now() },
    s3: { person: "Jamie", job: "Sonic", day: "Tuesday", start: "12:00", end: "20:00", createdAt: Date.now() }
  },

  stress: {
    Aden: 2,
    Edward: 2,
    Jamie: 2
  },

  meta: {
    seeded: true
  }
};

/* =========================
   THEME COPY
   ========================= */

const themeCopy = {
  "aden-skyrim": {
    label: "DRAGONBORN HOUSEGRID",
    cash: "GUILD TREASURY",
    food: "QUEST SUPPLIES",
    bills: "DEBTS OF THE HOLD",
    stress: "STAMINA",
    grocery: "Quest Supplies",
    billTitle: "Debts of the Hold",
    fundTitle: "Guild Treasury",
    fundIcon: "🪙",
    workTitle: "Active Bounties",
    activeWork: "On a Daily Pledge",
    inactiveWork: "Resting at the Hall",
    affordTitle: "Divined by the 8",
    affordSafe: "DIVINE BLESSING",
    affordBad: "HERETIC'S FOLLY",
    criticalStress: "Lethal Dragon Fatigue — GTFO"
  },

  "edward-fo76": {
    label: "C.A.M.P. BUILD MENU",
    cash: "CAP STASH",
    food: "KNOWN SUPPLIES",
    bills: "TAX COLLECTOR BOTS",
    stress: "HUNGER/THIRST",
    grocery: "C.A.M.P. Supplies",
    billTitle: "Tax Collector Bots",
    fundTitle: "Cap Stash",
    fundIcon: "🧢",
    workTitle: "Event Rotations",
    activeWork: "Running the Event",
    inactiveWork: "Back at C.A.M.P.",
    affordTitle: "C.A.M.P. Budget Check",
    affordSafe: "APPROVED",
    affordBad: "NO CAPS",
    criticalStress: "Hunger/Thirst Maxed — Quit scavenging and handle it."
  },

  "jamie-karlach": {
    label: "INFERNAL ENGINE COMMAND",
    cash: "WAR CHEST",
    food: "CAMP SUPPLIES",
    bills: "DEVIL'S CONTRACTS",
    stress: "ENGINE HEAT",
    grocery: "Camp Supplies",
    billTitle: "Devil's Contracts",
    fundTitle: "Infernal War Chest",
    fundIcon: "🔥",
    workTitle: "Blood War Rotations",
    activeWork: "Deployed in the Blood War",
    inactiveWork: "Back at Camp",
    affordTitle: "Roll for Initiative",
    affordSafe: "NAT 20 — BUY IT",
    affordBad: "CRIT FAIL",
    criticalStress: "Screaming Rage"
  }
};

/* =========================
   CHORE TASKS
   ========================= */

const choreTasks = [
  {
    id: "dishes",
    xp: 5,
    names: {
      Aden: "Scrubbing the Feast Hall",
      Edward: "Cleaning the C.A.M.P. Kitchen",
      Jamie: "Scouring the Camp Mess"
    }
  },
  {
    id: "catBoxes",
    xp: 10,
    names: {
      Aden: "Clearing the Skeever Den",
      Edward: "Handling Scorched Waste",
      Jamie: "Tending the Infernal Owlbear Nest"
    }
  },
  {
    id: "trash",
    xp: 5,
    names: {
      Aden: "Dumping the Skooma Scum",
      Edward: "Scrapping Appalachian Junk",
      Jamie: "Hauling the Blood War Dead"
    }
  },
  {
    id: "bathroom",
    xp: 15,
    names: {
      Aden: "Restoring the Temple of Dibella",
      Edward: "Decontaminating the Latrine",
      Jamie: "Cleaning the Avernus Bathhouse"
    }
  },
  {
    id: "bed",
    xp: 2,
    names: {
      Aden: "Preparing the Bedroll",
      Edward: "Tucking in the Vault-Tec Bunk",
      Jamie: "Resetting the Bedding"
    }
  },
  {
    id: "gamingStation",
    xp: 10,
    names: {
      Aden: "Organizing the Elder Scrolls",
      Edward: "Calibrating the Holotape Deck",
      Jamie: "Polishing the Soul Coin Terminal"
    }
  },
  {
    id: "cups",
    xp: 2,
    names: {
      Aden: "Banishing the Empty Tankards",
      Edward: "Collecting Empty Nuka-Cola Bottles",
      Jamie: "Clearing the Goblets"
    }
  }
];

/* =========================
   HELPERS
   ========================= */

function $(id) {
  return document.getElementById(id);
}

function snapToArray(snapshot) {
  if (!snapshot.exists()) return [];
  return Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data }));
}

function restartTypewriter() {
  document.querySelectorAll(".typewriter").forEach((el) => {
    el.classList.remove("typewriter");
    void el.offsetWidth;
    el.classList.add("typewriter");
  });
}

function getWeekKey(date = new Date()) {
  const d = new Date(date);
  const diffToSunday = d.getDate() - d.getDay();
  const sunday = new Date(d.setDate(diffToSunday));
  sunday.setHours(0, 0, 0, 0);
  return sunday.toISOString().slice(0, 10);
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getNextSundayMidnight() {
  const now = new Date();
  const next = new Date(now);
  const days = (7 - now.getDay()) % 7 || 7;
  next.setDate(now.getDate() + days);
  next.setHours(0, 0, 0, 0);
  return next;
}

/* =========================
   THEME ENGINE
   ========================= */

function applyTheme(theme) {
  currentTheme = theme;
  localStorage.setItem("housegrid-theme", theme);
  document.documentElement.setAttribute("data-theme", theme);

  const c = themeCopy[theme];

  $("themeSelect").value = theme;
  $("themeLabel").textContent = c.label;
  $("cashLabel").textContent = c.cash;
  $("foodLabel").textContent = c.food;
  $("billLabel").textContent = c.bills;
  $("stressLabel").textContent = c.stress;
  $("stressTitle").textContent = c.stress;
  $("groceryTitle").textContent = c.grocery;
  $("billsTitle").textContent = c.billTitle;
  $("fundTitle").textContent = c.fundTitle;
  $("fundIcon").textContent = c.fundIcon;
  $("workTitle").textContent = c.workTitle;
  $("affordTitle").textContent = c.affordTitle;

  renderAll();
}

/* =========================
   RENDER EVERYTHING
   ========================= */

function renderAll() {
  renderDashboard();
  renderGroceries();
  renderBills();
  renderFund();
  renderShifts();
  renderStress();
  renderQuestBoard();
  runAffordTool();
  restartTypewriter();
}

/* =========================
   DASHBOARD
   ========================= */

function renderDashboard() {
  const totalFund = fundState.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const activeGroceries = groceryState.filter((g) => !g.bought).length;
  const unpaidBills = billsState.filter((b) => !b.paid).length;

  $("cashStat").textContent = `$${totalFund}`;
  $("foodStat").textContent = activeGroceries;
  $("billStat").textContent = unpaidBills;
}

/* =========================
   GROCERIES
   ========================= */

function priorityLabel(priority) {
  if (currentTheme === "aden-skyrim" && priority === "High") return "DRAGON-LEVEL NEED";
  if (currentTheme === "edward-fo76" && priority === "High") return "C.A.M.P. CRITICAL";
  if (currentTheme === "jamie-karlach" && priority === "High") return "HELLFIRE NEED";
  return String(priority).toUpperCase();
}

function renderGroceries() {
  const list = $("groceryList");
  const active = groceryState.filter((g) => !g.bought);

  $("groceryCount").textContent = `${active.length} ACTIVE`;
  list.innerHTML = "";

  groceryState.forEach((item) => {
    const row = document.createElement("div");
    row.id = `grocery-${item.id}`;
    row.className = "hud p-4 flex items-center justify-between gap-3";

    row.innerHTML = `
      <div>
        <p class="text-xl font-black ${item.bought ? "line-through opacity-60" : ""}">
          ${item.name}
          ${
            currentTheme === "edward-fo76" && item.bought
              ? `<span class="known-tag ml-2">(KNOWN)</span>`
              : ""
          }
        </p>
        <p class="opacity-70 text-sm">
          Added by ${item.person || "House"} · $${item.price || 0} · ${priorityLabel(item.priority)}
        </p>
      </div>

      <button onclick="toggleGrocery('${item.id}')" class="btn px-4 py-2">
        ${item.bought ? "KNOWN" : "DONE"}
      </button>
    `;

    list.appendChild(row);
  });

  renderDashboard();
}

window.toggleGrocery = async function (id) {
  const item = groceryState.find((g) => g.id === id);
  if (!item) return;

  const row = $(`grocery-${id}`);

  if (currentTheme === "edward-fo76" && !item.bought && row) {
    row.classList.add("scrap-out");
  }

  await update(ref(db, `${BASE}/groceries/${id}`), {
    bought: !item.bought
  });
};

/* =========================
   BILLS
   ========================= */

function renderBills() {
  const list = $("billsList");
  const unpaid = billsState.filter((b) => !b.paid);

  $("unpaidBillsBadge").textContent = `${unpaid.length} UNPAID`;
  list.innerHTML = "";

  billsState.forEach((bill) => {
    const urgent = !bill.paid && Number(bill.dueIn) <= 3;

    const status = bill.paid
      ? "PAID"
      : currentTheme === "edward-fo76"
        ? "CAPS MISSING"
        : currentTheme === "jamie-karlach"
          ? "BURNING DEBT"
          : "UNPAID";

    const row = document.createElement("div");
    row.className = `hud p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
      urgent ? "critical" : ""
    }`;

    row.innerHTML = `
      <div>
        <p class="text-xl font-black">${bill.name}</p>
        <p class="opacity-70 text-sm">Usually handled by ${bill.payer}</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <span class="hud px-3 py-1 font-black">$${bill.amount}</span>
        <span class="hud px-3 py-1 font-black">${bill.dueIn} DAYS</span>
        <button onclick="toggleBillStatus('${bill.id}')" class="btn px-4 py-2">
          ${status}
        </button>
      </div>
    `;

    list.appendChild(row);
  });

  renderDashboard();
}

window.toggleBillStatus = async function (id) {
  const bill = billsState.find((b) => b.id === id);
  if (!bill) return;

  await update(ref(db, `${BASE}/bills/${id}`), {
    paid: !bill.paid
  });
};

/* =========================
   HOUSE FUND
   ========================= */

function renderFund() {
  const feed = $("fundFeed");
  const total = fundState.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  $("fundTotal").textContent = `$${total}`;

  const edwardPaid = fundState.some(
    (item) => item.person === "Edward" && Number(item.amount) > 0
  );

  if (currentTheme === "edward-fo76" && !edwardPaid) {
    $("edwardFundWarning").textContent =
      "Vendor out of Caps. Stop being a goddamn scavenger and deposit some loot.";
    $("edwardFundWarning").classList.remove("hidden");
  } else {
    $("edwardFundWarning").classList.add("hidden");
  }

  feed.innerHTML = "";

  fundState.forEach((item) => {
    const row = document.createElement("div");
    row.className = "hud p-3 flex justify-between items-center gap-3";

    row.innerHTML = `
      <div>
        <p class="font-black">${item.person} added $${item.amount}</p>
        <p class="opacity-70 text-sm">For ${item.reason}</p>
      </div>
      <span class="hud px-3 py-1 font-black">$${item.amount}</span>
    `;

    feed.appendChild(row);
  });

  renderDashboard();
}

/* =========================
   WORK SCHEDULE
   ========================= */

function isShiftActive(shift) {
  const now = new Date();
  const today = now.toLocaleDateString("en-US", { weekday: "long" });
  const current = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = String(shift.start || "00:00").split(":").map(Number);
  const [endH, endM] = String(shift.end || "00:00").split(":").map(Number);

  const start = startH * 60 + startM;
  let end = endH * 60 + endM;

  if (end < start) end += 1440;

  return shift.day === today && current >= start && current <= end;
}

function formatTime(time) {
  const [h, m] = String(time || "00:00").split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;

  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

function renderShifts() {
  const c = themeCopy[currentTheme];
  const list = $("shiftList");
  const active = shiftState.filter(isShiftActive);

  $("workingBadge").textContent = active.length
    ? active.map((s) => `${s.person}: ${c.activeWork}`).join(" · ")
    : "Nobody active";

  list.innerHTML = "";

  shiftState.forEach((shift) => {
    const activeNow = isShiftActive(shift);

    const card = document.createElement("div");
    card.className = `hud p-4 ${activeNow ? "critical" : ""}`;

    card.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-2xl font-black">${shift.person}</p>
          <p class="opacity-70 text-sm">${shift.job} · ${shift.day}</p>
          <p class="font-black mt-3">${formatTime(shift.start)} – ${formatTime(shift.end)}</p>
        </div>

        <span class="hud px-3 py-1 font-black">
          ${activeNow ? c.activeWork : c.inactiveWork}
        </span>
      </div>
    `;

    list.appendChild(card);
  });
}

/* =========================
   STRESS
   ========================= */

function averageStress() {
  const values = Object.values(stressState).map(Number);
  if (!values.length) return 2;

  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function renderStress() {
  const c = themeCopy[currentTheme];
  const level = averageStress();
  const percent = level * 25;

  $("stressBar").style.width = `${percent}%`;

  const text =
    level === 1
      ? "GOOD"
      : level === 2
        ? "OKAY"
        : level === 3
          ? "ROUGH"
          : c.criticalStress;

  $("stressStat").textContent = text;
  $("stressWarning").textContent =
    level === 4 ? c.criticalStress : "House pressure is manageable. Keep it clean.";

  $("stressStat").classList.toggle("critical", level === 4);
  $("stressWarning").classList.toggle("critical", level === 4);

  document.documentElement.classList.toggle(
    "engine-critical",
    level === 4 && currentTheme === "jamie-karlach"
  );

  restartTypewriter();
}

window.setStress = async function (level) {
  await set(ref(db, `${BASE}/stress/${currentUser}`), Number(level));
};

/* =========================
   AFFORD TOOL
   ========================= */

function extractAmount(text) {
  const match = String(text).match(/\$?\s*(\d+(\.\d{1,2})?)/);
  return match ? Number(match[1]) : 0;
}

function runAffordTool() {
  const input = $("affordInput").value;
  const amount = extractAmount(input);

  const box = $("affordResultBox");
  const verdict = $("affordVerdict");
  const explanation = $("affordExplanation");
  const die = $("karlachDie");
  const c = themeCopy[currentTheme];

  const fund = fundState.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const bills = billsState
    .filter((b) => !b.paid)
    .reduce((sum, b) => sum + Number(b.amount || 0), 0);

  const safeMoney = fund - bills;

  $("affordBudgetBadge").textContent = `Fund: $${fund} · Bills: $${bills} · Safe: $${safeMoney}`;

  if (!amount) {
    box.classList.add("hidden");
    return;
  }

  box.classList.remove("hidden");

  const ok = safeMoney - amount >= 0;

  if (currentTheme === "jamie-karlach") {
    die.classList.remove("hidden");
    die.classList.remove("die-roll");
    void die.offsetWidth;
    die.classList.add("die-roll");
    die.textContent = ok ? "🎲 20" : "🎲 1";
  } else {
    die.classList.add("hidden");
  }

  verdict.textContent = ok ? c.affordSafe : c.affordBad;
  verdict.className = `text-center text-5xl sm:text-7xl font-black tracking-widest border-2 p-6 ${
    ok ? "safe" : "bad"
  }`;

  explanation.textContent = ok
    ? `Approved. Spending $${amount} will not wreck the house after bills.`
    : currentTheme === "jamie-karlach"
      ? `Crit Fail — Do not buy this shit, Soldier! $${amount} leaves the camp too weak.`
      : `Denied. Spending $${amount} leaves the house broke after bills.`;
}

window.runAffordTool = runAffordTool;

/* =========================
   CHORE XP / LEADERBOARD
   ========================= */

function renderQuestBoard() {
  $("xp-Aden").textContent = xpState.totals?.Aden || 0;
  $("xp-Edward").textContent = xpState.totals?.Edward || 0;
  $("xp-Jamie").textContent = xpState.totals?.Jamie || 0;

  $("adenInsult").classList.toggle(
    "hidden",
    Number(xpState.totals?.Aden || 0) >= 10
  );

  const list = $("dailyQuestList");
  const person = $("questPerson").value;
  const today = getTodayKey();

  list.innerHTML = "";

  choreTasks.forEach((task) => {
    const completionId = `${today}_${person}_${task.id}`;
    const completed = Boolean(xpState.completions?.[completionId]);

    const card = document.createElement("div");
    card.id = `quest-card-${task.id}`;
    card.className = `hud p-4 flex items-center justify-between gap-3 ${
      completed ? "opacity-60" : ""
    }`;

    card.innerHTML = `
      <div>
        <p class="text-xl font-black">${task.names[person]}</p>
        <p class="opacity-70 text-sm">${task.xp} XP · ${person}</p>
      </div>

      <button onclick="completeQuest('${task.id}')" class="btn px-4 py-3" ${
      completed ? "disabled" : ""
    }>
        ${completed ? "CLAIMED" : "CLAIM XP"}
      </button>
    `;

    list.appendChild(card);
  });

  if (xpState.lastWinner) showVictoryBanner(xpState.lastWinner);
}

function showVictoryBanner(winner) {
  const banner = $("victoryBanner");

  banner.textContent = `VICTORY ACHIEVED. ${winner} is the Sovereign of the Week. They choose the family activity. No excuses. No bullshit.`;
  banner.classList.remove("hidden");
  banner.classList.add("victory-glow");
}

function updateWeeklyCountdown() {
  const diff = getNextSundayMidnight() - new Date();

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  $("weeklyCountdown").textContent = `Weekly reset: ${days}d ${hours}h ${mins}m ${secs}s`;
}

async function completeQuest(taskId) {
  const person = $("questPerson").value;
  const weekKey = getWeekKey();
  const today = getTodayKey();
  const completionId = `${today}_${person}_${taskId}`;

  if (xpState.completions?.[completionId]) return;

  const task = choreTasks.find((t) => t.id === taskId);
  const newTotal = Number(xpState.totals?.[person] || 0) + task.xp;

  await update(ref(db, `${BASE}/xpWeeks/${weekKey}`), {
    [`totals/${person}`]: newTotal,
    [`completions/${completionId}`]: {
      person,
      taskId,
      xp: task.xp,
      completedAt: Date.now()
    }
  });

  if (person === "Aden") {
    const card = $(`quest-card-${taskId}`);
    if (card) {
      card.classList.remove("dragon-soul");
      void card.offsetWidth;
      card.classList.add("dragon-soul");
    }
  }
}

window.completeQuest = completeQuest;

async function checkSundayVictoryReset() {
  const now = new Date();

  if (now.getDay() !== 0 || now.getHours() !== 0) return;

  const today = getTodayKey();

  if (localStorage.getItem("housegrid-last-reset") === today) return;

  localStorage.setItem("housegrid-last-reset", today);

  const oldWeek = getWeekKey(new Date(Date.now() - 86400000));
  const newWeek = getWeekKey();

  const totals = xpState.totals || { Aden: 0, Edward: 0, Jamie: 0 };
  const winner =
    Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] || "Nobody";

  await update(ref(db, `${BASE}/xpWeeks/${oldWeek}`), {
    lastWinner: winner,
    endedAt: Date.now()
  });

  await set(ref(db, `${BASE}/xpWeeks/${newWeek}`), {
    totals: { Aden: 0, Edward: 0, Jamie: 0 },
    completions: {},
    createdAt: Date.now()
  });

  showVictoryBanner(winner);
}

/* =========================
   FIREBASE
   ========================= */

async function startFirebase() {
  await signInAnonymously(auth);
}

async function seedDatabaseOnce() {
  const seeded = await get(ref(db, `${BASE}/meta/seeded`));

  if (!seeded.exists()) {
    await set(ref(db, BASE), defaultData);
  }
}

function setupListeners() {
  onValue(ref(db, `${BASE}/groceries`), (snap) => {
    groceryState = snapToArray(snap).sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );
    renderGroceries();
    runAffordTool();
  });

  onValue(ref(db, `${BASE}/bills`), (snap) => {
    billsState = snapToArray(snap);
    renderBills();
    runAffordTool();
  });

  onValue(ref(db, `${BASE}/fund`), (snap) => {
    fundState = snapToArray(snap).sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );
    renderFund();
    runAffordTool();
  });

  onValue(ref(db, `${BASE}/shifts`), (snap) => {
    shiftState = snapToArray(snap);
    renderShifts();
  });

  onValue(ref(db, `${BASE}/stress`), (snap) => {
    stressState = snap.val() || { Aden: 2, Edward: 2, Jamie: 2 };
    renderStress();
  });

  onValue(ref(db, `${BASE}/xpWeeks/${getWeekKey()}`), (snap) => {
    const data = snap.val() || {};

    xpState = {
      totals: data.totals || { Aden: 0, Edward: 0, Jamie: 0 },
      completions: data.completions || {},
      lastWinner: data.lastWinner || null
    };

    renderQuestBoard();
  });
}

/* =========================
   FORM EVENTS
   ========================= */

$("themeSelect").addEventListener("change", (e) => {
  applyTheme(e.target.value);
});

$("questPerson").addEventListener("change", renderQuestBoard);

$("groceryForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  await push(ref(db, `${BASE}/groceries`), {
    name: $("itemName").value.trim(),
    price: Number($("itemPrice").value),
    priority: $("itemPriority").value,
    person: currentUser,
    bought: false,
    createdAt: Date.now()
  });

  e.target.reset();

  $("groceryAlert").classList.remove("hidden");
  setTimeout(() => $("groceryAlert").classList.add("hidden"), 3000);
});

$("fundForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  await push(ref(db, `${BASE}/fund`), {
    person: $("fundPerson").value,
    amount: Number($("fundAmount").value),
    reason: $("fundReason").value.trim(),
    createdAt: Date.now()
  });

  e.target.reset();
});

$("shiftForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  await push(ref(db, `${BASE}/shifts`), {
    person: $("shiftPerson").value,
    job: $("shiftJob").value.trim(),
    day: $("shiftDay").value,
    start: $("shiftStart").value,
    end: $("shiftEnd").value,
    createdAt: Date.now()
  });

  e.target.reset();
  $("shiftJob").value = "Sonic";
});

/* =========================
   LOGIN
   ========================= */

$("loginBtn").addEventListener("click", async () => {
  const pass = $("loginPassword").value;

  if (pass !== HOUSE_PASSWORD) {
    $("loginError").classList.remove("hidden");
    return;
  }

  currentUser = $("loginPerson").value;

  localStorage.setItem("housegrid-user", currentUser);
  localStorage.setItem("housegrid-unlocked", "true");

  $("loginScreen").classList.add("hidden");

  await startFirebase();
});

/* =========================
   STARTUP
   ========================= */

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  await seedDatabaseOnce();
  setupListeners();

  updateWeeklyCountdown();

  setInterval(updateWeeklyCountdown, 1000);
  setInterval(checkSundayVictoryReset, 30000);
  setInterval(renderShifts, 60000);
});

applyTheme(currentTheme);

if (localStorage.getItem("housegrid-unlocked") === "true") {
  $("loginScreen").classList.add("hidden");
  startFirebase();
}
