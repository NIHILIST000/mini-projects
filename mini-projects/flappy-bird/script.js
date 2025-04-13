document.addEventListener('DOMContentLoaded', function () {
	const canvas = document.getElementById('gameCanvas')
	const ctx = canvas.getContext('2d')
	const currentScoreDisplay = document.querySelector('.current-score')
	const highScoreDisplay = document.querySelector('.high-score')
	const finalScoreDisplay = document.querySelector('.final-score')
	const finalHighScoreDisplay = document.querySelector('.final-high-score')
	const startScreen = document.querySelector('.start-screen')
	const gameOverScreen = document.querySelector('.game-over-screen')
	const restartBtn = document.querySelector('.restart-btn')

	// Настройки игры
	let gameRunning = false
	let score = 0
	let highScore = localStorage.getItem('pixelFlappyHighScore') || 0
	const gravity = 0.2
	const initialSpeed = 1.1
	let speed = initialSpeed
	const gameSpeedIncrease = 0.0003
	let lastFrameTime = 0
	let animationFrameId

	// Обновляем рекорд
	highScoreDisplay.textContent = `HI: ${highScore}`

	const bird = {
		x: 60, // Позиция ближе к левому краю
		y: canvas.height / 2,
		width: 24,
		height: 24,
		velocity: 0,
		jumpForce: -6.5,
		rotation: 0,
		color: '#f8d347',
		wingAngle: 0,

		draw() {
			ctx.save()
			ctx.translate(this.x, this.y)

			// Тело птицы
			ctx.fillStyle = this.color
			ctx.fillRect(0, 0, this.width, this.height)

			// Контур
			ctx.strokeStyle = '#000'
			ctx.lineWidth = 2
			ctx.strokeRect(0, 0, this.width, this.height)

			// Глаз
			ctx.fillStyle = '#fff'
			ctx.fillRect(14, 6, 8, 8)
			ctx.strokeRect(14, 6, 8, 8)

			ctx.fillStyle = '#000'
			ctx.fillRect(16, 8, 4, 4)

			// Клюв
			ctx.fillStyle = '#ff9800'
			ctx.beginPath()
			ctx.moveTo(24, 10)
			ctx.lineTo(32, 8)
			ctx.lineTo(32, 14)
			ctx.closePath()
			ctx.fill()
			ctx.stroke()

			// Крыло
			ctx.save()
			ctx.translate(8, 12)
			ctx.rotate(Math.sin(this.wingAngle) * 0.3)

			ctx.fillStyle = '#f0c040'
			ctx.fillRect(-8, -8, 16, 12)
			ctx.strokeRect(-8, -8, 16, 12)

			ctx.restore()

			ctx.restore()
		},

		update() {
			// Физика
			this.velocity += gravity
			this.velocity *= 0.96 // Сопротивление воздуха
			this.y += this.velocity

			// Анимация крыла
			this.wingAngle += 0.2

			// Проверка границ
			if (this.y + this.height > canvas.height - 40) {
				this.y = canvas.height - 40 - this.height
				this.velocity = 0
				endGame()
			}
			if (this.y < 0) {
				this.y = 0
				this.velocity = 0
				endGame()
			}
		},

		flap() {
			this.velocity = this.jumpForce
			this.wingAngle = 0 // Сброс анимации крыла при прыжке
		},
	}

	// Трубы в пиксельном стиле
	let pipes = []
	const pipeWidth = 52
	const pipeGap = 160
	const pipeFrequency = 2400
	let lastPipeTime = 0

	class Pipe {
		constructor() {
			this.x = canvas.width
			this.width = pipeWidth
			this.topHeight =
				Math.floor(Math.random() * (canvas.height - pipeGap - 120)) + 60
			this.bottomY = this.topHeight + pipeGap
			this.passed = false
			this.color = `hsl(${Math.floor(Math.random() * 60) + 100}, 70%, 40%)`
		}

		draw() {
			// Верхняя труба
			ctx.fillStyle = this.color
			ctx.fillRect(this.x, 0, this.width, this.topHeight)
			ctx.strokeRect(this.x, 0, this.width, this.topHeight)

			// Нижняя труба
			ctx.fillRect(
				this.x,
				this.bottomY,
				this.width,
				canvas.height - this.bottomY
			)
			ctx.strokeRect(
				this.x,
				this.bottomY,
				this.width,
				canvas.height - this.bottomY
			)

			// Украшение труб (пиксельный стиль)
			ctx.fillStyle = '#2E7D32'
			ctx.fillRect(this.x - 4, this.topHeight - 16, this.width + 8, 16)
			ctx.strokeRect(this.x - 4, this.topHeight - 16, this.width + 8, 16)

			ctx.fillRect(this.x - 4, this.bottomY, this.width + 8, 16)
			ctx.strokeRect(this.x - 4, this.bottomY, this.width + 8, 16)
		}

		update() {
			this.x -= speed
		}
	}

	// Земля
	const ground = {
		height: 40,
		draw() {
			// Земля
			ctx.fillStyle = '#8B4513'
			ctx.fillRect(0, canvas.height - this.height, canvas.width, this.height)
			ctx.strokeRect(0, canvas.height - this.height, canvas.width, this.height)

			// Трава (пиксельный стиль)
			ctx.fillStyle = '#2E8B57'
			for (let i = 0; i < canvas.width; i += 16) {
				ctx.fillRect(i, canvas.height - this.height - 8, 16, 8)
				ctx.strokeRect(i, canvas.height - this.height - 8, 16, 8)

				// Пиксельные "травки"
				for (let j = 0; j < 3; j++) {
					const offset = Math.sin(i / 20 + j) * 2
					ctx.fillRect(i + 4 + offset, canvas.height - this.height - 16, 2, 8)
					ctx.fillRect(i + 8 + offset, canvas.height - this.height - 12, 2, 4)
				}
			}
		},
	}

	// Управление
	const controls = {
		init() {
			document.addEventListener('keydown', e => {
				if (e.code === 'Space') {
					this.handleInput()
					e.preventDefault()
				}
			})

			canvas.addEventListener('click', this.handleInput)
			canvas.addEventListener('touchstart', this.handleInput)
			restartBtn.addEventListener('click', startGame)
		},

		handleInput() {
			if (!gameRunning) {
				startGame()
			} else {
				bird.flap()
			}
		},
	}

	controls.init()

	// Запуск игры
	function startGame() {
		if (gameRunning) return

		gameRunning = true
		score = 0
		speed = initialSpeed
		bird.y = canvas.height / 2
		bird.velocity = 0
		bird.wingAngle = 0
		pipes = []
		lastPipeTime = 0
		currentScoreDisplay.textContent = score
		startScreen.classList.add('hidden')
		gameOverScreen.classList.add('hidden')

		lastFrameTime = performance.now()
		animationFrameId = requestAnimationFrame(gameLoop)
	}

	// Конец игры
	function endGame() {
		if (!gameRunning) return

		gameRunning = false
		cancelAnimationFrame(animationFrameId)

		if (score > highScore) {
			highScore = score
			localStorage.setItem('pixelFlappyHighScore', highScore)
			highScoreDisplay.textContent = `HI: ${highScore}`
		}

		finalScoreDisplay.textContent = score
		finalHighScoreDisplay.textContent = highScore
		gameOverScreen.classList.remove('hidden')
	}

	// Создание труб
	function createPipe() {
		pipes.push(new Pipe())
	}

	// Обновление игры
	function update(deltaTime) {
		// Увеличение скорости
		speed += gameSpeedIncrease * deltaTime

		// Обновляем птицу
		bird.update()

		// Создание новых труб
		const currentTime = performance.now()
		if (currentTime - lastPipeTime > pipeFrequency) {
			createPipe()
			lastPipeTime = currentTime
		}

		// Обновление труб
		for (let i = 0; i < pipes.length; i++) {
			pipes[i].update()

			// Проверка столкновений
			if (
				bird.x + bird.width > pipes[i].x &&
				bird.x < pipes[i].x + pipes[i].width &&
				(bird.y < pipes[i].topHeight || bird.y + bird.height > pipes[i].bottomY)
			) {
				endGame()
				return
			}

			// Подсчет очков
			if (!pipes[i].passed && pipes[i].x + pipes[i].width < bird.x) {
				pipes[i].passed = true
				score++
				currentScoreDisplay.textContent = score
			}
		}

		// Удаление труб за пределами экрана
		pipes = pipes.filter(pipe => pipe.x + pipe.width > -50)
	}

	// Отрисовка игры
	function draw() {
		// Очистка холста
		ctx.fillStyle = '#70c5ce'
		ctx.fillRect(0, 0, canvas.width, canvas.height)

		// Трубы
		pipes.forEach(pipe => pipe.draw())

		// Земля
		ground.draw()

		// Птица
		bird.draw()

		// Пиксельные тени для глубины
		ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
		for (let i = 0; i < canvas.width; i += 4) {
			ctx.fillRect(i, canvas.height - ground.height - 1, 2, 1)
		}
	}

	// Игровой цикл
	function gameLoop(currentTime) {
		if (!gameRunning) return

		const deltaTime = currentTime - lastFrameTime
		lastFrameTime = currentTime

		update(deltaTime)
		draw()

		animationFrameId = requestAnimationFrame(gameLoop)
	}

	// Анимация птички на стартовом экране
	function animateStartScreen() {
		if (!gameRunning) {
			const time = performance.now() * 0.001
			const y = canvas.height / 2 + Math.sin(time * 2) * 10

			ctx.save()
			ctx.translate(canvas.width / 2 - 12, y - 12)

			// Рисуем птичку для стартового экрана
			ctx.fillStyle = '#f8d347'
			ctx.fillRect(0, 0, 24, 24)
			ctx.strokeRect(0, 0, 24, 24)

			// Глаз
			ctx.fillStyle = '#fff'
			ctx.fillRect(14, 6, 8, 8)
			ctx.strokeRect(14, 6, 8, 8)

			ctx.fillStyle = '#000'
			ctx.fillRect(16, 8, 4, 4)

			// Клюв
			ctx.fillStyle = '#ff9800'
			ctx.beginPath()
			ctx.moveTo(24, 10)
			ctx.lineTo(32, 8)
			ctx.lineTo(32, 14)
			ctx.closePath()
			ctx.fill()
			ctx.stroke()

			ctx.restore()

			requestAnimationFrame(animateStartScreen)
		}
	}

	animateStartScreen()
})
