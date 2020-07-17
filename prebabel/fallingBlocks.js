let board = document.getElementById("board");
let root = board.getRootNode();
let next = document.getElementById("next");
let nextNext = document.getElementById("next-next");
let scoreText = document.getElementById("score");
let stageText = document.getElementById("stage");
let startButton = document.getElementById("start-button");
let menu = document.getElementById("menu");
let instructions = document.getElementById("instructions");
let endingMenu = document.getElementById("ending-menu");
let endingScore = document.getElementById("ending-score");
let endingButton = document.getElementById("ending-button");
let instructionsButton = document.getElementById("instructions-button");
let instructions1 = document.getElementById("instructions1");
let instructions2 = document.getElementById("instructions2");
let instructions3 = document.getElementById("instructions3");
let instructionsButton1 = document.getElementById("instructions-button1");
let instructionsButton2 = document.getElementById("instructions-button2");
let pausedDiv = document.getElementById("paused");
let resumeButton = document.getElementById("resume-button");

let fastFall = false;
var paused = false;
var unpauseAction;

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

var rubble = [ ];
rubble.initialise = function() {
  // remove any remaining blocks
  let oldRubble = rubble.splice(0, 28);
  for (let rowNum = 0; rowNum < oldRubble.length; rowNum++) {
    for (let i = 0; i < 12; i++) {
      if (oldRubble[rowNum][i]) {
        board.removeChild(oldRubble[rowNum][i]);
      }
    }
  }
  // build rubble
  for (let rowNum = 0; rowNum < 28; rowNum++) {
    let row = [ ];
    if (rowNum < 17) {
      for (let i = 0; i < 12; i++) {
        row.push(null);
      }
    } else {
      let rubbleBlocksLeft = rowNum - 16;
      // We add 11 rubble blocks on the bottom row, 10 on the next row,
      // 9 on the next and so on.
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
          // Make blocks gradually change from background grey =
          // hsl(0, 0%, (100/3)%) to middle grey = hsl(0, 0%, (150)/3%)
          block.style.background = `linear-gradient(0deg,
                            hsl(0, 0%, ${(150 - 50 * (rowNum-16)/11)/3}%),
                            hsl(0, 0%, ${(150 - 50 * (rowNum-17)/11)/3}%))`;
          row.push(block);
        } else {
          row.push(null);
        }
      }
    }
    rubble.push(row);
  }
}
rubble.initialise();
rubble.test = function(pol) {
  // returns whether given polyomino is in a clear position
  for (let i = 0; i < pol.size; i++) {
    if (pol.y + pol.cells[i][1] >= 28 || pol.y + pol.cells[i][1] < 0 ||
        pol.x + pol.cells[i][0] >= 12 || pol.x + pol.cells[i][0] < 0 ||
        rubble[pol.y + pol.cells[i][1]][pol.x + pol.cells[i][0]] !== null) {
      return false;
    }
  }
  return true;
}
rubble.clear = function() {
  // Checks for full rows and removes them after brief animation.
  // Animation consists of disappearing rows flashing for 100ms
  let fullRows = [ ];
  let flashes = [ ];
  for (let rowNum = 27; rowNum >= 0; rowNum--) {
    if (rubble[rowNum].every(value => value !== null)) {
      fullRows.push(rowNum);
      let flash = document.createElement("DIV");
      board.appendChild(flash);
      flash.style.width = "12rem";
      flash.style.height = "1rem";
      flash.style.position = "absolute";
      flash.style.backgroundColor = "var(--main-cream)";
      flash.style.top = `${rowNum}rem`
      flash.style.left = "0";
      flashes.push(flash);
    }
  }
  game.score += 5 * game.stage * ((fullRows.length)*(fullRows.length + 1)/2);
  // Actions to be performed after 100ms: remove flashes and collapse
  // rows.
  setTimeout(function() {
    flashes.forEach(flash => board.removeChild(flash));
    fullRows.forEach(rowNum =>
      rubble.splice(rowNum, 1).pop().forEach(
        block => board.removeChild(block)
      )
    );
    // insert new empty rows at the top
    for (let j = 0; j < fullRows.length; j++) {
      let newRow = [ ];
      for (let i = 0; i < 12; i++) {
        newRow.push(null);
      }
      rubble.unshift(newRow);
    }
    // move divs to where they ought to be
    for (let rowNum = 0; rowNum < 28; rowNum++) {
      for (let i = 0; i < 12; i++) {
        if (rubble[rowNum][i] !== null) {
          rubble[rowNum][i].style.top = `${rowNum}rem`;
        }
      }
    }
  }, 100);
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
    // Stage 10 is the last stage.
    // This is accomplished by the formula below
    this.stage = Math.min(1 + Math.floor(Math.sqrt(value/25 + 1/4)-1/2), 10)
    stageText.innerHTML = this.stage.toString();
  },
  reset: function() {
    this.score = 0;
    this.progress = 0;
    delete this.lastDifficulty;
    delete this.lastLastDifficulty;
  },
  getNextDifficulty: function() {
    /**
     * Each size is selected based on a difficulty and the current
     * stage number. This function generates the difficulties.
     *
     * Each difficulty is a uniform random variable in [0, 1]. However,
     * they are not chosen independently. After an easier block, harder
     * blocks are more likely and vice versa.
     *
     * The joint probability distribution for two consecutive
     * difficulties X and Y has probability density function
     * 2(x(1-y) + (1-x)y).
     *
     * The joint probability distribution for three consecutive
     * difficulties X, Y and Z has probability density function
     * 8(x^3(1-y)(z-z^3) + (x-x^3)(1-y)z^3
     *   + (1-x-(1-x)^3)y(1-z)^3 + (1-x)^3y(1-z-(1-z)^3))
     *
     * There is no dependence other than this. The sequence of
     * difficulties X_1, X_2, ... satisfies the generalised markov
     * property that (X_n | H) ~ (X_n|X_{n-1}, X_{n-2})
     *
     * We sample from distributions where the pdf is a sum of terms
     * by using the law of total expectation conditioning on an extra
     * case variable, which basically says which part of the sum we are
     * in.
     */

    // We use order statistics to sample from distributions with
    // polynomial pdfs. The ith order statistic out of n has pdf
    // proportional to x^(i-1)(1-x)^(n-i)
    function orderStatistic(n, i) {
      let array = [ ];
      for (let j = 0; j < n; j++) {
        array.push(Math.random());
      }
      array.sort(function(a, b) {return a - b})
      return array[i-1] // translation to match with zero based array
    }

    if (this.lastDifficulty === undefined) {
      // first difficulty in game case. U[0, 1]
      var result = Math.random();
    } else if (this.lastLastDifficulty === undefined) {
      // second difficulty in game case. pdf 2(x(1-y) + (1-x)y)
      // we are selecting Y.
      let x = this.lastDifficulty;
      let caseChooser = Math.random();
      if (caseChooser < x) {
        // 2x(1-y) case
        var result = orderStatistic(2, 1);
      } else {
        // 2(1-x)y case
        var result = orderStatistic(2, 2);
      }
    } else {
      // at least third difficulty in game case.
      // pdf 8(x^3(1-y)(z-z^3) + (x-x^3)(1-y)z^3
      //       + (1-x-(1-x)^3)y(1-z)^3 + (1-x)^3y(1-z-(1-z)^3))
      // we are selecting Z.
      let x = this.lastLastDifficulty;
      let y = this.lastDifficulty;
      let caseChooser = Math.random() * 2 * (x * (1-y) + (1-x) * y);
      if (caseChooser < 2 * (x * (1-y))) {
        // 4(x^3(1-y)(z-z^3) + (x-x^3)(1-y)z^3) cases
        if (caseChooser < 2 * (x**3 * (1-y))) {
          // 4x^3(1-y)(z-z^3) case
          // We split z-z^3 into z-z^2 = z(1-z) and z^2-z^3 = z^2(1-z).
          // The former is twice as big as the latter.
          var result = (Math.random() < 2/3) ?
                        orderStatistic(3, 2) :
                        orderStatistic(4, 3)
        } else {
          // 4(x-x^3)(1-y)z^3) case
          var result = orderStatistic(4, 4);
        }
      } else {
        // 4((1-x-(1-x)^3)y(1-z)^3 + (1-x)^3y(1-z-(1-z)^3)) cases
        if (caseChooser < 2 * (x * (1-y) + (1-x - (1-x) ** 3) * y)) {
          // 4(1-x-(1-x)^3)y(1-z)^3 case
          var result = orderStatistic(4, 1);
        } else {
          // 4(1-x)^3y(1-z-(1-z)^3) case
          // we split 1-z-(1-z)^3 into 1-z-(1-z)^2 = z(1-z) and
          // (1-z)^2-(1-z)^3 = z(1-z)^2. The former is twice as
          // big as the latter
          var result = (Math.random() < 2/3) ?
                        orderStatistic(3, 2) :
                        orderStatistic(4, 2)
        }
      }
    }
    this.lastLastDifficulty = this.lastDifficulty;
    this.lastDifficulty = result;
    return result;
  },
  testRandomness: function(n) {
    // function present for testing purposes only
    let array = [ ];
    for (let i = 0; i < n*10; i++) {
      array.push(this.getNextDifficulty());
    }
    array.sort(function(a, b) {return a-b});
    for (let i = 0; i < 10; i++) {
      console.log(array[n*i]);
    }
  },
  // stageDistributions[n][i] gives the relative frequency of i-square
  // blocks when at stage n
  stageDistributions: [
    [0, 1], // Stage zero doesn't exist, but we give it a value anyway
    [0, 1, 1, 1, 1], // stage 1
    [0, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1],
    [0, 4, 4, 4, 3, 3, 3, 3], // stage 4
    [0, 4, 5, 4, 3, 3, 3, 3, 3],
    [0, 5, 6, 4, 3, 3, 3, 3, 3, 2],
    [0, 6, 7, 5, 3, 3, 3, 3, 3, 2, 2], // stage 7
    [0, 6, 7, 5, 3, 3, 3, 3, 3, 3, 3],
    [0, 5, 6, 4, 3, 3, 3, 3, 3, 3, 3],
    [0, 4, 4, 4, 3, 3, 3, 3, 3, 3, 3] // stage 10 is the last stage
  ],
  getNextSize: function() {
    // Function to output the size of the next polyomino.
    // This is based on a difficultuy and the current stage.
    let difficulty = this.getNextDifficulty();
    let sizeFrequencies = this.stageDistributions[this.stage];
    let totalFrequency = sizeFrequencies.reduce(function(a, b) {return a+b});
    // index is the total frequency of polyominos smaller than the
    // one we want to choose.
    let index = difficulty * totalFrequency;
    let size = 1;
    let total = sizeFrequencies[1];
    while (total < index) {
      size++;
      total += sizeFrequencies[size];
    }
    return size;
  }
}


