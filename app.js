const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const FPS_MAX = 24;
const CHUNK_WIDTH = 40;
const CHUNK_HEIGHT = 40;
const SNAKE_HEAD_COLOR = '#1e6823';
const SNAKE_BODY_COLOR = '#44a340';
const FOOD_COLOR = 'red';
const DIR = {
  left: 'Left',
  right: 'Right',
  up: 'Up',
  down: 'Down'
};

var s, f, t;
var fps = 6;
var isPaused = false;
var stats = {
  score: 0
}

// Building block of snake body and food
var chunk = function(spec) {
  var that = {};

  that.getX = function() { return spec.x; }
  that.getY = function() { return spec.y; }
  that.getWidth = function() { return spec.width; }
  that.getHeight = function() { return spec.height; }
  that.getColor = function() { return spec.color; }
  that.setColor = function(color) { spec.color = color; }
  that.draw = function() {
    ctx.fillStyle = spec.color;
    ctx.fillRect(spec.x, spec.y, spec.width, spec.height);
  };
  that.clear = function() {
    ctx.clearRect(spec.x, spec.y, spec.width, spec.height);
  };
  return that;
}

var food = function(spec) {
  var that = chunk(spec);
  return that;
}

var snake = function(spec) {
  var that = {};

  that.getSpeed = function() { return spec.speed; }
  that.setDirection = function(dir) { spec.dir = dir; }
  that.getDirection = function() { return spec.dir; };
  that.getQueue = function() { return spec.queue; }
  that.getHead = function() { return spec.queue[spec.queue.length-1]; }
  that.getBody = function() { return spec.queue.slice(0, spec.queue.length-1); }
  that.getLength = function() { return spec.queue.length; }
  that.draw = function() {
    console.log(spec.queue.length);
    for (var i = 0; i < spec.queue.length; i++) {
      spec.queue[i].draw();
    }
  };
  that.removeTail = function() {
    return spec.queue.shift();
  }
  that.addHead = function(chunk) {
    spec.queue.push(chunk);
  }

  return that;
}

function init() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  var headPos = getRandPos(canvas.width, canvas.height, CHUNK_WIDTH, CHUNK_HEIGHT);
  var foodPos = getRandPos(canvas.width, canvas.height, CHUNK_WIDTH, CHUNK_HEIGHT);

  var head = chunk({
    x: headPos.x,
    y: headPos.y,
    width: CHUNK_WIDTH,
    height: CHUNK_HEIGHT,
    color: SNAKE_HEAD_COLOR
  });

  // Assuming the snake has at least two chunks
  // at the very beginning
  s = snake({
    speed: CHUNK_WIDTH,
    dir: null,
    queue: [head]
  });

  f = food({
    x: foodPos.x,
    y: foodPos.y,
    width: CHUNK_WIDTH,
    height: CHUNK_HEIGHT,
    color: FOOD_COLOR
  });

  // Draw snake and food
  s.draw();
  f.draw();

  document.getElementById('score').innerHTML = stats.score;
}

function loop() {
  t = new Timer(loop, 1000 / fps);

  f.draw();

  // Calculate x and y translation by current speed and direction
  var transX = 0, transY = 0;
  var speed = s.getSpeed();
  var oldHead = s.getHead();

  // Boundaries check before apply translation
  switch (s.getDirection()) {
    case DIR.left:
      if (oldHead.getX() - speed < 0) return gameover();
      else transX -= speed;
      break;
    case DIR.right:
      if (oldHead.getX() + oldHead.getWidth() + speed > canvas.width) return gameover();
      else transX += speed;
      break;
    case DIR.up:
      if (oldHead.getY() - speed < 0) return gameover();
      else transY -= speed;
      break;
    case DIR.down:
      if (oldHead.getY() + oldHead.getHeight() + speed > canvas.height) return gameover();
      else transY += speed;
      break;
    default:

  }

  // Detect snake body collision
  for (var i = 0; i < s.getBody().length; i++) {
    var c = s.getBody()[i];
    if (oldHead.getX() + transX == c.getX() && oldHead.getY() + transY == c.getY()) {
      console.log('Ouch!')
      return gameover();
    };
  }

  // Detect food collision
  if (oldHead.getX() + transX == f.getX() && oldHead.getY() + transY == f.getY()) {
    console.log('Eat');
    stats.score += 1;
    document.getElementById('score').innerHTML = stats.score;

    // Speed up
    if (fps < FPS_MAX) fps += (FPS_MAX/fps)*0.05;
    f.clear();
    f = makeFood();
    f.draw();
  } else {
    s.removeTail().clear();
  }

  // Add a new head to the queue of chunks
  var newHead = chunk({
    x: oldHead.getX() + transX,
    y: oldHead.getY() + transY,
    width: oldHead.getWidth(),
    height: oldHead.getHeight(),
    color: SNAKE_HEAD_COLOR
  });

  s.addHead(newHead);
  newHead.draw();

  // Old head now becomes a part of body
  if (s.getLength() > 1) {
    oldHead.setColor(SNAKE_BODY_COLOR);
    oldHead.draw();
  }
}

