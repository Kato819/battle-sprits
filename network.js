// network.js

// 1. ランダムな6桁の数字コードを生成
function generateShortCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// 2. 6桁コードを付与し、STUN/TURNサーバーを指定してPeer初期化
const myShortCode = generateShortCode();
const peer = new Peer(`bs-room-${myShortCode}`, {
    config: {
        iceServers: [
            // 直接通信用（Google STUN）
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            
            // ルーター・回線の壁を越えるための中継用（公開TURNサーバー）
            {
                urls: "turn:openrelay.metered.ca:80",
                username: "openrelayproject",
                credential: "openrelayproject"
            },
            {
                urls: "turn:openrelay.metered.ca:443",
                username: "openrelayproject",
                credential: "openrelayproject"
            },
            {
                urls: "turn:openrelay.metered.ca:443?transport=tcp",
                username: "openrelayproject",
                credential: "openrelayproject"
            }
        ],
        iceCandidatePoolSize: 10
    }
});

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

// エラーハンドリング
peer.on("error", (err) => {
    console.error("Peer全体エラー:", err.type, err);
    if (err.type === "unavailable-id") {
        location.reload();
    } else if (err.type === "peer-unavailable") {
        alert("指定されたコードの相手が見つかりません。\n相手の画面が開いているか、番号が最新か確認してください。");
        resetConnectButton();
    }
});

// 4. 相手から接続されたとき（ホスト側）
peer.on("connection", (connection) => {
    console.log("相手からの接続を検知しました！", connection.peer);
    conn = connection;
    setupConnectionEvents();
});

// 5. 接続ボタン処理（ゲスト側）
const connectBtn = document.getElementById("connect-btn");
const targetInput = document.getElementById("target-peer-id");

function resetConnectButton() {
    if (connectBtn) {
        connectBtn.disabled = false;
        connectBtn.textContent = "接続";
    }
}

if (connectBtn) {
    connectBtn.addEventListener("click", () => {
        console.log(">>> 接続ボタンがクリックされました！");

        if (!targetInput) {
            console.error("入力欄 (id='target-peer-id') が見つかりません");
            return;
        }

        const inputVal = targetInput.value.trim();
        console.log("入力された値:", inputVal);

        if (!inputVal || inputVal.length !== 6 || isNaN(inputVal)) {
            alert("相手の半角数字6桁を入力してください");
            return;
        }

        // 連打防止：1回押したら一時的に無効化
        connectBtn.disabled = true;
        connectBtn.textContent = "接続中...";

        const targetFullId = `bs-room-${inputVal}`;
        console.log("接続開始:", targetFullId);

        conn = peer.connect(targetFullId, {
            reliable: true,
            serialization: "json"
        });

        conn.on("error", (err) => {
            console.error("接続エラー:", err);
            resetConnectButton();
        });

        conn.on("close", () => {
            resetConnectButton();
        });

        setupConnectionEvents();
    });
}

// 6. 接続確立後のイベント設定 & 状態監視
function setupConnectionEvents() {
    if (!conn) return;

    console.log("コネクション監視をセットアップ中...", conn.peer);

    // 通信確立時の画面更新処理
    const markConnected = () => {
        console.log("★ P2Pデータ通信路が完全に開通しました！");
        const statusEl = document.getElementById("connection-status");
        if (statusEl) {
            statusEl.textContent = "● 接続中";
            statusEl.style.color = "#4ade80";
        }
        resetConnectButton();

        // 15秒ごとの生存確認PING
        clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(() => {
            if (conn && conn.open) {
                conn.send({ type: "PING" });
            }
        }, 15000);
    };

    // すでに開通しているかチェック
    if (conn.open) {
        markConnected();
    } else {
        conn.on("open", () => {
            markConnected();
        });
    }

    // 相手からデータを受信したとき
    conn.on("data", (data) => {
        if (data.type === "PING") return;
        console.log("受信データ:", data);
        handleIncomingData(data);
    });

    conn.on("close", () => {
        console.warn("P2P接続が切断されました");
        clearInterval(heartbeatInterval);
        const statusEl = document.getElementById("connection-status");
        if (statusEl) {
            statusEl.textContent = "× 切断されました";
            statusEl.style.color = "#f87171";
        }
        resetConnectButton();
    });

    // WebRTCの内部経路状態（ICE）を直接監視
    if (conn.peerConnection) {
        conn.peerConnection.oniceconnectionstatechange = () => {
            const state = conn.peerConnection.iceConnectionState;
            console.log("ICE状態変化:", state);
            if (state === "connected" || state === "completed") {
                markConnected();
            }
        };
    }
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
                // 移動元のスロットを記憶
                const oldSlot = cardEl.parentElement;
                
                targetSlot.appendChild(cardEl);

                // ★相手の画面でもブレイヴ（重なり）表示を自動調整
                if (typeof updateBraveClasses === "function") {
                    if (oldSlot) updateBraveClasses(oldSlot);
                    updateBraveClasses(targetSlot);
                }
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
        case "UPDATE_HAND_COUNT": {
            const opHand = document.getElementById("op-hand");
            if (opHand) {
                // 一旦手札エリアを空にする
                opHand.innerHTML = ""; 
                // 送られてきた枚数分だけ裏向きカードを生成
                for (let i = 0; i < data.count; i++) {
                    const card = document.createElement("div");
                    card.className = "op-hand-card";
                    opHand.appendChild(card);
                }
            }
            break;
        }
    }
}
