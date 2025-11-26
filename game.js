// === Otter Sprites ===
const otterSprites = {
    idle: new Image(),
    attack: new Image(),
    hurt: new Image(),
};

// Roguejack/designs
otterSprites.idle.src = "designs/otter_idle.png";
otterSprites.attack.src = "designs/otter_attack.png";
otterSprites.hurt.src = "designs/otter_hurt.png";

let otterStateTimeout = null;
let floorLevel = 1;
let playerGold = 50;

function renderOtter(state = "idle") {
    const img = document.getElementById("playerSprite");
    if (!img) return;
    const sprite = otterSprites[state] || otterSprites.idle;
    if (sprite && sprite.complete) {
        img.src = sprite.src;
    } else if (sprite) {
        sprite.onload = () => (img.src = sprite.src);
    }
}

function setOtterState(state, duration = 500) {
    renderOtter(state);
    clearTimeout(otterStateTimeout);
    otterStateTimeout = setTimeout(() => renderOtter("idle"), duration);
}

// Roguejack core logic split into classes for easier extension

function setHPUI(barEl, current, max) {
    const value = Math.max(0, Math.min(current, max));
    const pct = (value / max) * 100;
    barEl.style.width = pct + "%";

    const colors = getHPColors(pct);
    applyHPColors(barEl, colors);
}

function getHPColors(pct) {
    if (pct <= 25) {
        return { start: "#ff6666", end: "#d63b3b", glow: "rgba(255, 102, 102, 0.35)" };
    }
    if (pct <= 50) {
        return { start: "#f0c75e", end: "#d6a53a", glow: "rgba(240, 199, 94, 0.35)" };
    }
    return { start: "#3aff81", end: "#2cd66b", glow: "rgba(58, 255, 129, 0.35)" };
}

function applyHPColors(barEl, colors) {
    if (!barEl) return;
    barEl.style.setProperty("--hp-start", colors.start);
    barEl.style.setProperty("--hp-end", colors.end);
    barEl.style.setProperty("--hp-glow", colors.glow);
}

function getCardLabel(value) {
    if (value === 11) return "Ace";
    if (value === 10) return "10";
    if (value === 1) return "Ace";
    return String(value);
}

function getSuitData(suit) {
    switch (suit) {
        case "Hearts":
            return { icon: "\u2665", cls: "suit-red" };
        case "Diamonds":
            return { icon: "\u2666", cls: "suit-red" };
        case "Clubs":
            return { icon: "\u2663", cls: "suit-black" };
        default:
            return { icon: "\u2660", cls: "suit-black" };
    }
}

function renderHand(hand, containerId, hideFirst = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    hand.forEach((card, idx) => {
        const div = document.createElement("div");
        div.className = "card";
        if (hideFirst && idx === 0) {
            div.classList.add("hidden");
            div.textContent = "?";
        } else {
            const rank = document.createElement("div");
            rank.className = "rank";
            rank.textContent = getCardLabel(card.value);

            const suitTop = document.createElement("div");
            const suitBottom = document.createElement("div");
            const { icon, cls } = getSuitData(card.suit);
            suitTop.className = "suit top " + cls;
            suitBottom.className = "suit bottom " + cls;
            suitTop.textContent = icon;
            suitBottom.textContent = icon;

            div.appendChild(suitTop);
            div.appendChild(rank);
            div.appendChild(suitBottom);
        }
        container.appendChild(div);
    });
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanTransparentBackground(imgEl, threshold = 245) {
    if (!imgEl || !imgEl.naturalWidth || !imgEl.naturalHeight) return;
    const canvas = document.createElement("canvas");
    canvas.width = imgEl.naturalWidth;
    canvas.height = imgEl.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imgEl, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r >= threshold && g >= threshold && b >= threshold) {
            data[i + 3] = 0;
        }
    }
    ctx.putImageData(imageData, 0, 0);
    imgEl.src = canvas.toDataURL("image/png");
}

