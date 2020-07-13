"use strict";

var board = document.getElementById("board");
var root = board.getRootNode();
var next = document.getElementById("next");
var nextNext = document.getElementById("next-next");
var scoreText = document.getElementById("score");
var stageText = document.getElementById("stage");
var startButton = document.getElementById("start-button");
var menu = document.getElementById("menu");
var instructions = document.getElementById("Instructions");
var endingMenu = document.getElementById("ending-menu");
var endingScore = document.getElementById("ending-score");
var endingButton = document.getElementById("ending-button");

var polyominos;
var getPolyominos = new XMLHttpRequest();
getPolyominos.open("GET", "./polyominos.json");
getPolyominos.onreadystatechange = function () {
  if (getPolyominos.readyState == 4 && getPolyominos.status == 200) {
    polyominos = JSON.parse(getPolyominos.responseText);
    activateStart();
  }
};
getPolyominos.send();

var rubble = [];
rubble.initialise = function () {
  // remove any remaining blocks
  var oldRubble = rubble.splice(0, 28);
  for (var rowNum = 0; rowNum < oldRubble.length; rowNum++) {
    for (var i = 0; i < 12; i++) {
      if (oldRubble[rowNum][i]) {
        board.removeChild(oldRubble[rowNum][i]);
      }
    }
  }
  // build rubble
  for (var _rowNum = 0; _rowNum < 28; _rowNum++) {
    var row = [];
    if (_rowNum < 17) {
      for (var _i = 0; _i < 12; _i++) {
        row.push(null);
      }
    } else {
      var rubbleBlocksLeft = _rowNum - 16;
      // We add 11 rubble blocks on the bottom row, 10 on the next row,
      // 9 on the next and so on.
      for (var _i2 = 0; _i2 < 12; _i2++) {
        // randomly either include a rubble block or not, depending on
        // how many rubble blocks are left.
        if (Math.random() * (12 - _i2) < rubbleBlocksLeft) {
          rubbleBlocksLeft--;
          var block = document.createElement("DIV");
          board.appendChild(block);
          block.style.width = "1rem";
          block.style.height = "1rem";
          block.style.position = "absolute";
          block.style.top = _rowNum + "rem";
          block.style.left = _i2 + "rem";
          block.style.backgroundColor = "var(--main-grey)";
          row.push(block);
        } else {
          row.push(null);
        }
      }
    }
    rubble.push(row);
  }
};
rubble.initialise();
rubble.test = function (pol) {
  // returns whether given polyomino is in a clear position
  for (var i = 0; i < pol.size; i++) {
    if (pol.y + pol.cells[i][1] >= 28 || pol.y + pol.cells[i][1] < 0 || pol.x + pol.cells[i][0] >= 12 || pol.x + pol.cells[i][0] < 0 || rubble[pol.y + pol.cells[i][1]][pol.x + pol.cells[i][0]] !== null) {
      return false;
    }
  }
  return true;
};
rubble.clear = function () {
  // Checks for full rows and removes them after brief animation.
  // Animation consists of disappearing rows flashing for 100ms
  var fullRows = [];
  var flashes = [];
  for (var rowNum = 27; rowNum >= 0; rowNum--) {
    if (rubble[rowNum].every(function (value) {
      return value !== null;
    })) {
      fullRows.push(rowNum);
      var flash = document.createElement("DIV");
      board.appendChild(flash);
      flash.style.width = "12rem";
      flash.style.height = "1rem";
      flash.style.position = "absolute";
      flash.style.backgroundColor = "var(--main-cream)";
      flash.style.top = rowNum + "rem";
      flash.style.left = "0";
      flashes.push(flash);
    }
  }
  // Actions to be performed after 100ms: remove flashes and collapse
  // rows.
  setTimeout(function () {
    flashes.forEach(function (flash) {
      return board.removeChild(flash);
    });
    fullRows.forEach(function (rowNum) {
      return rubble.splice(rowNum, 1).pop().forEach(function (block) {
        return board.removeChild(block);
      });
    });
    // insert new empty rows at the top
    for (var j = 0; j < fullRows.length; j++) {
      var newRow = [];
      for (var i = 0; i < 12; i++) {
        newRow.push(null);
      }
      rubble.unshift(newRow);
    }
    // move divs to where they ought to be
    for (var _rowNum2 = 0; _rowNum2 < 28; _rowNum2++) {
      for (var _i3 = 0; _i3 < 12; _i3++) {
        if (rubble[_rowNum2][_i3] !== null) {
          rubble[_rowNum2][_i3].style.top = _rowNum2 + "rem";
        }
      }
    }
  }, 100);
};

