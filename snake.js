"use strict";

var SNAKE = SNAKE || {};

SNAKE.game = function(spec) {
  const FPS_MIN = 8;
  const FPS_MAX = 30;
  const DIR = { left: 'Left', right: 'Right', up: 'Up', down: 'Down'};
  const KEY_CODE = {left: 37, up: 38, right: 39, down: 40, space: 32};

  const canvas = document.getElementById(spec.canvasId || 'canvas');
  const ctx = canvas.getContext('2d');
  const score = document.getElementById(spec.scoreId || 'score');
  const bgColor = spec.bgColor || '#fff';
  const canvasColor = spec.canvasColor || '#ee334d';
  const snakeHeadColor = spec.snakeHeadColor || '#fff';
  const snakeBodyColor = spec.snakeBodyColor || '#fff';
  const foodColor = spec.foodColor || '#fff';
  const chunkWidth = spec.chunkWidth || 40;
  const chunkHeight = spec.chunkHeight || 40;

  var that = {};
  var isPaused = spec.isPaused || false;
  var fps = spec.fps || FPS_MIN;
  var stats = {score: 0};
  var s, f, t;

  that.getFPS = function() { return fps; }
  that.getSnake = function() { return s; }
  that.getFood = function() { return f; }

  that.init = function() {
    // Resize canvas if the game has not started yet
    if (t) return;

    resizeCanvas();
    canvas.style.backgroundColor = canvasColor;
    document.body.style.backgroundColor = bgColor;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var headPos = getRandPos(canvas.width, canvas.height, chunkWidth, chunkHeight);
    var foodPos = getRandPos(canvas.width, canvas.height, chunkWidth, chunkHeight);

    var head = chunk({
      x: headPos.x,
      y: headPos.y,
      width: chunkWidth,
      height: chunkHeight,
      color: snakeHeadColor
    });

    s = snake({
      speed: chunkWidth,
      dir: null,
      queue: [head]
    });

    f = food({
      x: foodPos.x,
      y: foodPos.y,
      width: chunkWidth,
      height: chunkHeight,
      color: foodColor
    });

    // Draw snake and food
    s.draw();
    f.draw();

    score.innerHTML = stats.score;

    // Resize canvas
    window.addEventListener('resize', that.init, false);

    // Key events listener
    window.onkeydown = function(e) {
      var code = e.keyCode ? e.keyCode : e.which;
      var currentDir = s.getDirection();

      switch (code) {
        case KEY_CODE.left: // Left
          if (!currentDir || currentDir === DIR.up || currentDir === DIR.down) s.setDirection(DIR.left);
          break;
        case KEY_CODE.up: // Up
          if (!currentDir || currentDir === DIR.left || currentDir === DIR.right) s.setDirection(DIR.up);
          break;
        case KEY_CODE.right: // Right
          if (!currentDir || currentDir === DIR.up || currentDir === DIR.down) s.setDirection(DIR.right);
          break;
        case KEY_CODE.down: // Down
          if (!currentDir || currentDir === DIR.left || currentDir === DIR.right) s.setDirection(DIR.down);
          break;
        case KEY_CODE.space: // Space
          if (t) that.pause();
        default:

      }

      // Start the game after arrow key is pressed
      if (!t && s.getDirection()) t = new Timer(that.loop, 1000 / that.getFPS);
    }
  }

  that.loop = function() {
    t = new Timer(that.loop, 1000 / fps);

    // Calculate x and y translation by current speed and direction
    var transX = 0, transY = 0;
    var speed = s.getSpeed();
    var oldHead = s.getHead();

    // Boundaries check before apply translation
    // If hit wall, the snake head will appear at the opposite side
    switch (s.getDirection()) {
      case DIR.left:
        if (oldHead.getX() - speed < 0) transX += canvas.width;
        else transX -= speed;
        break;
      case DIR.right:
        if (oldHead.getX() + oldHead.getWidth() + speed > canvas.width) transX -= canvas.width;
        else transX += speed;
        break;
      case DIR.up:
        if (oldHead.getY() - speed < 0) transY += canvas.height;
        else transY -= speed;
        break;
      case DIR.down:
        if (oldHead.getY() + oldHead.getHeight() + speed > canvas.height) transY -= canvas.height;
        else transY += speed;
        break;
      default:

    }

    detectBodyCollision(oldHead, transX, transY);
    detectFoodCollision(oldHead, transX, transY);

    // Add a new head to the queue of chunks
    var newHead = chunk({
      x: oldHead.getX() + transX,
      y: oldHead.getY() + transY,
      width: oldHead.getWidth(),
      height: oldHead.getHeight(),
      color: snakeHeadColor
    });

    s.addHead(newHead);
    newHead.draw();

    // Old head now becomes a part of body
    if (s.getLength() > 1) {
      oldHead.setColor(snakeBodyColor);
      oldHead.draw();
    }
  }

  that.pause = function() {
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

  // Building block of snake body and food
  var chunk = function(spec) {
    var that = {};
    var padding = spec.padding || 2;

    that.getX = function() { return spec.x; }
    that.getY = function() { return spec.y; }
    that.getWidth = function() { return spec.width; }
    that.getHeight = function() { return spec.height; }
    that.getColor = function() { return spec.color; }
    that.setColor = function(color) { spec.color = color; }
    that.draw = function() {
      ctx.fillStyle = spec.color;
      ctx.fillRect(spec.x+padding, spec.y+padding, spec.width-padding*2, spec.height-padding*2);
    };
    that.clear = function() {
      ctx.clearRect(spec.x, spec.y, spec.width, spec.height);
    };
    return that;
  }

  var food = function(spec) {
    var that = chunk(spec);
    var padding = spec.padding || 2;

    that.draw = function() {
      ctx.strokeStyle = spec.color;
      ctx.strokeRect(spec.x+padding, spec.y+padding, spec.width-padding*2, spec.height-padding*2);
      ctx.beginPath();
      ctx.moveTo(spec.x+padding, spec.y+padding);
      ctx.lineTo(spec.x+spec.width-padding, spec.y+spec.height-padding);
      ctx.moveTo(spec.x+spec.width-padding, spec.y+padding);
      ctx.lineTo(spec.x+padding, spec.y+spec.height-padding);
      ctx.closePath();
      ctx.stroke();
    }
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
    that.containsChunk = function(chunk) {
      for (var i = 0; i < spec.queue.length; i++) {
        if (spec.queue[i].getX() === chunk.getX() && spec.queue[i].getY() === chunk.getY()) return true;
      }

      return false;
    }

    return that;
  }

  // Utilities
  var resizeCanvas = function() {
    canvas.width = window.innerWidth - (window.innerWidth % chunkWidth) - chunkWidth;
    canvas.height = window.innerHeight - (window.innerHeight % chunkHeight) - chunkHeight;
  }

  var detectBodyCollision = function(oldHead, transX, transY) {
    for (var i = 0; i < s.getBody().length; i++) {
      var c = s.getBody()[i];
      if (oldHead.getX() + transX == c.getX() && oldHead.getY() + transY == c.getY()) {
        console.log('Ouch!')
        return gameover();
      };
    }
  }

  var detectFoodCollision = function(oldHead, transX, transY) {
    if (oldHead.getX() + transX == f.getX() && oldHead.getY() + transY == f.getY()) {
      console.log('Eat');
      incrementScore();
      incrementFPS();
      f.clear();
      f = makeFood();
      f.draw();
    } else {
      s.removeTail().clear();
    }
  }

  var incrementScore = function() {
    stats.score += 1;
    score.innerHTML = stats.score;
  }

  var incrementFPS = function() {
    if (fps < FPS_MAX) fps += (FPS_MAX/fps)*0.05;
  }

  var makeFood = function() {
    var pos = getRandPos(canvas.width, canvas.height, chunkWidth, chunkHeight);
    var f = food({
      x: pos.x,
      y: pos.y,
      width: chunkWidth,
      height: chunkHeight,
      color: foodColor
    });

    while (s.containsChunk(f)) return makeFood();

    return f;
  }

  var gameover = function() {
    console.log('Game Over');
    t.stop();
    var restart = window.confirm('Play again?');
    if (restart) {
      stats.score = 0;
      t = null;
      fps = FPS_MIN;
      that.init();
    } else {
      window.onkeydown = null;
    }
  }

  function getRandPos(width, height, offsetX, offsetY) {
    var norm = {
      width: width / chunkWidth,
      height: height / chunkHeight,
      offsetX: offsetX / chunkWidth,
      offsetY: offsetY / chunkHeight
    };

    var pos = {
      x: getRandomInt(norm.offsetX, norm.width - norm.offsetX) * chunkWidth,
      y: getRandomInt(norm.offsetY, norm.height - norm.offsetY) * chunkHeight
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
  };

  return that;
}
