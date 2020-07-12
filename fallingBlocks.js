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

// initialise the rubble
var rubble = [];
for (var rowNum = 0; rowNum < 28; rowNum++) {
  var row = [];
  if (rowNum < 17) {
    for (var i = 0; i < 12; i++) {
      row.push(null);
    }
  } else {
    var rubbleBlocksLeft = rowNum - 16;
    // we add 11 rubble blocks on the bottom row, 10 on the next row,
    // 9 on the next and so on
    for (var _i = 0; _i < 12; _i++) {
      // randomly either include a rubble block or not, depending on
      // how many rubble blocks are left.
      if (Math.random() * (12 - _i) < rubbleBlocksLeft) {
        rubbleBlocksLeft--;
        var _block = document.createElement("DIV");
        board.appendChild(_block);
        _block.style.width = "1rem";
        _block.style.height = "1rem";
        _block.style.position = "absolute";
        _block.style.top = rowNum + "rem";
        _block.style.left = _i + "rem";
        _block.style.backgroundColor = "var(--main-grey)";
      } else {
        row.push(null);
      }
    }
  }
  rubble.push(row);
}
rubble.test = function (pol) {
  for (var _i2 = 0; _i2 < pol.size; _i2++) {
    if (rubble[pol.y + pol.cells[_i2][1]][pol.x + pol.cells[_i2][0]]) {
      return false;
    }
  }
  return true;
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
  newBlock: function newBlock(pol) {
    this.width = pol.width;
    this.height = pol.height;
    this.cells = pol.cells;
    this.size = pol.size;
    this.hue = pol.hue;
    this.y = 0;
    this.x = Math.floor(6 - this.width / 2);
    for (var _i3 = 0; _i3 < this.divList.length; _i3++) {
      board.removeChild(this.divList[_i3]);
    }
    this.divList = [];
    for (var _i4 = 0; _i4 < this.size; _i4++) {
      var _block2 = document.createElement("DIV");
      board.appendChild(_block2);
      _block2.style.width = "1rem";
      _block2.style.height = "1rem";
      _block2.style.position = "absolute";
      _block2.style.top = this.y + this.cells[_i4][1] + "rem";
      _block2.style.left = this.x + this.cells[_i4][0] + "rem";
      _block2.style.backgroundColor = "hsl(" + this.hue + ",\n                                     " + this.size + "0%,\n                                     50%)";
      this.divList.push(_block2);
    }
    setTimeout(this.fall, 500);
    console.log(this.fall);
  },
  screenUpdate: function screenUpdate() {
    for (var _i5 = 0; _i5 < this.size; _i5++) {
      block = divList[_i5];
      block.style.top = this.y + this.cells[_i5][1] + "rem";
      block.style.left = this.x + this.cells[_i5][0] + "rem";
    }
  },
  fallen: function fallen() {
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
    var pol = this.fall();
    if (rubble.test(pol)) {
      this.y += 1;
      this.screenUpdate();
      setTimeout(this.fall, 500);
    }
  }
};

var nextBlock = {
  _pol: undefined,
  get pol() {
    return this._pol;
  },
  set pol(newPol) {
    this._pol = newPol;
    this.display();
  },
  divList: [],
  display: function display() {
    for (var _i6 = 0; _i6 < this.divList.length; _i6++) {
      next.removeChild(this.divList[_i6]);
    }
    this.divList = [];
    for (var _i7 = 0; _i7 < this._pol.size; _i7++) {
      var _block3 = document.createElement("DIV");
      next.appendChild(_block3);
      _block3.style.width = "1rem";
      _block3.style.height = "1rem";
      _block3.style.position = "absolute";
      _block3.style.top = 5 - this._pol.height / 2 + this._pol.cells[_i7][1] + "rem";
      _block3.style.left = 5 - this._pol.width / 2 + this._pol.cells[_i7][0] + "rem";
      _block3.style.backgroundColor = "hsl(" + this._pol.hue + ",\n                                     " + this._pol.size + "0%,\n                                     50%)";
      this.divList.push(_block3);
    }
  }
};

var nextNextBlock = {
  _pol: undefined,
  get pol() {
    return this._pol;
  },
  set pol(newPol) {
    this._pol = newPol;
    this.display();
  },
  divList: [],
  display: function display() {
    for (var _i8 = 0; _i8 < this.divList.length; _i8++) {
      nextNext.removeChild(this.divList[_i8]);
    }
    this.divList = [];
    for (var _i9 = 0; _i9 < this._pol.size; _i9++) {
      var _block4 = document.createElement("DIV");
      nextNext.appendChild(_block4);
      _block4.style.width = "0.5rem";
      _block4.style.height = "0.5rem";
      _block4.style.position = "absolute";
      _block4.style.top = 2.5 - this._pol.height / 4 + this._pol.cells[_i9][1] / 2 + "rem";
      _block4.style.left = 2.5 - this._pol.width / 4 + this._pol.cells[_i9][0] / 2 + "rem";
      _block4.style.backgroundColor = "hsl(" + this._pol.hue + ",\n                                     " + this._pol.size + "0%,\n                                     50%)";
      this.divList.push(_block4);
    }
  }
};

function getNextBlock() {
  var size = game.getNextSize();
  return polyominos[size][Math.floor(Math.random() * polyominos[size].length)];
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