function makeEnemySprite(label, primary, secondary) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="200" viewBox="0 0 180 200">
        <defs>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="${primary}"/>
                <stop offset="100%" stop-color="${secondary}"/>
            </linearGradient>
        </defs>
        <rect x="16" y="16" rx="22" ry="22" width="148" height="168" fill="url(#g)" stroke="#0d0d0d" stroke-width="3"/>
        <circle cx="64" cy="88" r="14" fill="rgba(0,0,0,0.35)"/>
        <circle cx="116" cy="88" r="14" fill="rgba(0,0,0,0.35)"/>
        <path d="M52 132 Q90 152 128 132" stroke="#0d0d0d" stroke-width="8" fill="none" stroke-linecap="round"/>
        <text x="50%" y="180" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="18" fill="#0b0b0b" font-weight="700">${label}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function makePlayerSprite(label, primary, secondary, trim) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="200" viewBox="0 0 180 200">
        <defs>
            <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="${primary}"/>
                <stop offset="100%" stop-color="${secondary}"/>
            </linearGradient>
        </defs>
        <rect x="18" y="18" rx="24" ry="24" width="144" height="164" fill="url(#pg)" stroke="${trim}" stroke-width="5"/>
        <path d="M54 74 L90 98 L126 74 L90 140 Z" fill="rgba(12,18,28,0.55)" stroke="${trim}" stroke-width="4" stroke-linejoin="round"/>
        <circle cx="70" cy="82" r="8" fill="${trim}"/>
        <circle cx="110" cy="82" r="8" fill="${trim}"/>
        <path d="M68 120 Q90 134 112 120" stroke="${trim}" stroke-width="6" fill="none" stroke-linecap="round"/>
        <text x="50%" y="182" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="16" fill="${trim}" font-weight="700">${label}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function makeDealerSprite(label, primary, secondary, trim) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="200" viewBox="0 0 180 200">
        <defs>
            <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="${primary}"/>
                <stop offset="100%" stop-color="${secondary}"/>
            </linearGradient>
        </defs>
        <rect x="18" y="18" rx="24" ry="24" width="144" height="164" fill="url(#dg)" stroke="${trim}" stroke-width="5"/>
        <path d="M60 70 Q90 40 120 70 L120 115 Q120 140 90 150 Q60 140 60 115 Z" fill="rgba(12,18,28,0.55)" stroke="${trim}" stroke-width="4" stroke-linejoin="round"/>
        <circle cx="70" cy="85" r="8" fill="${trim}"/>
        <circle cx="110" cy="85" r="8" fill="${trim}"/>
        <path d="M70 122 Q90 132 110 122" stroke="${trim}" stroke-width="6" fill="none" stroke-linecap="round"/>
        <text x="50%" y="182" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="16" fill="${trim}" font-weight="700">${label}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const PLAYER_SPRITE = makePlayerSprite("Otter Knight", "#4fa3ff", "#1b6adf", "#e4c17a");
const DEALER_SPRITE = makeDealerSprite("The Hand", "#6b5a44", "#3b2f25", "#e4c17a");

const ENEMY_TYPES = [
    {
        name: "Dragon",
        maxHP: 20,
        damageOutMultiplier: 1.4,
        damageInMultiplier: 1,
        sprite: makeEnemySprite("Dragon", "#ff7b54", "#d63c26"),
        accent: "#ffb396"
    },
    {
        name: "Goblin",
        maxHP: 14,
        damageOutMultiplier: 1.1,
        damageInMultiplier: 0.9,
        sprite: makeEnemySprite("Goblin", "#7bd66a", "#3d8c2f"),
        accent: "#9af07e"
    },
    {
        name: "Knight",
        maxHP: 18,
        damageOutMultiplier: 1.2,
        damageInMultiplier: 1.05,
        sprite: makeEnemySprite("Knight", "#9aa0b3", "#5d6580"),
        accent: "#c5cad8"
    },
    {
        name: "Demon",
        maxHP: 22,
        damageOutMultiplier: 1.5,
        damageInMultiplier: 1.15,
        sprite: makeEnemySprite("Demon", "#b347ff", "#6d1fb8"),
        accent: "#cf8cff"
    }
];

class Logger {
    constructor(playerLogEl, enemyLogEl) {
        this.playerLogEl = playerLogEl;
        this.enemyLogEl = enemyLogEl;
    }

    log(message, target = "both") {
        const type = this.detectType(message);
        if (target === "both" || target === "player") {
            this.append(this.playerLogEl, message, type);
        }
        if (target === "both" || target === "enemy") {
            this.append(this.enemyLogEl, message, type);
        }
    }

    append(element, message, type) {
        if (!element) return;
        const entry = document.createElement("div");
        entry.className = "log-entry " + type;

        const icon = document.createElement("span");
        icon.className = "icon";
        icon.textContent = this.iconFor(type);

        const text = document.createElement("span");
        text.className = "text";
        text.textContent = message;

        entry.appendChild(icon);
        entry.appendChild(text);
        element.appendChild(entry);
        element.scrollTop = element.scrollHeight;
    }

    detectType(message) {
        const m = message.toLowerCase();
        if (m.includes("crit")) return "crit";
        if (m.includes("heal")) return "heal";
        if (m.includes("damage") || m.includes("bust") || m.includes("died")) return "damage";
        return "info";
    }

    iconFor(type) {
        switch (type) {
            case "damage": return "\u2694\uFE0F";
            case "heal": return "\u2795";
            case "crit": return "\u2728";
            default: return "\u2022";
        }
    }

    clear(target = "both") {
        if (target === "both" || target === "player") {
            this.playerLogEl.innerHTML = "";
        }
        if (target === "both" || target === "enemy") {
            this.enemyLogEl.innerHTML = "";
        }
    }
}

