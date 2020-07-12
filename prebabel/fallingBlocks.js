let board = document.getElementById("board");
let root = board.getRootNode();
let next = document.getElementById("next");
let nextNext = document.getElementById("next-next");
let scoreText = document.getElementById("score");
let stageText = document.getElementById("stage");
let startButton = document.getElementById("start-button");
let menu = document.getElementById("menu");
let instructions = document.getElementById("Instructions");

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
for (let rowNum = 0; rowNum < 28; rowNum++) {
  let row = [ ];
  if (rowNum < 17) {
    for (let i = 0; i < 12; i++) {
      row.push(null);
    }
  } else {
    let rubbleBlocksLeft = rowNum - 16;
    // we add 11 rubble blocks on the bottom row, 10 on the next row,
    // 9 on the next and so on
    for (let i = 0; i < 12; i++) {
      // randomly either include a rubble block or not, depending on
      // how many rubble blocks are left.
      if (Math.random()*(12-i) < rubbleBlocksLeft) {
        rubbleBlocksLeft--;
        let block = document.createElement("DIV");
        board.appendChild(block);
        block.style.width = "1rem";
        block.style.height = "1rem";
        block.style.position = "absolute";
        block.style.top = `${rowNum}rem`;
        block.style.left = `${i}rem`;
        block.style.backgroundColor = "var(--main-grey)";
      } else {
        row.push(null);
      }
    }
  }
  rubble.push(row);
}
rubble.test = function(pol) {
  for (let i = 0; i < pol.size; i++) {
    if (rubble[pol.y + pol.cells[i][1]][pol.x + pol.cells[i][0]]) {
      return false;
    }
  }
  return true;
}

let game = {
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
    this.stage = 1 + Math.floor(Math.sqrt(value/25 + 1/4)-1/2)
    stageText.innerHTML = this.stage.toString();
  },
  getNextSize: function() {
    // function to output the size of the next polyomino
    return 1 + Math.floor(Math.random()*5);
  }
}


let fallingBlock = {
  divList: [ ],
  newBlock: function(pol) {
    this.width = pol.width;
    this.height = pol.height;
    this.cells = pol.cells;
    this.size = pol.size;
    this.hue = pol.hue;
    this.y = 0;
    this.x = Math.floor(6 - this.width/2);
    for (let i = 0; i < this.divList.length; i++) {
      board.removeChild(this.divList[i]);
    }
    this.divList = [ ];
    for (let i = 0; i < this.size; i++) {
      let block = document.createElement("DIV");
      board.appendChild(block);
      block.style.width = "1rem";
      block.style.height = "1rem";
      block.style.position = "absolute";
      block.style.top = `${this.y + this.cells[i][1]}rem`;
      block.style.left = `${this.x + this.cells[i][0]}rem`;
      block.style.backgroundColor = `hsl(${this.hue},
                                     ${this.size}0%,
                                     50%)`
      this.divList.push(block);
    }
    setTimeout(this.fall, 500);
  },
  screenUpdate: function() {
    for (let i = 0; i < this.size; i++) {
      block = divList[i];
      block.style.top = `${this.y + this.cells[i][1]}rem`;
      block.style.left = `${this.x + this.cells[i][0]}rem`;
    }
  },
  fallen: function() {
    let pol = new Object();
    pol.width = this.width;
    pol.height = this.height;
    pol.cells = this.cells;
    pol.size = this.size;
    pol.x = this.x;
    pol.y = this.y + 1;
    return pol;
  },
  fall: function() {
    let pol = this.fallen();
    if (rubble.test(pol)) {
      this.y += 1;
      this.screenUpdate()
      setTimeout(this.fall, 500);
    }
  }
}

let nextBlock = {
  _pol: undefined,
  get pol() {
    return this._pol;
  },
  set pol(newPol) {
    this._pol = newPol;
    this.display();
  },
  divList: [ ],
  display: function() {
    for (let i = 0; i < this.divList.length; i++) {
      next.removeChild(this.divList[i]);
    }
    this.divList = [ ];
    for (let i=0; i < this._pol.size; i++) {
      let block = document.createElement("DIV");
      next.appendChild(block);
      block.style.width = "1rem";
      block.style.height = "1rem";
      block.style.position = "absolute";
      block.style.top = `${5 - this._pol.height / 2
                            + this._pol.cells[i][1]}rem`;
      block.style.left = `${5 - this._pol.width / 2
                            + this._pol.cells[i][0]}rem`;
      block.style.backgroundColor = `hsl(${this._pol.hue},
                                     ${this._pol.size}0%,
                                     50%)`
      this.divList.push(block);
    }
  }
}

let nextNextBlock = {
  _pol: undefined,
  get pol() {
    return this._pol;
  },
  set pol(newPol) {
    this._pol = newPol;
    this.display();
  },
  divList: [ ],
  display: function() {
    for (let i = 0; i < this.divList.length; i++) {
      nextNext.removeChild(this.divList[i]);
    }
    this.divList = [ ];
    for (let i=0; i < this._pol.size; i++) {
      let block = document.createElement("DIV");
      nextNext.appendChild(block);
      block.style.width = "0.5rem";
      block.style.height = "0.5rem";
      block.style.position = "absolute";
      block.style.top = `${2.5 - this._pol.height / 4
                            + this._pol.cells[i][1]/2}rem`;
      block.style.left = `${2.5 - this._pol.width / 4
                            + this._pol.cells[i][0]/2}rem`;
      block.style.backgroundColor = `hsl(${this._pol.hue},
                                     ${this._pol.size}0%,
                                     50%)`;
      this.divList.push(block);
    }
  }
}

function getNextBlock() {
  let size = game.getNextSize();
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
