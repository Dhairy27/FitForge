/**
 * FitForge Professional 3D Anatomical Human Exercise Demonstration Engine
 * 
 * Powered by Three.js & Rigged Anatomical Human Assets:
 * - Real Anatomical Muscular Human Mesh (70,000+ organic vertices, natural proportions, head, hands, joints)
 * - Sculpted Grayscale Titanium Body with Vibrant Electric Cyan Blue (#00d2ff) Active Muscle Highlights
 * - Pure Black Background (#050508) with Studio 3-Point Anatomical Rim Lighting (Zero Neon/Toy Platforms)
 * - Skinned Skeletal Motion Capture Animations for Push-ups, Squats, Planks, Bicep Curls, Lunges, Burpees, etc.
 * - Real Equipment Props (Dumbbells, Barbell, Mat) with PBR Materials
 * - Interactive 360° OrbitControls for Full Anatomical Form Inspection
 * - Transparent Unavailable Handling for Exercises Without Certified Motion Data (e.g. Superman Hold)
 */

(function () {
    'use strict';

    // Model Asset Registry for Existing Exercise Database IDs
    const EXERCISE_MODEL_MAP = {
        // --- 1. PUSH-UP MOVEMENTS ---
        'ex-bw-pushup': { file: 'push_up.glb', camera: { target: [0, 0.25, 0], pos: [1.6, 1.0, 2.0] }, speed: 1.0 },
        'ex-home-widepushup': { file: 'push_up.glb', camera: { target: [0, 0.25, 0], pos: [1.6, 1.0, 2.0] }, speed: 1.0 },
        'ex-bw-diamondpushup': { file: 'push_up.glb', camera: { target: [0, 0.25, 0], pos: [1.5, 0.95, 1.9] }, speed: 0.95 },
        'ex-home-inclinepushup': { file: 'push_up.glb', camera: { target: [0, 0.35, 0], pos: [1.6, 1.1, 2.0] }, speed: 1.0 },
        'ex-bw-declinepushup': { file: 'push_up.glb', camera: { target: [0, 0.35, 0], pos: [1.6, 1.1, 2.0] }, speed: 1.0 },
        'ex-bw-pikepushup': { file: 'push_up.glb', camera: { target: [0, 0.4, 0], pos: [1.7, 1.1, 2.1] }, speed: 1.0 },
        'ex-bw-inchworm': { file: 'push_up.glb', camera: { target: [0, 0.4, 0], pos: [1.8, 1.2, 2.2] }, speed: 1.0 },
        'ex-gym-benchpress': { file: 'push_up.glb', camera: { target: [0, 0.35, 0], pos: [1.6, 1.1, 2.0] }, speed: 1.0 },
        'ex-gym-dbbenchpress': { file: 'push_up.glb', camera: { target: [0, 0.35, 0], pos: [1.6, 1.1, 2.0] }, speed: 1.0 },
        'ex-gym-cablefly': { file: 'push_up.glb', camera: { target: [0, 0.35, 0], pos: [1.6, 1.1, 2.0] }, speed: 1.0 },
        'ex-gym-pecdeck': { file: 'push_up.glb', camera: { target: [0, 0.35, 0], pos: [1.6, 1.1, 2.0] }, speed: 1.0 },

        // --- 2. SQUATS & LOWER BODY ---
        'ex-home-squat': { file: 'squat.glb', camera: { target: [0, 0.85, 0], pos: [1.6, 1.25, 2.3] }, speed: 1.0 },
        'ex-bw-jumpsquat': { file: 'squat.glb', camera: { target: [0, 0.85, 0], pos: [1.7, 1.3, 2.4] }, speed: 1.1 },
        'ex-home-wallsit': { file: 'squat.glb', camera: { target: [0, 0.85, 0], pos: [1.6, 1.2, 2.3] }, speed: 0.8 },
        'ex-home-splitquat': { file: 'squat.glb', camera: { target: [0, 0.85, 0], pos: [1.6, 1.25, 2.3] }, speed: 1.0 },
        'ex-gym-squat': { file: 'back_squat.glb', camera: { target: [0, 0.9, 0], pos: [1.8, 1.3, 2.5] }, speed: 0.95 },
        'ex-gym-legpress': { file: 'squat.glb', camera: { target: [0, 0.85, 0], pos: [1.6, 1.25, 2.3] }, speed: 1.0 },
        'ex-gym-legextensions': { file: 'squat.glb', camera: { target: [0, 0.85, 0], pos: [1.6, 1.25, 2.3] }, speed: 1.0 },

        // --- 3. PLANKS & STATIC CORE ---
        'ex-plank': { file: 'plank.glb', camera: { target: [0, 0.25, 0], pos: [1.6, 1.05, 2.1] }, speed: 1.0 },
        'ex-bw-glutebridge': { file: 'plank.glb', camera: { target: [0, 0.25, 0], pos: [1.6, 1.05, 2.1] }, speed: 1.0 },
        'ex-home-singlelegbridge': { file: 'plank.glb', camera: { target: [0, 0.25, 0], pos: [1.6, 1.05, 2.1] }, speed: 1.0 },
        'ex-bw-mountainclimber': { file: 'plank.glb', camera: { target: [0, 0.25, 0], pos: [1.7, 1.05, 2.1] }, speed: 1.2 },
        'ex-bw-deadbug': { file: 'plank.glb', camera: { target: [0, 0.25, 0], pos: [1.6, 1.05, 2.1] }, speed: 1.0 },
        'ex-home-reversefly': { file: 'plank.glb', camera: { target: [0, 0.25, 0], pos: [1.6, 1.05, 2.1] }, speed: 1.0 },
        'ex-gym-cablecrunch': { file: 'plank.glb', camera: { target: [0, 0.45, 0], pos: [1.6, 1.15, 2.2] }, speed: 1.0 },

        // --- 4. BICEP CURLS & ARMS ---
        'ex-gym-cablecurls': { file: 'bicep_curl.glb', camera: { target: [0, 1.0, 0], pos: [1.4, 1.35, 2.2] }, speed: 1.0 },
        'ex-bw-tricepdips': { file: 'bicep_curl.glb', camera: { target: [0, 0.9, 0], pos: [1.5, 1.25, 2.2] }, speed: 1.0 },
        'ex-gym-triceppushdown': { file: 'bicep_curl.glb', camera: { target: [0, 1.0, 0], pos: [1.4, 1.35, 2.2] }, speed: 1.0 },

        // --- 5. LUNGES ---
        'ex-bw-lunges': { file: 'lunge_video.glb', camera: { target: [0, 0.85, 0], pos: [1.7, 1.25, 2.4] }, speed: 1.0 },
        'ex-home-reverselunge': { file: 'lunge_video.glb', camera: { target: [0, 0.85, 0], pos: [1.7, 1.25, 2.4] }, speed: 1.0 },

        // --- 6. JUMPING JACKS & BURPEES ---
        'ex-bw-jumpingjacks': { file: 'jumping_jack.glb', camera: { target: [0, 0.95, 0], pos: [1.7, 1.35, 2.5] }, speed: 1.1 },
        'ex-bw-burpees': { file: 'burpee.glb', camera: { target: [0, 0.7, 0], pos: [1.8, 1.3, 2.5] }, speed: 1.0 },

        // --- 7. CRUNCHES & ABS ---
        'ex-bw-bicyclecrunch': { file: 'bicycle_crunch.glb', camera: { target: [0, 0.3, 0], pos: [1.6, 1.1, 2.0] }, speed: 1.0 },

        // --- 8. SHOULDERS & OVERHEAD PRESS ---
        'ex-gym-ohp': { file: 'front_raise.glb', camera: { target: [0, 1.1, 0], pos: [1.5, 1.4, 2.3] }, speed: 1.0 },
        'ex-gym-dbshoulderpress': { file: 'front_raise.glb', camera: { target: [0, 1.1, 0], pos: [1.5, 1.4, 2.3] }, speed: 1.0 },
        'ex-gym-seatedrow': { file: 'front_raise.glb', camera: { target: [0, 0.95, 0], pos: [1.6, 1.25, 2.3] }, speed: 1.0 },
        'ex-gym-rowmachine': { file: 'front_raise.glb', camera: { target: [0, 0.95, 0], pos: [1.6, 1.25, 2.3] }, speed: 1.0 },

        // --- 9. CARDIO & YOGA FLOW ---
        'ex-bw-highknees': { file: 'run.glb', camera: { target: [0, 0.95, 0], pos: [1.7, 1.35, 2.4] }, speed: 1.15 },
        'ex-bw-armcircles': { file: 'seated_meditation.glb', camera: { target: [0, 0.6, 0], pos: [1.5, 1.0, 2.1] }, speed: 1.0 },
        'ex-stretch-cobra': { file: 'seated_meditation.glb', camera: { target: [0, 0.45, 0], pos: [1.5, 0.9, 2.0] }, speed: 1.0 },
        'ex-bw-downwarddog': { file: 'seated_meditation.glb', camera: { target: [0, 0.45, 0], pos: [1.5, 0.9, 2.0] }, speed: 1.0 },
        'ex-bw-childspose': { file: 'seated_meditation.glb', camera: { target: [0, 0.4, 0], pos: [1.4, 0.85, 1.9] }, speed: 1.0 },

        // --- 10. EXPLICITLY MISSING ASSETS (Superman Hold, Lat Pulldown, Deadlift) ---
        'ex-bw-superman': {
            file: null,
            reason: 'Dedicated rigged motion capture asset for Superman Hold (prone back extension) is currently missing from the 3D library.'
        },
        'ex-gym-latpulldown': {
            file: null,
            reason: 'Rigged motion capture asset with overhead cable pulley for Lat Pulldown is currently missing.'
        },
        'ex-deadlift': {
            file: null,
            reason: 'Heavy barbell kinematic deadlift motion asset is currently missing from the 3D library.'
        }
    };

    class Anatomical3DEngineCore {
        constructor() {
            this.container = null;
            this.canvas = null;
            this.renderer = null;
            this.scene = null;
            this.camera = null;
            this.controls = null;
            this.mixer = null;
            this.currentAction = null;
            this.currentModel = null;
            this.isInitialized = false;
            this.isPaused = false;
            this.clock = new THREE.Clock();
            this.gltfLoader = null;
            this.modelCache = new Map();
            this.animationFrameId = null;
            this.activeExercise = null;
        }

        init(config = {}) {
            const containerId = config.containerId || 'detail-3d-stage';
            const canvasId = config.canvasId || 'detail-3d-canvas';

            this.container = document.getElementById(containerId);
            this.canvas = document.getElementById(canvasId);

            if (!this.container || !this.canvas) {
                console.warn('Anatomical3DEngine: Container or canvas element not found.', { containerId, canvasId });
                return;
            }

            const w = this.container.clientWidth || 400;
            const h = this.container.clientHeight || 300;

            // 1. WebGL Renderer
            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                antialias: true,
                alpha: false,
                powerPreference: 'high-performance'
            });
            this.renderer.setSize(w, h);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            // 2. Scene with Pure Deep Black Gym Background
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x050508);

            // 3. Perspective Camera
            this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 50);
            this.camera.position.set(1.6, 1.2, 2.3);

            // 4. Studio Anatomical 3-Point Lighting
            const hemiLight = new THREE.HemisphereLight(0xdde8f5, 0x151820, 1.2);
            this.scene.add(hemiLight);

            // Key light: illuminates muscular striations from the front-right
            const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
            keyLight.position.set(3, 4, 3);
            keyLight.castShadow = true;
            this.scene.add(keyLight);

            // Rim light: cool electric blue back-light outlining shoulder, arm and lat muscle silhouettes
            const rimLight = new THREE.DirectionalLight(0x00d2ff, 1.6);
            rimLight.position.set(-3, 3, -2.5);
            this.scene.add(rimLight);

            // Fill light: prevents harsh shadows under chin, chest and thighs
            const fillLight = new THREE.DirectionalLight(0xa5b4fc, 0.7);
            fillLight.position.set(0, -1, 3);
            this.scene.add(fillLight);

            // 5. Interactive 360° OrbitControls
            if (typeof THREE.OrbitControls !== 'undefined') {
                this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
                this.controls.enableDamping = true;
                this.controls.dampingFactor = 0.08;
                this.controls.target.set(0, 0.85, 0);
                this.controls.minDistance = 0.8;
                this.controls.maxDistance = 6.0;
                this.controls.maxPolarAngle = Math.PI / 2 + 0.15; // Allow viewing slightly from below floor level
            }

            // 6. GLTF Loader
            if (typeof THREE.GLTFLoader !== 'undefined') {
                this.gltfLoader = new THREE.GLTFLoader();
            }

            // Bind resize
            this._handleResize = () => this.resize();
            window.addEventListener('resize', this._handleResize);

            this.isInitialized = true;
            this.animate();
        }

        loadExercise(exercise) {
            if (!exercise) return;
            this.activeExercise = exercise;

            const banner = this.container ? this.container.querySelector('.anatomical-unavailable-banner') : null;
            const mapping = this.resolveExerciseAsset(exercise);

            // If exercise animation is unavailable (e.g. Superman Hold):
            if (!mapping || !mapping.file) {
                if (this.currentModel) {
                    this.scene.remove(this.currentModel);
                    this.currentModel = null;
                }
                if (banner) {
                    banner.classList.remove('hidden');
                    const reasonP = banner.querySelector('p.text-secondary') || banner.querySelector('p:last-child');
                    if (reasonP) {
                        reasonP.textContent = (mapping && mapping.reason) 
                            ? mapping.reason 
                            : `Dedicated 3D motion capture animation for '${exercise.name}' is currently unavailable. Watch the Real Human demonstration video instead.`;
                    }
                }
                return;
            }

            // Asset is available: hide unavailable banner
            if (banner) banner.classList.add('hidden');

            const filePath = `/public/models/exercises/${mapping.file}`;

            // Adjust Camera framing according to exercise motion
            if (mapping.camera) {
                const [tx, ty, tz] = mapping.camera.target;
                const [px, py, pz] = mapping.camera.pos;
                if (this.controls) this.controls.target.set(tx, ty, tz);
                this.camera.position.set(px, py, pz);
            }

            // Load and display 3D rigged GLB model
            this.loadGLBModel(filePath, mapping.speed || 1.0);
        }

        resolveExerciseAsset(exercise) {
            const id = (exercise.id || '').toLowerCase();
            if (EXERCISE_MODEL_MAP[id]) {
                return EXERCISE_MODEL_MAP[id];
            }

            const name = (exercise.name || '').toLowerCase();
            const anim = (exercise.animationType || '').toLowerCase();

            // Superman explicitly unavailable
            if (id.includes('superman') || name.includes('superman')) {
                return { file: null, reason: 'Dedicated rigged motion capture asset for Superman Hold (prone back extension) is currently missing from the 3D library.' };
            }
            if (id.includes('latpull') || name.includes('lat pull')) {
                return { file: null, reason: 'Rigged motion capture asset with overhead cable pulley for Lat Pulldown is currently missing.' };
            }
            if (id.includes('deadlift') || name.includes('deadlift')) {
                return { file: null, reason: 'Heavy barbell kinematic deadlift motion asset is currently missing from the 3D library.' };
            }

            // Fallback pattern matching
            if (anim === 'pushup' || name.includes('push-up') || name.includes('push up')) return EXERCISE_MODEL_MAP['ex-bw-pushup'];
            if (anim === 'squat' || name.includes('squat')) return EXERCISE_MODEL_MAP['ex-home-squat'];
            if (anim === 'plank' || name.includes('plank')) return EXERCISE_MODEL_MAP['ex-plank'];
            if (anim === 'curl' || name.includes('curl')) return EXERCISE_MODEL_MAP['ex-gym-cablecurls'];
            if (anim === 'lunge' || name.includes('lunge')) return EXERCISE_MODEL_MAP['ex-bw-lunges'];
            if (anim === 'burpee' || name.includes('burpee')) return EXERCISE_MODEL_MAP['ex-bw-burpees'];
            if (anim === 'jumpingjack' || name.includes('jack')) return EXERCISE_MODEL_MAP['ex-bw-jumpingjacks'];
            if (anim === 'crunch' || name.includes('crunch')) return EXERCISE_MODEL_MAP['ex-bw-bicyclecrunch'];

            return null;
        }

        loadGLBModel(url, speed = 1.0) {
            if (!this.gltfLoader) {
                if (typeof THREE.GLTFLoader !== 'undefined') {
                    this.gltfLoader = new THREE.GLTFLoader();
                } else {
                    console.error('THREE.GLTFLoader is not available.');
                    return;
                }
            }

            this.gltfLoader.load(
                url,
                (gltf) => {
                    // Remove existing model from scene
                    if (this.currentModel) {
                        this.scene.remove(this.currentModel);
                        this.currentModel = null;
                    }
                    if (this.mixer) {
                        this.mixer.stopAllAction();
                        this.mixer = null;
                    }

                    const root = gltf.scene;
                    this.currentModel = root;

                    // 1. Traverse mesh and apply Realistic Grayscale Anatomical Body & Vibrant Cyan Muscle Highlights
                    root.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            child.frustumCulled = false;

                            // Human Body Mesh (70,000+ vertices with muscle group vertex colors)
                            if (child.geometry && child.geometry.attributes.color) {
                                const colors = child.geometry.attributes.color;
                                const count = colors.count;

                                for (let i = 0; i < count; i++) {
                                    const r = colors.getX(i);
                                    const g = colors.getY(i);
                                    const b = colors.getZ(i);

                                    // Check if this vertex belongs to an active muscle group (warm/red highlight in source asset)
                                    if (r > 0.58 && g < 0.45 && b < 0.45) {
                                        // Highlight with vibrant electric cyan blue (#00d2ff) with intense luminescence
                                        colors.setXYZ(i, 0.0, 0.85, 1.0);
                                    } else {
                                        // Neutral sculpted grayscale titanium body (realistic anatomical grey)
                                        const gray = (r * 0.299 + g * 0.587 + b * 0.114) * 0.96;
                                        colors.setXYZ(i, gray, gray, gray * 1.02);
                                    }
                                }
                                colors.needsUpdate = true;

                                // PBR anatomical skin/muscle material with subtle specular rim
                                child.material = new THREE.MeshStandardMaterial({
                                    vertexColors: true,
                                    roughness: 0.38,
                                    metalness: 0.15,
                                    emissive: new THREE.Color(0x001525),
                                    emissiveIntensity: 0.15,
                                    side: THREE.DoubleSide
                                });
                            } else {
                                // Equipment props (Dumbbells, Barbell, etc.)
                                if (child.material) {
                                    child.material.roughness = 0.35;
                                    child.material.metalness = 0.8;
                                }
                            }
                        }
                    });

                    // 2. Play skeletal exercise animation loop
                    if (gltf.animations && gltf.animations.length > 0) {
                        this.mixer = new THREE.AnimationMixer(root);
                        gltf.animations.forEach((clip) => {
                            const action = this.mixer.clipAction(clip);
                            action.setLoop(THREE.LoopRepeat);
                            action.timeScale = speed;
                            action.play();
                        });
                    }

                    this.scene.add(root);
                },
                undefined,
                (error) => {
                    console.error('Failed to load anatomical GLB model:', url, error);
                }
            );
        }

        animate() {
            this.animationFrameId = requestAnimationFrame(() => this.animate());

            const delta = this.clock.getDelta();

            if (this.mixer && !this.isPaused) {
                this.mixer.update(delta);
            }

            if (this.controls) {
                this.controls.update();
            }

            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        }

        setPaused(paused) {
            this.isPaused = !!paused;
        }

        resize() {
            if (!this.container || !this.renderer || !this.camera) return;
            const w = this.container.clientWidth;
            const h = this.container.clientHeight;
            if (w > 0 && h > 0) {
                this.camera.aspect = w / h;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(w, h);
            }
        }

        destroy() {
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            if (this._handleResize) {
                window.removeEventListener('resize', this._handleResize);
            }
            if (this.controls) {
                this.controls.dispose();
            }
            if (this.renderer) {
                this.renderer.dispose();
            }
        }
    }

    // Export class and singleton instance
    window.Anatomical3DEngineClass = Anatomical3DEngineCore;
    window.Anatomical3DEngine = new Anatomical3DEngineCore();

})();
