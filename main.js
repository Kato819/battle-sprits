// --- 1. ライフコアの操作と同期 ---
for (let i = 1; i <= 6; i++) {
    const lifeEl = document.getElementById(`life${i}`);
    if (lifeEl) {
        lifeEl.addEventListener("click", () => {
            lifeEl.classList.toggle("is-transparent");
            // 通信相手にライフの増減（透明化）を送信
            if (typeof sendGameData === "function") {
                sendGameData({
                    type: "UPDATE_LIFE",
                    lifeId: `life${i}`,
                    isTransparent: lifeEl.classList.contains("is-transparent")
                });
            }
        });
    }
}

// --- 2. カードの選択状態を保持する変数 ---
let selectedCardElement = null;

// --- 3. カードDOM要素を生成する関数 ---
function createCardElement(cardData) {
    const cardEl = document.createElement("div");
    cardEl.className = "game-card";
    cardEl.id = cardData.id;
    cardEl.textContent = cardData.name || "";

    if (cardData.image) {
        cardEl.style.backgroundImage = `url(${cardData.image})`;
        cardEl.dataset.image = cardData.image; // 通信用に画像パスを保持
        cardEl.textContent = "";
    }

    // コアカウンターの組み立て
    const coreOverlay = document.createElement("div");
    coreOverlay.className = "card-core-overlay";
    coreOverlay.innerHTML = `
        <button type="button" class="card-core-btn btn-minus">−</button>
        <div class="card-core-display">
            <div class="core"></div>
            <span class="card-core-cross">×</span>
            <span class="card-core-num">0</span>
        </div>
        <button type="button" class="card-core-btn btn-plus">＋</button>
    `;

    // カウンタークリックでカード選択が反応しないようにする
    coreOverlay.addEventListener("click", (e) => {
        e.stopPropagation();
    });

    coreOverlay.addEventListener("dblclick", (e) => {
        e.stopPropagation();
    });

    const minusBtn = coreOverlay.querySelector(".btn-minus");
    const plusBtn = coreOverlay.querySelector(".btn-plus");
    const numEl = coreOverlay.querySelector(".card-core-num");

    // コアカウンターに触れている時は拡大を止める
    coreOverlay.addEventListener("mouseenter", () => {
        cardEl.classList.add("no-zoom");
    });

    coreOverlay.addEventListener("mouseleave", () => {
        cardEl.classList.remove("no-zoom");
    });

    // カード上のコア減算
    minusBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        let count = parseInt(numEl.textContent, 10);
        if (count > 0) {
            numEl.textContent = count - 1;
            // 通信相手にカードコア変動を送信
            if (typeof sendGameData === "function") {
                sendGameData({
                    type: "UPDATE_CARD_CORE",
                    cardId: cardEl.id,
                    count: count - 1
                });
            }
        }
    });

    // カード上のコア加算
    plusBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        let count = parseInt(numEl.textContent, 10);
        numEl.textContent = count + 1;
        // 通信相手にカードコア変動を送信
        if (typeof sendGameData === "function") {
            sendGameData({
                type: "UPDATE_CARD_CORE",
                cardId: cardEl.id,
                count: count + 1
            });
        }
    });

    // カード本体に追加
    cardEl.appendChild(coreOverlay);

    // クリック時の選択 / 解除処理
    cardEl.addEventListener("click", (e) => {
        e.stopPropagation();
        if (selectedCardElement === cardEl) {
            cardEl.classList.remove("is-selected");
            selectedCardElement = null;
            return;
        }
        if (selectedCardElement) {
            selectedCardElement.classList.remove("is-selected");
        }
        selectedCardElement = cardEl;
        cardEl.classList.add("is-selected");
    });

    // ★ダブルクリックで疲労（横向き）/ 回復の切り替え
    cardEl.addEventListener("dblclick", (e) => {
        e.stopPropagation();

        if (e.target.closest(".card-core-overlay")) {
                    return;
        }
        
        cardEl.classList.toggle("is-exhausted");
        
        // 通信相手に疲労状態を送信
        if (typeof sendGameData === "function") {
            sendGameData({
                type: "EXHAUST_CARD",
                cardId: cardEl.id,
                isExhausted: cardEl.classList.contains("is-exhausted")
            });
        }
    });

    return cardEl;
}

// --- 4. 山札の初期化とドロー処理 ---
let currentDeck = [...activeDeckData];

function shuffleDeck() {
    for (let i = currentDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentDeck[i], currentDeck[j]] = [currentDeck[j], currentDeck[i]];
    }
}
shuffleDeck();

function drawCard() {
    if (currentDeck.length === 0) {
        alert("デッキが空です！");
        return;
    }

    // 手札の空き枠を探す
    const handSlots = document.querySelectorAll("#my-hand .single-card-area");
    let targetSlot = null;
    for (const slot of handSlots) {
        if (slot.children.length === 0) {
            targetSlot = slot;
            break;
        }
    }

    if (!targetSlot) {
        alert("手札枠がいっぱいです！");
        return;
    }

    // ドローして手札に置く
    const drawnData = currentDeck.pop();
    const cardElement = createCardElement(drawnData);
    targetSlot.appendChild(cardElement);

    // 最後の1枚を引いて0枚になったら背景画像を消す
    if (currentDeck.length === 0) {
        const deck = document.getElementById("deck-slot");
        if (deck) deck.style.backgroundImage = "none";
    }
}

