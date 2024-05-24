// Load.js
class Load extends Phaser.Scene {
  constructor() {
      super("loadScene");
  }

  preload() {
      this.load.setPath("./assets/");
  
      // Load characters spritesheet
      this.load.atlas("platformer_characters", "tilemap-characters-packed.png", "tilemap-characters-packed.json");
  
      // Load tilemap information
      this.load.image("tilemap_tiles", "tilemap_packed.png");
      this.load.image("tilemap-backgrounds", "tilemap-backgrounds_packed.png");
      this.load.image("tilemap-food", "tilemap_packed_food.png");
      this.load.spritesheet("sprite_tiles", "tilemap_packed.png", { frameWidth: 18, frameHeight: 18 });
      this.load.spritesheet("sprite_tiles_food", "tilemap_packed_food.png", { frameWidth: 18, frameHeight: 18 });
      this.load.tilemapTiledJSON("platformer-level-1", "platformer-level-1.tmj");
      this.load.multiatlas("kenny-particles", "kenny-particles.json");

      // Load the tilemap as a spritesheet
      this.load.spritesheet("tilemap_sheet", "tilemap_packed.png", {
          frameWidth: 18,
          frameHeight: 18
      });

      // Load assets for the main menu
      this.load.image("sprBtnPlay", "sprBtnPlay.png");
      this.load.image("sprBtnPlayHover", "sprBtnPlayHover.png");
      this.load.image("sprBtnPlayDown", "sprBtnPlayDown.png");
      this.load.audio("sndBtnOver", "sndBtnOver.wav");
      this.load.audio("sndBtnDown", "sndBtnDown.wav");
  }

  create() {
      // Transition to the main menu
      this.scene.start("SceneMainMenu");
  }

  update() {}
}
