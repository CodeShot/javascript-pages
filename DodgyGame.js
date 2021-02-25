/* global console:false, window:false, document:false */
'use strict';

// Init canvas and context
const canvas = document.getElementById('rityta');
canvas.width = parseInt(window.innerWidth) - 50;
canvas.height = parseInt(window.innerHeight) - 50;
const ctx = canvas.getContext('2d');

// helper function
function getRandomInt(range) {
  return Math.floor(Math.random() * Math.floor(range));
}

class Position {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

// Environment definition for a level
class World {
  // bounds, ballRadiusBounds, velocityBounds must be provided
  constructor(bounds, ballRadiusBounds, velocityBounds, gravitation, friction) {
    // Fall backs to default values if none is provided
    if (typeof gravitation === 'undefined') {
      this.gravitation = 9.82;
    } else {
      this.gravitation = gravitation;
    }

    if (typeof friction === 'undefined') {
      this.friction = 0;
    } else {
      this.friction = friction;
    }

    this.jumpGravitation = 400;
    this.playerVelocity = 300;
    this.jumpVelocity = 400;

    // Set values that must be provided
    this.bounds = bounds;
    this.velocityBounds = velocityBounds;
    this.ballRadiusBounds = ballRadiusBounds;
  }

  clearPlayArea() {
    ctx.fillStyle = 'rgba(255, 255, 255, 255)';
    ctx.fillRect(this.bounds.xMin, this.bounds.yMin,
        this.bounds.xMax - this.bounds.xMin,
        this.bounds.yMax - this.bounds.yMin);
  }
}

// Self contained obstacle definition
class Ball {
  // world object must be provided
  constructor(world) {
    this.world = world;
    this.fallSpeed = 0;
    this.msFlightTime = 0;
    this.radius = this.generateRadius();
    this.velocity = this.generateVelocity();
    this.pos = this.generateStartPosition();
    this.color = this.generateColor();
  }

  // Generate random radius within bounds defined in world object
  generateRadius() {
    const range = this.world.ballRadiusBounds.max -
                  this.world.ballRadiusBounds.min;
    return this.world.ballRadiusBounds.min + getRandomInt(range);
  }
  // Generate random start pos within bounds defined in world object
  generateStartPosition() {
    const range = this.world.bounds.yMax - this.world.bounds.yMin -
                2 * this.radius;
    return new Position(1, this.world.bounds.yMin + getRandomInt(range) +
                        this.radius);
  }
  // Generate random velocity within bounds defined in world object
  generateVelocity() {
    const range = this.world.velocityBounds.max - this.world.velocityBounds.min;
    return this.world.velocityBounds.min + getRandomInt(range);
  }
  // Generate random color within bounds defined in world object
  generateColor() {
    const color = 40 + getRandomInt(160);
    return `rgba(${color}, ${color}, ${color}, 0.5)`;
  }

  // Draw this object to context
  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Calculate one tick of the game
  doOneTick(msDelta) {
    this.msFlightTime += msDelta;
    const sDelta = msDelta / 1000;
    this.pos.x += this.velocity * sDelta;
    this.pos.y += this.fallSpeed * sDelta;
    this.fallSpeed -= this.world.gravitation * sDelta;
    if (this.pos.y - this.radius < 0) {
      this.fallSpeed *= -1;
    }
  }

  // Represent object as a string
  toString() {
    return `r: ${this.radius} color: ${this.color} pos (x,y): ${this.pos.x},
            ${this.pos.y} v: ${this.velocity}`;
  }
}

class Player {
  constructor(name, size, world) {
    this.name = name;
    this.world = world;
    this.size = size;
    this.color = 'rgba(0, 0, 0, 255)';

    this.position = this.setStartPosition();
    this.wayPoint = this.position;
  }

  setStartPosition() {
    return new Position((this.world.bounds.xMax / 2) - (this.size.width / 2),
        this.world.bounds.yMin);
  }

  // Used by event to set way point for movement on mousemove evebt
  setWayPoint(wayPoint) {
    this.wayPoint = this.world.bounds.xMax - wayPoint;
    console.log(this.wayPoint);
  }

