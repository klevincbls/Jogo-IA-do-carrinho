const road = document.getElementById("road");
const player = document.getElementById("player");
const overlay = document.getElementById("overlay");

const scoreDisplay = document.getElementById("score");
const speedDisplay = document.getElementById("speed");
const recordDisplay = document.getElementById("record");

const startButton = document.getElementById("startButton");
const message = document.getElementById("message");
const description = document.getElementById("description");

const leftButton = document.getElementById("leftButton");
const rightButton = document.getElementById("rightButton");

const carEmojis = ["🚕", "🚙", "🚓", "🚗"];

let playerLane = 1;
let enemies = [];
let score = 0;
let speed = 1;
let running = false;
let lastTime = 0;
let spawnTimer = 0;
let animationId = null;

let record = 0;

try {
  record = Number(localStorage.getItem("turboRecord")) || 0;
} catch (error) {
  record = 0;
}

recordDisplay.textContent = record;

// Retorna a posição horizontal de uma faixa.
function lanePosition(lane) {
  const laneWidth = road.clientWidth / 3;
  return lane * laneWidth + laneWidth / 2 - player.offsetWidth / 2;
}

// Atualiza a posição do carro do jogador.
function movePlayer() {
  player.style.left = lanePosition(playerLane) + "px";
}

// Move o jogador para a esquerda ou direita.
function changeLane(direction) {
  if (!running) return;

  playerLane += direction;

  if (playerLane < 0) playerLane = 0;
  if (playerLane > 2) playerLane = 2;

  movePlayer();
}

// Cria um carro adversário.
function createEnemy() {
  const enemy = document.createElement("div");
  enemy.className = "car enemy";

  const lane = Math.floor(Math.random() * 3);
  const emoji = carEmojis[
    Math.floor(Math.random() * carEmojis.length)
  ];

  enemy.innerHTML = `<span>${emoji}</span>`;
  enemy.style.left = lanePosition(lane) + "px";
  enemy.style.top = "-80px";

  road.appendChild(enemy);

  enemies.push({
    element: enemy,
    lane: lane,
    y: -80
  });
}

// Verifica se dois retângulos se sobrepõem.
function collision(a, b) {
  const rectA = a.getBoundingClientRect();
  const rectB = b.getBoundingClientRect();

  return (
    rectA.left < rectB.right - 8 &&
    rectA.right > rectB.left + 8 &&
    rectA.top < rectB.bottom - 8 &&
    rectA.bottom > rectB.top + 8
  );
}

// Encerra a corrida.
function gameOver() {
  running = false;

  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  if (score > record) {
    record = score;

    try {
      localStorage.setItem("turboRecord", record);
    } catch (error) {
      // O jogo continua mesmo se o armazenamento falhar.
    }
  }

  recordDisplay.textContent = record;

  message.textContent = "💥 FIM DE JOGO!";
  description.textContent =
    `Você fez ${score} pontos. Tente novamente!`;

  startButton.textContent = "🔄 JOGAR NOVAMENTE";
  overlay.style.display = "flex";
}

// Atualiza o jogo a cada quadro.
function gameLoop(timestamp) {
  if (!running) return;

  if (!lastTime) lastTime = timestamp;

  const delta = Math.min((timestamp - lastTime) / 16.67, 3);
  lastTime = timestamp;

  spawnTimer += delta;

  // A velocidade aumenta conforme a pontuação.
  speed = 1 + Math.floor(score / 100);

  speedDisplay.textContent = speed;

  // Cria adversários em intervalos progressivamente menores.
  const spawnInterval = Math.max(35, 90 - speed * 4);

  if (spawnTimer >= spawnInterval) {
    spawnTimer = 0;
    createEnemy();
  }

  // Move os adversários e verifica colisões.
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];

    enemy.y += (3 + speed * 0.5) * delta;
    enemy.element.style.top = enemy.y + "px";

    if (collision(player, enemy.element)) {
      gameOver();
      return;
    }

    // Pontua quando o adversário sai da pista.
    if (enemy.y > road.clientHeight) {
      enemy.element.remove();
      enemies.splice(i, 1);

      score += 10;
      scoreDisplay.textContent = score;
    }
  }

  animationId = requestAnimationFrame(gameLoop);
}

// Começa ou reinicia uma corrida.
function startGame() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  enemies.forEach(enemy => enemy.element.remove());
  enemies = [];

  score = 0;
  speed = 1;
  playerLane = 1;
  spawnTimer = 0;
  lastTime = 0;
  running = true;

  scoreDisplay.textContent = score;
  speedDisplay.textContent = speed;

  movePlayer();

  overlay.style.display = "none";

  animationId = requestAnimationFrame(gameLoop);
}

// Controles do teclado.
document.addEventListener("keydown", event => {
  if (
    ["ArrowLeft", "ArrowRight", "a", "A", "d", "D"].includes(event.key)
  ) {
    event.preventDefault();
  }

  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    changeLane(-1);
  }

  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    changeLane(1);
  }
});

// Controles para celular.
leftButton.addEventListener("click", () => changeLane(-1));
rightButton.addEventListener("click", () => changeLane(1));

// Botão de início e reinício.
startButton.addEventListener("click", startGame);

// Ajusta o carro caso a largura da tela mude.
window.addEventListener("resize", movePlayer);

// Posiciona o carro ao carregar a página.
movePlayer();