"use strict";

var board = document.getElementById("board");
var root = board.getRootNode();
var next = document.getElementById("next");
var nextNext = document.getElementById("next-next");
var scoreText = document.getElementById("score");
var stageText = document.getElementById("stage");

var polyominos;
var getPolyominos = new XMLHttpRequest();
getPolyominos.open("GET", "./polyominos.json");
getPolyominos.onreadystatechange = function () {
  if (getPolyominos.readyState == 4 && getPolyominos.status == 200) {
    polyominos = JSON.parse(getPolyominos.responseText);
    start();
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
    for (var _i = 0; _i < 12; _i++) {
      // randomly either include a rubble block or not, depending on
      // how many rubble blocks are left.
      if (Math.random() * (12 - _i) < rubbleBlocksLeft) {
        rubbleBlocksLeft--;
        var block = document.createElement("DIV");
        board.appendChild(block);
        block.style.width = "1rem";
        block.style.height = "1rem";
        block.style.position = "absolute";
        block.style.top = rowNum + "rem";
        block.style.left = _i + "rem";
        block.style.backgroundColor = "hsl(0, 0%, 50%)";
      } else {
        row.push(null);
      }
    }
  }
  rubble.push(row);
}

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
  }
};

root.addEventListener("keydown", function (event) {
  if (event.keyCode === 65) {
    game.score += 10;
    game.progress += 10;
  }
});

function start() {}