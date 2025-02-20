export default class Board {
    constructor(scene, rows, cols) {
        this.scene = scene;
        this.rows = rows;
        this.cols = cols;
        this.tiles = [];

        this.createBoard();
    }

    createBoard() {
        for (let row = 0; row < this.rows; row++) {
            this.tiles[row] = [];
            for (let col = 0; col < this.cols; col++) {
                let tileType = Phaser.Math.Between(1, 3); // 3 tipos de fichas
                let tile = this.scene.add.image(col * 70 + 50, row * 70 + 100, `tile${tileType}`);
                tile.setInteractive();
                this.tiles[row][col] = tile;
            }
        }
    }
}
