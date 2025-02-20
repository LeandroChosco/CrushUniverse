import Phaser from "phaser";


const config = {
    type: Phaser.AUTO,
    width: 700,
    height: 700,
    parent: "game-container",
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);


const ROWS = 10;
const COLS = 10;
const TILE_SIZE = 70;
const TILE_TYPES = ['tile1', 'tile2', 'tile3', 'tile4', 'tile5', 'tile6'];
const SPECIAL_TILE = 'power1';

let board = [];
let selectedTile = null;
let canMove = true;  
let score = 0;  
let scene;  
let movableBlockType = null; // Bloque habilitado cada 5s
let isDragging = false;



const scoreDisplay = document.getElementById("score-display");
if (scoreDisplay) {
    scoreDisplay.textContent = `Puntaje: ${score}`;
}

function preload() {
    this.load.image('tile1', '/assets/tile1.png');
    this.load.image('tile2', '/assets/tile2.png');
    this.load.image('tile3', '/assets/tile3.png');
    this.load.image('tile4', '/assets/tile4.png');
    this.load.image('tile5', '/assets/tile5.png');
    this.load.image('tile6', '/assets/tile6.png');
    this.load.image(SPECIAL_TILE, '/assets/power1.png');
}

function create() {
    scene = this;
    generateBoard(scene);

    // Inicia la lógica de bloque activo
    pickNewMovableBlockType();
    // Cada 5s cambia el tipo activo
    scene.time.addEvent({
        delay: 3000,
        callback: pickNewMovableBlockType,
        loop: true
    });
}

function update() {}

function highlightMovableBlocks(blockType) {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const tile = board[row][col];
            if (tile && tile.type === blockType) {
                scene.tweens.add({
                    targets: tile,
                    scale: 1.2,
                    duration: 300,
                    ease: 'Power2'
                });
            }
        }
    }
}

function resetScaleToDefault(blockType) {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const tile = board[row][col];
            if (tile && tile.type === blockType) {
                scene.tweens.add({
                    targets: tile,
                    scale: 1,
                    duration: 300,
                    ease: 'Power2'
                });
            }
        }
    }
}


function pickNewMovableBlockType() {
    if (isDragging && selectedTile) {
      revertDraggingTile(selectedTile);
    }
  
    if (movableBlockType) {
      resetScaleToDefault(movableBlockType);
    }

    movableBlockType = Phaser.Math.RND.pick(TILE_TYPES);
  
    highlightMovableBlocks(movableBlockType);
  }
  
  function revertDraggingTile(tile) {
    scene.tweens.add({
      targets: tile,
      x: tile.col * TILE_SIZE + TILE_SIZE / 2,
      y: tile.row * TILE_SIZE + TILE_SIZE / 2,
      duration: 200,
      ease: 'Power2'
    });
  
    selectedTile = null;
    isDragging = false;
  }

/* ---------------------------------------------------------------------
   2) GENERACIÓN DE TABLERO
   --------------------------------------------------------------------- */

function generateBoard(scene) {
    do {
        clearBoard();
        board = [];
        for (let row = 0; row < ROWS; row++) {
            board[row] = [];
            for (let col = 0; col < COLS; col++) {
                addTile(scene, row, col);
            }
        }
    } while (hasInitialMatches());
}

function clearBoard() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row] && board[row][col]) {
                board[row][col].destroy();
            }
        }
    }
}

function hasInitialMatches() {
    return checkAnyMatchInBoard();
}

