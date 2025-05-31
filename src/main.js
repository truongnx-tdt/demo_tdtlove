import * as THREE from 'three';
import { Text } from 'troika-three-text';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import TWEEN from '@tweenjs/tween.js';

class ParticleEffect {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.particles = [];
        this.mouseTrail = [];
        this.mousePosition = new THREE.Vector2();
        this.messages = [
            "Xuân Trường",
            "Em có yêu anh không?",
            "Em xinh gái ơi",
            "Anh yêu em",
            "Hảo Xinh Gái",
            "TDT DEV"
        ];
        this.currentMessageIndex = 0;
        this.textPositions = [
            { y: 4.0, scale: 1.2 },  // Start position (top)
            { y: 3.0, scale: 1.1 },
            { y: 2.0, scale: 1.0 },
            { y: 1.0, scale: 0.9 },
            { y: 0.0, scale: 0.8 },
            { y: -1.0, scale: 0.7 },
            { y: -2.0, scale: 0.6 },
            { y: -3.0, scale: 0.5 }  // End position (bottom)
        ];
        this.activeTexts = [];
        this.autoScrollInterval = null;
        this.scrollSpeed = 1500;
        this.generateInterval = 2000;
        this.colors = [
            new THREE.Color(0xFF69B4), // Hot Pink
            new THREE.Color(0xFF1493), // Deep Pink
            new THREE.Color(0xFFB6C1), // Light Pink
            new THREE.Color(0xFFC0CB)  // Pink
        ];
        this.currentColorIndex = 0;
        this.backgroundColors = [
            new THREE.Color(0xFFFFFF), // White
            new THREE.Color(0xFFE4E1), // Misty Rose
            new THREE.Color(0xFFF0F5), // Lavender Blush
            new THREE.Color(0xFFC0CB)  // Pink
        ];
        this.sounds = {
            background: new Audio('/storage/musics/message.mp3')
        };
        // Set audio properties
        this.sounds.background.volume = 0.3;
        this.sounds.background.loop = true;
        this.isPlaying = false;
        this.init();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.getElementById('app').appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.x = -10; 

        this.camera.position.z = 12; // Increased from 7 to 12 for a wider view

        // Add controls with disabled auto-rotation
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.autoRotate = false;
        this.controls.enableZoom = false;
        this.controls.minPolarAngle = Math.PI / 2;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.enablePan = false;

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Increased ambient light
        this.scene.add(ambientLight);

        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Increased directional light
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        // Add point light
        const pointLight = new THREE.PointLight(0xEE66A6, 1.5, 15); // Increased intensity and range
        pointLight.position.set(2, 2, 2);
        this.scene.add(pointLight);