// デッキクリックでドロー
const deckSlot = document.querySelector("#my-field #deck-slot");
if (deckSlot) {
    deckSlot.style.cursor = "pointer";
    deckSlot.addEventListener("click", drawCard);
}

// --- 5. スロット（枠）をクリックした時のカード移動処理 ---
document.querySelectorAll("#my-field .single-card-area, #my-hand .single-card-area").forEach((slot) => {
    slot.addEventListener("click", () => {
        // カードを選択していない、またはデッキ枠をクリックした場合は何もしない
        if (!selectedCardElement || slot.id === "deck-slot") return;

        // トラッシュ枠の判定
        const isTrash = slot.id === "trash-slot" || slot.classList.contains("trash-area");

        // 通常枠のみ「すでにカードがあるか」をチェック
        if (!isTrash) {
            const hasCard = Array.from(slot.children).some(el => el.classList.contains("game-card"));
            if (hasCard) {
                alert("この枠にはすでにカードがあります");
                return;
            }
        }

        // トラッシュに送られた場合：カードのコアを「リザーブ」へ返却
        if (isTrash) {
            const numEl = selectedCardElement.querySelector(".card-core-num");
            if (numEl) {
                const cardCores = parseInt(numEl.textContent, 10);
                if (cardCores > 0) {
                    const reserveCountEl = document.getElementById("reserve-count");
                    if (reserveCountEl) {
                        const newCount = parseInt(reserveCountEl.textContent, 10) + cardCores;
                        reserveCountEl.textContent = newCount;
                        // 相手のリザーブ表示を同期
                        if (typeof sendGameData === "function") {
                            sendGameData({ type: "UPDATE_CORE", target: "reserve", count: newCount });
                        }
                    }
                    numEl.textContent = "0";
                }
            }
        }

        // スロットにカードを追加
        const movingCard = selectedCardElement;
        slot.appendChild(movingCard);

        // 選択状態を解除
        movingCard.classList.remove("is-selected");
        selectedCardElement = null;

        // ★通信相手へカード移動を送信
        if (typeof sendGameData === "function") {
            // スロットの識別子（番号、trash、burstなど）を特定
            let toSlotId = slot.dataset.mySlot;
            if (isTrash) toSlotId = "trash";
            if (slot.id === "burst-slot" || slot.textContent.trim() === "バースト") toSlotId = "burst";

            // フィールド内の移動のみ相手画面に反映（手札内の並び替えは非公開）
            if (toSlotId) {
                sendGameData({
                    type: "MOVE_CARD",
                    cardId: movingCard.id,
                    image: movingCard.dataset.image || "",
                    toSlot: toSlotId,
                    coreCount: movingCard.querySelector(".card-core-num")?.textContent || 0
                });
            }
        }
    });
});

// --- 6. リフレッシュステップ ---
const refreshBtn = document.getElementById("refresh-btn");
if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
        const trashEl = document.getElementById("trash-count");
        const reserveEl = document.getElementById("reserve-count");

        if (trashEl && reserveEl) {
            const trashCount = parseInt(trashEl.textContent, 10);
            if (trashCount > 0) {
                const newReserve = parseInt(reserveEl.textContent, 10) + trashCount;
                reserveEl.textContent = newReserve;
                trashEl.textContent = 0;

                // 相手画面のコア表示を更新
                if (typeof sendGameData === "function") {
                    sendGameData({ type: "UPDATE_CORE", target: "reserve", count: newReserve });
                    sendGameData({ type: "UPDATE_CORE", target: "trash", count: 0 });
                }
            }
        }

        // 自分の場の疲労カードをすべて回復（縦向き）
        document.querySelectorAll("#my-field .game-card.is-exhausted").forEach((card) => {
            card.classList.remove("is-exhausted");
            if (typeof sendGameData === "function") {
                sendGameData({
                    type: "EXHAUST_CARD",
                    cardId: card.id,
                    isExhausted: false
                });
            }
        });
    });
}

// --- 7. リザーブ・トラッシュのコア増減ボタン処理 ---
document.querySelectorAll(".core-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
        const target = e.target.dataset.target; // "reserve" または "trash"
        const numEl = document.getElementById(`${target}-count`);
        if (!numEl) return;

        let count = parseInt(numEl.textContent, 10);

        if (e.target.classList.contains("btn-plus")) {
            count += 1;
        } else if (e.target.classList.contains("btn-minus")) {
            if (count > 0) count -= 1;
        }

        numEl.textContent = count;

        // 通信相手にリザーブ／トラッシュのコア数を送信
        if (typeof sendGameData === "function") {
            sendGameData({
                type: "UPDATE_CORE",
                target: target,
                count: count
            });
        }
    });
});
