// deck1.js
const deck1Recipe = [
    { cardId: "bs-17", count: 2 },
    { cardId: "bs-21", count: 1 },
    { cardId: "bs-22", count: 3 },
    { cardId: "bs-23", count: 3 },
    { cardId: "bs-24", count: 3 },
    { cardId: "bs-25", count: 2 },
    { cardId: "bs-26", count: 1 },
    { cardId: "bs-27", count: 1 },
    { cardId: "bs-28", count: 1 },
    { cardId: "bs-29", count: 1 },
    { cardId: "bs-30", count: 3 },
    { cardId: "bs-31", count: 2 },
    { cardId: "bs-32", count: 2 },
    { cardId: "bs-33", count: 1 },
    { cardId: "bs-34", count: 1 },
    { cardId: "bs-35", count: 3 },
    { cardId: "bs-36", count: 2 },
    { cardId: "bs-37", count: 2 },
    { cardId: "bs-38", count: 1 },
    { cardId: "bs-39", count: 1 },
    { cardId: "bs-40", count: 2 },
    { cardId: "bs-41", count: 1 },
    { cardId: "bs-42", count: 1 }

];

// デッキレシピとカード図鑑から山札配列を作るヘルパー
function createDeckFromRecipe(recipe, database) {
    const deck = [];
    let uniqueIdCounter = 1;

    recipe.forEach(item => {
        const baseCard = database[item.cardId];
        if (!baseCard) return;

        for (let i = 0; i < item.count; i++) {
            deck.push({
                ...baseCard,
                id: `card-inst-${uniqueIdCounter++}`, // 1枚ずつ固有のIDを振る
                masterId: item.cardId
            });
        }
    });
    return deck;
}

// ゲームで使う山札データとして公開（後で deck2.js などを読み替えるだけでデッキ変更可能）
const activeDeckData = createDeckFromRecipe(deck1Recipe, CARD_DATABASE);