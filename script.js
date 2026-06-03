const mobileTurnBar = document.getElementById("mobileTurnBar");
const startButton = document.getElementById("startButton");
const resetMoneyButton = document.getElementById("resetMoneyButton");
const cardArea = document.getElementById("cardArea");
const message = document.getElementById("message");
const statusArea = document.getElementById("statusArea");
const noticeArea = document.getElementById("noticeArea");
const resultArea = document.getElementById("resultArea");

const qModal = document.getElementById("qModal");
const qModalText = document.getElementById("qModalText");
const qUseButton = document.getElementById("qUseButton");
const qCancelButton = document.getElementById("qCancelButton");

const infoModal = document.getElementById("infoModal");
const infoModalTitle = document.getElementById("infoModalTitle");
const infoModalText = document.getElementById("infoModalText");
const infoModalButton = document.getElementById("infoModalButton");

let cards = [];
let players = [];
let playerCount = 2;
let currentPlayer = 0;
let betAmount = 100;

let sevenEffectUsed = false;
let kCount = 0;
let direction = 1;
let gameEnded = false;
let jokerActivated = false;
let qSkipBlocked = false;
let openedCardCount = 0;

function createDeck() {
  const deck = [];
  const types = ["A", "7", "10", "J", "Q", "K"];

  types.forEach(type => {
    for (let i = 0; i < 4; i++) {
      deck.push(type);
    }
  });

  deck.push("Joker", "Joker");
  return deck;
}

function shuffle(deck) {
  return deck.sort(() => Math.random() - 0.5);
}

function getCardIcon(card) {
  if (card === "A") return "👑";
  if (card === "7") return "🍀";
  if (card === "10") return "◆";
  if (card === "J") return "🔄";
  if (card === "Q") return "✨";
  if (card === "K") return "☠️";
  if (card === "Joker") return "🃏";
  return "";
}

function playSound(type) {
  const audio = new Audio();

  if (type === "card") {
    audio.src = "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg";
  }

  if (type === "success") {
    audio.src = "https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg";
  }

  if (type === "joker") {
    audio.src = "https://actions.google.com/sounds/v1/cartoon/slide_whistle_to_drum_hit.ogg";
  }

  audio.volume = 0.5;
  audio.play();
}

function saveMoney() {
  const moneyData = players.map(player => player.money);
  localStorage.setItem("trumpGameMoney", JSON.stringify(moneyData));
}

function applyMoneyResult(resultType, targetIndex) {
  if (resultType === "aWin") {
    const reward = betAmount * 2;
    const totalReward = reward * (players.length - 1);

    players.forEach((player, index) => {
      if (index === targetIndex) {
        player.money += totalReward;
      } else {
        player.money -= reward;
      }
    });
  }

  if (resultType === "jokerKWin") {
    const reward = betAmount;
    const totalReward = reward * (players.length - 1);

    players.forEach((player, index) => {
      if (index === targetIndex) {
        player.money += totalReward;
      } else {
        player.money -= reward;
      }
    });
  }

  if (resultType === "kLose") {
    const penalty = betAmount;
    const totalPenalty = penalty * (players.length - 1);

    players.forEach((player, index) => {
      if (index === targetIndex) {
        player.money -= totalPenalty;
      } else {
        player.money += penalty;
      }
    });
  }

  saveMoney();
  updateStatus();
}

function loadMoney(index) {
  const savedData = localStorage.getItem("trumpGameMoney");
  if (!savedData) return 0;

  const moneyData = JSON.parse(savedData);
  return moneyData[index] ?? 0;
}

function showInfoModal(title, text) {
  infoModalTitle.textContent = title;
  infoModalText.textContent = text;
  infoModal.style.display = "flex";

  infoModalButton.onclick = () => {
    infoModal.style.display = "none";
  };
}

function showNotice(text, type = "normal") {
  noticeArea.innerHTML = `
    <div class="notice-box ${type}">
      ${text}
    </div>
  `;

  setTimeout(() => {
    noticeArea.innerHTML = "";
  }, 2500);
}

function showResult(text, reward = betAmount) {
  resultArea.innerHTML = `
    <div class="result-box">
      <div class="result-title">🎉 RESULT 🎉</div>
      <div class="result-message">${text}</div>
      <div class="result-bet">獲得ベット：${reward}</div>
    </div>
  `;
}

