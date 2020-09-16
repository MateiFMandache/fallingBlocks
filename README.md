# Falling Blocks
A tetris variant featuring increasingly complicated block shapes. To play, follow the following steps:
 - Download the files or clone the repository
 - [Install node](https://nodejs.org/)
 - Run quizServer.js. To do this, you need to use the command line. Go to the directory where server.js is and type "node server.js" into the command line
 - Open a browser and go to localhost:1234
 
 # Instructions
 
 Blocks will fall down the screen. Your objective is to place them neatly so that full rows are completed. When a full row is completed it disappears and you win some points. Move blocks sideways using the left and right arrow keys. Rotate blocks using the up arrow key and flip them using the spacebar. The down arrow key makes blocks fall faster. Press p to pause. As you play, you will progress to further stages. This means trickier blocks will come which are harder to place. Good luck and have fun!

# Extra info

In normal tetris, the game gets harder as you progress by having the blocks fall faster. The motivation behind this game is to make a variant of tetris in which the game gets harder as you progress by giving you more complicated blocks. The set of blocks used in falling blocks is all polyominos with up to 10 squares. Note that, unlike in normal tetris, a block and its mirror image are considered the same since the player has the ability to flip blocks. The total number of blocks used is 6473, far more than the 7 used in normal tetris. For this reason, a script generatePolyominos.js is used to generate a json file containing the details of all the blocks.

In order to improve the player's experience, consecutive blocks are not chosen independently. After trickier blocks, easier blocks are more likely and vice versa. The next block's size is chosen from a distribution dependent on the previous two block sizes. For more details, see the source code of the getNextDifficulty function in fallingBlocks.js. This feature encourages the player to plan ahead by using easy blocks to prepare for upcoming tricky blocks.

The game does not start with an empty field, but rather has some "starting rubble" that the player can try to clear. This feature was chosen to make the early game more interesting for experienced players.