function addTile(scene, row, col) {
    const tileType = Phaser.Math.RND.pick(TILE_TYPES);
  
    const tile = scene.add.sprite(
      col * TILE_SIZE + TILE_SIZE / 2,
      row * TILE_SIZE + TILE_SIZE / 2,
      tileType
    );
  
    tile.setDisplaySize(TILE_SIZE, TILE_SIZE);
  
    tile.setInteractive();
    scene.input.setDraggable(tile);

    tile.row = row;
    tile.col = col;
    tile.type = tileType;
  

    tile.alpha = 0;
    scene.tweens.add({
      targets: tile,
      alpha: 1,
      duration: 200,
      ease: 'Power2'
    });
  
    tile.on('dragstart', () => {
        if (!canMove) return;
        if (tile.type !== movableBlockType && tile.type !== SPECIAL_TILE) return;
      
        selectedTile = tile;
        isDragging = true;
      });
      
      tile.on('drag', (pointer, dragX, dragY) => {
        if (!canMove) return;
        if (tile.type !== movableBlockType && tile.type !== SPECIAL_TILE) return;
      
        tile.x = dragX;
        tile.y = dragY;
      });
      
      tile.on('dragend', () => {
        if (!canMove) return;
        if (tile.type !== movableBlockType && tile.type !== SPECIAL_TILE) return;
      
        handleTileDrop(tile);
        selectedTile = null;
        isDragging = false;
      });
      
  
    board[row][col] = tile;
  }
  

function handleTileDrop(tile) {
    const closestTile = getClosestTile(tile);
    if (closestTile && areAdjacent(tile, closestTile)) {
        swapTiles(tile, closestTile);
    } else {
        resetTilePosition(tile);
    }
}

function getClosestTile(draggedTile) {
    let minDistance = TILE_SIZE / 2;
    let closestTile = null;
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const tile = board[row][col];
            if (tile && tile !== draggedTile) {
                const distance = Phaser.Math.Distance.Between(
                    draggedTile.x, draggedTile.y,
                    tile.x, tile.y
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    closestTile = tile;
                }
            }
        }
    }
    return closestTile;
}

function areAdjacent(tile1, tile2) {
    return (
        (tile1.row === tile2.row && Math.abs(tile1.col - tile2.col) === 1) ||
        (tile1.col === tile2.col && Math.abs(tile1.row - tile2.row) === 1)
    );
}


function swapTiles(tile1, tile2) {

    const tempRow = tile1.row;
    const tempCol = tile1.col;
    board[tile1.row][tile1.col] = tile2;
    board[tile2.row][tile2.col] = tile1;

    tile1.row = tile2.row;
    tile1.col = tile2.col;
    tile2.row = tempRow;
    tile2.col = tempCol;

    scene.tweens.add({
        targets: tile1,
        x: tile1.col * TILE_SIZE + TILE_SIZE / 2,
        y: tile1.row * TILE_SIZE + TILE_SIZE / 2,
        duration: 200,
        ease: 'Power2'
    });
    scene.tweens.add({
        targets: tile2,
        x: tile2.col * TILE_SIZE + TILE_SIZE / 2,
        y: tile2.row * TILE_SIZE + TILE_SIZE / 2,
        duration: 200,
        ease: 'Power2'
    });


    setTimeout(() => {

        if (tile1.type === SPECIAL_TILE && tile2.type === SPECIAL_TILE) {
            destroyAllBoard();
            return;
        }


        if (checkForPowerSwap(tile1, tile2)) {
            return;
        }


        checkMatches(false);
    }, 300);
}

function resetTilePosition(tile) {
    scene.tweens.add({
        targets: tile,
        x: tile.col * TILE_SIZE + TILE_SIZE / 2,
        y: tile.row * TILE_SIZE + TILE_SIZE / 2,
        duration: 150,
        ease: 'Power2'
    });
}


function checkForPowerSwap(tileA, tileB) {
    const tileAisPower = (tileA.type === SPECIAL_TILE);
    const tileBisPower = (tileB.type === SPECIAL_TILE);
    const tileAisActive = (tileA.type === movableBlockType);
    const tileBisActive = (tileB.type === movableBlockType);


    if (tileAisPower && tileBisActive) {
        destroyAllOfType(movableBlockType, tileA); 
        return true;
    }

    if (tileBisPower && tileAisActive) {
        destroyAllOfType(movableBlockType, tileB);
        return true;
    }
    return false;
}

