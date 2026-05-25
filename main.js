const canvas = document.getElementById("game")
const ctx = canvas.getContext('2d')

let lastTime = 0
const speed = 500


let maincharacter = {
    x: 0,
    y: 0,
    rad: 40,
    fill: "green",
    stroke: "white",
    direction: 0,
}
function resizeCanvas() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    maincharacter.x = canvas.width / 2
    maincharacter.y = canvas.height / 2
}
resizeCanvas()

let obstacle1 = {
    center: {
        x: canvas.width / 4,
        y: canvas.height / 4,
    },
    length: 300,
    height: 100,
}

let mouse = {
    x: 0,
    y: 0,
}

let keys = {
    w: false,
    a: false,
    s: false,
    d: false,
}





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

    window.addEventListener('mousemove', (event) => {
        mouse.x = event.clientX
        mouse.y = event.clientY
    });
}
inputHandler()

function updateDirection() {
    const dy = mouse.y - maincharacter.y;
    const dx = mouse.x - maincharacter.x;
    
    maincharacter.direction = Math.atan2(dy, dx);
    
    if (maincharacter.direction < 0) {
        maincharacter.direction += Math.PI * 2;
    }
}

window.addEventListener('resize', resizeCanvas)

function checkBounds(object) {
    if(object.x - object.rad <= 0) {
        object.x = object.rad
    }
    if(object.x + object.rad >= canvas.width) {
        object.x = canvas.width - object.rad
    }
    if(object.y + object.rad >= canvas.height) {
        object.y = canvas.height - object.rad
    }
    if(object.y - object.rad <= 0) {
        object.y = object.rad
    }
}

function handleCollision(character, obstacle) {
    const closestX = Math.max(obstacle.center.x - obstacle.length / 2, Math.min(character.x, obstacle.center.x + obstacle.length / 2))
    const closestY = Math.max(obstacle.center.y - obstacle.height / 2, Math.min(character.y, obstacle.center.y + obstacle.height / 2))

    let isColliding = false

    const distanceSq = (closestX - character.x) * (closestX - character.x)  + (closestY - character.y) * (closestY - character.y)
    if (distanceSq <= character.rad * character.rad) isColliding = true

    if(character.y > obstacle.center.y + obstacle.height / 2 || character.y < obstacle.center.y - obstacle.height / 2) {
        if (closestY <= character.y && isColliding) {
            character.y = closestY + character.rad
        }
        if (closestY >= character.y && isColliding) {
            character.y = closestY - character.rad
        }
    }
    else {
        if (closestX <= character.x && isColliding) {
            character.x = closestX + character.rad
        }
        if (closestX >= character.x && isColliding) {
            character.x = closestX - character.rad
        }
    }
}

function update(deltaTime) {
    checkBounds(maincharacter)
    if(keys.w) {
        maincharacter.y -= speed * deltaTime
    } 
    if(keys.s){
        maincharacter.y += speed * deltaTime
    }
    if(keys.a) {
        maincharacter.x -= speed * deltaTime
    }
    if(keys.d) {
        maincharacter.x += speed * deltaTime
    }

}

function drawRay(x, y, dir, len) {
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + len * Math.cos(dir), y + len * Math.sin(dir))
    ctx.strokeStyle = "white"
    ctx.stroke()
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.lineWidth = 2

    ctx.strokeRect(0.5, 0.5, canvas.width-0.5, canvas.height-0.5)

    ctx.beginPath()
    ctx.arc(maincharacter.x, maincharacter.y, maincharacter.rad, 0, Math.PI * 2)
    ctx.fillStyle = maincharacter.fill
    ctx.strokeStyle = maincharacter.stroke
    ctx.fill()
    ctx.stroke()
    drawRay(maincharacter.x, maincharacter.y, maincharacter.direction, maincharacter.rad)
    ctx.closePath()

    ctx.beginPath()
    ctx.rect(obstacle1.center.x - (obstacle1.length / 2), obstacle1.center.y - (obstacle1.height / 2), obstacle1.length, obstacle1.height)
    ctx.strokeStyle = "white"
    ctx.fillStyle = "yellow"
    ctx.fill()
    ctx.stroke()
    ctx.closePath()
}

function gameLoop(timeStamp) {
    const deltaTime = (timeStamp - lastTime) / 1000
    lastTime = timeStamp

    update(deltaTime)
    updateDirection()
    handleCollision(maincharacter, obstacle1)
    draw()
    requestAnimationFrame(gameLoop)
}

requestAnimationFrame((timeStamp) => {
    lastTime = timeStamp
    gameLoop(timeStamp)
})