class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 200;
        this.DRAG = 1000;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -500;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
        this.LIVES = 3;
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 45, 25);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");
        this.tilesetBg = this.map.addTilesetImage("tilemap-backgrounds", "tilemap-backgrounds");

        // Create the background layer first
        this.backGroundLayer = this.map.createLayer("BG", this.tilesetBg, 0, 0);

        // Create other layers
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.killableLayer = this.map.createLayer("Killables", this.tileset, 0, 0);
        this.overlayLayer = this.map.createLayer("Overlays", this.tileset, 0, 0);
        this.waterLayer = this.map.createLayer("Water", this.tileset, 0, 0);
        this.Flag = this.map.createLayer("Flag", this.tileset, 0, 0);

        // Make the ground, killable, and water layers collidable
        this.groundLayer.setCollisionByProperty({ collides: true });
        this.killableLayer.setCollisionByProperty({ collides: true });
        this.waterLayer.setCollisionByProperty({ collides: true });

        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });
        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(90, 100, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // Handle collision detection with coins
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
        });

        // Handle collision detection with killable layer
        this.physics.add.collider(my.sprite.player, this.killableLayer, () => {
            this.scene.restart(); // Restart the scene when player touches the killable layer
        });

        // Handle collision detection with water layer
        this.physics.add.collider(my.sprite.player, this.waterLayer, () => {
            this.loseLife();
        });

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true;
            this.physics.world.debugGraphic.clear();
        }, this);

        // Add movement vfx here
        my.vfx = {};
        // movement vfx
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            scale: { start: 0.03, end: 0.1 },
            lifespan: 350,
            alpha: { start: 1, end: 0.1 },
        });
        my.vfx.walking.stop();

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        // Create an array for the moving platforms
        this.movingPlatforms = [];

        // Define the properties for multiple moving platforms
        const platformProperties = [
            { x: 550, y: 297, minX: 440, maxX: 550 },
            { x: 800, y: 297, minX: 720, maxX: 885 },
            { x: 890, y: 297, minX: 890, maxX: 1050 },
        ];

        // Create moving platform containers
        platformProperties.forEach(props => {
            let container = this.add.container(props.x, props.y);

            // Add individual platform images to the container
            const platform1 = this.add.image(9, 9, "sprite_tiles", "48").setScale(1);
            const platform2 = this.add.image(27, 9, "sprite_tiles", "49").setScale(1);
            const platform3 = this.add.image(45, 9, "sprite_tiles", "50").setScale(1);
            
            container.add([platform1, platform2, platform3]);

            // Enable physics on the container
            this.physics.world.enable(container);
            container.body.setImmovable(true);
            container.body.allowGravity = false;
            container.body.setVelocityX(100);

            // Set container size to match the platforms
            container.body.setSize(54, 18);

            // Enable collision handling for the moving platform container
            this.physics.add.collider(my.sprite.player, container);

            // Store the platform properties and container
            this.movingPlatforms.push({
                container: container,
                minX: props.minX,
                maxX: props.maxX
            });
        });

        // Add lives display
        this.livesText = this.add.text(16, 16, 'Lives: 3', { fontSize: '32px', fill: '#fff' });
        this.livesText.setScrollFactor(0);
        this.livesText.setDepth(10); // Ensure the text is on top of other game objects
    }

    update() {
        // Player controls
        if (cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth / 2 - 10, my.sprite.player.displayHeight / 2 - 5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }

        } else if (cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth / 2 + 10, my.sprite.player.displayHeight / 2 - 5, false);
            my.vfx.walking.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }

        } else {
            my.sprite.player.setAccelerationX(0);
            if (my.sprite.player.body.blocked.down) {
                my.sprite.player.setVelocityX(0); // Stop player on the ground
                my.sprite.player.anims.play('idle');
            }
            my.vfx.walking.stop();
        }

        if (!my.sprite.player.body.blocked.down) {
            my.sprite.player.setDragX(100); // Increase drag while in air
            my.sprite.player.anims.play('jump');
        } else {
            my.sprite.player.setDragX(this.DRAG); // Reset drag when on ground
        }

        if (my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
        }

        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }

        // Update each moving platform container
        this.movingPlatforms.forEach(platform => {
            if (platform.container.x >= platform.maxX) {
                platform.container.body.setVelocityX(-40);
            } else if (platform.container.x <= platform.minX) {
                platform.container.body.setVelocityX(40);
            }
        });
    }

    loseLife() {
        this.LIVES--;
        this.livesText.setText('Lives: ' + this.LIVES);
        if (this.LIVES <= 0) {
            this.scene.restart(); // Restart the scene when out of lives
        } else {
            my.sprite.player.setPosition(90, 100); // Reset player position
        }
    }
}
