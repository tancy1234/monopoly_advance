/* =========================
   FIREBASE CORE
========================= */
const db = firebase.database();

/* =========================
   PLAYERS
========================= */
function listenPlayers(callback) {
  db.ref("players").on("value", (snap) => {
    callback(snap.val() || {});
  });
}

function savePlayers(players) {
  db.ref("players").set(players);
}

/* =========================
   TURN ORDER
========================= */
function listenTurnOrder(callback) {
  db.ref("turnOrder").on("value", (snap) => {
    callback(snap.val() || []);
  });
}

function saveTurnOrder(order) {
  db.ref("turnOrder").set(order);
}

/* =========================
   CURRENT TURN
========================= */
function listenCurrentTurn(callback) {
  db.ref("currentTurn").on("value", (snap) => {
    callback(snap.val() || null);
  });
}

function setCurrentTurn(p) {
  db.ref("currentTurn").set(p);
}

/* =========================
   SKIP SYSTEM
========================= */
function listenSkipList(callback) {
  db.ref("skipList").on("value", (snap) => {
    callback(snap.val() || {});
  });
}

function saveSkipList(data) {
  db.ref("skipList").set(data);
}

/* =========================
   CORE HELPERS
========================= */
function updateTurnOrderWithPlayers(players, order) {
  let list = Object.keys(players || {});

  order = (order || []).filter(p => list.includes(p));

  list.forEach(p => {
    if (!order.includes(p)) order.push(p);
  });

  return order;
}

/* =========================
   MONEY (inside players)
========================= */
function addMoney(players, p, amt) {
  if (!players[p]) return players;

  players[p].gold = (players[p].gold || 0) + amt;
  return players;
}

function removeMoney(players, p, amt) {
  if (!players[p]) return players;

  players[p].gold = (players[p].gold || 0) - amt;
  return players;
}

function penalty(players, p) {
  if (!players[p]) return players;

  players[p].gold -= 500;
  return players;
}

/* =========================
   SKIP
========================= */
function setSkip(skipList, p) {
  skipList[p] = 1;
  return skipList;
}

function consumeSkip(skipList, p) {
  if (skipList[p] > 0) {
    skipList[p]--;
    return { skipList, skipped: true };
  }
  return { skipList, skipped: false };
}

function startGame() {
  if (!turnOrder || turnOrder.length === 0) {
    alert("No players");
    return;
  }

  setCurrentTurn(turnOrder[0]);
}

function nextTurn() {
  if (!turnOrder.length) return;

  let index = turnOrder.indexOf(currentTurn);
  if (index === -1) index = 0;

  // skip logic
  if (skipList[currentTurn] > 0) {
    skipList[currentTurn] -= 1;
    saveSkipList(skipList);
    return;
  }

  index = (index + 1) % turnOrder.length;

  setCurrentTurn(turnOrder[index]);
}

function addMoney() {
  let p = document.getElementById("moneyPlayer").value;
  let amt = parseInt(document.getElementById("moneyAmount").value);

  players[p].gold = (players[p].gold || 0) + amt;

  savePlayers(players);
}

function removeMoney() {
  let p = document.getElementById("moneyPlayer").value;
  let amt = parseInt(document.getElementById("moneyAmount").value);

  players[p].gold = (players[p].gold || 0) - amt;

  savePlayers(players);
}

function penalty() {
  let p = document.getElementById("penaltyPlayer").value;

  players[p].gold -= 500;

  savePlayers(players);
}

function removePlayer() {
  let p = document.getElementById("removePlayer").value;

  delete players[p];

  savePlayers(players);
}

function skipTurn() {
  let p = document.getElementById("skipPlayer").value;

  skipList[p] = 1;

  saveSkipList(skipList);
}

function saveTurnOrderUI(newOrder) {
  saveTurnOrder(newOrder);
}

function renderPlayers(data) {
  let html = "";

  for (let p in data) {
    html += `
      <div class="card">
        <b>${p}</b><br>
        ${data[p].name}<br>
        💰 ${data[p].gold || 0}
      </div>
    `;
  }

  document.getElementById("players").innerHTML = html;
}

function renderTurnUI(turn) {
  document.getElementById("liveTurn").innerText = turn || "-";
}

function renderTurnOrder(data) {
  let html = "";

  data.forEach((p, i) => {
    html += `
      <div class="card">
        ${i + 1}. ${p}
        <button onclick="moveUp(${i})">⬆</button>
        <button onclick="moveDown(${i})">⬇</button>
      </div>
    `;
  });

  document.getElementById("orderList").innerHTML = html;
}