var game = {
  _score: 0,
  get score() {
    return this._score;
  },
  set score(value) {
    this._score = value;
    scoreText.innerHTML = value.toString();
  },
  stage: 1,
  _progress: 0,
  get progress() {
    return this._progress;
  },
  set progress(value) {
    this._progress = value;
    // reach 50 for stage 2, 150 = 50 + 100 for stage 3,
    // 300 = 50 + 100 + 150 for stage 4 etc. .
    // This is accomplished by the formula below
    this.stage = 1 + Math.floor(Math.sqrt(value / 25 + 1 / 4) - 1 / 2);
    stageText.innerHTML = this.stage.toString();
  },
  getNextSize: function getNextSize() {
    // function to output the size of the next polyomino
    return 1 + Math.floor(Math.random() * 5);
  }
};

var fallingBlock = {
  divList: [],
  rubblify: function rubblify() {
    // transfer previous divs to rubble
    for (var i = 0; i < this.divList.length; i++) {
      rubble[this.y + this.cells[i][1]][this.x + this.cells[i][0]] = this.divList[i];
    }
  },
  newBlock: function newBlock(pol) {
    // start at the top with a new block
    this.width = pol.width;
    this.height = pol.height;
    this.cells = pol.cells;
    this.size = pol.size;
    this.hue = pol.hue;
    this.y = 0;
    this.x = Math.floor(6 - this.width / 2);
    this.divList = [];
    if (!rubble.test(this)) {
      gameOver();
    } else {
      for (var i = 0; i < this.size; i++) {
        var square = document.createElement("DIV");
        board.appendChild(square);
        square.style.width = "1rem";
        square.style.height = "1rem";
        square.style.position = "absolute";
        square.style.top = this.y + this.cells[i][1] + "rem";
        square.style.left = this.x + this.cells[i][0] + "rem";
        square.style.backgroundColor = "hsl(" + this.hue + ",\n                                       " + this.size + "0%,\n                                       50%)";
        this.divList.push(square);
      }
      setTimeout(function () {
        fallingBlock.fall();
      }, fastFall ? 100 : 500);
    }
  },
  screenUpdate: function screenUpdate() {
    for (var i = 0; i < this.size; i++) {
      var square = this.divList[i];
      square.style.top = this.y + this.cells[i][1] + "rem";
      square.style.left = this.x + this.cells[i][0] + "rem";
    }
  },
  fallen: function fallen() {
    // creates a test polyomino object to see if this can fall
    var pol = new Object();
    pol.width = this.width;
    pol.height = this.height;
    pol.cells = this.cells;
    pol.size = this.size;
    pol.x = this.x;
    pol.y = this.y + 1;
    return pol;
  },
  fall: function fall() {
    var pol = this.fallen();
    if (rubble.test(pol)) {
      this.y += 1;
      this.screenUpdate();
      setTimeout(function () {
        fallingBlock.fall();
      }, fastFall ? 100 : 500);
    } else {
      this.rubblify();
      rubble.clear();
      setTimeout(incrementBlock, 150);
    }
  },
  righted: function righted() {
    // creates a test polyomino object to see if this can move right
    var pol = new Object();
    pol.width = this.width;
    pol.height = this.height;
    pol.cells = this.cells;
    pol.size = this.size;
    pol.x = this.x + 1;
    pol.y = this.y;
    return pol;
  },
  right: function right() {
    var pol = this.righted();
    if (rubble.test(pol)) {
      this.x += 1;
      this.screenUpdate();
    }
  },
  lefted: function lefted() {
    // creates a test polyomino object to see if this can move left
    var pol = new Object();
    pol.width = this.width;
    pol.height = this.height;
    pol.cells = this.cells;
    pol.size = this.size;
    pol.x = this.x - 1;
    pol.y = this.y;
    return pol;
  },
  left: function left() {
    var pol = this.lefted();
    if (rubble.test(pol)) {
      this.x -= 1;
      this.screenUpdate();
    }
  },
  rotated: function rotated() {
    // Creates a test polyomino to see if this can rotate.
    // If the block's height and width differ by at least 2, the new
    // corner is diagonally offset from the old one.
    var diagonalOffset = this.width > this.height ? Math.floor((this.width - this.height) / 2) : -Math.floor((this.height - this.width) / 2);
    var pol = new Object();
    pol.x = this.x + diagonalOffset;
    pol.y = this.y - diagonalOffset;
    pol.width = this.height;
    pol.height = this.width;
    pol.size = this.size;
    pol.cells = this.cells.map(function (cell) {
      return [cell[1], pol.height - cell[0] - 1];
    });
    return pol;
  },
  rotate: function rotate() {
    var pol = this.rotated();
    if (rubble.test(pol)) {
      this.width = pol.width;
      this.height = pol.height;
      this.cells = pol.cells;
      this.x = pol.x;
      this.y = pol.y;
      this.screenUpdate();
    }
  },
  flipped: function flipped() {
    // Creates a test polyomino to see if this can flip.
    var pol = new Object();
    pol.width = this.width;
    pol.height = this.height;
    pol.cells = this.cells.map(function (cell) {
      return [pol.width - 1 - cell[0], cell[1]];
    });
    pol.size = this.size;
    pol.x = this.x;
    pol.y = this.y;
    return pol;
  },
  flip: function flip() {
    var pol = this.flipped();
    if (rubble.test(pol)) {
      this.cells = pol.cells;
      this.screenUpdate();
    }
  }
};