function destroyAllOfType(targetType, powerTile) {
    canMove = false;


    board[powerTile.row][powerTile.col] = null; 
    score += 10; // Si quieres darle puntaje por usarlo
    scene.tweens.add({
        targets: powerTile,
        alpha: 0,
        scale: 0.3,
        duration: 300,
        onComplete: () => {
            powerTile.destroy();
        }
    });


    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const tile = board[row][col];
            if (tile && tile.type === targetType) {
                board[row][col] = null;
                score += 10;
                scene.tweens.add({
                    targets: tile,
                    alpha: 0,
                    scale: 0.3,
                    duration: 300,
                    onComplete: () => {
                        tile.destroy();
                    }
                });
            }
        }
    }
    if (scoreDisplay) {
        scoreDisplay.textContent = `Puntaje: ${score}`;
    }


    setTimeout(() => {
        dropTiles();
        setTimeout(() => {
            checkMatches(true); 
        }, 400);
    }, 400);
}


function destroyAllBoard() {
    canMove = false;
    let destroyedCount = 0;

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const tile = board[row][col];
            if (tile) {
                board[row][col] = null;
                destroyedCount++;
                scene.tweens.add({
                    targets: tile,
                    alpha: 0,
                    scale: 0.3,
                    duration: 300,
                    onComplete: () => {
                        tile.destroy();
                    }
                });
            }
        }
    }

    score += destroyedCount * 10;
    if (scoreDisplay) {
        scoreDisplay.textContent = `Puntaje: ${score}`;
    }

    setTimeout(() => {
        dropTiles();
        setTimeout(() => {
            checkMatches(true);
        }, 400);
    }, 400);
}

/* ---------------------------------------------------------------------
   5) CHECKMATCHES (maneja combinaciones de 3+, 4 => power, etc.)
   --------------------------------------------------------------------- */

/**
 * @param {boolean} causedByPower - true si la explosión se inició por un power1 (no generar más power1 de 4).
 */
function checkMatches(causedByPower = false) {

    let tilesToDestroy = findMatchedGroupsWithExpansion(causedByPower);
  
    if (tilesToDestroy.length > 0) {
      canMove = false; 
  

      explodeTiles(tilesToDestroy);
  

      setTimeout(() => {
        dropTiles();

        setTimeout(() => {
          checkMatches(causedByPower);
        }, 400);
      }, 400);
  
    } else {

      canMove = true;
    }
  }


function findMatchedGroups() {
    let groups = [];

    for (let row = 0; row < ROWS; row++) {
        let streak = [board[row][0]];
        for (let col = 1; col < COLS; col++) {
            const currentTile = board[row][col];
            if (
                currentTile && 
                streak[0] && 
                currentTile.type === streak[0].type &&

                currentTile.type !== SPECIAL_TILE
            ) {
                streak.push(currentTile);
            } else {
                if (streak.length >= 3) {
                    groups.push(streak);
                }
                streak = [currentTile];
            }
        }
        if (streak.length >= 3) {
            groups.push(streak);
        }
    }


    for (let col = 0; col < COLS; col++) {
        let streak = [board[0][col]];
        for (let row = 1; row < ROWS; row++) {
            const currentTile = board[row][col];
            if (
                currentTile &&
                streak[0] &&
                currentTile.type === streak[0].type &&
                currentTile.type !== SPECIAL_TILE
            ) {
                streak.push(currentTile);
            } else {
                if (streak.length >= 3) {
                    groups.push(streak);
                }
                streak = [currentTile];
            }
        }
        if (streak.length >= 3) {
            groups.push(streak);
        }
    }

    return groups;
}


   function transformTileToPower(tile) {
    tile.setTexture(SPECIAL_TILE);
    tile.type = SPECIAL_TILE;
  

    const baseW = tile.displayWidth;
    const baseH = tile.displayHeight;
  

    scene.tweens.add({
      targets: tile,
      displayWidth: baseW * 1.4,
      displayHeight: baseH * 1.4,
      duration: 200,
      yoyo: true,     
      ease: 'Power2',
      onComplete: () => {

        tile.displayWidth = baseW * 1.2;
        tile.displayHeight = baseH * 1.2;
      }
    });
  }
  


