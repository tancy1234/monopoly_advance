

/* =========================
   PLAYERS
========================= */


function savePlayers(players) {
  db.ref("players").set(players);
}

/* =========================
   TURN ORDER
========================= */


function saveTurnOrder(order) {
  db.ref("turnOrder").set(order);
}

/* =========================
   CURRENT TURN
========================= */


function setCurrentTurn(p) {
  db.ref("currentTurn").set(p);
}

/* =========================
   SKIP SYSTEM
========================= */


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


function addMoney() {

  let p = document.getElementById("moneyPlayer").value;
  let amt = parseInt(document.getElementById("moneyAmount").value);

  if(!players[p]) return;

  players[p].gold =
  (players[p].gold || 0) + amt;

  savePlayers(players);
}

function removeMoney(){

 let p=document.getElementById("moneyPlayer").value;
 let amt=parseInt(document.getElementById("moneyAmount").value);

 if(!players[p]) return;


 players[p].gold =
 (players[p].gold || 0)-amt;


 savePlayers(players);

}

function penalty(){

 let p=document.getElementById("penaltyPlayer").value;

 if(!players[p]) return;


 players[p].gold-=500;


 savePlayers(players);

}


/* =========================
   STORAGE CORE
========================= */


function resetGame() {
  db.ref().set({
    players: {},
    turnOrder: [],
    currentTurn: "",
    skipList: {}
  });
}




function renderPlayers() {
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


/* =========================
   TURN ORDER SYNC
========================= */
function syncTurnOrderWithPlayers(){

  if(orderLocked) return;


  let playerList = Object.keys(players);


  let newOrder = turnOrder.filter(p =>
    playerList.includes(p)
  );


  playerList.forEach(p=>{

    if(!newOrder.includes(p)){
      newOrder.push(p);
    }

  });


  db.ref("turnOrder").set(newOrder);

}

/* =========================
   TURN UI
========================= */
function renderTurnUI(){

 document.getElementById("liveTurn")
 .innerText = currentTurn || "-";

}

/* =========================
   NEXT TURN
========================= */
function nextTurn(){

  if(turnOrder.length === 0)
    return;
  let index = turnOrder.indexOf(currentTurn);
  if(index === -1)
    index = 0;
  let nextIndex =
  (index + 1) % turnOrder.length;
  let nextPlayer =
  turnOrder[nextIndex];
  // check skip
  let skipCount =
  skipList[nextPlayer] || 0;

  if(skipCount > 0){

    db.ref("skipList/" + nextPlayer)
    .set(skipCount - 1);
    let skipNext =
    (nextIndex + 1) % turnOrder.length;
    db.ref("currentTurn")
    .set(turnOrder[skipNext]);


    alert(nextPlayer + " skipped");

    return;

  }
  db.ref("currentTurn")
  .set(nextPlayer);
}


/* =========================
   SKIP TURN
========================= */
function skipTurn(){

  let p = document.getElementById("skipPlayer").value;


  if(!p){
    alert("Select player");
    return;
  }


  db.ref("skipList/" + p).once("value")
  .then((snap)=>{

    let count = snap.val() || 0;


    db.ref("skipList/" + p)
    .set(count + 1);


    alert(p + " will skip next turn");

  });

}


/* =========================
   TURN ORDER UI
========================= */
function renderTurnOrder() {
  let container = document.getElementById("orderList");
  if (!container) return;

  let html = "";

  turnOrder.forEach((p, i) => {
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
function startGame(){

 if(turnOrder.length===0){

   alert("No players");
   return;

 }


 db.ref("currentTurn")
 .set(turnOrder[0]);

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

function removePlayer() {

  let p = document.getElementById("removePlayer").value;

  if (!p) {
    alert("No player selected");
    return;
  }


  // 删除 Firebase 玩家资料
  db.ref("players/" + p).remove()
  .then(()=>{

    console.log(p + " removed from players");


    // 同时从 turnOrder 删除
    db.ref("turnOrder").once("value")
    .then((snap)=>{

      let order = snap.val() || [];

      order = order.filter(x => x !== p);


      db.ref("turnOrder").set(order);


    });


    // 删除 skip 状态
    db.ref("skipList/" + p).remove();


    alert(p + " removed");


  })
  .catch((error)=>{

    console.error("Remove error:", error);
  });

}




/* TURN ORDER */

function moveUp(index) {

  if (index === 0) return;

  let newOrder = [...turnOrder];

  [newOrder[index - 1], newOrder[index]] =
  [newOrder[index], newOrder[index - 1]];


  db.ref("turnOrder").set(newOrder);

}

function moveDown(index) {

  if (index === turnOrder.length - 1) return;


  let newOrder = [...turnOrder];


  [newOrder[index + 1], newOrder[index]] =
  [newOrder[index], newOrder[index + 1]];


  db.ref("turnOrder").set(newOrder);

}
function lockAndSave(){

  db.ref("orderLocked").set(true);


  alert("Turn order locked!");

}