// Константы игры
const COLS = 10
const ROWS = 20
const BLOCK_SIZE = 30
const COLORS = [
	null,
	'#FF0D72', // I
	'#0DC2FF', // J
	'#0DFF72', // L
	'#F538FF', // O
	'#FF8E0D', // S
	'#FFE138', // T
	'#3877FF', // Z
]

// Элементы DOM
const canvas = document.getElementById('tetrisCanvas')
const ctx = canvas.getContext('2d')
const nextPieceCanvas = document.getElementById('nextPieceCanvas')
const nextPieceCtx = nextPieceCanvas.getContext('2d')
const scoreDisplay = document.getElementById('score')
const levelDisplay = document.getElementById('level')
const linesDisplay = document.getElementById('lines')
const finalScoreDisplay = document.querySelector('.final-score')
const startScreen = document.querySelector('.start-screen')
const gameOverScreen = document.querySelector('.game-over-screen')
const pauseScreen = document.querySelector('.pause-screen')
const restartBtn = document.querySelector('.restart-btn')

// Масштабирование холста
canvas.width = COLS * BLOCK_SIZE
canvas.height = ROWS * BLOCK_SIZE
nextPieceCanvas.width = 100
nextPieceCanvas.height = 100

// Игровые переменные
let score = 0
let level = 1
let lines = 0
let gameOver = false
let isPaused = false
let dropCounter = 0
let dropInterval = 1000
let lastTime = 0
let animationId = null

// Игровое поле
const grid = createMatrix(COLS, ROWS)

// Фигуры Тетриса
const SHAPES = [
	[
		[0, 0, 0, 0],
		[1, 1, 1, 1],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
	], // I
	[
		[2, 0, 0],
		[2, 2, 2],
		[0, 0, 0],
	], // J
	[
		[0, 0, 3],
		[3, 3, 3],
		[0, 0, 0],
	], // L
	[
		[4, 4],
		[4, 4],
	], // O
	[
		[0, 5, 5],
		[5, 5, 0],
		[0, 0, 0],
	], // S
	[
		[0, 6, 0],
		[6, 6, 6],
		[0, 0, 0],
	], // T
	[
		[7, 7, 0],
		[0, 7, 7],
		[0, 0, 0],
	], // Z
]

// Игрок
const player = {
	pos: { x: 0, y: 0 },
	matrix: null,
	next: null,
}

// Создание матрицы
function createMatrix(w, h) {
	const matrix = []
	while (h--) {
		matrix.push(new Array(w).fill(0))
	}
	return matrix
}

// Создание фигуры
function createPiece(type) {
	return SHAPES[type].map(row => [...row])
}

// Рисование матрицы
function drawMatrix(matrix, offset, ctx, size = BLOCK_SIZE) {
	matrix.forEach((row, y) => {
		row.forEach((value, x) => {
			if (value !== 0) {
				ctx.fillStyle = COLORS[value]
				ctx.fillRect((x + offset.x) * size, (y + offset.y) * size, size, size)

				// Обводка блоков
				ctx.strokeStyle = '#000'
				ctx.lineWidth = 2
				ctx.strokeRect((x + offset.x) * size, (y + offset.y) * size, size, size)
			}
		})
	})
}

// Рисование игрового поля
function draw() {
	// Очистка холста
	ctx.fillStyle = '#000'
	ctx.fillRect(0, 0, canvas.width, canvas.height)

	// Рисование сетки
	ctx.strokeStyle = '#222'
	ctx.lineWidth = 1
	for (let i = 0; i <= COLS; i++) {
		ctx.beginPath()
		ctx.moveTo(i * BLOCK_SIZE, 0)
		ctx.lineTo(i * BLOCK_SIZE, ROWS * BLOCK_SIZE)
		ctx.stroke()
	}
	for (let i = 0; i <= ROWS; i++) {
		ctx.beginPath()
		ctx.moveTo(0, i * BLOCK_SIZE)
		ctx.lineTo(COLS * BLOCK_SIZE, i * BLOCK_SIZE)
		ctx.stroke()
	}

	// Рисование игрового поля
	drawMatrix(grid, { x: 0, y: 0 }, ctx)

	// Рисование текущей фигуры
	drawMatrix(player.matrix, player.pos, ctx)

	// Рисование следующей фигуры
	drawNextPiece()
}

// Рисование следующей фигуры
function drawNextPiece() {
	nextPieceCtx.fillStyle = '#000'
	nextPieceCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height)

	const size = 20
	const offset = {
		x: (nextPieceCanvas.width / size - player.next[0].length) / 2,
		y: (nextPieceCanvas.height / size - player.next.length) / 2,
	}

	drawMatrix(player.next, offset, nextPieceCtx, size)
}

// Объединение фигуры с полем
function merge() {
	player.matrix.forEach((row, y) => {
		row.forEach((value, x) => {
			if (value !== 0) {
				grid[y + player.pos.y][x + player.pos.x] = value
			}
		})
	})
}

// Проверка столкновений
function collide() {
	const [m, o] = [player.matrix, player.pos]
	for (let y = 0; y < m.length; ++y) {
		for (let x = 0; x < m[y].length; ++x) {
			if (
				m[y][x] !== 0 &&
				(grid[y + o.y] === undefined ||
					grid[y + o.y][x + o.x] === undefined ||
					grid[y + o.y][x + o.x] !== 0)
			) {
				return true
			}
		}
	}
	return false
}

