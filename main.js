const canvas = document.getElementById("game")
const ctx = canvas.getContext('2d')

let lastTime = 0
const speed = 500

function inputHandler() {
    window.addEventListener('keydown', (event) => {
        if (event.key === 'w') keys.w = true
    })
    window.addEventListener('keyup', (event) => {
        if (event.key === 'w') keys.w = false
    })
    window.addEventListener('keydown', (event) => {
        if (event.key === 'a') keys.a = true
    })
    window.addEventListener('keyup', (event) => {
        if (event.key === 'a') keys.a = false
    })
    window.addEventListener('keydown', (event) => {
        if (event.key === 's') keys.s = true
    })
    window.addEventListener('keyup', (event) => {
        if (event.key === 's') keys.s = false
    })
    window.addEventListener('keydown', (event) => {
        if (event.key === 'd') keys.d = true
    })
    window.addEventListener('keyup', (event) => {
        if (event.key === 'd') keys.d = false
    })
}
inputHandler()

let circle = {
    x: 0,
    y: 0,
    rad: 20,
    fill: "green",
    stroke: "white"
}

function resizeCanvas() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    circle.x = canvas.width / 2
    circle.y = canvas.height / 2
}
resizeCanvas()


let worldBorder = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height,
    stroke: "white",
}

let keys = {
    w: false,
    a: false,
    s: false,
    d: false,
}


window.addEventListener('resize', resizeCanvas)

function update(deltaTime) {
    if(keys.w) {
        circle.y -= speed * deltaTime
    } 
    if(keys.s){
        circle.y += speed * deltaTime
    }
    if(keys.a) {
        circle.x -= speed * deltaTime
    }
    if(keys.d) {
        circle.x += speed * deltaTime
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = worldBorder.stroke
    ctx.strokeRect(worldBorder.x, worldBorder.y, worldBorder.width, worldBorder.height)
    ctx.beginPath()
    ctx.arc(circle.x, circle.y, circle.rad, 0, Math.PI * 2)
    ctx.fillStyle = circle.fill
    ctx.strokeStyle = circle.stroke
    ctx.fill()
    ctx.stroke()

}

function gameLoop(timeStamp) {
    const deltaTime = (timeStamp - lastTime) / 1000
    lastTime = timeStamp

    update(deltaTime)
    draw()
    requestAnimationFrame(gameLoop)
}

requestAnimationFrame((timeStamp) => {
    lastTime = timeStamp
    gameLoop(timeStamp)
})