function updateStatus() {
  statusArea.innerHTML = "";

  const betText = document.createElement("p");
  betText.textContent = `💰 現在のベット数：${betAmount}`;
  betText.className = "bet-text";
  statusArea.appendChild(betText);

  players.forEach((player, index) => {
    const playerInfo = document.createElement("div");
    playerInfo.className = "player-info";

    if (index === currentPlayer && !gameEnded) {
      playerInfo.classList.add("active-player");
    }

    const counts = {};
    player.cards.forEach(card => {
      counts[card] = (counts[card] || 0) + 1;
    });

    const cardText = Object.keys(counts)
      .map(card => `${card} ×${counts[card]}`)
      .join(" / ");

    playerInfo.innerHTML = `
      <strong>🎮 ${player.name}</strong><br>
      💰 所持金：${player.money}<br>
      ${cardText || "保有カードなし"}
    `;

    statusArea.appendChild(playerInfo);
  });

    if (players[currentPlayer]) {
      const current = players[currentPlayer];

      const counts = {};
      current.cards.forEach(card => {
        counts[card] = (counts[card] || 0) + 1;
      });

      const cardText = Object.keys(counts)
        .map(card => `${card}×${counts[card]}`)
        .join(" / ");

      mobileTurnBar.innerHTML = `
        <strong>▶ ${current.name} のターン</strong><br>
        💰 ${current.money} / 🃏 ${cardText || "保有なし"}
      `;
    }

}

function nextTurn() {
  if (gameEnded) return;

  currentPlayer += direction;

  if (currentPlayer >= playerCount) currentPlayer = 0;
  if (currentPlayer < 0) currentPlayer = playerCount - 1;

  message.textContent = `${players[currentPlayer].name} のターン`;
  updateStatus();
  checkQSkip();
}

function checkQSkip() {
  if (qSkipBlocked) {
    qSkipBlocked = false;
    return;
  }

  const qIndex = players[currentPlayer].cards.indexOf("Q");
  if (qIndex === -1) return;

  qModalText.textContent =
    `${players[currentPlayer].name} はQを使ってターンをスキップしますか？`;

  qModal.style.display = "flex";

  qUseButton.onclick = () => {
    qModal.style.display = "none";

    players[currentPlayer].cards.splice(qIndex, 1);
    updateStatus();

    showNotice(`👑 ${players[currentPlayer].name} はQを使ってターンをスキップ！`, "q");

    nextTurn();
  };

  qCancelButton.onclick = () => {
    qModal.style.display = "none";
  };
}

function updateNameInputs() {
  const count = Number(document.getElementById("playerCountInput").value);

  document.getElementById("player3Box").style.display =
    count >= 3 ? "block" : "none";

  document.getElementById("player4Box").style.display =
    count >= 4 ? "block" : "none";
}

