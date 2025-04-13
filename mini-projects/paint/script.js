document.addEventListener('DOMContentLoaded', function () {
	const canvas = document.getElementById('canvas')
	const ctx = canvas.getContext('2d')
	const tools = document.querySelectorAll(
		'.toolbar button:not(#clear):not(#save)'
	)
	const colorInput = document.getElementById('color')
	const sizeInput = document.getElementById('size')
	const sizeValue = document.getElementById('size-value')
	const clearBtn = document.getElementById('clear')
	const saveBtn = document.getElementById('save')
	const colorOptions = document.querySelectorAll('.color-option')

	let isDrawing = false
	let currentTool = 'pencil'
	let startX, startY
	let snapshot

	// Установка белого фона
	ctx.fillStyle = 'white'
	ctx.fillRect(0, 0, canvas.width, canvas.height)
	ctx.fillStyle = colorInput.value

	// Выбор инструмента
	tools.forEach(tool => {
		tool.addEventListener('click', function () {
			tools.forEach(t => t.classList.remove('active-tool'))
			this.classList.add('active-tool')
			currentTool = this.id
		})
	})

	// Изменение размера кисти
	sizeInput.addEventListener('input', function () {
		sizeValue.textContent = this.value
	})

	// Быстрый выбор цвета
	colorOptions.forEach(option => {
		option.addEventListener('click', function () {
			colorInput.value = this.getAttribute('data-color')
		})
	})

	// Очистка холста
	clearBtn.addEventListener('click', function () {
		if (confirm('Очистить холст?')) {
			ctx.fillStyle = 'white'
			ctx.fillRect(0, 0, canvas.width, canvas.height)
			ctx.fillStyle = colorInput.value
		}
	})

	// Сохранение изображения
	saveBtn.addEventListener('click', function () {
		const link = document.createElement('a')
		link.download = 'web-paint.png'
		link.href = canvas.toDataURL('image/png')
		link.click()
	})

	// Начало рисования
	canvas.addEventListener('mousedown', startDrawing)
	canvas.addEventListener('touchstart', handleTouchStart)

	// Рисование
	canvas.addEventListener('mousemove', draw)
	canvas.addEventListener('touchmove', handleTouchMove)

	// Окончание рисования
	canvas.addEventListener('mouseup', stopDrawing)
	canvas.addEventListener('mouseout', stopDrawing)
	canvas.addEventListener('touchend', stopDrawing)

	function handleTouchStart(e) {
		e.preventDefault()
		const touch = e.touches[0]
		const mouseEvent = new MouseEvent('mousedown', {
			clientX: touch.clientX,
			clientY: touch.clientY,
		})
		canvas.dispatchEvent(mouseEvent)
	}

	function handleTouchMove(e) {
		e.preventDefault()
		const touch = e.touches[0]
		const mouseEvent = new MouseEvent('mousemove', {
			clientX: touch.clientX,
			clientY: touch.clientY,
		})
		canvas.dispatchEvent(mouseEvent)
	}

	function startDrawing(e) {
		isDrawing = true
		startX = e.offsetX
		startY = e.offsetY

		if (
			currentTool === 'rectangle' ||
			currentTool === 'circle' ||
			currentTool === 'line'
		) {
			snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height)
		}

		ctx.beginPath()
		ctx.moveTo(startX, startY)
		ctx.lineWidth = sizeInput.value
		ctx.strokeStyle = colorInput.value
		ctx.fillStyle = colorInput.value
	}

	function draw(e) {
		if (!isDrawing) return

		const x = e.offsetX
		const y = e.offsetY

		switch (currentTool) {
			case 'pencil':
			case 'brush':
			case 'eraser':
				ctx.lineTo(x, y)
				ctx.strokeStyle = currentTool === 'eraser' ? 'white' : colorInput.value
				ctx.stroke()
				ctx.beginPath()
				ctx.moveTo(x, y)
				break

			case 'line':
				ctx.putImageData(snapshot, 0, 0)
				ctx.beginPath()
				ctx.moveTo(startX, startY)
				ctx.lineTo(x, y)
				ctx.stroke()
				break

			case 'rectangle':
				ctx.putImageData(snapshot, 0, 0)
				ctx.beginPath()
				ctx.rect(startX, startY, x - startX, y - startY)
				ctx.stroke()
				break

			case 'circle':
				ctx.putImageData(snapshot, 0, 0)
				ctx.beginPath()
				const radius = Math.sqrt(
					Math.pow(x - startX, 2) + Math.pow(y - startY, 2)
				)
				ctx.arc(startX, startY, radius, 0, 2 * Math.PI)
				ctx.stroke()
				break

			case 'fill':
				floodFill(x, y, colorInput.value)
				isDrawing = false
				break
		}
	}

	function stopDrawing() {
		isDrawing = false

		if (
			currentTool === 'rectangle' ||
			currentTool === 'circle' ||
			currentTool === 'line'
		) {
			ctx.putImageData(snapshot, 0, 0)
		}
	}

	// Алгоритм заливки
	function floodFill(x, y, fillColor) {
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
		const pixelStack = [[x, y]]
		const targetColor = getPixelColor(imageData, x, y)

		if (targetColor === fillColor) return

		while (pixelStack.length) {
			const [x, y] = pixelStack.pop()

			if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue

			const currentColor = getPixelColor(imageData, x, y)
			if (currentColor !== targetColor) continue

			setPixelColor(imageData, x, y, fillColor)

			pixelStack.push([x + 1, y])
			pixelStack.push([x - 1, y])
			pixelStack.push([x, y + 1])
			pixelStack.push([x, y - 1])
		}

		ctx.putImageData(imageData, 0, 0)
	}

	function getPixelColor(imageData, x, y) {
		const pos = (y * imageData.width + x) * 4
		return [
			imageData.data[pos],
			imageData.data[pos + 1],
			imageData.data[pos + 2],
			imageData.data[pos + 3],
		].join(',')
	}

	function setPixelColor(imageData, x, y, color) {
		const hexColor = color.startsWith('#') ? color : `#${color}`
		const r = parseInt(hexColor.substr(1, 2), 16)
		const g = parseInt(hexColor.substr(3, 2), 16)
		const b = parseInt(hexColor.substr(5, 2), 16)

		const pos = (y * imageData.width + x) * 4
		imageData.data[pos] = r
		imageData.data[pos + 1] = g
		imageData.data[pos + 2] = b
		imageData.data[pos + 3] = 255
	}
})