function explodeTiles(tiles) {
    tiles.forEach(tile => {
        if (!tile) return;
        board[tile.row][tile.col] = null;
        score += 10;
        scene.tweens.add({
            targets: tile,
            alpha: 0,
            scale: 0.5,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                tile.destroy();
            }
        });
    });

    if (scoreDisplay) {
        scoreDisplay.textContent = `Puntaje: ${score}`;
    }
}


function dropTiles() {
    for (let col = 0; col < COLS; col++) {
        for (let row = ROWS - 1; row >= 0; row--) {
            if (board[row][col] === null) {
                for (let r = row - 1; r >= 0; r--) {
                    if (board[r][col] !== null) {
                        let tile = board[r][col];
                        board[r][col] = null;
                        board[row][col] = tile;
                        tile.row = row;
                        scene.tweens.add({
                            targets: tile,
                            y: row * TILE_SIZE + TILE_SIZE / 2,
                            duration: 200,
                            ease: 'Power2'
                        });
                        break;
                    }
                }
            }
        }
    }


    for (let col = 0; col < COLS; col++) {
        for (let row = 0; row < ROWS; row++) {
            if (board[row][col] === null) {
                addTile(scene, row, col);
            }
        }
    }
}


function checkAnyMatchInBoard() {
    return findMatchedGroups().length > 0;
}


function findBaseMatches() {
    let groups = [];
  

    for (let row = 0; row < ROWS; row++) {
      let streak = [board[row][0]];
      for (let col = 1; col < COLS; col++) {
        const currentTile = board[row][col];
        if (
          currentTile &&
          streak[0] &&
          currentTile.type === streak[0].type &&
          currentTile.type !== SPECIAL_TILE
        ) {
          streak.push(currentTile);
        } else {
          if (streak.length >= 3) {
            groups.push(streak);
          }
          streak = [currentTile];
        }
      }
      if (streak.length >= 3) {
        groups.push(streak);
      }
    }
  

    for (let col = 0; col < COLS; col++) {
      let streak = [board[0][col]];
      for (let row = 1; row < ROWS; row++) {
        const currentTile = board[row][col];
        if (
          currentTile &&
          streak[0] &&
          currentTile.type === streak[0].type &&
          currentTile.type !== SPECIAL_TILE
        ) {
          streak.push(currentTile);
        } else {
          if (streak.length >= 3) {
            groups.push(streak);
          }
          streak = [currentTile];
        }
      }
      if (streak.length >= 3) {
        groups.push(streak);
      }
    }
  
    return groups;
  }

  function getNeighbors(row, col) {
    let neighbors = [];
  

    if (row > 0 && board[row - 1][col]) {
      neighbors.push(board[row - 1][col]);
    }

    if (row < ROWS - 1 && board[row + 1][col]) {
      neighbors.push(board[row + 1][col]);
    }
  
    if (col > 0 && board[row][col - 1]) {
      neighbors.push(board[row][col - 1]);
    }

    if (col < COLS - 1 && board[row][col + 1]) {
      neighbors.push(board[row][col + 1]);
    }
  
    return neighbors;
  }

  function floodFill(tile) {
    if (!tile) return [];
  
    const targetType = tile.type;
    let queue = [tile];
    let visited = new Set([tile]);
    let result = [tile];
  
    while (queue.length > 0) {
      const current = queue.shift();
      const neighbors = getNeighbors(current.row, current.col);
  
      for (let n of neighbors) {
        if (!visited.has(n) && n.type === targetType) {
          visited.add(n);
          queue.push(n);
          result.push(n);
        }
      }
    }
    return result;
  }

  function findMatchedGroupsWithExpansion(causedByPower = false) {
   
    const baseMatches = findBaseMatches();
   
    let allTilesToDestroy = new Set();
  
    for (let group of baseMatches) {
     
      const tile = group[0];
      if (!tile) continue;
  
      
      const expandedGroup = floodFill(tile);
      for (let t of expandedGroup) {
        allTilesToDestroy.add(t);
      }
    }
  
    return Array.from(allTilesToDestroy);
  }