let fallingBlock = {
  divList: [ ],
  rubblify: function() {
    // transfer previous divs to rubble
    for (let i = 0; i < this.divList.length; i++) {
      rubble[this.y + this.cells[i][1]][this.x + this.cells[i][0]]
        = this.divList[i];
    }
  },
  newBlock: function(pol) {
    // start at the top with a new block
    this.active = true;
    this.width = pol.width;
    this.height = pol.height;
    this.cells = pol.cells;
    this.size = pol.size;
    this.hue = pol.hue;
    this.y = 0;
    this.x = Math.floor(6 - this.width/2);
    this.divList = [ ];
    if (!rubble.test(this)) {
      gameOver();
    } else {
      for (let i = 0; i < this.size; i++) {
        let square = document.createElement("DIV");
        board.appendChild(square);
        square.style.width = "1rem";
        square.style.height = "1rem";
        square.style.position = "absolute";
        square.style.top = `${this.y + this.cells[i][1]}rem`;
        square.style.left = `${this.x + this.cells[i][0]}rem`;
        square.style.backgroundColor = `hsl(${this.hue},
                                       ${this.size}0%,
                                       50%)`
        this.divList.push(square);
      }
      setTimeout(function() {fallingBlock.fall();}, (fastFall) ? 100: 500);
    }
  },
  screenUpdate: function() {
    for (let i = 0; i < this.size; i++) {
      let square = this.divList[i];
      square.style.top = `${this.y + this.cells[i][1]}rem`;
      square.style.left = `${this.x + this.cells[i][0]}rem`;
    }
  },
  fallen: function() {
    // creates a test polyomino object to see if this can fall
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
    if (paused) {
      unpauseAction = "fall";
    } else {
      let pol = this.fallen();
      if (rubble.test(pol)) {
        this.y += 1;
        this.screenUpdate();
        setTimeout(function() {fallingBlock.fall();}, (fastFall) ? 100: 500);
      } else {
        this.active = false;
        this.rubblify();
        rubble.clear();
        setTimeout(incrementBlock, 150);
      }
    }
  },
  righted: function() {
    // creates a test polyomino object to see if this can move right
    let pol = new Object();
    pol.width = this.width;
    pol.height = this.height;
    pol.cells = this.cells;
    pol.size = this.size;
    pol.x = this.x + 1;
    pol.y = this.y;
    return pol;
  },
  right: function() {
    let pol = this.righted();
    if (rubble.test(pol) && this.active) {
      this.x += 1;
      this.screenUpdate();
    }
  },
  lefted: function() {
    // creates a test polyomino object to see if this can move left
    let pol = new Object();
    pol.width = this.width;
    pol.height = this.height;
    pol.cells = this.cells;
    pol.size = this.size;
    pol.x = this.x - 1;
    pol.y = this.y;
    return pol;
  },
  left: function() {
    let pol = this.lefted();
    if (rubble.test(pol) && this.active) {
      this.x -= 1;
      this.screenUpdate();
    }
  },
  rotated: function() {
    // Creates a test polyomino to see if this can rotate.
    // If the block's height and width differ by at least 2, the new
    // corner is diagonally offset from the old one.
    let diagonalOffset = (this.width > this.height) ?
                          Math.floor((this.width - this.height) / 2) :
                          -Math.floor((this.height - this.width) / 2);
    let pol = new Object();
    pol.x = this.x + diagonalOffset;
    pol.y = this.y - diagonalOffset;
    pol.width = this.height;
    pol.height = this.width;
    pol.size = this.size;
    pol.cells = this.cells.map(cell => [cell[1], pol.height - cell[0] - 1])
    return pol;
  },
  rotate: function() {
    let pol = this.rotated();
    if (rubble.test(pol) && this.active) {
      this.width = pol.width;
      this.height = pol.height;
      this.cells = pol.cells;
      this.x = pol.x;
      this.y = pol.y;
      this.screenUpdate();
    }
  },
  flipped: function() {
    // Creates a test polyomino to see if this can flip.
    let pol = new Object();
    pol.width = this.width;
    pol.height = this.height;
    pol.cells = this.cells.map(cell => [pol.width - 1 - cell[0], cell[1]]);
    pol.size = this.size;
    pol.x = this.x;
    pol.y = this.y;
    return pol;
  },
  flip: function() {
    let pol = this.flipped();
    if (rubble.test(pol) && this.active) {
      this.cells = pol.cells;
      this.screenUpdate();
    }
  },
}

