const canvas = document.getElementById("game")
const ctx = canvas.getContext('2d')

let lastTime = 0
const speed = 500
const shellVelocity = 800
const shellDamage = 10

let maincharacter = {
    x: 0,
    y: 0,
    rad: 40,
    fill: "green",
    stroke: "white",
    direction: 0,
    tag: "c",
    health: 100
}

let bullets = []

function resizeCanvas() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    maincharacter.x = canvas.width / 2
    maincharacter.y = canvas.height / 2
}
resizeCanvas()

let mouse = {
    x: 0,
    y: 0,
}

let keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    lmb: false,
}

let obstacles = []

function generateRoom(x, y, w, h, t) {
    let rect1 = {
        center: {
            x: x - w/2 + t/2,
            y: y,
        },
        length: t,
        height: h - t,
        tag: "o"
    }
    let rect2 = {
        center: {
            x: x + w/2 - t/2,
            y: y
        },
        length: t,
        height: h-t,
        tag: "o"
    }
    let rect3 = {
        center: {
            x: x,
            y: y - h/2 + t/2
        },
        length: w,
        height: t,
        tag: "o"
    }
    obstacles.push(rect1, rect2, rect3)
}

generateRoom(canvas.width / 4, canvas.height / 2, 200, 200, 10)
generateRoom(canvas.width / 4 * 3, canvas.height /2, 200, 200, 10)

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

    window.addEventListener('mousedown', (event) => {
        if(event.button === 0) {
            keys.lmb = true;
            
            bullets.push({
                x: maincharacter.x + maincharacter.rad * Math.cos(maincharacter.direction),
                y: maincharacter.y + maincharacter.rad * Math.sin(maincharacter.direction),
                dir: maincharacter.direction,
                rad: 2,
                vx: shellVelocity * Math.cos(maincharacter.direction),
                vy: shellVelocity * Math.sin(maincharacter.direction)
            })
        }
    })
    window.addEventListener('mouseup', (event) => {
        if(event.button === 0) {
            keys.lmb = false;
        }
    })
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


function checkCollision(character, obstacle) {
    const closestX = Math.max(obstacle.center.x - obstacle.length / 2, Math.min(character.x, obstacle.center.x + obstacle.length / 2))
    const closestY = Math.max(obstacle.center.y - obstacle.height / 2, Math.min(character.y, obstacle.center.y + obstacle.height / 2))

    let isColliding = false

    const distanceSq = (closestX - character.x) * (closestX - character.x)  + (closestY - character.y) * (closestY - character.y)
    if (distanceSq <= character.rad * character.rad) isColliding = true

    return isColliding
}

function handleCollision(character, obstacle) {
    const closestX = Math.max(obstacle.center.x - obstacle.length / 2, Math.min(character.x, obstacle.center.x + obstacle.length / 2))
    const closestY = Math.max(obstacle.center.y - obstacle.height / 2, Math.min(character.y, obstacle.center.y + obstacle.height / 2))
    let isColliding = checkCollision(character, obstacle)

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
function handleBulletReflection(obstacle) {
    for(let i = 0; i < bullets.length; i++) {
        let bullet = bullets[i]
        const left = obstacle.center.x - obstacle.length / 2;
        const right = obstacle.center.x + obstacle.length / 2;
        const top = obstacle.center.y - obstacle.height / 2;
        const bottom = obstacle.center.y + obstacle.height / 2;
    
        if (!checkCollision(bullet, obstacle)) continue;
        
        if(obstacle.tag === "c") {
            obstacle.health -= shellDamage
            console.log(`Health: ${obstacle.health}`)
            bullets.splice(i, 1)
            continue
        }

        const distToLeft = Math.abs(bullet.x - left);
        const distToRight = Math.abs(bullet.x - right);
        const distToTop = Math.abs(bullet.y - top);
        const distToBottom = Math.abs(bullet.y - bottom);
    
        const closestWallDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
    
        if (closestWallDist === distToLeft || closestWallDist === distToRight) {
            bullet.vx *= -1; 
        } else {
            bullet.vy *= -1; 
        }
    
    
        // very rough mechanical fix, nudging the bullet by a few pixels outside of the obstacle
        // just so that it doesnt get stuck inside the box and do weird shit
        bullet.x += (bullet.vx / Math.abs(bullet.vx || 1)) * 2;
        bullet.y += (bullet.vy / Math.abs(bullet.vy || 1)) * 2;
    }
}

function handleBulletCollisionWithPlayer(character, bullet) {
    
}

function handleShooting(character) {

}

function update(deltaTime) {
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

    updateDirection()
    checkBounds(maincharacter)
    
    for(let i = 0; i < obstacles.length; i++) {
        handleCollision(maincharacter, obstacles[i])
    }
    

    for(let i = 0; i < obstacles.length; i++) {
        handleBulletReflection(obstacles[i])
    }
    

    // counting backwards to check every element despite the index change due to .splice()
    for(let i = bullets.length - 1; i >= 0; i--) {
        let bullet = bullets[i];
        bullet.x += bullet.vx * deltaTime;
        bullet.y += bullet.vy * deltaTime;

        if (
            bullet.x < 0 || 
            bullet.x > canvas.width || 
            bullet.y < 0 || 
            bullet.y > canvas.height
        ) {
            bullets.splice(i, 1);
        }
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
    for(let i = 0; i < obstacles.length; i++) {
        ctx.rect(obstacles[i].center.x - (obstacles[i].length / 2), obstacles[i].center.y - (obstacles[i].height / 2), obstacles[i].length, obstacles[i].height)
        ctx.strokeStyle = "white"
        ctx.fillStyle = "yellow"
        ctx.fill()
        ctx.stroke()
    }
    ctx.closePath()
    ctx.beginPath()
    ctx.fillStyle = "white"
    for(let i = 0; i < bullets.length; i++) {
        bullet = bullets[i]
        ctx.beginPath()
        ctx.arc(bullet.x, bullet.y, bullet.rad, 0, Math.PI * 2)
        ctx.fill()
        ctx.closePath()
    }
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