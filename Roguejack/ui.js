/* =========================================================
   UI MANAGER
========================================================= */

/* ---------- HP BAR UPDATE ---------- */
export function updateHPBar(id, current, max) {
    const fill = document.getElementById(id);
    const percent = Math.max(0, (current / max) * 100);
    fill.style.width = percent + "%";
}

/* ---------- SPRITE CHANGER ---------- */
export function setPlayerSprite(state) {
    const sprite = document.getElementById("playerSprite");

    const file = {
        idle: "designs/otter_idle.png",
        attack: "designs/otter_attack.png",
        hurt: "designs/otter_hurt.png"
    }[state];

    sprite.src = file;
}

export function setEnemySprite(src) {
    document.getElementById("enemySprite").src = src;
}

/* ---------- DAMAGE GLOW ---------- */
export function flashEnemyPanel() {
    const panel = document.getElementById("enemyPanel");
    panel.classList.add("damaged");
    setTimeout(() => panel.classList.remove("damaged"), 300);
}

/* ---------- COMBAT LOG ---------- */
export function addLog(target, icon, text, critical = false) {
    const container = document.getElementById(target + "Log");

    const div = document.createElement("div");
    div.className = "log-entry";

    const img = document.createElement("img");
    img.src = icon;

    const span = document.createElement("span");
    span.textContent = text;

    if (critical) span.classList.add("critical");

    div.appendChild(img);
    div.appendChild(span);

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

/* ---------- ENEMY HUD UPDATE ---------- */
export function setEnemyHeader(name, img) {
    document.getElementById("enemyIconName").textContent = name;
    document.getElementById("enemyIconImg").src = img;
}

/* ---------- BUTTONS ---------- */
export function registerButtons(onHit, onStand) {
    document.getElementById("hit-button").onclick = onHit;
    document.getElementById("stand-button").onclick = onStand;
}
