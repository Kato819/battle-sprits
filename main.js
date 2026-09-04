// ============================================================
// コア管理・連動ヘルパー関数（総数不変ルール）
// ============================================================

// ヘルパー：リザーブのコア数を取得
function getReserveCount() {
    const el = document.getElementById("reserve-count");
    return el ? parseInt(el.textContent, 10) : 0;
}

// ヘルパー：リザーブのコア数を更新＆相手へ同期
function setReserveCount(num) {
    const el = document.getElementById("reserve-count");
    if (el) {
        const val = Math.max(0, num);
        el.textContent = val;
        if (typeof sendGameData === "function") {
            sendGameData({ type: "UPDATE_CORE", target: "reserve", count: val });
        }
    }
}

// ヘルパー：トラッシュのコア数を取得
function getTrashCount() {
    const el = document.getElementById("trash-count");
    return el ? parseInt(el.textContent, 10) : 0;
}

// ヘルパー：トラッシュのコア数を更新＆相手へ同期
function setTrashCount(num) {
    const el = document.getElementById("trash-count");
    if (el) {
        const val = Math.max(0, num);
        el.textContent = val;
        if (typeof sendGameData === "function") {
            sendGameData({ type: "UPDATE_CORE", target: "trash", count: val });
        }
    }
}

// ============================================================
// 1. ライフコアの操作と同期
// ============================================================
for (let i = 1; i <= 6; i++) {
    const lifeEl = document.getElementById(`life${i}`);
    if (lifeEl) {
        lifeEl.addEventListener("click", () => {
            lifeEl.classList.toggle("is-transparent");
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

// ============================================================
// 2. カードの選択状態管理
// ============================================================
let selectedCardElement = null;

// ============================================================
// 3. カードDOM要素を生成する関数
// ============================================================
function createCardElement(cardData) {
    const cardEl = document.createElement("div");
    cardEl.className = "game-card";
    cardEl.id = cardData.id;
    cardEl.textContent = cardData.name || "";

    if (cardData.image) {
        cardEl.style.backgroundImage = `url(${cardData.image})`;
        cardEl.dataset.image = cardData.image;
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

    coreOverlay.addEventListener("click", (e) => e.stopPropagation());
    coreOverlay.addEventListener("dblclick", (e) => e.stopPropagation());

    const minusBtn = coreOverlay.querySelector(".btn-minus");
    const plusBtn = coreOverlay.querySelector(".btn-plus");
    const numEl = coreOverlay.querySelector(".card-core-num");

    coreOverlay.addEventListener("mouseenter", () => cardEl.classList.add("no-zoom"));
    coreOverlay.addEventListener("mouseleave", () => cardEl.classList.remove("no-zoom"));

    // --- カード上のコア加算（リザーブから1個持ってくる） ---
    plusBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const reserve = getReserveCount();
        if (reserve <= 0) {
            alert("リザーブにコアがありません！");
            return;
        }

        setReserveCount(reserve - 1);
        let count = parseInt(numEl.textContent, 10);
        numEl.textContent = count + 1;

        if (typeof sendGameData === "function") {
            sendGameData({
                type: "UPDATE_CARD_CORE",
                cardId: cardEl.id,
                count: count + 1
            });
        }
    });

    // --- カード上のコア減算（リザーブへ1個戻す：1つのみ定義） ---
    minusBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        let count = parseInt(numEl.textContent, 10);
        if (count > 0) {
            numEl.textContent = count - 1;
            setReserveCount(getReserveCount() + 1);

            if (typeof sendGameData === "function") {
                sendGameData({
                    type: "UPDATE_CARD_CORE",
                    cardId: cardEl.id,
                    count: count - 1
                });
            }
        }
    });

    cardEl.appendChild(coreOverlay);

    // クリック時の選択 / 解除
// クリック時の選択 / 解除 ＋ ★合体するためのクリックリダイレクト
    cardEl.addEventListener("click", (e) => {
        e.stopPropagation(); // 下のスロットのクリック判定を一旦止める

        // ★ すでに別のカードが選ばれていて、クリックしたカードが「自分のフィールド」にいる場合
        // （＝ 合体させたい場合）は、親のスロットのクリック処理を強制的に呼び出す
        if (selectedCardElement && selectedCardElement !== cardEl) {
            const parentSlot = cardEl.closest("#my-field .single-card-area");
            if (parentSlot) {
                parentSlot.click(); // 下敷きになっている枠をクリックしたことにする
                return;             // 選択の切り替えは行わずここで終了
            }
        }

        // 通常の選択 / 解除処理
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

    // ダブルクリックで疲労（横向き）/ 回復
    cardEl.addEventListener("dblclick", (e) => {
            e.stopPropagation();
            if (e.target.closest(".card-core-overlay")) return;
            
            // 所属スロット内の全カードを取得（合体時は一斉に疲労させる）
            const parentSlot = cardEl.parentElement;
            const groupCards = parentSlot ? Array.from(parentSlot.querySelectorAll(".game-card")) : [cardEl];
            
            // クリックしたカードのトグル後の状態を基準にする
            const willExhaust = !cardEl.classList.contains("is-exhausted");

            groupCards.forEach(c => {
                if (willExhaust) c.classList.add("is-exhausted");
                else c.classList.remove("is-exhausted");

                if (typeof sendGameData === "function") {
                    sendGameData({
                        type: "EXHAUST_CARD",
                        cardId: c.id,
                        isExhausted: willExhaust
                    });
                }
            });
        });

    return cardEl;
}

// ============================================================
// 4. 山札の初期化とドロー処理
// ============================================================
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

    const drawnData = currentDeck.pop();
    const cardElement = createCardElement(drawnData);
    targetSlot.appendChild(cardElement);

    if (currentDeck.length === 0) {
        const deck = document.getElementById("deck-slot");
        if (deck) deck.style.backgroundImage = "none";
    }
    syncHandCount();    
}

const deckSlot = document.querySelector("#my-field #deck-slot");
if (deckSlot) {
    deckSlot.style.cursor = "pointer";
    deckSlot.addEventListener("click", drawCard);
}


// ============================================================
// 5. スロット（枠）クリック時のカード移動・合体処理
// ============================================================
document.querySelectorAll("#my-field .single-card-area, #my-hand .single-card-area").forEach((slot) => {
    slot.addEventListener("click", () => {
        if (!selectedCardElement || slot.id === "deck-slot") return;

        const isTrash = slot.id === "trash-slot" || slot.classList.contains("trash-area");
        const isHand = slot.closest("#my-hand") !== null;
        const isBurst = slot.id === "burst-slot" || slot.textContent.trim() === "バースト";
        const cardsInSlot = Array.from(slot.querySelectorAll(".game-card"));

        // 枠の枚数制限チェック
        if (!isTrash) {
            if (isHand || isBurst) {
                if (cardsInSlot.length >= 1) {
                    alert("この枠にはすでにカードがあります");
                    return;
                }
            } else {
                // フィールド枠は合体(最大3枚)まで許可
                if (cardsInSlot.length >= 3) {
                    alert("これ以上合体できません（最大ダブルブレイヴまで）");
                    return;
                }
            }
        }

        const oldSlot = selectedCardElement.parentElement;

        // トラッシュ送り時のコア返却
        if (isTrash) {
            const numEl = selectedCardElement.querySelector(".card-core-num");
            if (numEl) {
                const cardCores = parseInt(numEl.textContent, 10);
                if (cardCores > 0) {
                    setReserveCount(getReserveCount() + cardCores);
                    numEl.textContent = "0";
                }
            }
        } 
        // ★ 合体時のコア合算処理（手札・トラッシュ・バースト以外で、すでにカードがいる枠に移動する場合）
        else if (!isHand && !isBurst && cardsInSlot.length > 0) {
            const parentCard = cardsInSlot[0]; // 下敷きになる親スピリット
            const movingCoreNumEl = selectedCardElement.querySelector(".card-core-num");
            const parentCoreNumEl = parentCard.querySelector(".card-core-num");
            
            if (movingCoreNumEl && parentCoreNumEl) {
                const movingCores = parseInt(movingCoreNumEl.textContent, 10);
                // 動かすブレイヴにコアが乗っていれば親に足す
                if (movingCores > 0) {
                    const parentCores = parseInt(parentCoreNumEl.textContent, 10);
                    const newParentCores = parentCores + movingCores;
                    
                    parentCoreNumEl.textContent = newParentCores;
                    movingCoreNumEl.textContent = "0";

                    // 通信で相手にもコアの合算を伝える
                    if (typeof sendGameData === "function") {
                        sendGameData({
                            type: "UPDATE_CARD_CORE",
                            cardId: parentCard.id,
                            count: newParentCores
                        });
                        sendGameData({
                            type: "UPDATE_CARD_CORE",
                            cardId: selectedCardElement.id,
                            count: 0
                        });
                    }
                }
            }
        }

        // ★ 移動処理本体
        const movingCard = selectedCardElement;
        slot.appendChild(movingCard);
        movingCard.classList.remove("is-selected");
        selectedCardElement = null;

        // 移動元と移動先のブレイヴ表示を更新
        if (oldSlot && oldSlot.classList.contains("single-card-area")) {
            updateBraveClasses(oldSlot); // 分離した側の更新
        }
        updateBraveClasses(slot);        // 合体した側の更新

        syncHandCount();

        // 通信送信
        if (typeof sendGameData === "function") {
            let toSlotId = slot.dataset.mySlot;
            if (isTrash) toSlotId = "trash";
            if (isBurst) toSlotId = "burst";

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

// ============================================================
// 6. ターン操作（コアステップ & リフレッシュステップ）
// ============================================================

// コアステップ（ボイドからリザーブへ+1）
const coreStepBtn = document.getElementById("core-step-btn");
if (coreStepBtn) {
    coreStepBtn.addEventListener("click", () => {
        setReserveCount(getReserveCount() + 1);
    });
}

// リフレッシュステップ（トラッシュ全回収 ＆ 全疲労回復）※1箇所のみに集約
const refreshBtn = document.getElementById("refresh-btn");
if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
        const trash = getTrashCount();
        if (trash > 0) {
            setReserveCount(getReserveCount() + trash);
            setTrashCount(0);
        }

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

// ============================================================
// 7. リザーブ ＆ トラッシュの「＋」「−」ボタン連動
// ============================================================
document.querySelectorAll(".core-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
        const target = e.target.dataset.target;
        const isPlus = e.target.classList.contains("btn-plus");
        const reserve = getReserveCount();
        const trash = getTrashCount();

        if (target === "reserve") {
            if (!isPlus) {
                // リザーブ「−」：コスト支払い
                if (reserve > 0) {
                    setReserveCount(reserve - 1);
                    setTrashCount(trash + 1);
                }
            } else {
                // リザーブ「＋」：巻き戻し
                if (trash > 0) {
                    setTrashCount(trash - 1);
                    setReserveCount(reserve + 1);
                }
            }
        } else if (target === "trash") {
            if (isPlus) {
                // トラッシュ「＋」：コスト支払い
                if (reserve > 0) {
                    setReserveCount(reserve - 1);
                    setTrashCount(trash + 1);
                }
            } else {
                // トラッシュ「−」：巻き戻し
                if (trash > 0) {
                    setTrashCount(trash - 1);
                    setReserveCount(reserve + 1);
                }
            }
        }
    });
});

// ============================================================
// ブレイヴ（合体）表示の自動更新関数
// ============================================================
function updateBraveClasses(slot) {
    if (!slot) return;
    const cards = Array.from(slot.querySelectorAll(".game-card"));
    
    // 一旦すべてのブレイヴクラスをリセット
    cards.forEach(c => {
        c.classList.remove("braved-base", "braved-right", "braved-left");
    });

    // スロット内の枚数に応じてクラスを付与
    if (cards.length === 2) {
        cards[0].classList.add("braved-base");  // 1枚目（下敷き）
        cards[1].classList.add("braved-right"); // 2枚目（右にズレる）
    } else if (cards.length >= 3) {
        cards[0].classList.add("braved-base");
        cards[1].classList.add("braved-right");
        cards[2].classList.add("braved-left");  // 3枚目（左にズレる）
    }
}

// ============================================================
// 手札の枚数を相手に同期する関数
// ============================================================
function syncHandCount() {
    if (typeof sendGameData === "function") {
        const handCount = document.querySelectorAll("#my-hand .game-card").length;
        sendGameData({ type: "UPDATE_HAND_COUNT", count: handCount });
    }
}