var fastFall = false;
root.addEventListener("keydown", function (event) {
  if (event.keyCode == 40) {
    fastFall = true;
  } else if (event.keyCode == 39) {
    fallingBlock.right();
  } else if (event.keyCode == 37) {
    fallingBlock.left();
  } else if (event.keyCode == 38) {
    fallingBlock.rotate();
  } else if (event.keyCode == 32) {
    fallingBlock.flip();
  }
});
root.addEventListener("keyup", function (event) {
  if (event.keyCode == 40) {
    fastFall = false;
  }
});

var nextBlock = {
  get pol() {
    return this._pol;
  },
  set pol(newPol) {
    this._pol = newPol;
    this.display();
  },
  divList: [],
  display: function display() {
    for (var i = 0; i < this.divList.length; i++) {
      next.removeChild(this.divList[i]);
    }
    this.divList = [];
    for (var _i4 = 0; _i4 < this._pol.size; _i4++) {
      var square = document.createElement("DIV");
      next.appendChild(square);
      square.style.width = "1rem";
      square.style.height = "1rem";
      square.style.position = "absolute";
      square.style.top = 5 - this._pol.height / 2 + this._pol.cells[_i4][1] + "rem";
      square.style.left = 5 - this._pol.width / 2 + this._pol.cells[_i4][0] + "rem";
      square.style.backgroundColor = "hsl(" + this._pol.hue + ",\n                                     " + this._pol.size + "0%,\n                                     50%)";
      this.divList.push(square);
    }
  },
  undisplay: function undisplay() {
    this.divList.forEach(function (square) {
      return next.removeChild(square);
    });
    this.divList = [];
  }
};

var nextNextBlock = {
  get pol() {
    return this._pol;
  },
  set pol(newPol) {
    this._pol = newPol;
    this.display();
  },
  divList: [],
  display: function display() {
    for (var i = 0; i < this.divList.length; i++) {
      nextNext.removeChild(this.divList[i]);
    }
    this.divList = [];
    for (var _i5 = 0; _i5 < this._pol.size; _i5++) {
      var square = document.createElement("DIV");
      nextNext.appendChild(square);
      square.style.width = "0.5rem";
      square.style.height = "0.5rem";
      square.style.position = "absolute";
      square.style.top = 2.5 - this._pol.height / 4 + this._pol.cells[_i5][1] / 2 + "rem";
      square.style.left = 2.5 - this._pol.width / 4 + this._pol.cells[_i5][0] / 2 + "rem";
      square.style.backgroundColor = "hsl(" + this._pol.hue + ",\n                                     " + this._pol.size + "0%,\n                                     50%)";
      this.divList.push(square);
    }
  },
  undisplay: function undisplay() {
    this.divList.forEach(function (square) {
      return nextNext.removeChild(square);
    });
    this.divList = [];
  }
};

function getNextBlock() {
  var size = game.getNextSize();
  return polyominos[size][Math.floor(Math.random() * polyominos[size].length)];
}

function incrementBlock() {
  game.progress += fallingBlock.size;
  game.score += fallingBlock.size;
  fallingBlock.newBlock(nextBlock.pol);
  nextBlock.pol = nextNextBlock.pol;
  nextNextBlock.pol = getNextBlock();
}

function activateStart() {
  startButton.innerHTML = "Start";
  startButton.disabled = false;
  startButton.addEventListener("click", start);
}

function start() {
  menu.style.display = "none";
  fallingBlock.newBlock(getNextBlock());
  nextBlock.pol = getNextBlock();
  nextNextBlock.pol = getNextBlock();
}

function gameOver() {
  endingMenu.style.display = "flex";
  endingScore.innerHTML = "Final score: " + game.score;
}

function goToMenu() {
  rubble.initialise();
  nextBlock.undisplay();
  nextNextBlock.undisplay();
  game.score = 0;
  game.progress = 0;
  endingMenu.style.display = "none";
  menu.style.display = "flex";
}

endingButton.addEventListener("click", goToMenu);