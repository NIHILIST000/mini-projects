document.addEventListener('DOMContentLoaded', function () {
	const canvas = document.getElementById('gameCanvas')
	const ctx = canvas.getContext('2d')
	const scoreDisplay = document.getElementById('score')
	const livesDisplay = document.getElementById('lives')
	const levelDisplay = document.getElementById('level')
	const finalScoreDisplay = document.querySelector('.final-score')
	const startScreen = document.querySelector('.start-screen')
	const gameOverScreen = document.querySelector('.game-over-screen')
	const levelCompleteScreen = document.querySelector('.level-complete-screen')
	const restartBtn = document.querySelector('.restart-btn')

	// Настройки игры
	const TILE_SIZE = 20
	const COLS = 19
	const ROWS = 22
	canvas.width = COLS * TILE_SIZE
	canvas.height = ROWS * TILE_SIZE

	// Скорости персонажей
	const PLAYER_SPEED = 0.15
	const GHOST_SPEED = 0.1
	const POWER_MODE_DURATION = 7000

	// Игровые переменные
	let score = 0
	let lives = 3
	let level = 1
	let gameRunning = false
	let animationId = null
	let powerMode = false
	let powerModeTimer = 0
	let lastTime = 0

	// Лабиринт (1 - стены, 0 - дороги, 2 - точки, 3 - энерджайзеры)
	const maze = [
		[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
		[1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
		[1, 3, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 3, 1],
		[1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
		[1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
		[1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1],
		[1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
		[1, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 1],
		[0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0],
		[1, 1, 1, 1, 2, 1, 0, 1, 1, 0, 1, 1, 0, 1, 2, 1, 1, 1, 1],
		[0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0],
		[1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
		[0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0],
		[1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
		[1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
		[1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
		[1, 3, 2, 1, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 1, 2, 3, 1],
		[1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1],
		[1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
		[1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1],
		[1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
		[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
	]

	// Цвета пришельцев
	const GHOST_COLORS = ['#FF0000', '#FFC0CB', '#00FFFF', '#FFA500']

	// Игрок
	class Player {
		constructor() {
			this.reset()
			this.radius = TILE_SIZE / 2 - 2
			this.mouthAngle = 0
			this.mouthSpeed = 0.08
		}

		reset() {
			this.x = 9
			this.y = 16
			this.speed = PLAYER_SPEED
			this.dx = 0
			this.dy = 0
			this.nextDir = null
		}

		draw() {
			ctx.save()
			ctx.translate((this.x + 0.5) * TILE_SIZE, (this.y + 0.5) * TILE_SIZE)

			// Тело
			ctx.fillStyle = '#FFFF00'
			ctx.beginPath()
			ctx.arc(0, 0, this.radius, this.mouthAngle, Math.PI * 2 - this.mouthAngle)
			ctx.lineTo(0, 0)
			ctx.fill()

			// Глаз
			ctx.fillStyle = '#000'
			ctx.beginPath()
			ctx.arc(
				this.radius / 3,
				-this.radius / 3,
				this.radius / 4,
				0,
				Math.PI * 2
			)
			ctx.fill()

			ctx.restore()

			// Анимация рта
			this.mouthAngle += this.mouthSpeed
			if (this.mouthAngle > 0.4 || this.mouthAngle < 0) {
				this.mouthSpeed = -this.mouthSpeed
			}
		}

		canMove(x, y) {
			const centerX = x + 0.5
			const centerY = y + 0.5

			const checkPoints = [
				{ x: Math.floor(centerX - 0.4), y: Math.floor(centerY - 0.4) },
				{ x: Math.floor(centerX + 0.4), y: Math.floor(centerY - 0.4) },
				{ x: Math.floor(centerX - 0.4), y: Math.floor(centerY + 0.4) },
				{ x: Math.floor(centerX + 0.4), y: Math.floor(centerY + 0.4) },
			]

			return checkPoints.every(point => {
				if (point.x < 0 || point.x >= COLS || point.y < 0 || point.y >= ROWS) {
					return false
				}
				return maze[point.y][point.x] !== 1
			})
		}

		update() {
			const prevX = this.x
			const prevY = this.y

			// Проверка следующего направления
			if (this.nextDir) {
				const [nextX, nextY] = [
					this.x + this.nextDir.dx,
					this.y + this.nextDir.dy,
				]
				if (this.canMove(nextX, nextY)) {
					this.dx = this.nextDir.dx
					this.dy = this.nextDir.dy
					this.nextDir = null
				}
			}

			this.x += this.dx * this.speed
			this.y += this.dy * this.speed

			if (!this.canMove(this.x, this.y)) {
				this.x = prevX
				this.y = prevY

				if (this.dx !== 0) this.x = Math.round(this.x)
				if (this.dy !== 0) this.y = Math.round(this.y)
			}

			// Телепортация через туннели
			if (this.x < -0.5) this.x = COLS - 0.5
			if (this.x >= COLS - 0.5) this.x = -0.5

			this.collectDots()
		}

		collectDots() {
			const col = Math.floor(this.x)
			const row = Math.floor(this.y)

			if (maze[row][col] === 2) {
				maze[row][col] = 0
				score += 10
				scoreDisplay.textContent = score
			} else if (maze[row][col] === 3) {
				maze[row][col] = 0
				score += 50
				scoreDisplay.textContent = score
				activatePowerMode()
			}
		}

		setDirection(dx, dy) {
			const newX = this.x + dx
			const newY = this.y + dy

			if (this.canMove(newX, newY)) {
				this.dx = dx
				this.dy = dy
				this.nextDir = null
			} else {
				this.nextDir = { dx, dy }
			}
		}
	}

	// Пришельцы
	class Ghost {
		constructor(x, y, color) {
			this.x = x
			this.y = y
			this.color = color
			this.dx = 0
			this.dy = 0
			this.speed = GHOST_SPEED
			this.scared = false
			this.radius = TILE_SIZE / 2 - 2
			this.animation = 0
		}

		draw() {
			ctx.save()
			ctx.translate((this.x + 0.5) * TILE_SIZE, (this.y + 0.5) * TILE_SIZE)

			// Тело
			ctx.fillStyle = this.scared ? '#2121FF' : this.color
			ctx.beginPath()
			ctx.arc(0, 0, this.radius, Math.PI, 0, false)

			// Нижняя волнистая часть
			const wave = Math.sin(this.animation) * 3
			ctx.lineTo(this.radius, wave)
			ctx.lineTo(this.radius * 0.6, wave + 3)
			ctx.lineTo(this.radius * 0.2, wave - 2)
			ctx.lineTo(-this.radius * 0.2, wave + 4)
			ctx.lineTo(-this.radius * 0.6, wave - 1)
			ctx.lineTo(-this.radius, wave + 2)
			ctx.closePath()
			ctx.fill()

			// Глаза
			const eyeDx = this.dx !== 0 ? this.dx * 0.3 : 0
			const eyeDy = this.dy !== 0 ? this.dy * 0.3 : 0

			ctx.fillStyle = 'white'
			ctx.beginPath()
			ctx.arc(
				-this.radius / 3 + eyeDx,
				-this.radius / 3 + eyeDy,
				this.radius / 3,
				0,
				Math.PI * 2
			)
			ctx.arc(
				this.radius / 3 + eyeDx,
				-this.radius / 3 + eyeDy,
				this.radius / 3,
				0,
				Math.PI * 2
			)
			ctx.fill()

			ctx.fillStyle = '#000'
			ctx.beginPath()
			ctx.arc(
				-this.radius / 3 + eyeDx,
				-this.radius / 3 + eyeDy,
				this.radius / 6,
				0,
				Math.PI * 2
			)
			ctx.arc(
				this.radius / 3 + eyeDx,
				-this.radius / 3 + eyeDy,
				this.radius / 6,
				0,
				Math.PI * 2
			)
			ctx.fill()

			ctx.restore()

			this.animation += 0.2
		}

		canMove(x, y) {
			const centerX = x + 0.5
			const centerY = y + 0.5

			const checkPoints = [
				{ x: Math.floor(centerX - 0.4), y: Math.floor(centerY - 0.4) },
				{ x: Math.floor(centerX + 0.4), y: Math.floor(centerY - 0.4) },
				{ x: Math.floor(centerX - 0.4), y: Math.floor(centerY + 0.4) },
				{ x: Math.floor(centerX + 0.4), y: Math.floor(centerY + 0.4) },
			]

			return checkPoints.every(point => {
				if (point.x < 0 || point.x >= COLS || point.y < 0 || point.y >= ROWS) {
					return false
				}
				return maze[point.y][point.x] !== 1
			})
		}

		update() {
			if (Math.random() < 0.05 || (this.dx === 0 && this.dy === 0)) {
				this.changeDirection()
			}

			const newX = this.x + this.dx * this.speed
			const newY = this.y + this.dy * this.speed

			if (this.canMove(newX, newY)) {
				this.x = newX
				this.y = newY
			} else {
				this.changeDirection()
			}

			if (this.x < 0) this.x = COLS - 1
			if (this.x >= COLS) this.x = 0
		}

		changeDirection() {
			const directions = [
				{ dx: 1, dy: 0 },
				{ dx: -1, dy: 0 },
				{ dx: 0, dy: 1 },
				{ dx: 0, dy: -1 },
			]

			const validDirections = directions.filter(dir => {
				return (
					this.canMove(this.x + dir.dx, this.y + dir.dy) &&
					!(dir.dx === -this.dx && dir.dy === -this.dy)
				)
			})

			if (validDirections.length > 0) {
				const dir =
					validDirections[Math.floor(Math.random() * validDirections.length)]
				this.dx = dir.dx
				this.dy = dir.dy
			}
		}

		reset() {
			this.x = 9
			this.y = 9
			this.dx = 0
			this.dy = 0
			this.scared = false
		}
	}

	// Создаем игрока и пришельцев
	const player = new Player()
	const ghosts = GHOST_COLORS.map(
		(color, i) => new Ghost(9 + (i % 2), 9 + Math.floor(i / 2), color)
	)

	// Режим силы
	function activatePowerMode() {
		powerMode = true
		powerModeTimer = POWER_MODE_DURATION
		ghosts.forEach(ghost => (ghost.scared = true))
	}

	function updatePowerMode(deltaTime) {
		if (powerMode) {
			powerModeTimer -= deltaTime

			if (powerModeTimer < 2000) {
				ghosts.forEach(ghost => {
					ghost.scared = Math.floor(powerModeTimer / 200) % 2 === 0
				})
			}

			if (powerModeTimer <= 0) {
				powerMode = false
				ghosts.forEach(ghost => (ghost.scared = false))
			}
		}
	}

	// Проверка столкновений
	function checkCollisions() {
		ghosts.forEach(ghost => {
			const dx = (player.x + 0.5) * TILE_SIZE - (ghost.x + 0.5) * TILE_SIZE
			const dy = (player.y + 0.5) * TILE_SIZE - (ghost.y + 0.5) * TILE_SIZE
			const distance = Math.sqrt(dx * dx + dy * dy)

			if (distance < player.radius + ghost.radius) {
				if (ghost.scared) {
					ghost.reset()
					score += 200
					scoreDisplay.textContent = score
				} else {
					lives--
					livesDisplay.textContent = lives

					if (lives <= 0) {
						gameOver = true
						endGame()
					} else {
						resetPositions()
					}
				}
			}
		})
	}

	// Сброс позиций
	function resetPositions() {
		player.reset()
		ghosts.forEach(ghost => ghost.reset())
	}

	// Проверка завершения уровня
	function checkLevelComplete() {
		for (let row = 0; row < ROWS; row++) {
			for (let col = 0; col < COLS; col++) {
				if (maze[row][col] === 2 || maze[row][col] === 3) {
					return false
				}
			}
		}
		return true
	}

	// Рисование лабиринта
	function drawMaze() {
		for (let row = 0; row < ROWS; row++) {
			for (let col = 0; col < COLS; col++) {
				const x = col * TILE_SIZE
				const y = row * TILE_SIZE

				if (maze[row][col] === 1) {
					ctx.fillStyle = '#000066'
					ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)

					ctx.strokeStyle = '#00f0ff'
					ctx.lineWidth = 2
					ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE)
				} else if (maze[row][col] === 2) {
					ctx.fillStyle = '#FFFFFF'
					ctx.beginPath()
					ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 3, 0, Math.PI * 2)
					ctx.fill()
				} else if (maze[row][col] === 3) {
					ctx.fillStyle = '#FFFFFF'
					ctx.beginPath()
					ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 6, 0, Math.PI * 2)
					ctx.fill()

					const pulse = Math.sin(Date.now() / 200) * 2
					ctx.strokeStyle = '#FF00FF'
					ctx.lineWidth = 2
					ctx.beginPath()
					ctx.arc(
						x + TILE_SIZE / 2,
						y + TILE_SIZE / 2,
						6 + pulse,
						0,
						Math.PI * 2
					)
					ctx.stroke()
				}
			}
		}
	}

	// Рисование звездного фона
	function drawBackground() {
		ctx.fillStyle = '#000033'
		ctx.fillRect(0, 0, canvas.width, canvas.height)

		ctx.fillStyle = '#FFFFFF'
		for (let i = 0; i < 50; i++) {
			const x = Math.random() * canvas.width
			const y = Math.random() * canvas.height
			const size = Math.random() * 2
			const opacity = 0.2 + Math.random() * 0.8

			ctx.globalAlpha = opacity
			ctx.fillRect(x, y, size, size)
		}
		ctx.globalAlpha = 1
	}

	// Игровой цикл
	function gameLoop(timestamp) {
		if (!gameRunning) return

		const deltaTime = timestamp - lastTime
		lastTime = timestamp

		drawBackground()
		drawMaze()

		ghosts.forEach(ghost => {
			ghost.update()
			ghost.draw()
		})

		player.update()
		player.draw()

		checkCollisions()
		updatePowerMode(deltaTime)

		if (checkLevelComplete()) {
			levelComplete()
		}

		animationId = requestAnimationFrame(gameLoop)
	}

	// Начало игры
	function startGame() {
		score = 0
		lives = 3
		level = 1
		gameRunning = true

		scoreDisplay.textContent = score
		livesDisplay.textContent = lives
		levelDisplay.textContent = level

		player.speed = PLAYER_SPEED
		ghosts.forEach(ghost => {
			ghost.speed = GHOST_SPEED
			ghost.reset()
		})

		// Восстановление лабиринта
		for (let row = 0; row < ROWS; row++) {
			for (let col = 0; col < COLS; col++) {
				if (maze[row][col] === 0) {
					maze[row][col] = 2
				}
			}
		}

		// Восстановление энерджайзеров
		maze[1][1] = 3
		maze[1][17] = 3
		maze[16][1] = 3
		maze[16][17] = 3

		player.reset()

		startScreen.classList.add('hidden')
		gameOverScreen.classList.add('hidden')
		levelCompleteScreen.classList.add('hidden')

		lastTime = performance.now()
		animationId = requestAnimationFrame(gameLoop)
	}

	// Завершение уровня
	function levelComplete() {
		gameRunning = false
		cancelAnimationFrame(animationId)

		level++
		levelDisplay.textContent = level

		ghosts.forEach(ghost => (ghost.speed += 0.02))

		levelCompleteScreen.classList.remove('hidden')

		setTimeout(() => {
			startGame()
		}, 3000)
	}

	// Конец игры
	function endGame() {
		gameRunning = false
		cancelAnimationFrame(animationId)

		finalScoreDisplay.textContent = score
		gameOverScreen.classList.remove('hidden')
	}

	// Обработка клавиш
	function handleKeyPress(e) {
		if (!gameRunning && !startScreen.classList.contains('hidden')) {
			startGame()
			return
		}

		switch (e.keyCode) {
			case 37:
				player.setDirection(-1, 0)
				break
			case 39:
				player.setDirection(1, 0)
				break
			case 38:
				player.setDirection(0, -1)
				break
			case 40:
				player.setDirection(0, 1)
				break
			case 80:
				togglePause()
				break // P - пауза
			case 82:
				startGame()
				break // R - рестарт
		}
	}

	// Пауза
	function togglePause() {
		if (!gameRunning && !gameOverScreen.classList.contains('hidden')) return

		gameRunning = !gameRunning

		if (gameRunning) {
			lastTime = performance.now()
			animationId = requestAnimationFrame(gameLoop)
		}
	}

	// Инициализация игры
	function init() {
		document.addEventListener('keydown', handleKeyPress)
		restartBtn.addEventListener('click', startGame)

		drawBackground()
		drawMaze()
		player.draw()
		ghosts.forEach(ghost => ghost.draw())
	}

	init()
})