class Character {
    constructor(name, side, maxHP, barElement, spriteElement, logTarget, logger) {
        this.name = name;
        this.side = side;
        this.maxHP = maxHP;
        this.hp = maxHP;
        this.currentHP = this.hp;
        this.barElement = barElement;
        this.spriteElement = spriteElement;
        this.spriteBodyElement = spriteElement && spriteElement.querySelector ? spriteElement.querySelector(".sprite-body") : null;
        this.spriteImgElement = spriteElement && spriteElement.tagName === "IMG" ? spriteElement : null;
        this.logTarget = logTarget;
        this.logger = logger;
        this.hand = [];
        this.damageOutMultiplier = 1;
        this.damageInMultiplier = 1;
        this.type = null;
        this.isDoublingDown = false;
    }

    resetForRound() {
        this.hand = [];
    }

    drawCard(deck) {
        const card = deck.draw();
        this.hand.push(card);
        return card;
    }

    handTotal() {
        return this.hand.reduce((sum, card) => sum + (card.value || 0), 0);
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        this.currentHP = this.hp;
        this.updateHPUI();
    }

    isDead() {
        return this.hp <= 0;
    }

    updateHPUI() {
        setHPUI(this.barElement, this.hp, this.maxHP);
    }

    log(message) {
        this.logger.log(message, this.logTarget);
    }

    setSpriteVisual(label, backgroundImage, borderColor) {
        if (this.spriteImgElement && backgroundImage) {
            this.spriteImgElement.src = backgroundImage;
        }
        if (this.spriteBodyElement) {
            const labelEl = this.spriteBodyElement.querySelector(".sprite-label");
            if (labelEl) {
                labelEl.textContent = label;
            } else {
                this.spriteBodyElement.textContent = label;
            }
            if (backgroundImage) {
                this.spriteBodyElement.style.backgroundImage = `url("${backgroundImage}")`;
            }
            if (borderColor) {
                this.spriteBodyElement.style.borderColor = borderColor;
            }
        }
    }
}

class Player extends Character {
    constructor(...args) {
        super(...args);
        this.maxEnergy = 3;
        this.energy = this.maxEnergy;
        this.aegisActive = false;
        this.peekedCard = null;
        this.forgeBonus = 0;
    }

    resetForRound() {
        super.resetForRound();
        this.energy = this.maxEnergy;
        this.aegisActive = false;
        this.peekedCard = null;
        this.forgeBonus = 0;
    }

    handTotal() {
        const base = super.handTotal();
        if (base > 21) return base;
        const bonus = this.forgeBonus || 0;
        return Math.min(base + bonus, 21);
    }
}
class Enemy extends Character {
    setType(type) {
        this.type = type;
        this.maxHP = type.maxHP;
        this.hp = this.maxHP;
        this.currentHP = this.hp;
        this.damageOutMultiplier = type.damageOutMultiplier;
        this.damageInMultiplier = type.damageInMultiplier;
        this.setSpriteVisual(type.name, type.sprite, type.accent);
        this.updateHPUI();
    }
}

class CardDeck {
    constructor(drawAnimContainer) {
        this.drawAnimContainer = drawAnimContainer;
        this.deck = [];
        this.refillAndShuffleDeck();
    }

    buildFreshDeck() {
        const suits = ["Spades", "Hearts", "Diamonds", "Clubs"];
        const values = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11]; // 10 repeated for J,Q,K, 11 as Ace
        const deck = [];
        for (const suit of suits) {
            for (const value of values) {
                deck.push({ value, suit });
            }
        }
        return deck;
    }

    shuffleDeck(deck) {
        let currentIndex = deck.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [deck[currentIndex], deck[randomIndex]] = [
                deck[randomIndex], deck[currentIndex]
            ];
        }
        return deck;
    }

    refillAndShuffleDeck() {
        this.deck = this.shuffleDeck(this.buildFreshDeck());
    }

    draw() {
        if (this.deck.length === 0) {
            this.refillAndShuffleDeck();
        }
        return this.deck.pop();
    }

    peekNext() {
        if (this.deck.length === 0) {
            this.refillAndShuffleDeck();
        }
        return this.deck[this.deck.length - 1];
    }

    showDrawAnimation(cardValue, side) {
        if (!this.drawAnimContainer) return;
        const card = document.createElement("div");
        card.className = "card-anim " + side;
        const label = side === "player" ? "You draw" : "Enemy draws";
        card.innerHTML = '<span class="label">' + label + '</span><span class="value">' + cardValue + "</span>";
        this.drawAnimContainer.appendChild(card);
        const remove = () => {
            if (card.parentNode) {
                card.parentNode.removeChild(card);
            }
        };
        card.addEventListener("animationend", remove);
        setTimeout(remove, 1100);
    }
}

