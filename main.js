const canvas = document.getElementById("game")
const ctx = canvas.getContext('2d')

let lastTime = 0
let gameState = "PLAYING" 
let score = 0
let gameTime = 0

const speed = 500
const shellVelocity = 800
const shellDamage = 10
const clipVisibility = false;

const bulletSound = new Audio("./shoot.mp3")
const hitSound = new Audio("./hit.mp3") 
const deathSound = new Audio("./death.mp3") 

export let maincharacter = {
    x: 0,
    y: 0,
    rad: 40,
    fill: "green",
    stroke: "white",
    direction: 0, 
    tag: "c",
    health: 100,
    maxHealth: 100,
    isDead: false,
    lastTimeBeforeShooting: 0,
    fireRate: 500, 
}

function resizeCanvas() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    maincharacter.x = canvas.width / 2
    maincharacter.y = canvas.height / 2
}
resizeCanvas()

let mouse = { x: 0, y: 0 }
let keys = { w: false, a: false, s: false, d: false, lmb: false }

let bullets = []
let obstacles = []
let enemies = []


let currentRoom = { x: 0, y: 0 }

function loadRoom(roomX, roomY) {
    obstacles = []
    enemies = []
    bullets = []
    currentRoom = { x: roomX, y: roomY }
    
    
    let numObstacles = Math.floor(Math.random() * 4) + 2; 
    for (let i = 0; i < numObstacles; i++) {
        let w = Math.random() * 200 + 50;
        let h = Math.random() * 200 + 50;
        
        
        let obX = Math.random() * (canvas.width - 200) + 100;
        let obY = Math.random() * (canvas.height - 200) + 100;
        
        obstacles.push({
            center: { x: obX, y: obY },
            length: w,
            height: h,
            tag: "o"
        });
    }

    
    let numEnemies = Math.floor(Math.random() * 3) + 1; 
    for (let i = 0; i < numEnemies; i++) {
        enemies.push({
            x: Math.random() * (canvas.width - 100) + 50,
            y: Math.random() * (canvas.height - 100) + 50,
            rad: 40,
            fill: "red",
            stroke: "white",
            direction: 0,
            tag: "c",
            health: 100,
            lastTimeBeforeShooting: 0,
            fireRate: 1000,
            state: "idle",
            aggroRange: 700,
            speed: 150 
        });
    }
}
loadRoom(0, 0) 