// Поворот фигуры
function rotate() {
	const matrix = player.matrix
	const N = matrix.length

	// Транспонирование матрицы
	for (let y = 0; y < N; ++y) {
		for (let x = 0; x < y; ++x) {
			;[matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]]
		}
	}

	// Обратный порядок столбцов
	for (let y = 0; y < N; ++y) {
		matrix[y].reverse()
	}

	// Если после поворота есть столкновение - откат
	if (collide()) {
		for (let y = 0; y < N; ++y) {
			matrix[y].reverse()
		}
		for (let y = 0; y < N; ++y) {
			for (let x = 0; x < y; ++x) {
				;[matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]]
			}
		}
	}
}

// Движение фигуры вниз
function playerDrop() {
	player.pos.y++
	if (collide()) {
		player.pos.y--
		merge()
		playerReset()
		arenaSweep()
		updateScore()
	}
	dropCounter = 0
}

// Движение фигуры влево/вправо
function playerMove(dir) {
	player.pos.x += dir
	if (collide()) {
		player.pos.x -= dir
	}
}

// Сброс фигуры
function playerReset() {
	player.matrix = player.next
	player.next = createPiece(Math.floor(Math.random() * SHAPES.length))
	player.pos.y = 0
	player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2)

	// Если новая фигура сразу сталкивается - игра окончена
	if (collide()) {
		gameOver = true
		endGame()
	}
}

// Быстрый сброс (хард дроп)
function playerHardDrop() {
	while (!collide()) {
		player.pos.y++
	}
	player.pos.y--
	playerDrop()
}

// Очистка заполненных линий
function arenaSweep() {
	let linesCleared = 0
	outer: for (let y = grid.length - 1; y >= 0; --y) {
		for (let x = 0; x < grid[y].length; ++x) {
			if (grid[y][x] === 0) {
				continue outer
			}
		}

		// Удаление заполненной строки
		const row = grid.splice(y, 1)[0].fill(0)
		grid.unshift(row)
		++y

		linesCleared++
	}

	if (linesCleared > 0) {
		lines += linesCleared
		// Увеличение уровня каждые 10 линий
		level = Math.floor(lines / 10) + 1
	}
}

// Обновление счета
function updateScore() {
	const points = [0, 40, 100, 300, 1200]
	const clearedLines = Math.min(lines % 10, 4)
	score += points[clearedLines] * level
	scoreDisplay.textContent = score
	levelDisplay.textContent = level
	linesDisplay.textContent = lines

	// Увеличение скорости с уровнем
	dropInterval = 1000 / level
}

// Игровой цикл
function update(time = 0) {
	if (isPaused) return

	const deltaTime = time - lastTime
	lastTime = time

	dropCounter += deltaTime
	if (dropCounter > dropInterval) {
		playerDrop()
	}

	draw()

	if (!gameOver) {
		animationId = requestAnimationFrame(update)
	}
}

// Обработка клавиш
function handleKeyPress(e) {
	if (gameOver) return

	switch (e.keyCode) {
		case 37: // ←
			playerMove(-1)
			break
		case 39: // →
			playerMove(1)
			break
		case 40: // ↓
			playerDrop()
			break
		case 38: // ↑
			rotate()
			break
		case 32: // Space
			playerHardDrop()
			break
		case 80: // P
			togglePause()
			break
	}
}

// Пауза
function togglePause() {
	isPaused = !isPaused
	pauseScreen.classList.toggle('hidden')

	if (!isPaused && !gameOver) {
		lastTime = performance.now()
		update()
	}
}

// Начало игры
function startGame() {
	if (animationId) {
		cancelAnimationFrame(animationId)
	}

	// Сброс игрового поля
	grid.forEach(row => row.fill(0))

	// Сброс параметров игры
	score = 0
	level = 1
	lines = 0
	gameOver = false
	isPaused = false
	dropInterval = 1000

	// Обновление интерфейса
	scoreDisplay.textContent = score
	levelDisplay.textContent = level
	linesDisplay.textContent = lines
	finalScoreDisplay.textContent = score

	// Создание фигур
	player.next = createPiece(Math.floor(Math.random() * SHAPES.length))
	playerReset()

	// Скрытие экранов
	startScreen.classList.add('hidden')
	gameOverScreen.classList.add('hidden')
	pauseScreen.classList.add('hidden')

	// Запуск игры
	lastTime = 0
	dropCounter = 0
	update()
}

// Конец игры
function endGame() {
	gameOver = true
	cancelAnimationFrame(animationId)
	finalScoreDisplay.textContent = score
	gameOverScreen.classList.remove('hidden')
}

// Инициализация игры
function init() {
	// Обработчики событий
	document.addEventListener('keydown', handleKeyPress)
	document.addEventListener('keydown', function (e) {
		if (startScreen.classList.contains('hidden') === false) {
			startGame()
		}
	})
	restartBtn.addEventListener('click', startGame)

	// Первый рендер
	draw()

	// Создание первой следующей фигуры
	player.next = createPiece(Math.floor(Math.random() * SHAPES.length))
	drawNextPiece()
}

// Запуск игры
init()
