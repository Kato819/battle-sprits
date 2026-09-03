// network.js

// 1. ランダムな6桁の数字コードを生成
function generateShortCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// 2. 6桁コードを付与してPeerインスタンスを初期化
const myShortCode = generateShortCode();
const peer = new Peer(`bs-room-${myShortCode}`);
let conn = null;
let heartbeatInterval = null;

// 3. ID確定時の処理（画面に数字6桁を表示）
peer.on("open", (id) => {
    console.log("Peer準備完了 - あなたの6桁コード:", myShortCode);
    const myIdEl = document.getElementById("my-peer-id");
    if (myIdEl) {
        myIdEl.textContent = myShortCode;
    }
});

// 万が一同じ数字コードが衝突した場合の自動リトライ
peer.on("error", (err) => {
    console.error("PeerJSエラー:", err);
    if (err.type === "unavailable-id") {
        location.reload();
    }
});

// 4. 相手から接続されたとき（ホスト側）
peer.on("connection", (connection) => {
    console.log("相手からの接続を検知しました！");
    conn = connection;
    setupConnectionEvents();
});

// 5. 接続ボタンクリック処理（HTML末尾で読み込まれているため即座に取得可能）
const connectBtn = document.getElementById("connect-btn");
const targetInput = document.getElementById("target-peer-id");

if (connectBtn) {
    connectBtn.addEventListener("click", () => {
        console.log(">>> 接続ボタンがクリックされました！");

        if (!targetInput) {
            console.error("入力欄 (id='target-peer-id') がありません");
            return;
        }

        const inputVal = targetInput.value.trim();
        console.log("入力された値:", inputVal);

        if (!inputVal || inputVal.length !== 6 || isNaN(inputVal)) {
            alert("相手の半角数字6桁を入力してください");
            return;
        }

        const targetFullId = `bs-room-${inputVal}`;
        console.log("接続開始:", targetFullId);

        conn = peer.connect(targetFullId);
        setupConnectionEvents();
    });
} else {
    console.error("connect-btn が見つかりません");
}

// 6. 接続確立後のイベント設定 & ハートビート監視
function setupConnectionEvents() {
    if (!conn) return;

    conn.on("open", () => {
        console.log("P2P接続が完全に確立しました！");
        const statusEl = document.getElementById("connection-status");
        if (statusEl) {
            statusEl.textContent = "● 接続中";
            statusEl.style.color = "#4ade80";
        }

        // 15秒ごとの生存確認PING
        clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(() => {
            if (conn && conn.open) {
                conn.send({ type: "PING" });
            }
        }, 15000);
    });

    // 相手からデータを受信したとき
    conn.on("data", (data) => {
        if (data.type === "PING") return;
        console.log("受信データ:", data);
        handleIncomingData(data);
    });

    conn.on("close", () => {
        clearInterval(heartbeatInterval);
        const statusEl = document.getElementById("connection-status");
        if (statusEl) {
            statusEl.textContent = "× 切断されました";
            statusEl.style.color = "#f87171";
        }
    });

    conn.on("error", (err) => {
        console.error("接続エラー:", err);
    });
}

// 相手にデータを送信する関数
function sendGameData(data) {
    if (conn && conn.open) {
        conn.send(data);
    }
}

// 相手から届いたデータに応じて相手フィールド（#opponent-field）を動かす関数
function handleIncomingData(data) {
    switch (data.type) {
        case "MOVE_CARD": {
            let cardEl = document.getElementById(`op-card-${data.cardId}`);
            
            if (!cardEl) {
                cardEl = document.createElement("div");
                cardEl.className = "game-card";
                cardEl.id = `op-card-${data.cardId}`;
                if (data.image) {
                    cardEl.style.backgroundImage = `url(${data.image})`;
                }

                const overlay = document.createElement("div");
                overlay.className = "card-core-overlay";
                overlay.style.display = "flex";
                overlay.innerHTML = `
                    <div class="card-core-display" style="width: 100%; justify-content: center;">
                        <div class="core"></div>
                        <span class="card-core-cross">×</span>
                        <span class="card-core-num" id="op-core-${data.cardId}">${data.coreCount || 0}</span>
                    </div>
                `;
                cardEl.appendChild(overlay);
            }

            let targetSlot = null;
            if (data.toSlot === "trash") {
                targetSlot = document.getElementById("op-trash-slot");
            } else if (data.toSlot === "burst") {
                targetSlot = document.getElementById("op-burst-slot");
            } else {
                targetSlot = document.querySelector(`#opponent-field [data-op-slot="${data.toSlot}"]`);
            }

            if (targetSlot) {
                targetSlot.appendChild(cardEl);
            }
            break;
        }

        case "UPDATE_CORE": {
            const numEl = document.getElementById(`op-${data.target}-count`);
            if (numEl) numEl.textContent = data.count;
            break;
        }

        case "UPDATE_CARD_CORE": {
            const coreNumEl = document.getElementById(`op-core-${data.cardId}`);
            if (coreNumEl) coreNumEl.textContent = data.count;
            break;
        }

        case "EXHAUST_CARD": {
            const cardEl = document.getElementById(`op-card-${data.cardId}`);
            if (cardEl) {
                if (data.isExhausted) {
                    cardEl.classList.add("is-exhausted");
                } else {
                    cardEl.classList.remove("is-exhausted");
                }
            }
            break;
        }

        case "UPDATE_LIFE": {
            const lifeEl = document.getElementById(`op-${data.lifeId}`);
            if (lifeEl) {
                if (data.isTransparent) {
                    lifeEl.classList.add("is-transparent");
                } else {
                    lifeEl.classList.remove("is-transparent");
                }
            }
            break;
        }
    }
}
