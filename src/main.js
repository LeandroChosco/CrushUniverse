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

// Ajustes
const ROWS = 10;
const COLS = 10;
const TILE_SIZE = 70;
const TILE_TYPES = ['tile1', 'tile2', 'tile3', 'tile4', 'tile5'];
const SPECIAL_TILE = 'power1';

let board = [];
let selectedTile = null;
let canMove = true;  
let score = 0;  
let scene;  
let movableBlockType = null; // Bloque habilitado cada 5s
let isDragging = false;


// Opcional: mostrar puntaje en HTML
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

/* ---------------------------------------------------------------------
   1) BLOQUES HABILITADOS CADA 5s
   --------------------------------------------------------------------- */


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
    // Si hay un arrastre en curso, revertimos
    if (isDragging && selectedTile) {
      revertDraggingTile(selectedTile);
    }
  
    // Restaura la escala del tipo anterior
    if (movableBlockType) {
      resetScaleToDefault(movableBlockType);
    }
  
    // Escoge uno nuevo
    movableBlockType = Phaser.Math.RND.pick(TILE_TYPES);
  
    // Destaca el nuevo tipo
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
  
    // “fin” del arrastre
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
    // Selecciona aleatoriamente el tipo de bloque
    const tileType = Phaser.Math.RND.pick(TILE_TYPES);
  
    // Crea el sprite en la posición (col, row) multiplicando por TILE_SIZE
    const tile = scene.add.sprite(
      col * TILE_SIZE + TILE_SIZE / 2,
      row * TILE_SIZE + TILE_SIZE / 2,
      tileType
    );
  
    // Fija el tamaño final de la imagen en (TILE_SIZE x TILE_SIZE)
    tile.setDisplaySize(TILE_SIZE, TILE_SIZE);
  
    // Lo marcamos como interactivo y draggable
    tile.setInteractive();
    scene.input.setDraggable(tile);
  
    // Guarda su posición lógica y tipo
    tile.row = row;
    tile.col = col;
    tile.type = tileType;
  
    // Animación de entrada: con alpha en vez de scale
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
      
  
    // Almacena el tile en la matriz board
    board[row][col] = tile;
  }
  

/* ---------------------------------------------------------------------
   3) INTERCAMBIO DE BLOQUES
   --------------------------------------------------------------------- */
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

/**
 * swapTiles:
 *  - Intercambia en la matriz.
 *  - Si ambos son power1 => destruye todo.
 *  - Si (power1, tileActivo) => destruye todos del tipo activo + power1 consumido.
 *  - Sino => checkMatches(false).
 */