function startGame() {
  cardArea.innerHTML = "";
  resultArea.innerHTML = "";
  noticeArea.innerHTML = "";

  cards = shuffle(createDeck());

  playerCount = Number(document.getElementById("playerCountInput").value);
  betAmount = Number(document.getElementById("betInput").value);

  const playerNames = [
    document.getElementById("player1Name").value,
    document.getElementById("player2Name").value,
    document.getElementById("player3Name").value,
    document.getElementById("player4Name").value
  ];

  players = [];
  sevenEffectUsed = false;
  kCount = 0;
  direction = 1;
  gameEnded = false;
  jokerActivated = false;
  qSkipBlocked = false;
  openedCardCount = 0;

  for (let i = 0; i < playerCount; i++) {
    players.push({
      name: playerNames[i] || `プレイヤー${i + 1}`,
      cards: [],
      money: loadMoney(i)
    });
  }

  currentPlayer = 0;
  message.textContent = `${players[currentPlayer].name} のターン`;
  updateStatus();

  cards.forEach(card => {
    const cardElement = document.createElement("div");
    cardElement.className = "card";
    cardElement.textContent = "？";

    cardElement.addEventListener("click", () => {
      if (gameEnded) return;
      if (cardElement.textContent !== "？") return;

      cardElement.classList.add("flip");

      setTimeout(() => {
        if (card === "Joker") {
          cardElement.innerHTML = `
            <div class="joker-side left">J<br>O<br>K<br>E<br>R</div>
            <div class="card-center">🃏</div>
            <div class="joker-side right">J<br>O<br>K<br>E<br>R</div>
          `;
        } else {
          cardElement.innerHTML = `
            <div class="card-corner top">${card}</div>
            <div class="card-center">${getCardIcon(card)}</div>
            <div class="card-corner bottom">${card}</div>
          `;
        }

        playSound("card");

        if (card === "A") cardElement.classList.add("card-a");
        if (card === "7") cardElement.classList.add("card-7");
        if (card === "10") cardElement.classList.add("card-10");
        if (card === "J") cardElement.classList.add("card-j");
        if (card === "Q") cardElement.classList.add("card-q");
        if (card === "K") cardElement.classList.add("card-k");
        if (card === "Joker") cardElement.classList.add("card-joker");
      }, 150);

      openedCardCount++;

      if (card === "J") {
        direction *= -1;
        showInfoModal("🔄 Jカード発動", "順番が逆転しました！");
      }

      if (card === "A" || card === "7" || card === "Q" || card === "Joker") {
        players[currentPlayer].cards.push(card);
      }

      if (card === "K") {
        kCount++;

        if (kCount >= 4) {
          gameEnded = true;

          if (jokerActivated) {
            applyMoneyResult("jokerKWin", currentPlayer);

            message.textContent = `${players[currentPlayer].name} の勝利！`;
            showResult(`${players[currentPlayer].name} の勝利！`, betAmount);
            playSound("success");

            showInfoModal(
              "🃏 Kルール改ざん発動",
              `${players[currentPlayer].name} が4枚目のKを引きました！ジョーカー効果により勝利です！`
            );
          } else {
            applyMoneyResult("kLose", currentPlayer);

            message.textContent = `${players[currentPlayer].name} の敗北！`;
            showResult(`${players[currentPlayer].name} の敗北！`, betAmount);
            playSound("success");

            showInfoModal(
              "💀 Kカード発動",
              `${players[currentPlayer].name} が4枚目のKを引いたので敗北です！残りのプレイヤーの勝利！`
            );
          }

          return;
        }
      }

      const aCount = players[currentPlayer].cards.filter(c => c === "A").length;

      if (aCount >= 4) {
        gameEnded = true;

        applyMoneyResult("aWin", currentPlayer);

        message.textContent = `${players[currentPlayer].name} の勝利！`;
        showResult(`${players[currentPlayer].name} の勝利！`, betAmount * 2);
        playSound("success");

        showInfoModal(
          "🏆 Aカード勝利",
          `${players[currentPlayer].name} がAを4枚集めました！`
        );

        return;
      }

      const sevenCount = players[currentPlayer].cards.filter(c => c === "7").length;

      if (sevenCount >= 3 && sevenEffectUsed === false) {
        betAmount = betAmount * 2;
        sevenEffectUsed = true;

        showInfoModal(
          "🍀 7カード発動",
          `${players[currentPlayer].name} が7を3枚集めたので、ベット数が2倍になりました！`
        );
      }

      const jokerCount = players[currentPlayer].cards.filter(c => c === "Joker").length;

      if (jokerCount >= 2 && jokerActivated === false) {
        jokerActivated = true;
        playSound("joker");

        showNotice(
          `🃏 ${players[currentPlayer].name} がジョーカーを2枚集めました！Kルールが改ざん！`,
          "joker"
        );

        showInfoModal(
          "🃏 Joker発動",
          `${players[currentPlayer].name} がジョーカーを2枚集めました！Kルールが改ざんされます！`
        );
      }

      updateStatus();

      if (openedCardCount >= cards.length) {
        gameEnded = true;
        updateStatus();

        message.textContent = "カードがすべて開かれました。ゲーム終了！";
        showInfoModal("ゲーム終了", "カードがすべて開かれました。ゲーム終了です！");
        return;
      }

      if (card === "J" && playerCount === 2) {
        qSkipBlocked = true;
        message.textContent = `${players[currentPlayer].name} のターン`;
        updateStatus();
        return;
      }

      setTimeout(() => {
        nextTurn();
      }, 700);
    });

    cardArea.appendChild(cardElement);
  });
}

startButton.addEventListener("click", startGame);

resetMoneyButton.addEventListener("click", () => {
  localStorage.removeItem("trumpGameMoney");

  players.forEach(player => {
    player.money = 0;
  });

  updateStatus();

  showInfoModal("💰 所持金リセット", "所持金をリセットしました！");
});

document
  .getElementById("playerCountInput")
  .addEventListener("input", updateNameInputs);

updateNameInputs();

