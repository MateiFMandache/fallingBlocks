/**
 * The purpose of this script is to generate a json file containing
 * all the polyominos with up to 10 squares
 */


function includesCell(array, cell) {
  /**
   * returns whether array contains cell.
   * this exists to make up for JavaScript never considering objects
   * equal.
   */
   let arrLength = array.length;
   for (let i = 0; i < arrLength; i++) {
     if (array[i][0] == cell[0] && array[i][1] == cell[1]) return true;
   }
   return false;
}


function polyominoList(included, excluded, possible, size) {
  /**
   * return an array containing all of the polyominos which include the
   * cells listed in included, and exclude the cells listed in excluded,
   * that have the given size. possible is the list of cells greater than
   * (0, 0) lexicographically which are adjacent to an included cell, but
   * not part of excluded. These represent the cells that could be added
   * to the polyomino at the next step.
   */
  if (included.length == size) {
    return [included];
  } else if (possible.length == 0) {
    return [ ];
  } else {
    let newCell = possible.pop();
    // A new cell that can either be included or excluded from our polyomino
    let [x, y] = newCell;
    // Find which cells need to be added to the possible list in the event
    // that the new cell is included
    let furtherCells = [[x - 1, y], [x, y - 1], [x, y + 1], [x + 1, y]];
    let newFurtherCells = furtherCells.filter(cell =>
                                              !(includesCell(included, cell) ||
                                                includesCell(excluded, cell) ||
                                                includesCell(possible, cell) ||
                                                cell[0] < 0 ||
                                                (cell[0] == 0 && cell[1] < 0)));
    return polyominoList(included.concat([newCell]),
                         excluded,
                         possible.concat(newFurtherCells),
                         size)
        .concat(polyominoList(included,
                              excluded.concat([newCell]),
                              possible,
                              size));

  }
}


function Polyomino(cells) {
  let xOffset = Math.min(...cells.map(cell => cell[0]));
  let yOffset = Math.min(...cells.map(cell => cell[1]));
  this.width = Math.max(...cells.map(cell => cell[0])) - xOffset + 1;
  this.height = Math.max(...cells.map(cell => cell[1])) - yOffset + 1;
  this.cells = cells.map(cell => [cell[0] - xOffset, cell[1] - yOffset]);
  this.size = cells.length;
  this.rotate = function() {
    return new Polyomino(this.cells.map(cell => [cell[1], -cell[0]]));
  }
  this.flip = function() {
    return new Polyomino(this.cells.map(cell => [-cell[0], cell[1]]));
  }
  this.toString = function() {
    // First initialise array
    let array = [ ];
    for (let x = 0; x < this.width; x++) {
      let row = [ ];
      for (let y = 0; y < this.height; y++) {
        row.push(false);
      }
      array.push(row);
    }
    // array entries are set to true if there is a cell there
    for (let cellIndex = 0; cellIndex < this.size; cellIndex++) {
      let cell = this.cells[cellIndex];
      array[cell[0]][cell[1]] = true;
    }
    // now we create the string, with . for no cell and o for cell.
    let string = ""
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        string += (array[x][y]) ? "o" : ".";
      }
      string += "\n";
    }
    return string;
  }
  this.dataify = function() {
    // simplifies the object to be ready to put into polyominos.json
    delete this.rotate;
    delete this.flip;
    delete this.toString;
    delete this.dataify;
    return this;
  }
}

// polyominos[i] will be a list containing all the polyominos of size i
// no valid polyominos of size 0
let polyominos = [ [ ] ];

for (let size = 1; size <= 10; size++) {
  // We use an object as a hash table for seeing whther a polyomino
  // has been added or not
  let table = new Object();
  let uniquePolyominos = [ ];
  let fixedPolyominoList = polyominoList([ ], [ ], [[0, 0]], size);
  for (let polIndex = 0; polIndex < fixedPolyominoList.length; polIndex++) {
    let pol = new Polyomino(fixedPolyominoList[polIndex]);
    // if not encoutered so far ...
    if (!table[pol.toString()]) {
      // add to table all transformations of the polyomino
      table[pol.toString()] = true;
      table[pol.rotate().toString()] = true;
      table[pol.rotate().rotate().toString()] = true;
      table[pol.rotate().rotate().rotate().toString()] = true;
      table[pol.flip().toString()] = true;
      table[pol.flip().rotate().toString()] = true;
      table[pol.flip().rotate().rotate().toString()] = true;
      table[pol.flip().rotate().rotate().rotate().toString()] = true;
      // add polyomino to unique list
      uniquePolyominos.push(pol.dataify());
    }
  }
  polyominos.push(uniquePolyominos);
}

let fs = require("fs");
fs.writeFile("./polyominos.json", JSON.stringify(polyominos),
              (err) => { if (err) throw err;});