class CombatEngine {
    constructor({ player, enemy, deck, logger, overlay, overlayTitle, controls, enemyTypes = ENEMY_TYPES, enemyIconImg, enemyIconName, dealerDeckEl, dealerHandEl }) {
        this.player = player;
        this.enemy = enemy;
        this.deck = deck;
        this.logger = logger;
        this.overlay = overlay;
        this.overlayTitle = overlayTitle;
        this.controls = controls;
        this.enemyTypes = enemyTypes;
        this.enemyIconImg = enemyIconImg;
        this.enemyIconName = enemyIconName;
        this.dealerDeckEl = dealerDeckEl;
        this.dealerHandEl = dealerHandEl;
        this.peekIndicator = document.getElementById("peek-indicator");
        this.currentEnemyType = null;
        this.gameOver = false;
        this.enemyHoleRevealed = false;
        this.dealing = false;
        this.needsEnemySpawn = true;
        this.skillCosts = { peek: 1, aegis: 2, forge: 1 };

        this.bindControls();
        this.hideDoubleButton();
    }

    init() {
        this.updateHPUI();
        this.updateFloorUI();
        this.updateGoldUI();
        this.updateEnergyUI();
        this.newRound();
        renderOtter("idle");
    }

    bindControls() {
        if (this.controls.startRoundBtn) {
            this.controls.startRoundBtn.addEventListener("click", async () => {
                await this.startRound();
            });
        }
        if (this.controls.hitBtn) {
            this.controls.hitBtn.addEventListener("click", async () => {
                await this.playerHit();
            });
        }
        if (this.controls.standBtn) {
            this.controls.standBtn.addEventListener("click", async () => {
                await this.playerStand();
            });
        }
        if (this.controls.doubleBtn) {
            this.controls.doubleBtn.addEventListener("click", async () => {
                await this.playerDoubleDown();
            });
        }
        if (this.controls.peekBtn) {
            this.controls.peekBtn.addEventListener("click", async () => {
                await this.playerPeek();
            });
        }
        if (this.controls.aegisBtn) {
            this.controls.aegisBtn.addEventListener("click", async () => {
                await this.playerAegis();
            });
        }
        if (this.controls.forgeBtn) {
            this.controls.forgeBtn.addEventListener("click", async () => {
                await this.playerForge();
            });
        }
        if (this.controls.restartBtn) {
            this.controls.restartBtn.addEventListener("click", async () => {
                await this.restartGame();
            });
        }

        const continueBtn = document.getElementById("continue-button");
        if (continueBtn) {
            continueBtn.addEventListener("click", async () => {
                await this.hideShopAndContinue();
            });
        }

        const buyDeck = document.getElementById("buy-deck");
        if (buyDeck) {
            buyDeck.addEventListener("click", () => this.handlePurchase("deck"));
        }
        const buyPotion = document.getElementById("buy-potion");
        if (buyPotion) {
            buyPotion.addEventListener("click", () => this.handlePurchase("potion"));
        }
        const buyCharm = document.getElementById("buy-charm");
        if (buyCharm) {
            buyCharm.addEventListener("click", () => this.handlePurchase("charm"));
        }
    }

    hideDoubleButton() {
        if (this.controls.doubleBtn) {
            this.controls.doubleBtn.style.display = "none";
        }
    }

    updateDoubleButtonVisibility() {
        if (!this.controls.doubleBtn) return;
        const shouldShow = !this.gameOver && !this.dealing && this.player.hand.length === 2;
        this.controls.doubleBtn.style.display = shouldShow ? "block" : "none";
    }

    showRoundOverlay(titleText = "Start round!") {
        if (this.overlay) {
            this.setOverlay(titleText, { showStart: true, showRestart: false });
        }
    }

    hideRoundOverlay() {
        if (this.overlay) {
            this.overlay.classList.add("hidden");
        }
    }

    async startRound() {
        if (this.gameOver) return;
        this.hideRoundOverlay();
        await this.newRound();
    }

    async newRound() {
        if (this.gameOver) return;

        this.hideDoubleButton();
        this.dealing = true;
        this.player.isDoublingDown = false;
        if (this.needsEnemySpawn) {
            this.spawnNewEnemy();
            this.needsEnemySpawn = false;
        }
        this.player.resetForRound();
        this.enemy.resetForRound();
        this.enemyHoleRevealed = false;
        this.clearPeekedCard();
        this.updateEnergyUI();
        this.updateSkillButtons();
        this.updateHPUI();
        this.renderHands();

        await this.dealInitialSequence();

        this.logger.log("\n=== NEW ROUND ===", "both");
        this.logger.log(
            "You drew: " + this.player.hand.map(c => `${getCardLabel(c.value)} of ${c.suit}`).join(", "),
            "player"
        );
        this.logger.log("Enemy shows a hidden card.", "enemy");
        this.dealing = false;
        this.updateDoubleButtonVisibility();
        this.updateSkillButtons();
    }

