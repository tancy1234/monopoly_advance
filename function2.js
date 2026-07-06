function listenPlayers(callback) {
    db.ref("players").on("value", (snap) => {
        callback(snap.val() || {});
    });
}

function listenTurn(callback) {
    db.ref("currentTurn").on("value", (snap) => {
        callback(snap.val());
    });
}

function listenTurnOrder(callback) {
    db.ref("turnOrder").on("value", (snap) => {
        callback(snap.val() || []);
    });
}

function listenCurrentTurn(callback) {
    db.ref("currentTurn").on("value", (snap) => {
        callback(snap.val() || null);
    });
}