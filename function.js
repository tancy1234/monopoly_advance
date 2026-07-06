

/* =========================
   STORAGE CORE
========================= */


function savePlayers(players) {
  localStorage.setItem("players", JSON.stringify(players));
}

/* =========================
   TURN SYSTEM
========================= */


function saveTurnOrder(order) {
  localStorage.setItem("turnOrder", JSON.stringify(order));
}

function getCurrentTurn() {
  return localStorage.getItem("currentTurn");
}

function setCurrentTurn(p) {
  localStorage.setItem("currentTurn", p);
}

/* =========================
   SKIP SYSTEM
========================= */




/* =========================
   RENDER PLAYERS
========================= */
function renderPlayers() {
  getPlayers((players) => {
    renderPlayers(players);
  });

  let html = "<h3>📜 Players</h3>";

  for (let char in players) {
    html += `
      <div class="card">
        <b>${char.toUpperCase()}</b><br>
        Name: ${players[char].name}<br>
        Gold: ${players[char].gold || 0}
      </div>
    `;
  }

  document.getElementById("players").innerHTML = html;
}

/* =========================
   UPDATE DROPDOWNS
========================= */
function updateSelect() {
  let players = getPlayers();

  function fill(id) {
    let sel = document.getElementById(id);
    if (!sel) return;

    let prev = sel.value;
    sel.innerHTML = "";

    Object.keys(players).forEach(char => {
      let opt = document.createElement("option");
      opt.value = char;
      opt.textContent = `${char} (${players[char].name})`;
      sel.appendChild(opt);
    });

    sel.value = prev;
  }

  fill("removePlayer");
  fill("moneyPlayer");
  fill("penaltyPlayer");
  fill("skipPlayer");
}

function isOrderLocked() {
  return localStorage.getItem("orderLocked") === "true";
}

function setOrderLocked(v) {
  localStorage.setItem("orderLocked", v ? "true" : "false");
}
/* =========================
   TURN ORDER SYNC
========================= */
function syncTurnOrderWithPlayers() {
  let players = Object.keys(getPlayers());
  let order = getTurnOrder();

  // ❗ 如果锁住 → 不改顺序
  if (isOrderLocked()) return;

  // 只移除不存在玩家
  order = order.filter(p => players.includes(p));

  // 只添加新玩家
  players.forEach(p => {
    if (!order.includes(p)) order.push(p);
  });

  saveTurnOrder(order);
}

/* =========================
   TURN UI
========================= */
function renderTurnUI() {
  let current = getCurrentTurn() || "-";
  document.getElementById("liveTurn").innerText = current;
}

/* =========================
   NEXT TURN
========================= */
function nextTurn() {
  let order = getTurnOrder();
  if (order.length === 0) return;

  let current = getCurrentTurn();
  let index = order.indexOf(current);
  if (index === -1) index = 0;

  let skipList = getSkipList();

  // ❗ check NEXT player instead of current
  let nextIndex = (index + 1) % order.length;
  let nextPlayer = order[nextIndex];

  // 🔥 if NEXT player must skip → consume skip but DON'T move to them
  if (skipList[nextPlayer] && skipList[nextPlayer] > 0) {
    skipList[nextPlayer] -= 1;
    saveSkipList(skipList);

    alert(nextPlayer + " skipped turn!");

    // skip them → jump to next next player
    let skipIndex = (nextIndex + 1) % order.length;
    setCurrentTurn(order[skipIndex]);

    renderTurnUI();
    return;
  }

  // normal flow
  setCurrentTurn(nextPlayer);
  renderTurnUI();
}

/* =========================
   MONEY
========================= */
function addMoney() {
  let p = document.getElementById("moneyPlayer").value;
  let amt = parseInt(document.getElementById("moneyAmount").value);

  let players = getPlayers();
  if (!players[p] || isNaN(amt)) return;

  players[p].gold = (players[p].gold || 0) + amt;

  savePlayers(players);
  renderPlayers();
}

function removeMoney() {
  let p = document.getElementById("moneyPlayer").value;
  let amt = parseInt(document.getElementById("moneyAmount").value);

  let players = getPlayers();
  if (!players[p] || isNaN(amt)) return;

  players[p].gold = (players[p].gold || 0) - amt;

  savePlayers(players);
  renderPlayers();
}