  doJump() {
    player.inJump = true;
    player.upVelocity = this.world.jumpVelocity;
  }
  // Used by the game ticker to move player closer to way point
  // this implementation is constant motion without acceleration
  movePlayer(msDelta) {
    if (this.inJump) {
      const sDelta = msDelta / 1000;
      this.upVelocity -= this.world.jumpGravitation * sDelta;
      this.position.y += this.upVelocity * sDelta;
      if (this.upVelocity > 0 &&
          this.position.y + this.size.height > this.world.bounds.yMax) {
        this.upVelocity *= -1;
      }
      if (this.position.y < this.world.bounds.yMin) {
        this.inJump = false;
        this.position.y = 0;
      }
    }
    if (this.wayPoint < this.position.x + this.size.width &&
        this.wayPoint > this.position.x) {
      return;
    }
    const distance = this.wayPoint - this.position.x;
    const movement = this.world.playerVelocity * (msDelta / 1000);
    if (distance < 0) {
      if (this.position.x > this.wayPoint) {
        this.position.x -= movement;
      }
    } else {
      if (this.position.x < this.wayPoint) {
        this.position.x += movement;
      }
    }
  }

  draw() {
    console.log('drawing at: ' + this.position.x, this.position.y);
    ctx.fillStyle = this.color;
    ctx.fillRect(this.position.x, this.position.y,
        this.size.width, this.size.height);
  }
}

// Test function for moving a set of balls generated at with a fixed
// frequency (more or less finished level function)
const animateExpandingBallSet = function(numBalls, animationDelay,
    creationDelay, world) {
  const balls = [];
  const freeSlots = [];
  let ballCount = 0;
  let frameCount = 0;
  let lastDraw = 0;

  // Helper for readability
  const redraw = function(timestamp) {
    const msDelta = timestamp - lastDraw;
    // iterate through collection of balls
    balls.forEach((item, i) => {
      // Elements can be undefined (as we do in-place swapping)
      if (typeof item !== 'undefined') {
        // Destroy balls that go out of bounds
        if (item.pos.x - item.radius > world.bounds.xMax) {
          console.log('ousside');
          freeSlots.push(i);
          balls[i] = undefined;
        } else {
        // Calcultate tick and draw ball
          item.doOneTick(msDelta, world);
          item.draw();
        }
      }
    });
  };

  // Animation function to be iterated with each animation frame of window
  const animate = function(timestamp) {
    // Check if it is time to create a ball
    if (timestamp > (creationDelay * ballCount) && ballCount < numBalls) {
      //  If there are indices with undefined values, use them first
      if (freeSlots.length > 0) balls[freeSlots.pop()] = new Ball(world);
      // Create new array index if no undefined indices found
      else balls.push(new Ball(world));


      ballCount++;
    }
    // Check if it is time to redraw
    if (timestamp > (animationDelay * frameCount)) {
      world.clearPlayArea();
      redraw(timestamp);

      lastDraw = timestamp;
      frameCount++;
    }
    // Keep iterating while there is balls to create (TODO: fix this)
    if (ballCount < numBalls) window.requestAnimationFrame(animate);

    // Dump some info to console log
    else {
      console.log('maximum concurrent balls: ' + balls.length);
      console.log('concurrent balls at end: ' + freeSlots.length);
      console.log('number of balls spawned: ' + ballCount);
    }
  };

  // Start animation, first call
  animate(0);
};

const animatePlayerMotion = function(animationDelay, player, world) {
  let lastDraw = 0;
  let frameCount = 0;

  canvas.addEventListener('mousemove', (e) => {
    player.setWayPoint(e.offsetX);
  });

  canvas.addEventListener('click', (e) => {
    player.doJump();
  });

  const animate = function(timestamp) {
    if (timestamp > (animationDelay * frameCount)) {
      world.clearPlayArea();
      const msDelta = timestamp - lastDraw;
      player.draw();
      player.movePlayer(msDelta);
      lastDraw = timestamp;
      frameCount++;
    }

    window.requestAnimationFrame(animate);
  };

  animate(0);
};

ctx.save();
ctx.translate(canvas.width, canvas.height);
ctx.scale(-1, -1);

// Used to set the level data
// int means integer and parameters enclosed by [] are optional/have default
// fallbacks
// parameters (play area {xMin:v, yMin:int, xMax:int, yMax:int},
//             ball radius bounds {min:int, max:int},
//             ball velocity bounds {min:int, max:int}
//             [gravitaion (default: 9.82)],
//             [friction/resistance (not implemented)])
const world = new World({xMin: 0, yMin: 0,
  xMax: parseInt(canvas.width),
  yMax: parseInt(canvas.height)},
{min: 5, max: 50}, {min: 80, max: 180});

// Test animation of balls without player present, good for level design
// parameters:
// (number of balls, animation tick (ms), ball spawn tick (ms), level reference)
animateExpandingBallSet(100, 25, 1000, world);

// Set the player size and on what level it appears
const player = new Player('RAJSON', {width: 30, height: 60}, world);

// Animate player with mouse whre parameters are:
// (redraw and position update tick (ms), event poll rate, player reference)
// animatePlayerMotion(25, player, world);

// ctx.restore();