    spawnNewEnemy() {
        if (!this.enemyTypes || this.enemyTypes.length === 0) return;
        const baseType = this.enemyTypes[Math.floor(Math.random() * this.enemyTypes.length)];
        const scaledType = {
            ...baseType,
            maxHP: 100 + floorLevel * 10,
            damageOutMultiplier: (baseType.damageOutMultiplier || 1) * (1 + floorLevel * 0.1),
            damageInMultiplier: baseType.damageInMultiplier || 1
        };
        scaledType.damageDealtMultiplier = scaledType.damageOutMultiplier;
        this.enemy.setType(scaledType);
        this.currentEnemyType = scaledType;
        if (this.enemyIconImg) {
            this.enemyIconImg.src = scaledType.sprite;
        }
        if (this.enemyIconName) {
            this.enemyIconName.textContent = scaledType.name;
        }

        const outMult = scaledType.damageOutMultiplier.toFixed(2);
        const inMult = scaledType.damageInMultiplier.toFixed(2);
        this.logger.log(
            `Floor ${floorLevel} - New enemy appears: ${scaledType.name} (Max HP ${scaledType.maxHP}, damage dealt x${outMult}, damage taken x${inMult})`,
            "both"
        );
        this.updateFloorUI();
    }

    async playerHit() {
        if (this.gameOver || this.dealing) return;
        this.clearPeekedCard();
        this.hideDoubleButton();
        this.dealing = true;
        const latest = await this.dealCardTo(this.player);
        this.logger.log("You draw a card: " + `${getCardLabel(latest.value)} of ${latest.suit}`, "player");
        this.renderHands();
        await this.checkPlayerBust();
        this.dealing = false;
    }

    async playerStand() {
        if (this.gameOver || this.dealing) return;
        this.clearPeekedCard();
        this.hideDoubleButton();
        this.dealing = true;
        this.logger.log("You stand.", "player");
        await this.enemyTurn();
        this.dealing = false;
    }

    async playerDoubleDown() {
        if (this.gameOver || this.dealing) return;
        if (this.player.hand.length !== 2) return;
        this.clearPeekedCard();
        this.hideDoubleButton();
        this.dealing = true;
        this.player.isDoublingDown = true;
        this.logger.log("You go all in and DOUBLE DOWN!", "player");
        const latest = await this.dealCardTo(this.player);
        this.logger.log("You draw a card: " + `${getCardLabel(latest.value)} of ${latest.suit}`, "player");
        this.renderHands();
        const playerTotal = this.player.handTotal();
        await this.checkPlayerBust();
        if (this.gameOver || playerTotal > 21) {
            this.dealing = false;
            return;
        }
        this.dealing = false;
        await this.playerStand();
    }

    async playerPeek() {
        if (this.gameOver || this.dealing) return;
        if (!this.spendEnergy(this.skillCosts.peek)) return;
        const next = this.deck.peekNext();
        this.player.peekedCard = next;
        this.logger.log(`You PEEK into the deck: next card is ${getCardLabel(next.value)} of ${next.suit}.`, "player");
        this.updatePeekIndicator();
        this.updateSkillButtons();
    }

    async playerAegis() {
        if (this.gameOver || this.dealing) return;
        if (this.player.hand.length !== 2) return;
        if (this.player.aegisActive) return;
        if (!this.spendEnergy(this.skillCosts.aegis)) return;
        this.player.aegisActive = true;
        this.logger.log("You raise an AEGIS. Your next bust is ignored.", "player");
        this.updateSkillButtons();
    }

    async playerForge() {
        if (this.gameOver || this.dealing) return;
        const total = this.player.handTotal();
        if (total >= 21) return;
        if (!this.spendEnergy(this.skillCosts.forge)) return;
        this.player.forgeBonus = Math.min((this.player.forgeBonus || 0) + 1, 21 - total);
        this.logger.log("Used FORGE. Hand total +1.", "player");
        this.updatePlayerTotal();
        this.updateSkillButtons();
    }

    async checkPlayerBust() {
        if (this.player.handTotal() > 21) {
            if (this.player.aegisActive) {
                this.player.aegisActive = false;
                this.logger.log("AEGIS absorbs your bust! You take no damage.", "player");
                this.updateSkillButtons();
                await this.newRound();
                return;
            }
            this.logger.log("?? You bust!", "player");
            await this.dealDamage(this.player);
        }
    }

    async enemyTurn() {
        this.logger.log("\nEnemy turn...", "enemy");
        while (this.enemy.handTotal() < 17) {
            await this.dealCardTo(this.enemy);
            await wait(120);
        }
        this.enemyHoleRevealed = true;
        this.renderHands();
        this.logger.log(
            "Enemy final hand: " + this.enemy.hand.map(c => `${getCardLabel(c.value)} of ${c.suit}`).join(", ") + " (total " + this.enemy.handTotal() + ")",
            "enemy"
        );
        await this.resolveRound();
    }