/* =========================
   PENALTY
========================= */
function penalty() {
  let p = document.getElementById("penaltyPlayer").value;

  let players = getPlayers();
  if (!players[p]) return;

  players[p].gold -= 500;

  savePlayers(players);
  renderPlayers();
}

/* =========================
   SKIP TURN
========================= */
function skipTurn() {
  let p = document.getElementById("skipPlayer").value;

  let skipList = getSkipList();

  // 🔥 IMPORTANT: make it counter-based
  skipList[p] = (skipList[p] || 0) + 1;

  saveSkipList(skipList);

  alert(p + " will skip next turn");
}

/* =========================
   REMOVE PLAYER
========================= */
function removePlayer() {
  let players = getPlayers();
  let p = document.getElementById("removePlayer").value;

  delete players[p];
  savePlayers(players);

  let order = getTurnOrder();
  order = order.filter(x => x !== p);
  saveTurnOrder(order);

  let skip = getSkipList();
  delete skip[p];
  saveSkipList(skip);

  renderAll();
}

/* =========================
   TURN ORDER UI
========================= */
function renderTurnOrder() {
  let order = getTurnOrder();
  let container = document.getElementById("orderList");

  if (!container) return;

  let html = "";

  order.forEach((p, i) => {
    html += `
      <div class="card">
        ${i + 1}. ${p}
        <button onclick="moveUp(${i})">⬆</button>
        <button onclick="moveDown(${i})">⬇</button>
      </div>
    `;
  });

  container.innerHTML = html;
}

/* =========================
   GAME CONTROL
========================= */
function startGame() {
  syncTurnOrderWithPlayers();

  let order = getTurnOrder();

  if (order.length === 0) {
    alert("No players");
    return;
  }

  setCurrentTurn(order[0]);

  renderAll();
}

function resetGame() {
  localStorage.clear();
  renderAll();
}

/* =========================
   MASTER RENDER
========================= */
function renderAll() {
  renderPlayers();
  updateSelect();
  renderTurnOrder();   // ⭐ 关键
  renderTurnUI();
}

/* =========================
   SAFE STORAGE CORE (FIXED)
========================= */

function safeParse(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    if (!v || v === "undefined" || v === "null") return fallback;
    return JSON.parse(v);
  } catch (e) {
    return fallback;
  }
}

/* PLAYERS */
function getPlayers(callback) {
  db.ref("players").on("value", (snap) => {
    callback(snap.val() || {});
  });
}

function savePlayers(players) {
  db.ref("players").set(players);
}

/* TURN ORDER */
function getTurnOrder(callback) {
  db.ref("turnOrder").on("value", (snap) => {
    callback(snap.val() || []);
  });
}

function saveTurnOrder(order) {
  db.ref("turnOrder").set(order);
}

/* CURRENT TURN */
function getCurrentTurn(callback) {
  db.ref("currentTurn").on("value", (snap) => {
    callback(snap.val());
  });
}

function setCurrentTurn(p) {
  db.ref("currentTurn").set(p);
}

function listenTurn(callback) {
  db.ref("currentTurn").on("value", (snap) => {
    callback(snap.val());
  });
}

/* SKIP LIST */
function getSkipList(callback) {
  db.ref("skipList").on("value", (snap) => {
    callback(snap.val() || {});
  });
}

function saveSkipList(data) {
  db.ref("skipList").set(data);
}



function getTurnOrderSafe() {
  try {
    let data = localStorage.getItem("turnOrder");
    if (!data || data === "undefined") return [];
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function moveUp(index) {
  let order = getTurnOrderSafe();

  if (index === 0) return;

  [order[index - 1], order[index]] = [order[index], order[index - 1]];

  localStorage.setItem("turnOrder", JSON.stringify(order));
  renderTurnOrder();
}

function moveDown(index) {
  let order = getTurnOrderSafe();

  if (index === order.length - 1) return;

  [order[index + 1], order[index]] = [order[index], order[index + 1]];

  localStorage.setItem("turnOrder", JSON.stringify(order));
  renderTurnOrder();
}

function lockAndSave() {
  setOrderLocked(true);

  let order = getTurnOrder();
  saveTurnOrder(order);

  alert("Turn order locked!");
  renderTurnOrder();
}



/* =========================
   INIT
========================= */
window.onload = () => {
  syncTurnOrderWithPlayers();
  renderAll();
};

setInterval(() => {
  syncTurnOrderWithPlayers();
  renderAll();
}, 1000);