function swapTiles(tile1, tile2) {
    // Intercambio en la matriz
    const tempRow = tile1.row;
    const tempCol = tile1.col;
    board[tile1.row][tile1.col] = tile2;
    board[tile2.row][tile2.col] = tile1;

    tile1.row = tile2.row;
    tile1.col = tile2.col;
    tile2.row = tempRow;
    tile2.col = tempCol;

    // Animación de intercambio
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

    // Tras la animación, verificamos
    setTimeout(() => {
        // Caso 1: 2 power1 => limpia todo
        if (tile1.type === SPECIAL_TILE && tile2.type === SPECIAL_TILE) {
            destroyAllBoard();
            return;
        }

        // Caso 2: power1 + bloque activo => destruye todos de ese tipo + power1
        if (checkForPowerSwap(tile1, tile2)) {
            return;
        }

        // Caso 3: intercambio normal => checamos matches (movimiento directo)
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

/* ---------------------------------------------------------------------
   4) POWER1 LÓGICA
   --------------------------------------------------------------------- */

/**
 * checkForPowerSwap:
 *  - Si tileA es power1 y tileB es tipo activo (o viceversa),
 *    destruye todos del tipo activo + consume el power1.
 *  - Devuelve true si se activó el poder, false en caso contrario.
 */
function checkForPowerSwap(tileA, tileB) {
    const tileAisPower = (tileA.type === SPECIAL_TILE);
    const tileBisPower = (tileB.type === SPECIAL_TILE);
    const tileAisActive = (tileA.type === movableBlockType);
    const tileBisActive = (tileB.type === movableBlockType);

    // Caso 1: tileA = power, tileB = activo
    if (tileAisPower && tileBisActive) {
        destroyAllOfType(movableBlockType, tileA); 
        return true;
    }
    // Caso 2: tileB = power, tileA = activo
    if (tileBisPower && tileAisActive) {
        destroyAllOfType(movableBlockType, tileB);
        return true;
    }
    return false;
}

/**
 * Destruye todos los bloques de un tipo en el tablero, y 
 * consume el power1 que se usó.
 */
function destroyAllOfType(targetType, powerTile) {
    canMove = false;

    // 1) Consumimos el power1
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

    // 2) Recorremos todo el tablero y destruimos todos los de targetType
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

    // Luego caen y checamos matches => causedByPower = true
    setTimeout(() => {
        dropTiles();
        setTimeout(() => {
            checkMatches(true); 
        }, 400);
    }, 400);
}

/**
 * Combinar 2 power1 => limpiar todo el tablero
 */
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
    // Sumar puntaje de todo lo destruido
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
    let result = findMatchedGroupsWithExpansion(causedByPower);
    let tilesToDestroy = result.tilesToDestroy;
    let powerTiles = result.powerTiles;
  
    if (tilesToDestroy.length > 0 || powerTiles.length > 0) {
      canMove = false; // Bloquea mientras explotan
  
      // 1) Transformar en power1 las fichas que correspondan
      powerTiles.forEach(tile => {
        transformTileToPower(tile); // tu función actual
      });
  
      // 2) Destruir el resto
      if (tilesToDestroy.length > 0) {
        explodeTiles(tilesToDestroy); // tu función actual que hace anim y set board[row][col]=null
      }
  
      // 3) Luego dropTiles() y revisamos encadenamientos
      setTimeout(() => {
        dropTiles(); // tu lógica que hace caer fichas y rellena
        setTimeout(() => {
          // Repetimos checkMatches por si se formaron nuevas combinaciones
          checkMatches(causedByPower);
        }, 400);
      }, 400);
  
    } else {
      // No hay más matches => tablero estable
      canMove = true;
    }
  }

/* ---------------------------------------------------------------------
   6) DETECTAR GRUPOS DE 3 O MÁS
   --------------------------------------------------------------------- */
function findMatchedGroups() {
    let groups = [];

    // Horizontales
    for (let row = 0; row < ROWS; row++) {
        let streak = [board[row][0]];
        for (let col = 1; col < COLS; col++) {
            const currentTile = board[row][col];
            if (
                currentTile && 
                streak[0] && 
                currentTile.type === streak[0].type &&
                // Excluimos power1 de hacer match "normal"
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

    // Verticales
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

/* ---------------------------------------------------------------------
   7) CREAR power1
   --------------------------------------------------------------------- */
   function transformTileToPower(tile) {
    tile.setTexture(SPECIAL_TILE);
    tile.type = SPECIAL_TILE;
  
    // Guarda el tamaño base actual:
    const baseW = tile.displayWidth;
    const baseH = tile.displayHeight;
  
    // Ejemplo: pulso a 1.4 y regresa, luego queda en 1.2
    scene.tweens.add({
      targets: tile,
      displayWidth: baseW * 1.4,
      displayHeight: baseH * 1.4,
      duration: 200,
      yoyo: true,      // vuelve al tamaño original tras la animación
      ease: 'Power2',
      onComplete: () => {
        // Al final del pulso, dejamos el tile un poco más grande (1.2)
        tile.displayWidth = baseW * 1.2;
        tile.displayHeight = baseH * 1.2;
      }
    });
  }
  

/* ---------------------------------------------------------------------
   8) EXPLOSIÓN DE TILES
   --------------------------------------------------------------------- */
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

/* ---------------------------------------------------------------------
   9) HACER CAER Y RELLENAR
   --------------------------------------------------------------------- */
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

    // Rellenamos espacios vacíos
    for (let col = 0; col < COLS; col++) {
        for (let row = 0; row < ROWS; row++) {
            if (board[row][col] === null) {
                addTile(scene, row, col);
            }
        }
    }
}

/* ---------------------------------------------------------------------
   10) CHECK SI HAY MATCHES (para hasInitialMatches)
   --------------------------------------------------------------------- */
function checkAnyMatchInBoard() {
    return findMatchedGroups().length > 0;
}


function findBaseMatches() {
    let groups = [];
  
    // Horizontales
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
  
    // Verticales
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
  
    // Arriba
    if (row > 0 && board[row - 1][col]) {
      neighbors.push(board[row - 1][col]);
    }
    // Abajo
    if (row < ROWS - 1 && board[row + 1][col]) {
      neighbors.push(board[row + 1][col]);
    }
    // Izquierda
    if (col > 0 && board[row][col - 1]) {
      neighbors.push(board[row][col - 1]);
    }
    // Derecha
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
    let powerTiles = [];
  
    for (let group of baseMatches) {
      if (group.length >= 3) {
        // Verificamos si EXACTAMENTE 4 y no viene de power
        if (group.length === 4 && !causedByPower) {
          // Escogemos la primera para hacer power
          powerTiles.push(group[0]);
        }
  
        // Flood fill desde el primer tile (podrías floodFill todos, 
        // pero con uno basta en un match normal de 3+)
        const tile = group[0];
        if (!tile) continue;
  
        const expandedGroup = floodFill(tile);
        for (let t of expandedGroup) {
          allTilesToDestroy.add(t);
        }
      }
    }
  
    // Si una tile se vuelve power, NO se destruye
    for (let pTile of powerTiles) {
      if (allTilesToDestroy.has(pTile)) {
        allTilesToDestroy.delete(pTile);
      }
    }
  
    return {
      tilesToDestroy: Array.from(allTilesToDestroy),
      powerTiles: powerTiles
    };
  }