// Generate a new food
function makeFood() {
  var pos = getRandPos(canvas.width, canvas.height, CHUNK_WIDTH, CHUNK_HEIGHT);

  return chunk({
    x: pos.x,
    y: pos.y,
    width: CHUNK_WIDTH,
    height: CHUNK_HEIGHT,
    color: FOOD_COLOR
  });
}

function pause() {
  if (isPaused) {
    console.log('Resume');
    isPaused = false;
    t.resume();
  } else {
    console.log('Pause');
    isPaused = true;
    t.pause();
  }
}

function gameover() {
  console.log('Game Over');
  t.stop();
  var restart = window.confirm('Play again?');
  if (restart) {
    init();
    t = null;
  } else {
    window.onkeydown = null;
  }
}

function getRandPos(width, height, offsetX, offsetY) {
  var norm = {
    width: width/CHUNK_WIDTH,
    height: height/CHUNK_HEIGHT,
    offsetX: offsetX/CHUNK_WIDTH,
    offsetY: offsetY/CHUNK_HEIGHT
  };

  var pos = {
    x: getRandomInt(norm.offsetX, norm.width - norm.offsetX) * CHUNK_WIDTH,
    y: getRandomInt(norm.offsetY, norm.height - norm.offsetY) * CHUNK_HEIGHT
  };

  return pos;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function Timer(callback, delay) {
  var timerId, start, remaining = delay;

  this.pause = function() {
    window.clearTimeout(timerId);
    remaining -= new Date() - start;
  };

  this.resume = function() {
    start = new Date();
    window.clearTimeout(timerId);
    timerId = window.setTimeout(callback, remaining);
  };

  this.stop = function() {
    window.clearTimeout(timerId);
  }

  this.resume();
}

function resizeCanvas() {
  // Only resize canvas before the game start
  if (!t) {
    canvas.width = window.innerWidth - (window.innerWidth % CHUNK_WIDTH) - CHUNK_WIDTH;
    canvas.height = window.innerHeight - (window.innerHeight % CHUNK_HEIGHT) - CHUNK_HEIGHT*2;
    init();
  }
}

// Key events listener
window.onkeydown = function(e) {
  var code = e.keyCode ? e.keyCode : e.which;
  var currentDir = s.getDirection();

  switch (code) {
    case 37: // Left
      if (!currentDir || currentDir === DIR.up || currentDir === DIR.down) s.setDirection(DIR.left);
      break;
    case 38: // Up
      if (!currentDir || currentDir === DIR.left || currentDir === DIR.right) s.setDirection(DIR.up);
      break;
    case 39: // Right
      if (!currentDir || currentDir === DIR.up || currentDir === DIR.down) s.setDirection(DIR.right);
      break;
    case 40: // Down
      if (!currentDir || currentDir === DIR.left || currentDir === DIR.right) s.setDirection(DIR.down);
      break;
    case 32: // Space
      if (t) pause();
    default:

  }

  // Start the game after arrow key is pressed
  if (!t && s.getDirection()) t = new Timer(loop, 1000 / fps);
}

window.addEventListener('resize', resizeCanvas, false);

resizeCanvas();