function togglePause() {
  if (!paused) {
    paused = true;
    unpauseAction = null;
    pausedDiv.style.display = "flex";
  } else {
    paused = false;
    pausedDiv.style.display = "none";
    if (unpauseAction === "fall") {fallingBlock.fall();}
    else if (unpauseAction === "incrementBlock") {incrementBlock();}
  }
}

resumeButton.addEventListener("click", togglePause);

root.addEventListener("keydown", event => {
  if (event.keyCode == 40) {
    fastFall = true;
  } else if (event.keyCode == 80) {
    togglePause();
  } else if (!paused) {
    if (event.keyCode == 39) {
      fallingBlock.right();
    } else if (event.keyCode == 37) {
      fallingBlock.left();
    } else if (event.keyCode == 38) {
      fallingBlock.rotate();
    } else if (event.keyCode == 32) {
      fallingBlock.flip();
    }
  }
});
root.addEventListener("keyup", event => {
  if (event.keyCode == 40) {
    fastFall = false;
  }
});

let nextBlock = {
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
      let square = document.createElement("DIV");
      next.appendChild(square);
      square.style.width = "1rem";
      square.style.height = "1rem";
      square.style.position = "absolute";
      square.style.top = `${5 - this._pol.height / 2
                            + this._pol.cells[i][1]}rem`;
      square.style.left = `${5 - this._pol.width / 2
                            + this._pol.cells[i][0]}rem`;
      square.style.backgroundColor = `hsl(${this._pol.hue},
                                     ${this._pol.size}0%,
                                     50%)`
      this.divList.push(square);
    }
  },
  undisplay: function() {
    this.divList.forEach(square => next.removeChild(square));
    this.divList = [ ];
  }
}