        // Load heart model
        const loader = new OBJLoader();
        loader.load('/storage/heart.obj', (object) => {
            // Center the heart
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            
            // Create a group to hold the heart
            const heartGroup = new THREE.Group();
            
            // Center the heart model
            object.position.sub(center);
            
            // Add the heart to the group
            heartGroup.add(object);
            
            // Adjust scale and position
            heartGroup.scale.set(0.02, 0.02, 0.02); // Reduced scale from 0.05 to 0.02
            heartGroup.position.y = 0; // Move heart down a bit
            object.rotation.x = -Math.PI / 2; // Rotate to stand upright
            object.rotation.y = 0; // Reset y rotation

            // Add material to the heart
            object.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.material = new THREE.MeshPhongMaterial({
                        color: 0xFF69B4,
                        shininess: 100,
                        specular: 0xFFFFFF
                    });
                }
            });

            this.scene.add(heartGroup);
            this.heart = heartGroup;
            this.setupHeartAnimation();
        });

        // Create particles
        this.createParticles();
        this.createMouseTrail();

        // Start text generation immediately
        this.startTextGeneration();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);

        // Add mouse move handler
        window.addEventListener('mousemove', (event) => this.onMouseMove(event));

        // Add click handler to toggle auto-scroll
        window.addEventListener('click', () => {
            if (this.autoScrollInterval) {
                this.stopAutoScroll();
            } else {
                this.startAutoScroll();
            }
        });

        // Add click handler to start background music
        window.addEventListener('click', () => {
            this.startBackgroundMusic();
        }, { once: true });

        // Start auto-scrolling
        this.startAutoScroll();

        // Start animation
        this.animate();
    }

    createMouseTrail() {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.PointsMaterial({
            size: 0.05,
            color: 0xEE66A6,
            transparent: true,
            opacity: 0.8
        });

        const positions = new Float32Array(50 * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        this.mouseTrail = new THREE.Points(geometry, material);
        this.scene.add(this.mouseTrail);
    }

    onMouseMove(event) {
        // Convert mouse position to normalized device coordinates
        this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update mouse trail
        const positions = this.mouseTrail.geometry.attributes.position.array;
        for (let i = positions.length - 3; i > 0; i -= 3) {
            positions[i] = positions[i - 3];
            positions[i + 1] = positions[i - 2];
            positions[i + 2] = positions[i - 1];
        }

        // Convert mouse position to world coordinates
        const vector = new THREE.Vector3(this.mousePosition.x, this.mousePosition.y, 0.5);
        vector.unproject(this.camera);
        const dir = vector.sub(this.camera.position).normalize();
        const distance = -this.camera.position.z / dir.z;
        const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));

        positions[0] = pos.x;
        positions[1] = pos.y;
        positions[2] = pos.z;

        this.mouseTrail.geometry.attributes.position.needsUpdate = true;
    }

    setupHeartAnimation() {
        if (!this.heart) return;

        // Custom physics parameters for smoother animation
        const gravity = 2.0; // Reduced gravity for slower fall
        const timeStep = 0.5/60; // 60 FPS
        let velocity = 0;
        let position = 0;
        let time = 0;
        let heartCount = 0;
        const maxHearts = 100;
        let hearts = []; // Array to store all hearts with their states
        let textSpawnTimer = 0;
        const textSpawnInterval = 2000; // Spawn new text every 2 seconds

        // Set initial position at the top
        this.heart.position.y = -position;

        // Create animation function
        const animate = () => {
            // Update time
            time += timeStep;
            textSpawnTimer += timeStep;
            
            // Calculate new position using physics equations
            position = -9 + (0 * time) + (0.5 * gravity * time * time);
            velocity = 0 + (gravity * time);
            
            // Update main heart position and rotation
            this.heart.position.y = -position;
            this.heart.rotation.z = Math.sin(time * 4) * 0.3;
            this.heart.rotation.x = Math.cos(time * 3) * 0.2;
            this.heart.rotation.y = time * 3;

            // Spawn new hearts using while loop
            while (heartCount < maxHearts) {
                const newHeart = this.heart.clone();
                const randomX = (Math.random() - 0.5) * 30;
                const randomZ = (Math.random() - 0.5) * 20; 
                
                const randomValue = Math.random();
                const minY = -15;
                const maxY = 15;
                const randomY = minY + (randomValue * (maxY - minY));
                
                const heartState = {
                    object: newHeart,
                    velocity: 0,
                    position: randomY,
                    gravity: 2.0 + Math.random() * 0.5,
                    startX: randomX,
                    startZ: randomZ
                };
                
                newHeart.position.set(randomX, randomY, randomZ);
                this.scene.add(newHeart);
                hearts.push(heartState);
                heartCount++;
            }

            // Spawn new text periodically
            if (textSpawnTimer >= textSpawnInterval / 1000) {
                this.generateNewText();
                textSpawnTimer = 0;
            }

            // Update all hearts with independent falling motion
            hearts.forEach((heart, index) => {
                heart.velocity += heart.gravity * timeStep;
                heart.position += heart.velocity * timeStep;
                heart.object.position.y = -heart.position;
                
                heart.object.rotation.z = Math.sin(time * 4) * 0.3;
                heart.object.rotation.x = Math.cos(time * 3) * 0.2;
                heart.object.rotation.y = time * 3;

                if (heart.position > 10) {
                    heart.position = -15 + Math.random() * 5;
                    heart.velocity = 0;
                    heart.object.position.x = heart.startX;
                    heart.object.position.z = heart.startZ;
                }
            });

            // Update text positions with falling animation
            this.activeTexts.forEach((textState, index) => {
                // Ensure text keeps moving by updating velocity and position
                textState.velocity += textState.gravity * timeStep;
                textState.position += textState.velocity * timeStep;
                
                // Update text position
                textState.object.position.y = -textState.position;
                
                // Add rotation for more dynamic movement
                textState.object.rotation.z = Math.sin(time * 4) * 0.1;
                
                // Reset text to top when it reaches bottom
                if (textState.position > 10) {
                    // Reset position to top with random offset
                    textState.position = -15 + Math.random() * 5;
                    textState.velocity = 0;
                    // Keep the same X and Z positions
                    textState.object.position.x = textState.startX;
                    textState.object.position.z = textState.startZ;
                }
            });
            
            // Continue animation
            requestAnimationFrame(animate);
        };

        // Start animation
        animate();
    }

    startAutoScroll() {
        if (this.autoScrollInterval) return;
        this.autoScrollInterval = setInterval(() => this.cycleMessage(), this.scrollSpeed);
    }

    stopAutoScroll() {
        if (this.autoScrollInterval) {
            clearInterval(this.autoScrollInterval);
            this.autoScrollInterval = null;
        }
    }

    cycleMessage() {
        // Remove bottom text
        const bottomText = this.activeTexts.pop();
        this.scene.remove(bottomText);
        bottomText.dispose();

        // Move all existing texts down
        for (let i = this.activeTexts.length - 1; i >= 0; i--) {
            const text = this.activeTexts[i];
            const currentPos = this.textPositions[i + 1];
            const targetPos = this.textPositions[i];

            // Create smooth animation
            new TWEEN.Tween(text.position)
                .to({ y: targetPos.y }, 800) // Faster animation
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start();

            new TWEEN.Tween(text.scale)
                .to({ x: targetPos.scale, y: targetPos.scale, z: targetPos.scale }, 800)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start();

            new TWEEN.Tween(text.material)
                .to({ opacity: this.getOpacityForPosition(targetPos.y) }, 800)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start();
        }

        // Add new text at top
        const newText = new Text();
        newText.text = this.messages[this.currentMessageIndex];
        newText.fontSize = 0.4;
        newText.color = '#FFFFFF';
        newText.outlineColor = '#FFFFFF';
        newText.outlineWidth = 0.02;
        newText.position.set(0, this.textPositions[0].y, 0);
        newText.scale.setScalar(this.textPositions[0].scale);
        newText.anchorX = 'center';
        newText.anchorY = 'middle';
        newText.material.depthTest = false;
        newText.material.transparent = true;
        newText.material.opacity = this.getOpacityForPosition(this.textPositions[0].y);
        newText.overflowWrap = 'break-word';
        newText.maxWidth = 5;
        newText.font = 'Pacifico';
        newText.material.onBeforeCompile = (shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <color_fragment>',
                `
                #include <color_fragment>
                float glow = 0.5 + 0.5 * sin(vUv.x * 10.0 + time * 2.0);
                diffuseColor.rgb += vec3(0.1, 0.1, 0.1) * glow;
                `
            );
        };
        newText.sync();
        this.scene.add(newText);
        this.activeTexts.unshift(newText);

        // Update message index
        this.currentMessageIndex = (this.currentMessageIndex + 1) % this.messages.length;
        this.currentColorIndex = (this.currentColorIndex + 1) % this.colors.length;
    }

    getOpacityForPosition(y) {
        // Create a smooth opacity transition
        const maxOpacity = 1.0;
        const minOpacity = 0.4; // Higher minimum opacity
        const range = 4; // Total range of positions
        const normalizedY = (y + 2) / range; // Normalize y position to 0-1 range
        return minOpacity + (maxOpacity - minOpacity) * (1 - Math.abs(normalizedY - 0.5) * 2);
    }

    createParticles() {
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3); // Add velocities array

        for (let i = 0; i < particleCount; i++) {
            // Start all particles at center
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;

            // Calculate random direction for each particle
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const speed = 0.02 + Math.random() * 0.01; // Random speed between 0.02 and 0.03

            velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
            velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
            velocities[i * 3 + 2] = Math.cos(phi) * speed;

            const color = this.colors[0];
            colors[i * 3] = 255;
            colors[i * 3 + 1] = 255;
            colors[i * 3 + 2] = 255;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

        const material = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.7
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        this.particles.push(particles);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Update TWEEN
        TWEEN.update();

        // Update controls only if user is interacting
        if (this.controls.enabled) {
            this.controls.update();
        }

        // Update particles position
        this.particles.forEach(particle => {
            const positions = particle.geometry.attributes.position.array;
            const velocities = particle.geometry.attributes.velocity.array;
            
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += velocities[i];
                positions[i + 1] += velocities[i + 1];
                positions[i + 2] += velocities[i + 2];

                const distance = Math.sqrt(
                    positions[i] * positions[i] +
                    positions[i + 1] * positions[i + 1] +
                    positions[i + 2] * positions[i + 2]
                );

                if (distance > 10) {
                    positions[i] = 0;
                    positions[i + 1] = 0;
                    positions[i + 2] = 0;

                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    const speed = 0.02 + Math.random() * 0.01;

                    velocities[i] = Math.sin(phi) * Math.cos(theta) * speed;
                    velocities[i + 1] = Math.sin(phi) * Math.sin(theta) * speed;
                    velocities[i + 2] = Math.cos(phi) * speed;
                }
            }

            particle.geometry.attributes.position.needsUpdate = true;
        });

        // Update text positions with falling animation and color cycling
        this.activeTexts.forEach((textState, index) => {
            // Force continuous movement
            if (Math.abs(textState.velocity) < 0.01) {
                textState.velocity = 0.1; // Ensure minimum velocity
            }
            // Update physics
            textState.velocity += textState.gravity * (0.25/60);
            textState.position += textState.velocity * (0.25/60);
            // Update position
            textState.object.position.y = -textState.position;
            // Add rotation
            textState.object.rotation.z = Math.sin(Date.now() * 0.001 + index) * 0.1;
            
            // Color transition based on position
            const normalizedPosition = (textState.position + 18) / 28; // Normalize position from -18 to 10
            const colors = [
                { r: 255, g: 255, b: 255 },    // White
                { r: 255, g: 200, b: 200 },    // Light Red
                { r: 255, g: 100, b: 100 },    // Medium Red
                { r: 255, g: 0, b: 0 }         // Pure Red
            ];
            
            // Calculate color based on position
            let colorIndex = Math.floor(normalizedPosition * (colors.length - 1));
            let t = (normalizedPosition * (colors.length - 1)) % 1;
            
            let currentColor = colors[colorIndex];
            let nextColor = colors[Math.min(colorIndex + 1, colors.length - 1)];
            
            let r = Math.round(currentColor.r + (nextColor.r - currentColor.r) * t);
            let g = Math.round(currentColor.g + (nextColor.g - currentColor.g) * t);
            let b = Math.round(currentColor.b + (nextColor.b - currentColor.b) * t);
            
            const color = `rgb(${r}, ${g}, ${b})`;
            
            // Apply color with enhanced glow effect
            textState.object.color = color;
            textState.object.outlineColor = color;
            textState.object.outlineWidth = 0.02;
            textState.object.font = '/font/pacifico/Pacifico-Regular.ttf';
            textState.object.fontFamily = 'Pacifico, Arial, sans-serif';
            textState.object.fontWeight = 'normal';
            textState.object.fontStyle = 'normal';
            textState.object.characterSet = 'latin, symbols';
            textState.object.direction = 'ltr';
            textState.object.whiteSpace = 'normal';
            textState.object.letterSpacing = 0;
            textState.object.lineHeight = 1;
            textState.object.textAlign = 'center';
            textState.object.textBaseline = 'middle';
            textState.object.allowMultipleFonts = true;
            
            // Enhanced glow animation
            if (textState.object.material.uniforms) {
                textState.object.material.uniforms.time.value = Date.now() * 0.001;
            }
            const glowIntensity = 0.5 + 0.5 * Math.sin(Date.now() * 0.001 + index);
            textState.object.material.opacity = 0.8 + glowIntensity * 0.2;
            textState.object.sync();

            // Reset if too low
            if (textState.position > 10) {
                textState.position = -18 + Math.random() * 3; // Reset to top
                textState.velocity = 0.1;
                textState.object.position.x = textState.startX;
                textState.object.position.z = textState.startZ;
            }
        });

        // Rotate heart if it exists - only around y-axis
        if (this.heart) {
            this.heart.rotation.y += 0.005;
        }

        // Update mouse trail
        if (this.mouseTrail) {
            this.mouseTrail.rotation.x += 0.001;
            this.mouseTrail.rotation.y += 0.001;
        }

        this.renderer.render(this.scene, this.camera);
    }

    startTextGeneration() {
        // Clear any existing texts
        this.activeTexts.forEach(text => {
            this.scene.remove(text);
            text.dispose();
        });
        this.activeTexts = [];

        // Generate initial texts with shorter delays
        for (let i = 0; i < 10; i++) { // Increased from 5 to 10 initial texts
            setTimeout(() => {
                this.generateNewText();
            }, i * 300); // Reduced delay from 1000ms to 300ms
        }

        // Set up interval for continuous text generation
        if (this.generateInterval) {
            clearInterval(this.generateInterval);
        }
        this.generateInterval = setInterval(() => {
            this.generateNewText();
        }, 2000); // Reduced from 3000ms to 2000ms for more frequent generation
    }

    generateNewText() {
        const text = new Text();
        text.text = this.messages[this.currentMessageIndex];
        text.fontSize = 0.5;
        text.color = '#FFFFFF';
        text.outlineColor = '#FFFFFF';
        text.outlineWidth = 0.02;
        text.material.opacity = 0.95;
        text.anchorX = 'center';
        text.anchorY = 'middle';
        text.overflowWrap = 'break-word';
        text.maxWidth = 8;
        text.font = '/font/pacifico/Pacifico-Regular.ttf';
        text.fontFamily = 'Pacifico, Arial, sans-serif';
        text.fontWeight = 'normal';
        text.fontStyle = 'normal';
        text.characterSet = 'latin, symbols';
        text.direction = 'ltr';
        text.whiteSpace = 'normal';
        text.letterSpacing = 0;
        text.lineHeight = 1;
        text.textAlign = 'center';
        text.textBaseline = 'middle';
        text.allowMultipleFonts = true;
        // Enhanced glowing effect
        text.material.onBeforeCompile = (shader) => {
            shader.uniforms.time = { value: 0 };
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <color_fragment>',
                `
                #include <color_fragment>
                float glow = 0.5 + 0.5 * sin(vUv.x * 10.0 + time * 2.0);
                float pulse = 0.5 + 0.5 * sin(time * 3.0);
                vec3 glowColor = vec3(1.0, 0.8, 0.8); // Soft pink glow
                diffuseColor.rgb += glowColor * glow * pulse * 0.3;
                diffuseColor.rgb = mix(diffuseColor.rgb, glowColor, glow * pulse * 0.2);
                `
            );
        };
        text.sync();

        // Always start at the top (randomY between -18 and -15)
        const randomX = (Math.random() - 0.5) * 30;
        const randomZ = (Math.random() - 0.5) * 16;
        const randomY = -18 + Math.random() * 3;
        text.position.set(randomX, randomY, randomZ);
        text.scale.setScalar(0.8);

        // Lower gravity for slower fall
        const textState = {
            object: text,
            velocity: 0.1,
            position: randomY,
            gravity: 0.35 + Math.random() * 0.1,
            startX: randomX,
            startZ: randomZ
        };

        this.scene.add(text);
        this.activeTexts.push(textState);

        this.currentMessageIndex = (this.currentMessageIndex + 1) % this.messages.length;
        this.currentColorIndex = (this.currentColorIndex + 1) % this.colors.length;
    }

    startBackgroundMusic() {
        // Start background music
        this.sounds.background.play()
            .then(() => {
                console.log('Background music started');
            })
            .catch(error => {
                console.log('Background music failed to start:', error);
            });
    }
}

// Initialize the particle effect
new ParticleEffect(); 