function inputHandler() {
    window.addEventListener('keydown', (event) => {
        if (event.key === 'w') keys.w = true
        if (event.key === 'a') keys.a = true
        if (event.key === 's') keys.s = true
        if (event.key === 'd') keys.d = true
        if (event.key === 'p' || event.key === 'Escape') {
            gameState = gameState === "PLAYING" ? "PAUSED" : "PLAYING"
        }
        if (event.key === 'r' && gameState === "GAMEOVER") {
            restartGame()
        }
    })
    window.addEventListener('keyup', (event) => {
        if (event.key === 'w') keys.w = false
        if (event.key === 'a') keys.a = false
        if (event.key === 's') keys.s = false
        if (event.key === 'd') keys.d = false
    })

    window.addEventListener('mousemove', (event) => {
        mouse.x = event.clientX
        mouse.y = event.clientY
    });

    window.addEventListener('mousedown', (event) => {
        if(event.button === 0 && gameState === "PLAYING") {
            const now = performance.now()
            keys.lmb = true;
            if(now - maincharacter.lastTimeBeforeShooting >= maincharacter.fireRate) {                
                if (bulletSound.readyState >= 2) bulletSound.play()
                bullets.push({
                    x: maincharacter.x + maincharacter.rad * Math.cos(maincharacter.direction),
                    y: maincharacter.y + maincharacter.rad * Math.sin(maincharacter.direction),
                    dir: maincharacter.direction,
                    rad: 2,
                    vx: shellVelocity * Math.cos(maincharacter.direction),
                    vy: shellVelocity * Math.sin(maincharacter.direction),
                    owner: "player" 
                })
                maincharacter.lastTimeBeforeShooting = now
            }
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
        if (object === maincharacter) { loadRoom(currentRoom.x - 1, currentRoom.y); maincharacter.x = canvas.width - object.rad - 10; return; }
        object.x = object.rad
    }
    if(object.x + object.rad >= canvas.width) {
        if (object === maincharacter) { loadRoom(currentRoom.x + 1, currentRoom.y); maincharacter.x = object.rad + 10; return; }
        object.x = canvas.width - object.rad
    }
    if(object.y + object.rad >= canvas.height) {
        if (object === maincharacter) { loadRoom(currentRoom.x, currentRoom.y + 1); maincharacter.y = object.rad + 10; return; }
        object.y = canvas.height - object.rad
    }
    if(object.y - object.rad <= 0) {
        if (object === maincharacter) { loadRoom(currentRoom.x, currentRoom.y - 1); maincharacter.y = canvas.height - object.rad - 10; return; }
        object.y = object.rad
    }
}



function checkCollisionWithObject(character, obstacle) {
    const closestX = Math.max(obstacle.center.x - obstacle.length / 2, Math.min(character.x, obstacle.center.x + obstacle.length / 2))
    const closestY = Math.max(obstacle.center.y - obstacle.height / 2, Math.min(character.y, obstacle.center.y + obstacle.height / 2))

    let isColliding = false

    const distanceSq = (closestX - character.x) * (closestX - character.x)  + (closestY - character.y) * (closestY - character.y)
    if (distanceSq <= character.rad * character.rad) isColliding = true

    return isColliding
}

function handleCollisionWithObject(character, obstacle) {
    let isColliding = checkCollisionWithObject(character, obstacle)
    if (!isColliding) return
    const closestX = Math.max(obstacle.center.x - obstacle.length / 2, Math.min(character.x, obstacle.center.x + obstacle.length / 2))
    const closestY = Math.max(obstacle.center.y - obstacle.height / 2, Math.min(character.y, obstacle.center.y + obstacle.height / 2))

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

function checkCollisionWithCharacter(character1, character2) {
    let isColliding = false
    const sqDist = (character1.x - character2.x) * (character1.x - character2.x) + (character1.y - character2.y) * (character1.y - character2.y)
    const sqRad = (character1.rad + character2.rad) * (character1.rad + character2.rad)
    if (sqRad >= sqDist) isColliding = true;
    return isColliding
}

function handleCollisionWithCharacter(character1, character2) {
    let isColliding = checkCollisionWithCharacter(character1, character2) 
    if (!isColliding) return

    const dist = Math.sqrt((character1.x - character2.x) * (character1.x - character2.x) + (character1.y - character2.y) * (character1.y - character2.y))
    let dx = (character1.x - character2.x) / dist
    let dy = (character1.y - character2.y) / dist

    let push = character1.rad + character2.rad - dist

    character1.x += push * dx 
    character1.y += push * dy
}

function handleBulletReflection(obstacle) {
    for(let i = 0; i < bullets.length; i++) {
        let bullet = bullets[i]
        const left = obstacle.center.x - obstacle.length / 2;
        const right = obstacle.center.x + obstacle.length / 2;
        const top = obstacle.center.y - obstacle.height / 2;
        const bottom = obstacle.center.y + obstacle.height / 2;
    
        if (!checkCollisionWithObject(bullet, obstacle)) continue;

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
    
        bullet.x += (bullet.vx / Math.abs(bullet.vx || 1)) * 2;
        bullet.y += (bullet.vy / Math.abs(bullet.vy || 1)) * 2;
    }
}

function handleBulletCollisionWithCharacter(character, bullet) {
    let isColliding = checkCollisionWithCharacter(character, bullet)
    if (!isColliding) return false

    character.health -= shellDamage
    if (hitSound.readyState >= 2) hitSound.play()
    return isColliding
}



function hasLineOfSight(x1, y1, x2, y2) {
    for (let o of obstacles) {
        const left = o.center.x - o.length / 2;
        const right = o.center.x + o.length / 2;
        const top = o.center.y - o.height / 2;
        const bottom = o.center.y + o.height / 2;
        
        if (Math.max(x1, x2) < left || Math.min(x1, x2) > right || Math.max(y1, y2) < top || Math.min(y1, y2) > bottom) continue;
        return false; 
    }
    return true;
}

function enemyBulletFire(e) {
    if (bulletSound.readyState >= 2) bulletSound.play()
    bullets.push({
        x: e.x + e.rad * Math.cos(e.direction),
        y: e.y + e.rad * Math.sin(e.direction),
        dir: e.direction,
        rad: 2,
        vx: shellVelocity * Math.cos(e.direction),
        vy: shellVelocity * Math.sin(e.direction),
        owner: "enemy"
    })
}

function enemyAi(now, deltaTime) {
    for(let i = 0; i < enemies.length; i++) {
        let e = enemies[i]
        
        let dist = Math.sqrt((maincharacter.x - e.x)**2 + (maincharacter.y - e.y)**2)
        let canSee = dist < e.aggroRange && hasLineOfSight(e.x, e.y, maincharacter.x, maincharacter.y)

        if (canSee) {
            e.direction = Math.atan2(maincharacter.y - e.y, maincharacter.x - e.x)
            
            if (dist > 250) {
                
                e.state = "chase"
                e.x += Math.cos(e.direction) * e.speed * deltaTime;
                e.y += Math.sin(e.direction) * e.speed * deltaTime;
            } else {
                
                e.state = "attack"
                if (now - e.lastTimeBeforeShooting >= e.fireRate) {
                    enemyBulletFire(e)
                    e.lastTimeBeforeShooting = now
                }
            }
        } else {
            e.state = "idle" 
        }
    }
}



function update(deltaTime) {
    if (gameState !== "PLAYING") return;
    const now = performance.now()
    gameTime += deltaTime

    if(keys.w) maincharacter.y -= speed * deltaTime
    if(keys.s) maincharacter.y += speed * deltaTime
    if(keys.a) maincharacter.x -= speed * deltaTime
    if(keys.d) maincharacter.x += speed * deltaTime

    updateDirection()
    checkBounds(maincharacter)
    
    
    enemyAi(now, deltaTime)
    
    for(let i = 0; i < obstacles.length; i++) {
        handleCollisionWithObject(maincharacter, obstacles[i])
    }
    
    for (let i = 0; i < enemies.length; i++) {
        handleCollisionWithCharacter(maincharacter, enemies[i])
        for(let j = 0; j < obstacles.length; j++) {
            handleCollisionWithObject(enemies[i], obstacles[j])
        }
    }

    for(let i = 0; i < obstacles.length; i++) {
        handleBulletReflection(obstacles[i])
    }

    for(let i = bullets.length - 1; i >= 0; i--) {
        let bullet = bullets[i];
        bullet.x += bullet.vx * deltaTime;
        bullet.y += bullet.vy * deltaTime;

        if(bullet.owner !== "player" && handleBulletCollisionWithCharacter(maincharacter, bullet)) {
            if(maincharacter.health <= 0) {
                maincharacter.isDead = true
                gameState = "GAMEOVER"
                if(deathSound.readyState >= 2) deathSound.play()
            }
            bullets.splice(i, 1)
            continue;
        }

        let hitEnemy = false;
        if(bullet.owner !== "enemy") {
            for (let j = enemies.length - 1; j >= 0; j--) {
                if(handleBulletCollisionWithCharacter(enemies[j], bullet)) {
                    if (enemies[j].health <= 0) {
                        enemies.splice(j, 1)
                        score += 100
                    }
                    bullets.splice(i, 1)
                    hitEnemy = true;
                    break;
                }
            }
        }
        if (hitEnemy) continue;

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
    ctx.moveTo(x, y)
    ctx.lineTo(x + len * Math.cos(dir), y + len * Math.sin(dir))
    ctx.strokeStyle = "white"
    ctx.stroke()
}

function drawVisibilityCone(angleDegrees) {
    const length = canvas.width
    const halfAngle = (angleDegrees / 2) * (Math.PI / 180)
    const startAngle = maincharacter.direction - halfAngle
    const endAngle = maincharacter.direction + halfAngle
    ctx.beginPath()
    ctx.moveTo(maincharacter.x, maincharacter.y)
    ctx.lineTo(maincharacter.x + length * Math.cos(startAngle), maincharacter.y + length * Math.sin(startAngle))
    ctx.arc(maincharacter.x, maincharacter.y, length, startAngle, endAngle)
    ctx.closePath()
}

function drawHUD() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(0, 0, canvas.width, 40)

    ctx.fillStyle = "white"
    ctx.font = "20px Arial"
    ctx.textAlign = "left"
    ctx.fillText(`Health: ${maincharacter.health}/${maincharacter.maxHealth}`, 20, 28)
    
    ctx.textAlign = "center"
    ctx.fillText(`Time: ${Math.floor(gameTime)}s | Room: [${currentRoom.x}, ${currentRoom.y}]`, canvas.width / 2, 28)
    
    ctx.textAlign = "right"
    ctx.fillText(`Score: ${score}`, canvas.width - 20, 28)

    if (gameState === "PAUSED") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = "white"
        ctx.font = "40px Arial"
        ctx.textAlign = "center"
        ctx.fillText("PAUSED (Press P)", canvas.width / 2, canvas.height / 2)
    } else if (gameState === "GAMEOVER") {
        ctx.fillStyle = "rgba(150, 0, 0, 0.5)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = "white"
        ctx.font = "50px Arial"
        ctx.textAlign = "center"
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20)
        ctx.font = "25px Arial"
        ctx.fillText("Press 'R' to Restart", canvas.width / 2, canvas.height / 2 + 30)
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    
    const angleDegrees = 120
    if (clipVisibility) {
        drawVisibilityCone(angleDegrees)
        ctx.clip()
    }

    ctx.beginPath()
    ctx.fillStyle = "yellow"
    for(let i = 0; i < obstacles.length; i++) {
        let o = obstacles[i]
        ctx.fillRect(o.center.x - o.length/2, o.center.y - o.height/2, o.length, o.height)
        ctx.strokeRect(o.center.x - o.length/2, o.center.y - o.height/2, o.length, o.height)
    }

    ctx.fillStyle = "red"
    for(let i = 0; i < enemies.length; i++) {
        let e = enemies[i]
        ctx.beginPath()
        ctx.arc(e.x, e.y, e.rad, 0, Math.PI * 2)
        ctx.fillStyle = e.fill
        ctx.fill()
        ctx.stroke()
        drawRay(e.x, e.y, e.direction, e.rad)
        ctx.closePath()
    }
    
    ctx.fillStyle = "white"
    for(let i = 0; i < bullets.length; i++) {
        let b = bullets[i]
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.rad, 0, Math.PI * 2)
        ctx.fill()
    }

    ctx.beginPath()
    ctx.fillStyle = "red"
    for(let i = 0; i < enemies.length; i++){
        let enemy = enemies[i]
        ctx.fillRect(enemy.x - enemy.rad, enemy.y - enemy.rad - 25, 2 * enemy.rad * Math.max(0, enemy.health) / 100, 10)
    }

    if (!maincharacter.isDead) {
        ctx.fillStyle = "green"
        ctx.fillRect(maincharacter.x - maincharacter.rad, maincharacter.y - maincharacter.rad - 25, 2 * maincharacter.rad * Math.max(0, maincharacter.health) / maincharacter.maxHealth, 10)

        ctx.restore(); 
        ctx.beginPath()
        ctx.arc(maincharacter.x, maincharacter.y, maincharacter.rad, 0, Math.PI * 2)
        ctx.fillStyle = maincharacter.fill
        ctx.fill()
        ctx.stroke()
        drawRay(maincharacter.x, maincharacter.y, maincharacter.direction, maincharacter.rad)
        ctx.closePath()
    } else {
        ctx.restore()
    }
    
    drawHUD() 
}

function restartGame() {
    maincharacter.health = maincharacter.maxHealth
    maincharacter.isDead = false
    score = 0
    gameTime = 0
    gameState = "PLAYING"
    loadRoom(0, 0)
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