let nextNextBlock = {
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
      let square = document.createElement("DIV");
      nextNext.appendChild(square);
      square.style.width = "0.5rem";
      square.style.height = "0.5rem";
      square.style.position = "absolute";
      square.style.top = `${2.5 - this._pol.height / 4
                            + this._pol.cells[i][1]/2}rem`;
      square.style.left = `${2.5 - this._pol.width / 4
                            + this._pol.cells[i][0]/2}rem`;
      square.style.backgroundColor = `hsl(${this._pol.hue},
                                     ${this._pol.size}0%,
                                     50%)`;
      this.divList.push(square);
    }
  },
  undisplay: function() {
    this.divList.forEach(square => nextNext.removeChild(square));
    this.divList = [ ];
  }
}

function getNextBlock() {
  let size = game.getNextSize();
  return polyominos[size][Math.floor(Math.random() * polyominos[size].length)];
}

function incrementBlock() {
  if (paused) {
    unpauseAction = "incrementBlock";
  } else {
    game.progress += fallingBlock.size;
    fallingBlock.newBlock(nextBlock.pol);
    nextBlock.pol = nextNextBlock.pol;
    nextNextBlock.pol = getNextBlock();
  }
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
  endingScore.innerHTML = `Final score: ${game.score}`;
}

function goToMenu() {
  rubble.initialise();
  nextBlock.undisplay();
  nextNextBlock.undisplay();
  game.reset();
  endingMenu.style.display = "none";
  menu.style.display = "flex";
}