    async resolveRound() {
        const playerTotal = this.player.handTotal();
        const enemyTotal = this.enemy.handTotal();

        if (playerTotal > 21) {
            await this.dealDamage(this.player);
            return;
        }

        if (enemyTotal > 21) {
            this.logger.log("Enemy busts! Massive damage!", "both");
            await this.dealDamage(this.enemy, true);
            return;
        }

        if (playerTotal > enemyTotal) {
            const isCrit = playerTotal === 21;
            if (isCrit) {
                this.logger.log("CRITICAL HIT! Your perfect 21 deals massive damage and heals you for 15 HP!", "player");
            } else {
                this.logger.log("You win the round!", "both");
            }
            await this.dealDamage(this.enemy, false, isCrit);
            if (isCrit) {
                const healAmount = this.player.isDoublingDown ? 30 : 15;
                this.healPlayer(healAmount);
            }
        } else if (enemyTotal > playerTotal) {
            this.logger.log("Enemy wins the round!", "both");
            await this.dealDamage(this.player);
        } else {
            this.logger.log("Tie - no one takes damage.", "both");
            await this.newRound();
        }
    }

    async dealDamage(target, bustBonus = false, playerCrit = false) {
        const damageBase = Math.abs(this.player.handTotal() - this.enemy.handTotal());
        let damage = Math.max(1, damageBase);
        if (bustBonus) {
            damage *= 2;
        }

        const attacker = target === this.enemy ? this.player : this.enemy;
        this.playAttackAnimation(attacker, target);

        if (target === this.enemy) {
            damage = Math.max(1, Math.round(damage * this.enemy.damageInMultiplier));
            if (playerCrit) {
                damage = Math.round(damage * 2);
            }
            if (this.player.isDoublingDown) {
                damage = Math.round(damage * 2);
            }
        } else {
            damage = Math.max(1, Math.round(damage * this.enemy.damageOutMultiplier));
            if (this.player.isDoublingDown) {
                damage = Math.round(damage * 2);
            }
        }

        target.takeDamage(damage);

        if (target === this.enemy) {
            this.logger.log("?? You deal " + damage + " damage! Enemy HP: " + this.enemy.hp, "both");
        } else {
            this.logger.log("?? You take " + damage + " damage! Your HP: " + this.player.hp, "player");
        }

        this.updateHPUI();
        await this.checkEnd();
    }

    async checkEnd() {
        if (this.player.isDead()) {
            this.logger.log("\n?? You died!", "player");
            this.logger.log("\n?? Enemy wins!", "enemy");
            this.gameOver = true;
            this.dealing = false;
            this.showEndOverlay("Defeat! Restart?");
            return;
        }
        if (this.enemy.isDead()) {
            this.logger.log("\n?? You defeated the enemy!", "player");
            this.logger.log("\n?? Enemy defeated!", "enemy");
            playerGold += 50;
            this.updateGoldUI();
            this.logger.log("You received 50 Gold!", "player");
            this.dealing = false;
            this.player.isDoublingDown = false;
            this.showShop();
            return;
        }

        this.player.isDoublingDown = false;
        await this.newRound();
    }

    updateHPUI() {
        this.player.updateHPUI();
        this.enemy.updateHPUI();
        this.updateHPText();
    }

    renderHands() {
        renderHand(this.player.hand, "player-hand-container", false);
        renderHand(this.enemy.hand, "enemy-hand-container", !this.enemyHoleRevealed);
        this.updatePlayerTotal();
        this.updateSkillButtons();
    }

    async dealInitialSequence() {
        await this.dealCardTo(this.player);
        await wait(120);
        await this.dealCardTo(this.enemy);
        await wait(120);
        await this.dealCardTo(this.player);
        await wait(120);
        await this.dealCardTo(this.enemy);
    }

    async dealCardTo(targetCharacter) {
        const card = this.deck.draw();
        await this.animateDeal(card, targetCharacter.side);
        targetCharacter.hand.push(card);
        this.renderHands();
        return card;
    }

    async animateDeal(card, side) {
        const container = document.getElementById(side === "player" ? "player-hand-container" : "enemy-hand-container");
        const deckEl = this.dealerDeckEl;
        const handEl = this.dealerHandEl;
        const originEl = handEl || deckEl;
        const animContainer = this.deck.drawAnimContainer;
        if (!container || !originEl || !animContainer) return;

        const cardEl = document.createElement("div");
        cardEl.className = "deal-card";
        const { icon, cls } = getSuitData(card.suit);
        cardEl.innerHTML = `<div class="suit ${cls}">${icon}</div><div class="rank">${getCardLabel(card.value)}</div><div class="suit ${cls}">${icon}</div>`;

        const deckRect = originEl.getBoundingClientRect();
        const targetRect = container.getBoundingClientRect();
        const startX = deckRect.left + deckRect.width / 2;
        const startY = deckRect.top + deckRect.height / 2;
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;

        cardEl.style.left = `${startX}px`;
        cardEl.style.top = `${startY}px`;

        animContainer.appendChild(cardEl);
        this.triggerHandFlick();

        requestAnimationFrame(() => {
            cardEl.style.opacity = "1";
            cardEl.style.transform = `translate(${endX - startX}px, ${endY - startY}px) scale(1)`;
        });

        return new Promise(resolve => {
            setTimeout(() => {
                if (cardEl.parentNode) cardEl.parentNode.removeChild(cardEl);
                resolve();
            }, 450);
        });
    }

