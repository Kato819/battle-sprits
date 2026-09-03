// network.js

// 1. ランダムな6桁の数字コードを生成
function generateShortCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// 2. 6桁コードを付与してPeerインスタンスを初期化（他者との重複回避のため接頭辞をつける）
const myShortCode = generateShortCode();
const peer = new Peer(`bs-room-${myShortCode}`);
let conn = null;
let heartbeatInterval = null;

// 3. ID確定時の処理（画面には6桁の数字のみ表示）
peer.on("open", (id) => {
    console.log("My Room Code:", myShortCode);
    const myIdEl = document.getElementById("my-peer-id");
    if (myIdEl) {
        myIdEl.textContent = myShortCode;
    }
});

// 万が一同じ数字コードが衝突した場合の自動リトライ
peer.on("error", (err) => {
    if (err.type === "unavailable-id") {
        location.reload();
    } else {
        console.error("PeerJSエラー:", err);
    }
});

// 4. 相手から接続されたときの処理（ホスト側）
peer.on("connection", (connection) => {
    conn = connection;
    setupConnectionEvents();
});

// 5. 相手の数字6桁を入力して接続する処理（ゲスト側）
const connectBtn = document.getElementById("connect-btn");
if (connectBtn) {
    connectBtn.addEventListener("click", () => {
        const inputVal = document.getElementById("target-peer-id").value.trim();
        if (!inputVal || inputVal.length !== 6 || isNaN(inputVal)) {
            alert("半角数字6桁を入力してください");
            return;
        }

        // 接頭辞を補完して接続
        const targetFullId = `bs-room-${inputVal}`;
        conn = peer.connect(targetFullId);
        setupConnectionEvents();
    });
}

// 6. 接続確立後のイベント設定 & ハートビート監視
function setupConnectionEvents() {
    if (!conn) return;

    conn.on("open", () => {
        const statusEl = document.getElementById("connection-status");
        if (statusEl) {
            statusEl.textContent = "● 接続中";
            statusEl.style.color = "#4ade80";
        }
        console.log("P2P接続が確立しました！");

        // 15秒ごとに生存信号（PING）を送って通信経路を維持
        clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(() => {
            if (conn && conn.open) {
                conn.send({ type: "PING" });
            }
        }, 15000);
    });

    // 相手からデータを受信したとき
    conn.on("data", (data) => {
        // 生存確認PINGは無視して読み捨てる
        if (data.type === "PING") return;

        console.log("受信したデータ:", data);
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
        console.error("P2Pエラー:", err);
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
        // カードの移動・召喚
        case "MOVE_CARD": {
            let cardEl = document.getElementById(`op-card-${data.cardId}`);
            
            // 相手画面にまだないカードなら新しく作成
            if (!cardEl) {
                cardEl = document.createElement("div");
                cardEl.className = "game-card";
                cardEl.id = `op-card-${data.cardId}`;
                if (data.image) {
                    cardEl.style.backgroundImage = `url(${data.image})`;
                }

                // 相手用コアカウンターバッジ
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

            // 移動先の相手枠を特定
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
            } else {
                console.warn("移動先スロットが見つかりませんでした: ", data.toSlot);
            }
            break;
        }

        // コア増減（リザーブ / トラッシュ）
        case "UPDATE_CORE": {
            const numEl = document.getElementById(`op-${data.target}-count`);
            if (numEl) numEl.textContent = data.count;
            break;
        }

        // カード上のコア数変動
        case "UPDATE_CARD_CORE": {
            const coreNumEl = document.getElementById(`op-core-${data.cardId}`);
            if (coreNumEl) coreNumEl.textContent = data.count;
            break;
        }

        // 疲労・回復の切り替え
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

        // ライフコアの増減
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