endingButton.addEventListener("click", goToMenu);

instructionsButton.addEventListener("click", function() {
  menu.style.display = "none";
  instructions.style.display = "block";
  goToInstructionsPage(1);
});

var instructionsPage = 1;

function goToInstructionsPage(page) {
  instructionsPage = page;
  switch (page) {
    case 1:
      instructions1.style.display = "block";
      instructions2.style.display = "none";
      instructions3.style.display = "none";
      instructionsButton2.innerHTML = "Next";
      break;
    case 2:
      instructions1.style.display = "none";
      instructions2.style.display = "block";
      instructions3.style.display = "none";
      instructionsButton2.innerHTML = "Next";
      break;
    case 3:
      instructions1.style.display = "none";
      instructions2.style.display = "none";
      instructions3.style.display = "block";
      instructionsButton2.innerHTML = "Start";
      break;
  }
}

instructionsButton1.addEventListener("click", function() {
  if (instructionsPage > 1) {
    goToInstructionsPage(instructionsPage - 1);
  } else {
    instructions.style.display = "none";
    menu.style.display = "flex";
  }
});

instructionsButton2.addEventListener("click", function() {
  if (instructionsPage < 3) {
    goToInstructionsPage(instructionsPage + 1);
  } else {
    instructions.style.display = "none";
    start();
  }
});