    triggerHandFlick() {
        if (!this.dealerHandEl) return;
        this.dealerHandEl.classList.remove("hand-flick");
        void this.dealerHandEl.offsetWidth;
        this.dealerHandEl.classList.add("hand-flick");
    }

    updatePlayerTotal() {
        const el = document.getElementById("player-total-value");
        if (!el) return;
        el.textContent = this.player.handTotal();
    }

    updateFloorUI() {
        const el = document.getElementById("floor-level");
        if (!el) return;
        el.textContent = `Floor: ${floorLevel}`;
    }

    updateGoldUI() {
        const el = document.getElementById("gold-indicator");
        if (!el) return;
        el.textContent = `Gold: ${playerGold}`;
    }

    updateEnergyUI() {
        const el = document.getElementById("energy-indicator");
        if (!el) return;
        const value = this.player.energy ?? 0;
        const valueEl = el.querySelector(".energy-value");
        if (valueEl) {
            valueEl.textContent = value;
        } else {
            el.textContent = `Energy: ${value}`;
        }
    }

    updateUI() {
        this.updateHPUI();
        this.updateGoldUI();
        this.updateEnergyUI();
        this.updateSkillButtons();
    }

    updateSkillButtons() {
        const energy = this.player.energy || 0;
        const canAct = !this.gameOver && !this.dealing;
        if (this.controls.peekBtn) {
            this.controls.peekBtn.disabled = !canAct || energy < this.skillCosts.peek;
        }
        if (this.controls.aegisBtn) {
            const canPrep = this.player.hand.length === 2 && !this.player.aegisActive;
            this.controls.aegisBtn.disabled = !canAct || energy < this.skillCosts.aegis || !canPrep;
        }
        if (this.controls.forgeBtn) {
            const total = this.player.handTotal();
            const canForge = total < 21;
            this.controls.forgeBtn.disabled = !canAct || energy < this.skillCosts.forge || !canForge;
        }
    }

    updatePeekIndicator() {
        if (!this.peekIndicator) return;
        const card = this.player.peekedCard;
        if (!card) {
            this.peekIndicator.style.display = "none";
            this.peekIndicator.textContent = "";
            return;
        }
        this.peekIndicator.style.display = "block";
        this.peekIndicator.innerHTML = `Next card: <span class="value">${getCardLabel(card.value)} of ${card.suit}</span>`;
    }

    clearPeekedCard() {
        this.player.peekedCard = null;
        this.updatePeekIndicator();
    }

    spendEnergy(cost) {
        if (this.player.energy === undefined) {
            this.player.energy = 0;
        }
        if (this.player.energy < cost) {
            return false;
        }
        this.player.energy -= cost;
        this.updateEnergyUI();
        this.updateSkillButtons();
        return true;
    }

    healPlayer(amount) {
        this.player.hp = Math.min(this.player.maxHP, this.player.hp + amount);
        this.player.currentHP = this.player.hp;
        this.updateHPUI();
    }

    handlePurchase(itemType) {
        const costs = { potion: 50, deck: 25, charm: 75 };
        const names = { potion: "Minor Health Potion", deck: "Shuffled Deck", charm: "Otter's Charm" };
        const cost = costs[itemType];
        if (cost === undefined) return;

        if (playerGold < cost) {
            this.logger.log(`Not enough Gold to buy ${names[itemType]}!`, "player");
            return;
        }

        playerGold -= cost;

        if (itemType === "potion") {
            this.player.hp = Math.min(this.player.maxHP, this.player.hp + 30);
            this.player.currentHP = this.player.hp;
            const btn = document.getElementById("buy-potion");
            if (btn) btn.disabled = true;
            this.logger.log("You drink a Minor Health Potion and restore 30 HP.", "player");
        } else if (itemType === "deck") {
            this.player.maxEnergy = (this.player.maxEnergy || 0) + 2;
            this.player.energy = this.player.maxEnergy;
            if (this.deck) this.deck.refillAndShuffleDeck();
            const btn = document.getElementById("buy-deck");
            if (btn) btn.disabled = true;
            this.logger.log("Your deck is shuffled and you feel energized (+2 max Energy, refilled).", "player");
        } else if (itemType === "charm") {
            this.player.maxHP += 15;
            this.player.hp = this.player.maxHP;
            this.player.currentHP = this.player.hp;
            const btn = document.getElementById("buy-charm");
            if (btn) btn.style.display = "none";
            this.logger.log("You equip Otter's Charm: Max HP +15 and fully healed.", "player");
        }

        this.updateUI();
    }

    showShop() {
        const shop = document.getElementById("shop-screen");
        const title = document.getElementById("shop-title");
        if (shop) {
            shop.style.display = "flex";
        }
        if (title) {
            title.textContent = `The Wanderer's Emporium (Floor ${floorLevel})`;
        }
    }

