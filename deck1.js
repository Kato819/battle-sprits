// deck1.js
const deck1Recipe = [
    { cardId: "bs-01", count: 1 },
    { cardId: "bs-02", count: 2 },
    { cardId: "bs-04", count: 3 },
    { cardId: "bs-05", count: 3 },
    { cardId: "bs-06", count: 1 },
    { cardId: "bs-07", count: 3 },
    { cardId: "bs-08", count: 2 },
    { cardId: "bs-09", count: 1 },
    { cardId: "bs-10", count: 3 },
    { cardId: "bs-11", count: 1 },
    { cardId: "bs-12", count: 2 },
    { cardId: "bs-13", count: 2 },
    { cardId: "bs-14", count: 2 },
    { cardId: "bs-15", count: 3 },
    { cardId: "bs-16", count: 2 },
    { cardId: "bs-17", count: 1 },
    { cardId: "bs-18", count: 2 },
    { cardId: "bs-19", count: 1 },
    { cardId: "bs-20", count: 2 }

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
