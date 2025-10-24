// Bunny Runner - 3D Endless Runner Game
// A cute, addictive game for your bestie! 🐰✨

class BunnyRunnerGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.bunny = null;
        this.world = [];
        this.obstacles = [];
        this.collectibles = [];
        this.particles = [];
        
        this.gameState = 'loading'; // loading, menu, playing, paused, gameOver
        this.score = 0;
        this.bestScore = this.getBestScore();
        this.speed = 0.15;
        this.baseSpeed = 0.15;
        this.speedIncrement = 0.002;
        this.jumpVelocity = 0;
        this.isJumping = false;
        this.jumpPower = 0.3;
        this.gravity = 0.015;
        
        // Difficulty settings
        this.selectedDifficulty = 'medium';
        this.difficultyConfig = {
            easy: {
                name: 'Relaxed Garden Stroll',
                icon: '🌸',
                baseSpeed: 0.10,
                acceleration: 0.001,
                maxSpeed: 0.20,
                obstacleInterval: [2500, 3500],
                collectibleInterval: [1500, 2500]
            },
            medium: {
                name: 'Happy Run',
                icon: '💕',
                baseSpeed: 0.15,
                acceleration: 0.002,
                maxSpeed: 0.35,
                obstacleInterval: [1000, 2000],
                collectibleInterval: [2000, 4000]
            },
            hard: {
                name: 'Speed Bunny Challenge',
                icon: '⚡',
                baseSpeed: 0.22,
                acceleration: 0.003,
                maxSpeed: 0.50,
                obstacleInterval: [800, 1500],
                collectibleInterval: [3000, 5000]
            }
        };
        
        this.lanes = [-2, 0, 2]; // Three lanes
        this.currentLane = 1; // Start in middle lane
        this.targetLanePosition = 0;
        
        this.worldLength = 100;
        this.worldPosition = 0;
        
        this.keys = {};
        this.lastObstacleZ = -10;
        this.lastCollectibleZ = -5;
        
        // Obstacle spawning system
        this.obstacleSpawnTimer = 0;
        this.nextObstacleSpawnTime = 1500; // Base interval in ms
        this.lastObstacleSpawnTime = 0;
        this.obstacleSpawnDistance = 50; // Distance ahead of player to spawn
        this.obstacleRemovalDistance = -20; // Distance behind player to remove
        this.maxObstacles = 20; // Maximum obstacles in scene
        this.totalObstaclesSpawned = 0;
        
        // Collectible spawning system - FIX FOR CONTINUOUS SPAWNING
        this.collectibleSpawnTimer = 0;
        this.nextCollectibleSpawnTime = 2500; // Base interval in ms
        this.lastCollectibleSpawnTime = 0;
        this.collectibleSpawnDistance = 45; // Distance ahead of player to spawn
        this.collectibleRemovalDistance = -20; // Distance behind player to remove
        this.maxCollectibles = 15; // Maximum collectibles in scene
        this.totalCollectiblesSpawned = 0;
        
        this.clock = new THREE.Clock();
        this.frameCount = 0;
        
        // Audio setup
        this.audioListener = null;
        this.backgroundMusic = null;
        this.soundEffects = {};
        this.audioEnabled = false;
        this.musicEnabled = true;
        
        // Combo system
        this.comboCount = 0;
        this.comboTimer = 0;
        this.comboTimeout = 3000; // 3 seconds to maintain combo
        this.lastComboTime = 0;
        
        // Milestone tracking
        this.lastMilestone = 0;
        this.milestones = [100, 250, 500, 750, 1000, 1500, 2000, 3000, 5000];
        
        this.init();
    }
    
    async init() {
        await this.loadingSequence();
        this.setupThreeJS();
        this.setupAudio();
        this.createWorld();
        this.createBunny();
        this.setupLights();
        this.setupEventListeners();
        this.setupTouchControls();
        this.setupDifficultySelector();
        this.showMainMenu();
        this.animate();
    }
    
    async loadingSequence() {
        const loadingProgress = document.getElementById('loading-progress');
        
        for (let i = 0; i <= 100; i += 5) {
            loadingProgress.style.width = i + '%';
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        document.getElementById('loading-screen').classList.add('hidden');
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setupThreeJS() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 10, 50);
        
        // Camera with responsive FOV
        const aspectRatio = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(
            aspectRatio < 1 ? 85 : 75, // Higher FOV for portrait mode
            aspectRatio,
            0.1,
            1000
        );
        
        // Adjust camera position based on screen ratio
        if (aspectRatio < 0.8) { // Portrait mode
            this.camera.position.set(0, 6, 8);
            this.camera.lookAt(0, 0, -3);
        } else {
            this.camera.position.set(0, 4, 6);
            this.camera.lookAt(0, 0, -5);
        }
        
        // Renderer
        const canvas = document.getElementById('game-canvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas, 
            antialias: window.devicePixelRatio < 2 // Disable on high-DPI for performance
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Mobile optimizations
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (this.isMobile) {
            // Reduce shadow quality on mobile
            this.renderer.shadowMap.type = THREE.BasicShadowMap;
        }
        
        // Handle resize with debouncing
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 100);
        });
    }
    
    setupAudio() {
        // Create audio listener
        this.audioListener = new THREE.AudioListener();
        this.camera.add(this.audioListener);
        
        // Create background music
        this.backgroundMusic = new THREE.Audio(this.audioListener);
        
        // Create high-quality sound effects using Web Audio API
        this.createSoundEffects();
        
        // Setup background music
        this.setupBackgroundMusic();
    }
    
    createSoundEffects() {
        // Create better quality sound effects using oscillators and filters
        const audioContext = this.audioListener.context;
        
        this.soundEffects = {
            jump: () => this.playBoingSound(),
            collect: () => this.playChimeSound(),
            gameOver: () => this.playAwwSound(),
            milestone: () => this.playCelebrationSound()
        };
    }
    
    playBoingSound() {
        if (!this.audioEnabled) return;
        const audioContext = this.audioListener.context;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.2);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }
    
    playChimeSound() {
        if (!this.audioEnabled) return;
        const audioContext = this.audioListener.context;
        
        // Create magical sparkle chime with multiple tones
        const frequencies = [800, 1000, 1200, 1600];
        
        frequencies.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.05);
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime + index * 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.2, audioContext.currentTime + index * 0.05 + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.05 + 0.3);
            
            oscillator.start(audioContext.currentTime + index * 0.05);
            oscillator.stop(audioContext.currentTime + index * 0.05 + 0.3);
        });
    }
    
    playAwwSound() {
        if (!this.audioEnabled) return;
        const audioContext = this.audioListener.context;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(200, audioContext.currentTime + 0.5);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }
    
    playCelebrationSound() {
        if (!this.audioEnabled) return;
        const audioContext = this.audioListener.context;
        
        // Create exciting celebration sound with ascending notes
        const frequencies = [400, 500, 600, 800, 1000];
        
        frequencies.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + index * 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.1 + 0.3);
            
            oscillator.start(audioContext.currentTime + index * 0.1);
            oscillator.stop(audioContext.currentTime + index * 0.1 + 0.3);
        });
    }
    
    setupBackgroundMusic() {
        // Create a cute, upbeat background melody using oscillators
        // This will be a simple but pleasant melody that loops
        this.startBackgroundMusic();
    }
    
    startBackgroundMusic() {
        if (!this.audioEnabled || !this.musicEnabled) return;
        
        this.stopBackgroundMusic();
        this.playBackgroundMelody();
        
        // Loop the melody every 8 seconds
        this.musicLoopInterval = setInterval(() => {
            if (this.musicEnabled && this.audioEnabled) {
                this.playBackgroundMelody();
            }
        }, 8000);
    }
    
    playBackgroundMelody() {
        if (!this.audioEnabled || !this.musicEnabled) return;
        
        const audioContext = this.audioListener.context;
        
        // Cute kawaii-style melody - simple and cheerful
        const melody = [
            {note: 523, time: 0.0, duration: 0.3}, // C5
            {note: 587, time: 0.4, duration: 0.3}, // D5
            {note: 659, time: 0.8, duration: 0.3}, // E5
            {note: 523, time: 1.2, duration: 0.3}, // C5
            {note: 659, time: 1.8, duration: 0.3}, // E5
            {note: 698, time: 2.2, duration: 0.6}, // F5
            {note: 659, time: 3.0, duration: 0.3}, // E5
            {note: 587, time: 3.4, duration: 0.3}, // D5
            {note: 523, time: 3.8, duration: 0.8}, // C5
        ];
        
        melody.forEach(({note, time, duration}) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(note, audioContext.currentTime + time);
            
            const volume = this.gameState === 'gameOver' ? 0.1 : 0.2;
            gainNode.gain.setValueAtTime(0, audioContext.currentTime + time);
            gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + time + 0.05);
            gainNode.gain.linearRampToValueAtTime(volume * 0.7, audioContext.currentTime + time + duration * 0.7);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + time + duration);
            
            oscillator.start(audioContext.currentTime + time);
            oscillator.stop(audioContext.currentTime + time + duration);
        });
    }
    
    stopBackgroundMusic() {
        if (this.musicLoopInterval) {
            clearInterval(this.musicLoopInterval);
            this.musicLoopInterval = null;
        }
    }
    
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        const musicBtn = document.getElementById('music-toggle');
        
        if (this.musicEnabled) {
            musicBtn.innerHTML = '🔊';
            musicBtn.title = 'Mute Music';
            if (this.audioEnabled) {
                this.startBackgroundMusic();
            }
        } else {
            musicBtn.innerHTML = '🔇';
            musicBtn.title = 'Unmute Music';
            this.stopBackgroundMusic();
        }
    }
    
    selectDifficulty(difficulty) {
        // Find the difficulty index
        const index = this.difficultyOptions.findIndex(d => d.key === difficulty);
        if (index !== -1) {
            this.currentDifficultyIndex = index;
            this.selectedDifficulty = difficulty;
            this.updateDifficultyDisplay();
            this.applyDifficultySettings();
            this.soundEffects.collect();
        }
    }
    
    applyDifficultySettings() {
        const config = this.difficultyConfig[this.selectedDifficulty];
        
        this.baseSpeed = config.baseSpeed;
        this.speedIncrement = config.acceleration;
        
        // Update spawn intervals
        this.nextObstacleSpawnTime = this.getRandomInterval(config.obstacleInterval);
        this.nextCollectibleSpawnTime = this.getRandomInterval(config.collectibleInterval);
    }
    
    getRandomInterval(range) {
        const [min, max] = range;
        return min + Math.random() * (max - min);
    }
    
    enableAudio() {
        if (this.audioEnabled) return;
        
        try {
            // Resume audio context if it's suspended
            if (this.audioListener.context.state === 'suspended') {
                this.audioListener.context.resume();
            }
            
            this.audioEnabled = true;
            
            if (this.musicEnabled) {
                this.startBackgroundMusic();
            }
        } catch (error) {
            console.warn('Audio could not be enabled:', error);
        }
    }
    
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        this.scene.add(directionalLight);
        
        // Soft fill light
        const fillLight = new THREE.DirectionalLight(0xFFB6C1, 0.3);
        fillLight.position.set(-5, 5, 2);
        this.scene.add(fillLight);
    }
    
    createWorld() {
        // Create ground
        this.createGround();
        
        // Create initial world chunks
        for (let i = 0; i < 3; i++) {
            this.generateWorldChunk(i * 20 - 10);
        }
    }
    
    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(10, 200);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x98FB98 }); // Mint green
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Create path lanes
        for (let lane of this.lanes) {
            const pathGeometry = new THREE.PlaneGeometry(1.5, 200);
            const pathMaterial = new THREE.MeshLambertMaterial({ color: 0xF0E68C }); // Light khaki
            const path = new THREE.Mesh(pathGeometry, pathMaterial);
            path.rotation.x = -Math.PI / 2;
            path.position.set(lane, 0.01, -50);
            path.receiveShadow = true;
            this.scene.add(path);
        }
    }
    
    createBunny() {
        const bunnyGroup = new THREE.Group();
        
        // Body (main part) - Extra soft and cute!
        const bodyGeometry = new THREE.SphereGeometry(0.8, 32, 32);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFB6C1,
            shininess: 30,
            specular: 0xFFFFFF
        }); // Light pink with shine
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.8;
        body.scale.set(1, 1.2, 1);
        body.castShadow = true;
        bunnyGroup.add(body);
        
        // Head - Extra round and cute!
        const headGeometry = new THREE.SphereGeometry(0.6, 32, 32);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.set(0, 1.8, 0.2);
        head.castShadow = true;
        bunnyGroup.add(head);
        
        // Ears
        const earGeometry = new THREE.ConeGeometry(0.15, 0.8, 8);
        const leftEar = new THREE.Mesh(earGeometry, bodyMaterial);
        leftEar.position.set(-0.3, 2.4, 0.1);
        leftEar.rotation.z = 0.2;
        leftEar.castShadow = true;
        bunnyGroup.add(leftEar);
        
        const rightEar = new THREE.Mesh(earGeometry, bodyMaterial);
        rightEar.position.set(0.3, 2.4, 0.1);
        rightEar.rotation.z = -0.2;
        rightEar.castShadow = true;
        bunnyGroup.add(rightEar);
        
        // Eyes - Big kawaii eyes with shine!
        const eyeGeometry = new THREE.SphereGeometry(0.12, 16, 16);
        const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.2, 1.9, 0.5);
        bunnyGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.2, 1.9, 0.5);
        bunnyGroup.add(rightEye);
        
        // Eye shine highlights for extra cuteness!
        const shineGeometry = new THREE.SphereGeometry(0.04, 8, 8);
        const shineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        
        const leftShine = new THREE.Mesh(shineGeometry, shineMaterial);
        leftShine.position.set(-0.15, 2.0, 0.55);
        bunnyGroup.add(leftShine);
        
        const rightShine = new THREE.Mesh(shineGeometry, shineMaterial);
        rightShine.position.set(0.25, 2.0, 0.55);
        bunnyGroup.add(rightShine);
        
        // Nose - Cuter and pinker!
        const noseGeometry = new THREE.SphereGeometry(0.08, 12, 12);
        const noseMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFF1493,
            shininess: 80,
            emissive: 0xFF69B4,
            emissiveIntensity: 0.2
        }); // Deep pink with glow
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.set(0, 1.7, 0.55);
        bunnyGroup.add(nose);
        
        // Tail
        const tailGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
        tail.position.set(0, 1, -0.8);
        tail.castShadow = true;
        bunnyGroup.add(tail);
        
        bunnyGroup.position.set(0, 0, 0);
        this.bunny = bunnyGroup;
        this.scene.add(bunnyGroup);
    }
    
    generateWorldChunk(startZ) {
        const chunkLength = 20;
        
        // Only generate decorative elements now - collectibles handled by continuous system
        this.generateDecorations(startZ, chunkLength);
    }
    
    createObstacle(z) {
        // Don't create if we have too many obstacles
        if (this.obstacles.length >= this.maxObstacles) {
            return;
        }
        
        const lane = Math.floor(Math.random() * 3);
        const x = this.lanes[lane];
        
        const obstacleTypes = ['flower', 'log', 'rock'];
        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        
        let obstacle;
        
        if (type === 'flower') {
            obstacle = this.createFlower();
        } else if (type === 'log') {
            obstacle = this.createLog();
        } else {
            obstacle = this.createRock();
        }
        
        obstacle.position.set(x, 0, z);
        obstacle.userData = { 
            type: 'obstacle',
            obstacleType: type,
            lane: lane,
            spawnTime: Date.now()
        };
        this.obstacles.push(obstacle);
        this.scene.add(obstacle);
        
        this.totalObstaclesSpawned++;
        // console.log('Obstacle spawned:', this.totalObstaclesSpawned, 'Type:', type, 'Lane:', lane, 'Z:', z.toFixed(2));
    }
    
    createFlower() {
        const flowerGroup = new THREE.Group();
        
        // Stem
        const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5);
        const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 }); // Forest green
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.75;
        stem.castShadow = true;
        flowerGroup.add(stem);
        
        // Petals
        const petalColors = [0xFF69B4, 0xFFB6C1, 0xDDA0DD, 0x98FB98, 0xFFFF99];
        const petalColor = petalColors[Math.floor(Math.random() * petalColors.length)];
        
        for (let i = 0; i < 6; i++) {
            const petalGeometry = new THREE.SphereGeometry(0.3, 8, 8);
            const petalMaterial = new THREE.MeshLambertMaterial({ color: petalColor });
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            
            const angle = (i / 6) * Math.PI * 2;
            petal.position.set(
                Math.cos(angle) * 0.4,
                1.5,
                Math.sin(angle) * 0.4
            );
            petal.scale.set(0.8, 0.3, 0.8);
            petal.castShadow = true;
            flowerGroup.add(petal);
        }
        
        // Center
        const centerGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const centerMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 }); // Gold
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.position.y = 1.5;
        center.castShadow = true;
        flowerGroup.add(center);
        
        return flowerGroup;
    }
    
    createLog() {
        const logGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2);
        const logMaterial = new THREE.MeshLambertMaterial({ color: 0xD2691E }); // Chocolate
        const log = new THREE.Mesh(logGeometry, logMaterial);
        log.rotation.z = Math.PI / 2;
        log.position.y = 0.3;
        log.castShadow = true;
        return log;
    }
    
    createRock() {
        const rockGeometry = new THREE.DodecahedronGeometry(0.5);
        const rockMaterial = new THREE.MeshLambertMaterial({ color: 0xE6E6FA }); // Lavender
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.y = 0.5;
        rock.rotation.x = Math.random() * Math.PI;
        rock.rotation.y = Math.random() * Math.PI;
        rock.castShadow = true;
        return rock;
    }
    
    createCollectible(z) {
        const lane = Math.floor(Math.random() * 3);
        const x = this.lanes[lane];
        
        const collectibleTypes = ['heart', 'star', 'bunnyPlush'];
        const type = collectibleTypes[Math.floor(Math.random() * collectibleTypes.length)];
        
        let collectible;
        
        if (type === 'heart') {
            collectible = this.createHeart();
        } else if (type === 'star') {
            collectible = this.createStar();
        } else {
            collectible = this.createBunnyPlush();
        }
        
        collectible.position.set(x, 1.5, z);
        collectible.userData = { type: 'collectible', subType: type };
        this.collectibles.push(collectible);
        this.scene.add(collectible);
    }
    
    createHeart() {
        const heartGroup = new THREE.Group();
        
        // Create heart shape using two spheres and a triangle-ish shape
        const heartMaterial = new THREE.MeshLambertMaterial({ color: 0xFF69B4 }); // Hot pink
        
        // Left curve
        const leftGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const left = new THREE.Mesh(leftGeometry, heartMaterial);
        left.position.set(-0.1, 0.1, 0);
        left.scale.set(1, 0.8, 0.5);
        heartGroup.add(left);
        
        // Right curve
        const right = new THREE.Mesh(leftGeometry, heartMaterial);
        right.position.set(0.1, 0.1, 0);
        right.scale.set(1, 0.8, 0.5);
        heartGroup.add(right);
        
        // Bottom point
        const bottomGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const bottom = new THREE.Mesh(bottomGeometry, heartMaterial);
        bottom.position.set(0, -0.15, 0);
        bottom.scale.set(0.8, 1.2, 0.5);
        heartGroup.add(bottom);
        
        return heartGroup;
    }
    
    createStar() {
        const starGroup = new THREE.Group();
        
        // Create star using cylinders
        const starMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFF99 }); // Light yellow
        
        for (let i = 0; i < 5; i++) {
            const rayGeometry = new THREE.CylinderGeometry(0.05, 0.15, 0.6);
            const ray = new THREE.Mesh(rayGeometry, starMaterial);
            
            const angle = (i / 5) * Math.PI * 2;
            ray.position.set(
                Math.cos(angle) * 0.2,
                0,
                Math.sin(angle) * 0.2
            );
            ray.rotation.z = -angle + Math.PI / 2;
            ray.castShadow = true;
            starGroup.add(ray);
        }
        
        // Center
        const centerGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const center = new THREE.Mesh(centerGeometry, starMaterial);
        center.castShadow = true;
        starGroup.add(center);
        
        return starGroup;
    }
    
    createBunnyPlush() {
        const plushGroup = new THREE.Group();
        
        // Mini bunny body
        const bodyGeometry = new THREE.SphereGeometry(0.25, 8, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEEB }); // Sky blue
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        plushGroup.add(body);
        
        // Mini bunny head
        const headGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.set(0, 0.3, 0);
        head.castShadow = true;
        plushGroup.add(head);
        
        // Mini ears
        const earGeometry = new THREE.ConeGeometry(0.05, 0.2, 6);
        const leftEar = new THREE.Mesh(earGeometry, bodyMaterial);
        leftEar.position.set(-0.08, 0.45, 0);
        leftEar.castShadow = true;
        plushGroup.add(leftEar);
        
        const rightEar = new THREE.Mesh(earGeometry, bodyMaterial);
        rightEar.position.set(0.08, 0.45, 0);
        rightEar.castShadow = true;
        plushGroup.add(rightEar);
        
        return plushGroup;
    }
    
    generateDecorations(startZ, length) {
        // Add some grass patches and flowers in the background
        for (let i = 0; i < 8; i++) {
            const x = (Math.random() - 0.5) * 20; // Spread across width
            const z = startZ - Math.random() * length;
            
            if (Math.abs(x) > 4) { // Only place outside the path
                const decorationType = Math.random() < 0.7 ? 'grass' : 'flower';
                
                if (decorationType === 'grass') {
                    const grassGeometry = new THREE.ConeGeometry(0.1, 0.5, 4);
                    const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 }); // Light green
                    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
                    grass.position.set(x, 0.25, z);
                    grass.rotation.y = Math.random() * Math.PI * 2;
                    this.scene.add(grass);
                } else {
                    const flower = this.createFlower();
                    flower.position.set(x, 0, z);
                    flower.scale.setScalar(0.7);
                    this.scene.add(flower);
                }
            }
        }
    }
    
    handleResize() {
        const aspectRatio = window.innerWidth / window.innerHeight;
        
        // Update camera
        this.camera.aspect = aspectRatio;
        this.camera.fov = aspectRatio < 1 ? 85 : 75;
        this.camera.updateProjectionMatrix();
        
        // Adjust camera position based on screen ratio
        if (aspectRatio < 0.8) { // Portrait mode
            this.camera.position.set(0, 6, 8);
            this.camera.lookAt(0, 0, -3);
        } else {
            this.camera.position.set(0, 4, 6);
            this.camera.lookAt(0, 0, -5);
        }
        
        // Update renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    setupTouchControls() {
        // Show touch controls only on touch devices
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (this.isTouchDevice) {
            const touchControls = document.getElementById('touch-controls');
            
            // Touch control event listeners
            const touchLeft = document.getElementById('touch-left');
            const touchRight = document.getElementById('touch-right');
            const touchJump = document.getElementById('touch-jump');
            
            // Prevent default touch behaviors
            [touchLeft, touchRight, touchJump].forEach(btn => {
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    btn.style.transform = 'scale(0.9)';
                });
                
                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    btn.style.transform = '';
                });
            });
            
            // Touch controls
            touchLeft.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.triggerHapticFeedback('light');
                    this.moveLane(-1);
                }
            });
            
            touchRight.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.triggerHapticFeedback('light');
                    this.moveLane(1);
                }
            });
            
            touchJump.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.triggerHapticFeedback('medium');
                    this.jump();
                }
            });
            
            // Add swipe gestures
            this.setupSwipeGestures();
        }
    }
    
    setupSwipeGestures() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        
        const minSwipeDistance = 50;
        
        document.addEventListener('touchstart', (e) => {
            if (this.gameState !== 'playing') return;
            
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        }, { passive: false });
        
        document.addEventListener('touchend', (e) => {
            if (this.gameState !== 'playing') return;
            
            touchEndX = e.changedTouches[0].clientX;
            touchEndY = e.changedTouches[0].clientY;
            
            this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY, minSwipeDistance);
        }, { passive: false });
        
        // Tap to jump
        document.addEventListener('touchstart', (e) => {
            if (this.gameState === 'playing' && e.touches.length === 1) {
                // Only if not touching control buttons
                const touch = e.touches[0];
                const element = document.elementFromPoint(touch.clientX, touch.clientY);
                if (!element.closest('.touch-controls') && !element.closest('.hud-top')) {
                    setTimeout(() => {
                        if (this.gameState === 'playing') {
                            this.jump();
                        }
                    }, 150); // Small delay to allow swipe detection
                }
            }
        }, { passive: false });
    }
    
    handleSwipe(startX, startY, endX, endY, minDistance) {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        
        // Check if swipe is long enough
        if (Math.abs(deltaX) > minDistance || Math.abs(deltaY) > minDistance) {
            // Horizontal swipes
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                this.triggerHapticFeedback('light');
                if (deltaX > 0) {
                    this.moveLane(1); // Swipe right
                } else {
                    this.moveLane(-1); // Swipe left
                }
            }
            // Vertical swipes
            else if (deltaY < 0) {
                this.triggerHapticFeedback('medium');
                this.jump(); // Swipe up
            }
        }
    }
    
    triggerHapticFeedback(intensity = 'light') {
        if ('vibrate' in navigator) {
            const patterns = {
                light: 10,
                medium: 20,
                heavy: 30,
                success: [10, 50, 10]
            };
            navigator.vibrate(patterns[intensity] || 10);
        }
    }
    
    setupDifficultySelector() {
        // Difficulty data
        this.difficultyOptions = [
            {
                key: 'easy',
                icon: '🌸',
                name: 'Relaxed Garden Stroll',
                desc: 'Perfect for a chill time!'
            },
            {
                key: 'medium',
                icon: '💕',
                name: 'Happy Run',
                desc: 'Balanced fun & challenge!'
            },
            {
                key: 'hard',
                icon: '⚡',
                name: 'Speed Bunny Challenge',
                desc: 'For the ultimate bunny!'
            }
        ];
        
        this.currentDifficultyIndex = 1; // Start with medium
        
        // Event listeners for difficulty arrows
        document.getElementById('difficulty-prev').addEventListener('click', () => {
            this.changeDifficulty(-1);
        });
        
        document.getElementById('difficulty-next').addEventListener('click', () => {
            this.changeDifficulty(1);
        });
        
        // Initialize display
        this.updateDifficultyDisplay();
    }
    
    changeDifficulty(direction) {
        this.currentDifficultyIndex = (this.currentDifficultyIndex + direction + this.difficultyOptions.length) % this.difficultyOptions.length;
        this.selectedDifficulty = this.difficultyOptions[this.currentDifficultyIndex].key;
        this.updateDifficultyDisplay();
        this.applyDifficultySettings();
        this.soundEffects.collect();
    }
    
    updateDifficultyDisplay() {
        const current = this.difficultyOptions[this.currentDifficultyIndex];
        
        document.getElementById('current-difficulty-icon').textContent = current.icon;
        document.getElementById('current-difficulty-name').textContent = current.name;
        document.getElementById('current-difficulty-desc').textContent = current.desc;
        
        // Show/hide recommended badge
        const badge = document.getElementById('recommended-badge');
        if (current.key === 'medium') {
            badge.classList.add('show');
        } else {
            badge.classList.remove('show');
        }
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            
            if (this.gameState === 'playing') {
                if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
                    this.moveLane(-1);
                }
                if (event.code === 'ArrowRight' || event.code === 'KeyD') {
                    this.moveLane(1);
                }
                if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
                    event.preventDefault();
                    this.jump();
                }
                if (event.code === 'Escape') {
                    this.pauseGame();
                }
            }
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
        
        // Button events (guard DOM queries in case elements are missing)
        const startBtn = document.getElementById('start-btn');
        if (startBtn) startBtn.addEventListener('click', () => {
            // Enable audio from a user gesture once, then start the game
            this.enableAudio();
            this.startGame();
        });

        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.pauseGame());

        const resumeBtn = document.getElementById('resume-btn');
        if (resumeBtn) resumeBtn.addEventListener('click', () => this.resumeGame());

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) restartBtn.addEventListener('click', () => this.restartGame());

        const menuBtn = document.getElementById('menu-btn');
        if (menuBtn) menuBtn.addEventListener('click', () => this.showMainMenu());

        const playAgainBtn = document.getElementById('play-again-btn');
        if (playAgainBtn) playAgainBtn.addEventListener('click', () => this.restartGame());

        const menuReturnBtn = document.getElementById('menu-return-btn');
        if (menuReturnBtn) menuReturnBtn.addEventListener('click', () => this.showMainMenu());

        const musicToggle = document.getElementById('music-toggle');
        if (musicToggle) musicToggle.addEventListener('click', () => this.toggleMusic());
        
        // Difficulty selection handled by setupDifficultySelector()
    }
    
    moveLane(direction) {
        const newLane = Math.max(0, Math.min(2, this.currentLane + direction));
        if (newLane !== this.currentLane) {
            this.currentLane = newLane;
            this.targetLanePosition = this.lanes[this.currentLane];
        }
    }
    
    jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.jumpVelocity = this.jumpPower;
            this.soundEffects.jump();
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.speed = this.baseSpeed;
        this.worldPosition = 0;
        this.currentLane = 1;
        this.targetLanePosition = 0;
        this.isJumping = false;
        this.jumpVelocity = 0;
        
        // Reset combo system
        this.comboCount = 0;
        this.comboTimer = 0;
        this.lastComboTime = 0;
        
        // Reset milestone tracking
        this.lastMilestone = 0;
        
        // Reset obstacle spawning system
        this.obstacleSpawnTimer = 0;
        this.nextObstacleSpawnTime = this.getRandomObstacleInterval();
        this.lastObstacleSpawnTime = 0;
        this.totalObstaclesSpawned = 0;
        
        // Reset collectible spawning system - FIX FOR CONTINUOUS SPAWNING
        this.collectibleSpawnTimer = 0;
        this.nextCollectibleSpawnTime = this.getRandomCollectibleInterval();
        this.lastCollectibleSpawnTime = 0;
        this.totalCollectiblesSpawned = 0;
        
        // Apply difficulty settings
        this.applyDifficultySettings();
        
        // Reset bunny position
        this.bunny.position.set(0, 0, 0);
        
        // Clear existing obstacles and collectibles
        this.clearWorld();
        
        // Generate initial world decorations
        this.lastObstacleZ = -10;
        this.lastCollectibleZ = -5;
        for (let i = 0; i < 3; i++) {
            this.generateDecorations(i * 20 - 10, 20);
        }
        
        // Spawn a few initial collectibles using the new system
        for (let i = 0; i < 3; i++) {
            const z = -15 - (i * 8);
            this.createContinuousCollectible(z);
        }
        
        this.showScreen('game-hud');
        this.updateScore();
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.stopBackgroundMusic();
            this.showScreen('pause-menu');
        }
    }
    
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            if (this.musicEnabled && this.audioEnabled) {
                this.startBackgroundMusic();
            }
            this.showScreen('game-hud');
        }
    }

    gameOver() {
        this.gameState = 'gameOver';

        // Stop background music on game over
        this.stopBackgroundMusic();

        // Check for new best score
        let isNewBest = false;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveBestScore();
            isNewBest = true;
            if (this.soundEffects && this.soundEffects.milestone) this.soundEffects.milestone();
        } else {
            if (this.soundEffects && this.soundEffects.gameOver) this.soundEffects.gameOver();
        }

        // Update game over screen
        const messages = [
            "You're awesome!",
            "Cutest run ever!",
            "Best BFF!",
            "So proud of you!",
            "Keep hopping!"
        ];

        const title = isNewBest ? "New Best Score! 🏆" : "You're Awesome!";
        const message = isNewBest ? "Amazing work, bestie! 💖" : messages[Math.floor(Math.random() * messages.length)];

        const titleEl = document.getElementById('game-over-title');
        const msgEl = document.getElementById('game-over-message');
        const finalScoreEl = document.getElementById('final-score');
        const bestScoreFinalEl = document.getElementById('best-score-final');

        if (titleEl) titleEl.textContent = title;
        if (msgEl) msgEl.textContent = message;
        if (finalScoreEl) finalScoreEl.textContent = this.score;
        if (bestScoreFinalEl) bestScoreFinalEl.textContent = this.bestScore;

        // Show celebration if new best
        const celebration = document.getElementById('celebration');
        if (celebration) celebration.style.display = isNewBest ? 'block' : 'none';

        this.showScreen('game-over');
    }
    
    restartGame() {
        // Clean up current game state
        this.clearWorld();
        this.stopBackgroundMusic();
        
        // Enable audio if not already enabled
        this.enableAudio();
        
        // Start fresh game
        this.startGame();
    }
    
    showMainMenu() {
        this.gameState = 'menu';
        this.stopBackgroundMusic();
        this.clearWorld();
        
        // Update menu best score display
        const menuBestScore = document.getElementById('best-score-menu');
        if (menuBestScore) {
            menuBestScore.textContent = this.bestScore;
        }
        
        this.showScreen('main-menu');
    }
    
    clearWorld() {
        // Remove obstacles with proper cleanup
        this.obstacles.forEach(obstacle => {
            obstacle.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            this.scene.remove(obstacle);
        });
        this.obstacles = [];
        
        // Remove collectibles with proper cleanup
        this.collectibles.forEach(collectible => {
            collectible.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            this.scene.remove(collectible);
        });
        this.collectibles = [];
        
        // Remove particles with proper cleanup
        this.particles.forEach(particle => {
            particle.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            this.scene.remove(particle);
        });
        this.particles = [];
    }
    
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Show target screen
        document.getElementById(screenId).classList.remove('hidden');
        
        // Show/hide touch controls based on screen
        const touchControls = document.getElementById('touch-controls');
        if (this.isTouchDevice && screenId === 'game-hud') {
            touchControls.classList.remove('hidden');
        } else {
            touchControls.classList.add('hidden');
        }
    }
    
    updateScore() {
        document.getElementById('current-score').textContent = this.score;
        document.getElementById('best-score').textContent = this.bestScore;
        
        // Update combo display
        const comboDisplay = document.getElementById('combo-display');
        const comboCount = document.getElementById('combo-count');
        
        if (this.comboCount > 1) {
            comboDisplay.style.display = 'block';
            comboCount.textContent = `${this.comboCount}x`;
            comboDisplay.style.animation = 'none';
            setTimeout(() => {
                comboDisplay.style.animation = 'comboPulse 0.3s ease-out';
            }, 10);
        } else {
            comboDisplay.style.display = 'none';
        }
    }
    
    checkCollisions() {
        const bunnyBox = new THREE.Box3().setFromObject(this.bunny);
        
        // Slightly shrink collision box for more forgiving gameplay (10% smaller)
        const bunnySize = new THREE.Vector3();
        bunnyBox.getSize(bunnySize);
        bunnyBox.expandByVector(bunnySize.multiplyScalar(-0.05));
        
        // Check obstacle collisions
        for (let i = 0; i < this.obstacles.length; i++) {
            const obstacle = this.obstacles[i];
            const obstacleBox = new THREE.Box3().setFromObject(obstacle);
            
            if (bunnyBox.intersectsBox(obstacleBox)) {
                this.triggerHapticFeedback('heavy');
                this.gameOver();
                return;
            }
        }
        
        // Check collectible collisions
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            const collectibleBox = new THREE.Box3().setFromObject(collectible);
            
            if (bunnyBox.intersectsBox(collectibleBox)) {
                // Collect item with combo system
                this.collectWithCombo();
                this.triggerHapticFeedback('success');
                
                // Create sparkle effect
                this.createSparkleEffect(collectible.position);
                
                // Remove collectible
                this.scene.remove(collectible);
                this.collectibles.splice(i, 1);
            }
        }
    }
    
    collectWithCombo() {
        const currentTime = Date.now();
        
        // Check if we're still within combo window
        if (currentTime - this.lastComboTime < this.comboTimeout) {
            this.comboCount++;
        } else {
            this.comboCount = 1; // Reset combo
        }
        
        this.lastComboTime = currentTime;
        
        // Calculate score with combo multiplier
        const baseScore = 10;
        const comboMultiplier = Math.min(this.comboCount, 10); // Cap at 10x
        const earnedScore = baseScore * comboMultiplier;
        
        this.score += earnedScore;
        this.updateScore();
        
        // Play appropriate sound based on combo
        if (this.comboCount >= 5) {
            this.soundEffects.milestone();
        } else {
            this.soundEffects.collect();
        }
        
        // Show combo feedback
        if (this.comboCount > 1) {
            this.showComboFeedback(this.comboCount, earnedScore);
        }
        
        // Check for milestones
        this.checkMilestone();
    }
    
    showComboFeedback(combo, score) {
        // Create floating text for combo
        const comboText = document.createElement('div');
        comboText.className = 'combo-feedback';
        comboText.textContent = `${combo}x COMBO! +${score}`;
        comboText.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 2rem;
            font-weight: bold;
            color: #FFD700;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            pointer-events: none;
            z-index: 1000;
            animation: comboFadeUp 1s ease-out forwards;
        `;
        document.body.appendChild(comboText);
        
        setTimeout(() => comboText.remove(), 1000);
    }
    
    checkMilestone() {
        for (const milestone of this.milestones) {
            if (this.score >= milestone && this.lastMilestone < milestone) {
                this.lastMilestone = milestone;
                this.celebrateMilestone(milestone);
                break;
            }
        }
    }
    
    celebrateMilestone(milestone) {
        this.soundEffects.milestone();
        this.triggerHapticFeedback('success');
        
        // Show milestone message
        const milestoneText = document.createElement('div');
        milestoneText.className = 'milestone-feedback';
        milestoneText.innerHTML = `
            <div style="font-size: 3rem;">🎉</div>
            <div style="font-size: 1.5rem; font-weight: bold;">${milestone} POINTS!</div>
            <div style="font-size: 1rem;">Keep going! 💕</div>
        `;
        milestoneText.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: white;
            text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
            pointer-events: none;
            z-index: 1000;
            animation: milestoneZoom 2s ease-out forwards;
        `;
        document.body.appendChild(milestoneText);
        
        setTimeout(() => milestoneText.remove(), 2000);
    }
    
    showSpeedUpFeedback() {
        // Quick visual pulse effect
        const speedText = document.createElement('div');
        speedText.textContent = '⚡ SPEED UP! ⚡';
        speedText.style.cssText = `
            position: fixed;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 1.5rem;
            font-weight: bold;
            color: #FFD700;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            pointer-events: none;
            z-index: 1000;
            animation: speedPulse 0.5s ease-out forwards;
        `;
        document.body.appendChild(speedText);
        
        setTimeout(() => speedText.remove(), 500);
    }
    
    createSparkleEffect(position) {
        const sparkleGroup = new THREE.Group();
        
        for (let i = 0; i < 8; i++) {
            const sparkleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
            const sparkleMaterial = new THREE.MeshLambertMaterial({
                color: new THREE.Color().setHSL(Math.random(), 1, 0.7),
                transparent: true,
                opacity: 1
            });
            
            const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
            sparkle.position.copy(position);
            
            // Random direction
            sparkle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.2,
                    Math.random() * 0.3 + 0.1,
                    (Math.random() - 0.5) * 0.2
                ),
                life: 1.0,
                geometry: sparkleGeometry,
                material: sparkleMaterial
            };
            
            sparkleGroup.add(sparkle);
        }
        
        sparkleGroup.userData = { type: 'sparkle', life: 1.0 };
        this.particles.push(sparkleGroup);
        this.scene.add(sparkleGroup);
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            if (particle.userData.type === 'sparkle') {
                particle.userData.life -= 0.05;
                
                particle.children.forEach(sparkle => {
                    sparkle.position.add(sparkle.userData.velocity);
                    sparkle.userData.velocity.y -= 0.01; // Gravity
                    sparkle.material.opacity = particle.userData.life;
                });
                
                if (particle.userData.life <= 0) {
                    // Properly dispose of geometries and materials
                    particle.children.forEach(sparkle => {
                        if (sparkle.userData.geometry) {
                            sparkle.userData.geometry.dispose();
                        }
                        if (sparkle.userData.material) {
                            sparkle.userData.material.dispose();
                        }
                    });
                    
                    this.scene.remove(particle);
                    this.particles.splice(i, 1);
                }
            }
        }
    }
    
    // Legacy playSound method - now handled by new audio system
    playSound(type) {
        if (this.soundEffects[type]) {
            this.soundEffects[type]();
        }
    }
    
    getBestScore() {
        try {
            const v = localStorage.getItem('bunnyRunnerBestScore');
            return v ? parseInt(v, 10) : (window.bunnyRunnerBestScore || 0);
        } catch (e) {
            return window.bunnyRunnerBestScore || 0;
        }
    }
    
    saveBestScore() {
        try {
            localStorage.setItem('bunnyRunnerBestScore', String(this.bestScore));
        } catch (e) {
            // Fallback to in-memory storage
            window.bunnyRunnerBestScore = this.bestScore;
        }
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        const deltaTime = this.clock.getDelta();
        this.frameCount++;
        
        // Update world position
        this.worldPosition += this.speed;
        
        // Handle continuous obstacle spawning
        this.updateObstacleSpawning(deltaTime);
        
        // Handle continuous collectible spawning - FIX FOR CONTINUOUS SPAWNING
        this.updateCollectibleSpawning(deltaTime);
        
        // Move world towards camera
        this.obstacles.forEach(obstacle => {
            obstacle.position.z += this.speed;
        });
        
        this.collectibles.forEach(collectible => {
            collectible.position.z += this.speed;
            // Rotate collectibles for visual appeal
            collectible.rotation.y += 0.05;
        });
        
        // Generate new world chunks as needed
        if (this.worldPosition > 20) {
            this.generateWorldChunk(-40);
            this.worldPosition = 0;
        }
        
        // Update bunny lane position (smooth interpolation)
        const currentX = this.bunny.position.x;
        const targetX = this.targetLanePosition;
        this.bunny.position.x = currentX + (targetX - currentX) * 0.2;
        
        // Update jumping
        if (this.isJumping) {
            this.bunny.position.y += this.jumpVelocity;
            this.jumpVelocity -= this.gravity;
            
            if (this.bunny.position.y <= 0) {
                this.bunny.position.y = 0;
                this.isJumping = false;
                this.jumpVelocity = 0;
            }
        }
        
        // Add cute bouncy running animation
        this.bunny.rotation.z = Math.sin(this.frameCount * 0.2) * 0.15;
        this.bunny.rotation.x = this.isJumping ? -0.3 : Math.sin(this.frameCount * 0.15) * 0.08;
        
        // Add subtle y-axis bobbing for extra cuteness
        if (!this.isJumping) {
            this.bunny.position.y += Math.sin(this.frameCount * 0.3) * 0.02;
        }
        
        // Update speed (gradually increase difficulty) - respects difficulty settings
        const config = this.difficultyConfig[this.selectedDifficulty];
        const oldSpeed = this.speed;
        this.speed = Math.min(this.baseSpeed + (this.score * this.speedIncrement * 0.1), config.maxSpeed);
        
        // Visual feedback when speed tier changes
        if (Math.floor(this.speed * 10) > Math.floor(oldSpeed * 10)) {
            this.showSpeedUpFeedback();
        }
        
        // Update camera to follow bunny
        this.camera.position.x += (this.bunny.position.x * 0.3 - this.camera.position.x) * 0.1;
        
        // Update particles
        this.updateParticles();
        
        // Check collisions
        this.checkCollisions();
        
        // Add distance-based score
        if (this.frameCount % 30 === 0) {
            this.score += 1;
            this.updateScore();
        }
    }
    
    getRandomObstacleInterval() {
        // Base interval from difficulty config, scales with speed and score
        const config = this.difficultyConfig[this.selectedDifficulty];
        const [baseMin, baseMax] = config.obstacleInterval;
        
        // Progressive difficulty: obstacles spawn faster as score increases
        const progressFactor = Math.max(0.5, 1 - (this.score / 1000)); // Caps at 50% faster
        const speedFactor = Math.max(0.5, 1 - (this.speed - this.baseSpeed) / this.baseSpeed);
        
        const minInterval = Math.max(400, baseMin * speedFactor * progressFactor);
        const maxInterval = Math.max(600, baseMax * speedFactor * progressFactor);
        
        return minInterval + Math.random() * (maxInterval - minInterval);
    }
    
    getRandomCollectibleInterval() {
        // Base interval from difficulty config - more frequent as score increases
        const config = this.difficultyConfig[this.selectedDifficulty];
        const [baseMin, baseMax] = config.collectibleInterval;
        
        // Collectibles appear more frequently as player progresses
        const progressFactor = Math.max(0.6, 1 - (this.score / 2000)); // Caps at 40% more frequent
        
        const minInterval = Math.max(1000, baseMin * progressFactor);
        const maxInterval = Math.max(2000, baseMax * progressFactor);
        
        return minInterval + Math.random() * (maxInterval - minInterval);
    }
    
    updateObstacleSpawning(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        const currentTime = Date.now();
        
        // Check if it's time to spawn a new obstacle
        if (currentTime - this.lastObstacleSpawnTime >= this.nextObstacleSpawnTime) {
            // Spawn obstacle ahead of player
            const spawnZ = this.bunny.position.z - this.obstacleSpawnDistance;
            this.createObstacle(spawnZ);
            
            // Set next spawn time
            this.lastObstacleSpawnTime = currentTime;
            this.nextObstacleSpawnTime = this.getRandomObstacleInterval();
        }
        
        // Clean up old obstacles
        this.cleanupOldObstacles();
    }
    
    updateCollectibleSpawning(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        const currentTime = Date.now();
        
        // Check if it's time to spawn a new collectible - FIX FOR CONTINUOUS SPAWNING
        if (currentTime - this.lastCollectibleSpawnTime >= this.nextCollectibleSpawnTime) {
            // Don't spawn if we have too many collectibles
            if (this.collectibles.length < this.maxCollectibles) {
                // Spawn collectible ahead of player in random lane
                const spawnZ = this.bunny.position.z - this.collectibleSpawnDistance;
                this.createContinuousCollectible(spawnZ);
            }
            
            // Set next spawn time
            this.lastCollectibleSpawnTime = currentTime;
            this.nextCollectibleSpawnTime = this.getRandomCollectibleInterval();
        }
        
        // Clean up old collectibles (already handled in cleanupOldObstacles)
    }
    
    createContinuousCollectible(z) {
        // Choose random lane, but avoid the same lane as recent obstacles
        let availableLanes = [0, 1, 2];
        
        // Check for nearby obstacles and try to avoid same lanes
        this.obstacles.forEach(obstacle => {
            const distance = Math.abs(obstacle.position.z - z);
            if (distance < 5 && obstacle.userData.lane !== undefined) {
                const laneIndex = availableLanes.indexOf(obstacle.userData.lane);
                if (laneIndex > -1) {
                    availableLanes.splice(laneIndex, 1);
                }
            }
        });
        
        // If all lanes blocked, use any lane
        if (availableLanes.length === 0) {
            availableLanes = [0, 1, 2];
        }
        
        const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
        const x = this.lanes[lane];
        
        // Mix different collectible types for variety
        const collectibleTypes = ['heart', 'star', 'bunnyPlush'];
        const type = collectibleTypes[Math.floor(Math.random() * collectibleTypes.length)];
        
        let collectible;
        
        if (type === 'heart') {
            collectible = this.createHeart();
        } else if (type === 'star') {
            collectible = this.createStar();
        } else {
            collectible = this.createBunnyPlush();
        }
        
        collectible.position.set(x, 1.5, z);
        collectible.userData = { 
            type: 'collectible', 
            subType: type,
            lane: lane,
            spawnTime: Date.now()
        };
        this.collectibles.push(collectible);
        this.scene.add(collectible);
        
        this.totalCollectiblesSpawned++;
        console.log('Collectible spawned:', this.totalCollectiblesSpawned, 'Type:', type, 'Lane:', lane, 'Active:', this.collectibles.length);
    }
    
    cleanupOldObstacles() {
        // Remove obstacles that are too far behind the player
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            
            // Remove if obstacle is behind the removal distance
            if (obstacle.position.z > this.bunny.position.z + Math.abs(this.obstacleRemovalDistance)) {
                // Dispose of geometries and materials
                obstacle.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => mat.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                });
                
                this.scene.remove(obstacle);
                this.obstacles.splice(i, 1);
            }
        }
        
        // Also clean up collectibles
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            
            if (collectible.position.z > this.bunny.position.z + Math.abs(this.obstacleRemovalDistance)) {
                // Dispose of geometries and materials
                collectible.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => mat.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                });
                
                this.scene.remove(collectible);
                this.collectibles.splice(i, 1);
            }
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new BunnyRunnerGame();
});