    async hideShopAndContinue() {
        const shop = document.getElementById("shop-screen");
        if (shop) {
            shop.style.display = "none";
        }
        this.needsEnemySpawn = true;
        floorLevel += 1;
        this.updateFloorUI();
        await this.newRound();
    }

    updateHPText() {
        const playerText = document.getElementById("player-hp-text");
        const enemyText = document.getElementById("enemy-hp-text");
        if (playerText) {
            playerText.innerText = `${this.player.hp}/${this.player.maxHP}`;
        }
        if (enemyText) {
            enemyText.innerText = `${this.enemy.hp}/${this.enemy.maxHP}`;
        }
    }

    playAttackAnimation(attacker, defender) {
        if (attacker === this.player) {
            setOtterState("attack", 500);
        }
        if (defender === this.player) {
            setOtterState("hurt", 500);
        }
        this.runAnimation(attacker.spriteElement, ["attack-forward"], 600);
        this.runAnimation(defender.spriteElement, ["hit-shake", "hit-flash"], 550);
    }

    runAnimation(element, classNames, duration) {
        if (!element) return;
        classNames.forEach(name => element.classList.remove(name));
        // force reflow to restart animation reliably
        void element.offsetWidth;
        classNames.forEach(name => element.classList.add(name));
        setTimeout(() => {
            classNames.forEach(name => element.classList.remove(name));
        }, duration);
    }

    setOverlay(titleText, { showStart = false, showRestart = false } = {}) {
        if (this.overlayTitle) {
            this.overlayTitle.textContent = titleText;
        }
        this.controls.startRoundBtn.classList.toggle("hidden", !showStart);
        this.controls.restartBtn.classList.toggle("hidden", !showRestart);
        this.overlay.classList.remove("hidden");
    }

    showEndOverlay(titleText) {
        if (this.overlay) {
            this.setOverlay(titleText, { showStart: false, showRestart: true });
        }
    }

    restartGame() {
        this.gameOver = false;
        this.dealing = false;
        floorLevel = 1;
        this.needsEnemySpawn = true;
        this.player.maxHP = 100;
        this.player.hp = 100;
        this.player.currentHP = 100;
        playerGold = 50;
        this.enemy.maxHP = 100;
        this.enemy.hp = 100;
        this.enemy.currentHP = 100;
        if (this.deck) {
            this.deck.refillAndShuffleDeck();
        }
        this.player.resetForRound();
        this.enemy.resetForRound();
        this.logger.clear("both");
        this.updateHPUI();
        this.updateFloorUI();
        this.updateGoldUI();
        this.updateEnergyUI();
        this.updateSkillButtons();
        renderOtter("idle");
        if (this.overlay) {
            this.showRoundOverlay("Start round!");
        } else {
            this.newRound();
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const logger = new Logger(
        document.getElementById("playerLog"),
        document.getElementById("enemyLog")
    );

    const deck = new CardDeck(document.getElementById("draw-anim-container"));

    const player = new Player(
        "Player",
        "player",
        100,
        document.getElementById("playerHPFill"),
        document.getElementById("playerSprite"),
        "player",
        logger
    );
    player.setSpriteVisual("Otter Knight", PLAYER_SPRITE, "#e4c17a");
    player.isDoublingDown = false;

    const enemy = new Enemy(
        "Enemy",
        "enemy",
        100,
        document.getElementById("enemyHPFill"),
        document.getElementById("enemySprite"),
        "enemy",
        logger
    );

    const engine = new CombatEngine({
        player,
        enemy,
        deck,
        logger,
        overlay: null,
        overlayTitle: null,
        enemyIconImg: document.getElementById("enemyIconImg"),
        enemyIconName: document.getElementById("enemyIconName"),
        dealerDeckEl: document.getElementById("dealer-deck"),
        dealerHandEl: document.getElementById("dealer-box"),
        controls: {
            startRoundBtn: null,
            restartBtn: document.getElementById("restart-button"),
            hitBtn: document.getElementById("hit-button"),
            standBtn: document.getElementById("stand-button"),
            doubleBtn: document.getElementById("double-button"),
            peekBtn: document.getElementById("peek-button"),
            aegisBtn: document.getElementById("aegis-button"),
            forgeBtn: document.getElementById("forge-button")
        }
    });

    const dealerSpriteEl = document.getElementById("dealerSprite");
    if (dealerSpriteEl) {
        dealerSpriteEl.src = "designs/hand.png";
        dealerSpriteEl.onerror = () => {
            dealerSpriteEl.onerror = null;
            dealerSpriteEl.src = DEALER_SPRITE;
        };
        dealerSpriteEl.onload = () => {
            cleanTransparentBackground(dealerSpriteEl);
        };
    }

    engine.init();

    otterSprites.idle.onload = () => renderOtter("idle");
    renderOtter("idle");
});
