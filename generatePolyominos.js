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
   * to the polynomial at the next step.
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
  let xOffset = min(...cells.map(cell => cell[0])))
}


let polyominos = [null];


for (let i = 1; i <= 10; i++) {

}
