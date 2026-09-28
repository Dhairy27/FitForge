/**
 * FitForge Motion Studio Engine
 * Professional 60fps Biomechanical Demonstration Dummy & Contextual 3D Gym Equipment
 * Features:
 * - High-DPI Anatomical 3D-Shaded Trainer Dummy (Coach Marcus & Coach Elena)
 * - Professional Gym Studio with Perspective Floor, LED Pillars & Contextual Equipment
 * - Full 15-Exercise Certified Kinematic Library with Smooth 4-Phase Cycles
 * - Accurate Equipment: Power Squat Rack, Olympic Barbell & Bumper Plates, Hex Dumbbells,
 *   Padded Gym Bench, Alignment Workout Mat, Pull-Up Rig, and Elastic Resistance Band
 * - Complete MongoDB Persistence & Ecosystem Sync (Workouts, Daily Protocol, Weekly Planner, Streak)
 */

(function () {
    'use strict';

    class LiveCoachEngine {
        constructor() {
            this.active = false;
            this.paused = false;
            this.trainerGender = 'male'; // 'male' | 'female'
            this.currentExercise = null;
            this.currentRep = 0;
            this.targetReps = 12;
            this.currentSet = 1;
            this.targetSets = 3;
            this.cycleTime = 0.0; // 0.0 to 1.0 within repetition
            this.repTempo = 3.6; // seconds per repetition
            this.exercisePhase = 0; // 0: Start, 1: Move, 2: Peak, 3: Return
            this.sessionSeconds = 0;
            this.caloriesBurned = 0;
            this.isResting = false;
            this.restSecondsLeft = 0;

            // Canvas & Sizing
            this.canvas = null;
            this.ctx = null;
            this.width = 800;
            this.height = 600;
            this.dpr = 1;

            // Animation & Timers
            this.animFrameId = null;
            this.lastTime = performance.now();
            this.sessionInterval = null;
            this.restInterval = null;

            // BroadcastChannel & Socket.IO
            this.broadcastChannel = null;
            try {
                this.broadcastChannel = new BroadcastChannel('fitforge_sync_channel');
            } catch (e) {
                console.warn("BroadcastChannel not supported:", e);
            }
        }

        init({ canvasId }) {
            this.canvas = document.getElementById(canvasId);
            if (this.canvas) {
                this.ctx = this.canvas.getContext('2d');
                this.resizeCanvas();
                window.addEventListener('resize', () => this.resizeCanvas());
            }

            // Keyboard Shortcuts: Space (Pause), T (Switch Coach), F (Fullscreen)
            window.addEventListener('keydown', (e) => {
                if (!this.active) return;
                if (e.code === 'Space') {
                    e.preventDefault();
                    this.togglePause();
                } else if (e.code === 'KeyT') {
                    this.toggleGender();
                } else if (e.code === 'KeyF') {
                    this.toggleFullscreen();
                }
            });
        }

        resizeCanvas() {
            if (!this.canvas) return;
            const rect = this.canvas.getBoundingClientRect();
            this.dpr = window.devicePixelRatio || 1;
            this.width = rect.width || 800;
            this.height = rect.height || 600;

            this.canvas.width = Math.round(this.width * this.dpr);
            this.canvas.height = Math.round(this.height * this.dpr);
        }

        startSession(exercise, options = {}) {
            this.active = true;
            this.paused = false;
            this.currentExercise = exercise;
            this.currentRep = 0;
            this.targetReps = parseInt(exercise.reps) || 12;
            this.currentSet = 1;
            this.targetSets = exercise.sets || 3;
            this.cycleTime = 0.0;
            this.sessionSeconds = 0;
            this.caloriesBurned = 0;
            this.isResting = false;

            if (options.trainerGender) {
                this.trainerGender = options.trainerGender;
            }

            this.resizeCanvas();

            // Pacing tempo tailored to movement type
            const exType = this.resolveExerciseType(exercise);
            if (['jumping_jacks', 'mountain_climber', 'cardio'].includes(exType)) {
                this.repTempo = 1.4; // fast cadence
            } else if (['burpee'].includes(exType)) {
                this.repTempo = 4.0; // full compound chain
            } else {
                this.repTempo = 3.4; // controlled hypertrophy tempo
            }

            // Start animation loop
            this.lastTime = performance.now();
            if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
            this.animFrameId = requestAnimationFrame((t) => this.renderLoop(t));

            // Start session clock
            if (this.sessionInterval) clearInterval(this.sessionInterval);
            this.sessionInterval = setInterval(() => {
                if (!this.paused && !this.isResting) {
                    this.sessionSeconds++;
                    const rate = (exType === 'cardio' || exType === 'burpee' ? 0.22 : 0.16);
                    this.caloriesBurned = Math.round(this.sessionSeconds * rate);
                    this.updateUI();
                }
            }, 1000);

            this.updateUI();
        }

        renderLoop(currentTime) {
            if (!this.active) return;

            const delta = Math.min((currentTime - this.lastTime) / 1000, 0.1);
            this.lastTime = currentTime;

            if (!this.paused && !this.isResting) {
                this.cycleTime += delta / this.repTempo;
                if (this.cycleTime >= 1.0) {
                    this.cycleTime = 0.0;
                    this.onRepComplete();
                }

                // 4 Phases: 0: Start, 1: Movement, 2: Peak, 3: Return
                if (this.cycleTime < 0.25) {
                    this.exercisePhase = 0;
                } else if (this.cycleTime < 0.50) {
                    this.exercisePhase = 1;
                } else if (this.cycleTime < 0.75) {
                    this.exercisePhase = 2;
                } else {
                    this.exercisePhase = 3;
                }
            }

            this.drawScene();
            this.animFrameId = requestAnimationFrame((t) => this.renderLoop(t));
        }

        onRepComplete() {
            this.currentRep++;
            this.updateUI();

            if (this.currentRep >= this.targetReps) {
                this.currentRep = 0;
                this.logSet();
            }
        }

        logSet() {
            if (this.currentSet < this.targetSets) {
                this.currentSet++;
                this.startRest(this.currentExercise?.rest || 35);
            } else {
                this.finishWorkout();
            }
            this.updateUI();
        }

        startRest(seconds = 35) {
            this.isResting = true;
            this.restSecondsLeft = seconds;

            const overlay = document.getElementById('player-rest-overlay');
            const controls = document.getElementById('player-active-controls');
            if (overlay) overlay.classList.remove('hidden');
            if (controls) controls.classList.add('hidden');

            if (this.restInterval) clearInterval(this.restInterval);
            this.restInterval = setInterval(() => {
                this.restSecondsLeft--;
                this.updateRestDisplay();
                if (this.restSecondsLeft <= 0) {
                    this.endRest();
                }
            }, 1000);
            this.updateRestDisplay();
        }

        endRest() {
            if (this.restInterval) clearInterval(this.restInterval);
            this.isResting = false;

            const overlay = document.getElementById('player-rest-overlay');
            const controls = document.getElementById('player-active-controls');
            if (overlay) overlay.classList.add('hidden');
            if (controls) controls.classList.remove('hidden');

            this.updateUI();
        }

        skipRest() {
            this.endRest();
        }

        updateRestDisplay() {
            const secEl = document.getElementById('rest-timer-secs');
            const ringEl = document.getElementById('rest-timer-ring');
            if (secEl) secEl.innerText = this.restSecondsLeft;
            if (ringEl) {
                const total = this.currentExercise?.rest || 35;
                const circ = 2 * Math.PI * 50; // 314.159
                const progress = Math.max(0, this.restSecondsLeft / total);
                ringEl.style.strokeDashoffset = circ * (1 - progress);
            }
        }

        async finishWorkout() {
            this.active = false;
            if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
            if (this.sessionInterval) clearInterval(this.sessionInterval);
            if (this.restInterval) clearInterval(this.restInterval);

            const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('fitforge_email') || 'athlete@fitforge.com';
            const durationMins = Math.max(1, Math.round(this.sessionSeconds / 60));
            const calories = this.caloriesBurned || (durationMins * 9);
            const totalReps = (this.currentSet * this.targetReps);

            // Populate celebration modal
            const durEl = document.getElementById('complete-duration');
            const calEl = document.getElementById('complete-calories');
            const setsEl = document.getElementById('complete-sets');
            const repsEl = document.getElementById('complete-reps');
            const formEl = document.getElementById('complete-form-score');
            const compModal = document.getElementById('completion-modal');

            if (durEl) durEl.innerText = `${durationMins} mins`;
            if (calEl) calEl.innerText = `${calories} kcal`;
            if (setsEl) setsEl.innerText = `${this.targetSets} Sets`;
            if (repsEl) repsEl.innerText = `${totalReps} Reps`;
            if (formEl) formEl.innerText = `100% Certified Form`;
            if (compModal) compModal.classList.remove('hidden');

            // Send POST /api/workout-session/complete
            if (userEmail) {
                try {
                    const response = await fetch('/api/workout-session/complete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: userEmail,
                            workoutName: this.currentExercise ? this.currentExercise.name : "Motion Studio Routine",
                            category: this.currentExercise ? this.currentExercise.category : "Strength",
                            duration: durationMins,
                            durationSeconds: this.sessionSeconds,
                            calories: calories,
                            repsCompleted: totalReps,
                            setsCompleted: this.targetSets,
                            avgFormScore: 98,
                            targetMuscles: this.currentExercise ? (this.currentExercise.targetMuscles || this.currentExercise.muscle) : "Full Body",
                            exercises: [
                                {
                                    name: this.currentExercise ? this.currentExercise.name : "Exercise Demo",
                                    sets: this.targetSets,
                                    reps: `${this.targetReps}`,
                                    completed: true
                                }
                            ]
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (this.broadcastChannel) {
                            this.broadcastChannel.postMessage({
                                type: 'workout:completed',
                                source: 'live_coach_session',
                                calories: calories,
                                duration: durationMins,
                                streak: data.metrics?.activeStreak || 1,
                                timestamp: new Date().toISOString()
                            });
                        }

                        if (window.socket && window.socket.connected) {
                            window.socket.emit('fitforge:state-changed', {
                                entity: 'workout',
                                action: 'session_completed',
                                email: userEmail,
                                calories: calories,
                                duration: durationMins
                            });
                        }
                    }
                } catch (err) {
                    console.error("Session completion persist failed:", err);
                }
            }
        }

        updateUI() {
            // Rep count & ring
            const repEl = document.getElementById('live-rep-count');
            const targetRepEl = document.getElementById('live-target-reps');
            const repRingEl = document.getElementById('live-rep-ring');
            if (repEl) repEl.innerText = this.currentRep;
            if (targetRepEl) targetRepEl.innerText = `/ ${this.targetReps} REPS`;
            if (repRingEl) {
                const circ = 2 * Math.PI * 46; // 289.026
                const pct = Math.min(1, this.currentRep / Math.max(1, this.targetReps));
                repRingEl.style.strokeDashoffset = circ * (1 - pct);
            }

            // Sets & Time
            const setEl = document.getElementById('player-completed-sets');
            const targetSetEl = document.getElementById('player-target-sets');
            if (setEl) setEl.innerText = this.currentSet;
            if (targetSetEl) targetSetEl.innerText = `${this.targetSets} Sets`;

            const durEl = document.getElementById('player-session-time');
            if (durEl) {
                const mins = Math.floor(this.sessionSeconds / 60);
                const secs = this.sessionSeconds % 60;
                durEl.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }

            // Calories
            const calEl = document.getElementById('live-calories-burned');
            if (calEl) calEl.innerText = `${this.caloriesBurned} kcal`;

            // Coach Gender Button Display (if present)
            const genderBtn = document.getElementById('btn-toggle-gender');
            if (genderBtn) {
                genderBtn.innerHTML = `
                    <span class="material-symbols-outlined text-sm text-purple-400">person</span>
                    <span>${this.trainerGender === 'male' ? 'Coach Marcus (Male)' : 'Coach Elena (Female)'}</span>
                `;
            }

            // UNIFIED START / PAUSE BUTTON Visual State
            const toggleBtn = document.getElementById('player-btn-toggle');
            if (toggleBtn) {
                if (this.paused) {
                    toggleBtn.className = "w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-headline text-xs uppercase tracking-wider font-bold active:scale-95 transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/50 animate-pulse";
                    toggleBtn.innerHTML = `
                        <span class="material-symbols-outlined text-lg">play_arrow</span>
                        <span>START DEMO</span>
                    `;
                } else {
                    toggleBtn.className = "w-full py-3.5 px-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-headline text-xs uppercase tracking-wider font-bold active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.2)]";
                    toggleBtn.innerHTML = `
                        <span class="material-symbols-outlined text-lg">pause</span>
                        <span>PAUSE DEMO</span>
                    `;
                }
            }

            // Legacy individual buttons (if present)
            const startBtn = document.getElementById('player-btn-start');
            const pauseBtn = document.getElementById('player-btn-pause');
            const headerStartBtn = document.getElementById('btn-header-start');

            if (startBtn) {
                if (this.paused) {
                    startBtn.className = "py-3 px-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-headline text-xs uppercase tracking-wider font-bold active:scale-95 transition-all shadow-[0_0_25px_rgba(16,185,129,0.5)] cursor-pointer flex items-center justify-center gap-1.5 border border-emerald-300 animate-pulse";
                } else {
                    startBtn.className = "py-3 px-2 rounded-2xl bg-emerald-600/80 hover:bg-emerald-600 text-white font-headline text-xs uppercase tracking-wider font-bold active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] cursor-pointer flex items-center justify-center gap-1.5 border border-emerald-400/40";
                }
            }

            if (pauseBtn) {
                if (this.paused) {
                    pauseBtn.className = "py-3 px-2 rounded-2xl bg-amber-500/40 border border-amber-400 text-amber-200 font-headline text-xs uppercase tracking-wider font-bold active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)]";
                } else {
                    pauseBtn.className = "py-3 px-2 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-headline text-xs uppercase tracking-wider font-bold active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5";
                }
            }

            if (headerStartBtn) {
                headerStartBtn.innerHTML = `
                    <span class="material-symbols-outlined text-sm text-emerald-400">${this.paused ? 'play_arrow' : 'pause'}</span>
                    <span>${this.paused ? 'Start' : 'Pause'}</span>
                `;
            }
        }

        startWorkout() {
            this.paused = false;
            this.updateUI();
        }

        pauseWorkout() {
            this.paused = true;
            this.updateUI();
        }

        togglePause() {
            this.paused = !this.paused;
            this.updateUI();
        }

        stopWorkout() {
            this.finishWorkout();
        }

        toggleGender() {
            this.trainerGender = (this.trainerGender === 'male' ? 'female' : 'male');
            this.updateUI();
        }

        toggleFullscreen() {
            const modal = document.getElementById('live-player-modal');
            if (!document.fullscreenElement) {
                if (modal && modal.requestFullscreen) {
                    modal.requestFullscreen().catch(err => console.warn(err));
                }
            } else if (document.exitFullscreen) {
                document.exitFullscreen();
            }
            setTimeout(() => this.resizeCanvas(), 200);
        }

        exitSession() {
            this.active = false;
            if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
            if (this.sessionInterval) clearInterval(this.sessionInterval);
            if (this.restInterval) clearInterval(this.restInterval);

            const modal = document.getElementById('live-player-modal');
            if (modal) modal.classList.add('hidden');
        }

        resolveExerciseType(exercise) {
            if (!exercise) return 'squat';
            const name = (exercise.name || '').toLowerCase();
            const anim = (exercise.animationType || '').toLowerCase();

            if (anim.includes('pushup') || name.includes('push-up') || name.includes('pushup')) return 'pushup';
            if (anim.includes('bench') || name.includes('bench press')) return 'bench_press';
            if (anim.includes('squat') || name.includes('squat')) return 'squat';
            if (anim.includes('lunge') || name.includes('lunge')) return 'lunge';
            if (anim.includes('deadlift') || name.includes('deadlift')) return 'deadlift';
            if (anim.includes('curl') || name.includes('bicep')) return 'curl';
            if (name.includes('shoulder press') || name.includes('overhead press')) return 'shoulder_press';
            if (name.includes('pull up') || name.includes('pull-up') || name.includes('chin up')) return 'pullup';
            if (anim.includes('burpee') || name.includes('burpee')) return 'burpee';
            if (anim.includes('jack') || name.includes('jumping jack')) return 'jumping_jacks';
            if (anim.includes('climber') || name.includes('mountain climber')) return 'mountain_climber';
            if (anim.includes('plank') || name.includes('plank')) return 'plank';
            if (anim.includes('yoga') || name.includes('yoga') || name.includes('warrior') || name.includes('dog') || name.includes('cobra')) return 'yoga';
            if (anim.includes('stretch') || name.includes('stretch')) return 'stretching';
            if (anim.includes('cardio') || name.includes('hiit') || name.includes('high knee')) return 'cardio';

            return 'squat';
        }

        /**
         * Main 60fps Scene Drawing Routine
         */
        drawScene() {
            if (!this.canvas || !this.ctx) return;
            const ctx = this.ctx;
            const w = this.width;
            const h = this.height;

            ctx.save();
            ctx.scale(this.dpr, this.dpr);
            ctx.clearRect(0, 0, w, h);

            const exType = this.resolveExerciseType(this.currentExercise);
            const isHorizontal = ['pushup', 'plank', 'mountain_climber'].includes(exType);
            const isBench = (exType === 'bench_press');
            const isPullup = (exType === 'pullup');

            // Establish responsive floor baseline
            const floorY = isPullup ? h * 0.88 : (isHorizontal ? h * 0.72 : (isBench ? h * 0.76 : h * 0.76));

            // 1. Draw Professional Studio Environment
            this.drawStudioEnvironment(ctx, w, h, floorY);

            // 2. Compute smooth parametric movement curve t in [0, 1]
            // Sine eased curve: 0 -> 1 -> 0
            const t = Math.sin(this.cycleTime * Math.PI);

            // 3. Draw Equipment Background (Squat Rack, Bench Frame, Mat, Pullup Bar)
            this.drawEquipmentBackground(ctx, exType, w, h, floorY, t);

            // 4. Draw Floor Contact Shadow
            this.drawContactShadow(ctx, exType, w, floorY, t);

            // 5. Draw Athletic Human Trainer Dummy (Centered, fully visible, proper biomechanics)
            this.drawTrainerDummy(ctx, exType, w, h, floorY, t);

            // 6. Draw Equipment Foreground (Barbell in hands, Dumbbells, Bands)
            this.drawEquipmentForeground(ctx, exType, w, h, floorY, t);

            // 7. Draw Movement Phase HUD Badge directly on Canvas
            this.drawMovementPhaseBadge(ctx, w, h, t);

            ctx.restore();
        }

        /**
         * Professional Modern Studio Gym (Obsidian, Vertical Purple Pillars & Floor Perspective)
         */
        drawStudioEnvironment(ctx, w, h, floorY) {
            // Dark obsidian gradient wall
            const wallGrad = ctx.createLinearGradient(0, 0, 0, floorY);
            wallGrad.addColorStop(0, '#06060a');
            wallGrad.addColorStop(0.5, '#0b0b14');
            wallGrad.addColorStop(1, '#13121f');
            ctx.fillStyle = wallGrad;
            ctx.fillRect(0, 0, w, floorY);

            // Center Ambient Purple Halo
            const haloGrad = ctx.createRadialGradient(w * 0.5, floorY * 0.45, 20, w * 0.5, floorY * 0.45, w * 0.55);
            haloGrad.addColorStop(0, 'rgba(168, 85, 247, 0.20)');
            haloGrad.addColorStop(0.6, 'rgba(139, 92, 246, 0.05)');
            haloGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = haloGrad;
            ctx.fillRect(0, 0, w, floorY);

            // Dual Vertical Neon Purple LED Light Pillars
            [w * 0.10, w * 0.90].forEach(px => {
                const pillarGrad = ctx.createLinearGradient(px - 15, 0, px + 15, 0);
                pillarGrad.addColorStop(0, 'transparent');
                pillarGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.35)');
                pillarGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = pillarGrad;
                ctx.fillRect(px - 20, 0, 40, floorY);

                ctx.fillStyle = '#c084fc';
                ctx.shadowColor = '#c084fc';
                ctx.shadowBlur = 10;
                ctx.fillRect(px - 1.5, h * 0.05, 3, floorY - h * 0.05);
                ctx.shadowBlur = 0;
            });

            // Polished Dark Rubber Flooring
            const floorGrad = ctx.createLinearGradient(0, floorY, 0, h);
            floorGrad.addColorStop(0, '#151520');
            floorGrad.addColorStop(0.4, '#0f0f18');
            floorGrad.addColorStop(1, '#060609');
            ctx.fillStyle = floorGrad;
            ctx.fillRect(0, floorY, w, h - floorY);

            // Perspective Floor Lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.lineWidth = 1.2;
            [-3, -2, -1, 0, 1, 2, 3].forEach(step => {
                ctx.beginPath();
                ctx.moveTo(w * 0.5 + step * (w * 0.09), floorY);
                ctx.lineTo(w * 0.5 + step * (w * 0.22), h);
                ctx.stroke();
            });

            // Floor Baseboard Glow Line
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, floorY);
            ctx.lineTo(w, floorY);
            ctx.stroke();
        }

        /**
         * Contextual Equipment Background
         */
        drawEquipmentBackground(ctx, exType, w, h, floorY, t) {
            const cx = w * 0.5;

            // 1. Alignment Yoga / Exercise Mat (Pushup, Plank, Burpee, Mountain Climber, Yoga, Stretching)
            if (['pushup', 'plank', 'burpee', 'mountain_climber', 'yoga', 'stretching'].includes(exType)) {
                ctx.save();
                const matW = Math.min(w * 0.70, 460);
                const matH = 34;
                const matX = cx - matW / 2;
                const matY = floorY - 6;

                // Mat base gradient
                const matGrad = ctx.createLinearGradient(matX, matY, matX + matW, matY);
                matGrad.addColorStop(0, '#2e1065');
                matGrad.addColorStop(0.5, '#581c87');
                matGrad.addColorStop(1, '#2e1065');
                ctx.fillStyle = matGrad;
                ctx.beginPath();
                ctx.roundRect(matX, matY, matW, matH, 6);
                ctx.fill();

                // Mat Center Alignment Guidelines
                ctx.strokeStyle = '#a855f7';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(matX + 24, matY + matH * 0.5);
                ctx.lineTo(matX + matW - 24, matY + matH * 0.5);
                ctx.stroke();

                // Mat hand placement indicators
                [-120, 120].forEach(offset => {
                    ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
                    ctx.beginPath();
                    ctx.arc(cx + offset, matY + matH * 0.5, 6, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }

            // 2. Commercial Power Squat Rack (Squats)
            if (exType === 'squat') {
                ctx.save();
                ctx.strokeStyle = '#27272a';
                ctx.lineWidth = 8;
                ctx.lineCap = 'square';

                const rackLeft = cx - 110;
                const rackRight = cx + 110;
                const rackTop = floorY - 260;

                // Vertical steel pillars
                ctx.beginPath();
                ctx.moveTo(rackLeft, floorY);
                ctx.lineTo(rackLeft, rackTop);
                ctx.moveTo(rackRight, floorY);
                ctx.lineTo(rackRight, rackTop);
                // Top crossbar
                ctx.moveTo(rackLeft, rackTop);
                ctx.lineTo(rackRight, rackTop);
                ctx.stroke();

                // Yellow J-Hooks at shoulder height
                ctx.fillStyle = '#eab308';
                const jHookY = floorY - 170;
                ctx.fillRect(rackLeft - 4, jHookY, 14, 8);
                ctx.fillRect(rackRight - 10, jHookY, 14, 8);
                ctx.restore();
            }

            // 3. Flat Padded Weight Bench (Bench Press)
            if (exType === 'bench_press') {
                ctx.save();
                const benchW = 280;
                const benchH = 22;
                const benchX = cx - benchW / 2;
                const benchY = floorY - 80;

                // Heavy steel frame & legs
                ctx.fillStyle = '#27272a';
                ctx.fillRect(benchX + 30, benchY + benchH, 12, floorY - (benchY + benchH));
                ctx.fillRect(benchX + benchW - 42, benchY + benchH, 12, floorY - (benchY + benchH));
                ctx.fillRect(benchX + 15, floorY - 8, 42, 8);
                ctx.fillRect(benchX + benchW - 57, floorY - 8, 42, 8);

                // High-density padded leather cushion
                const padGrad = ctx.createLinearGradient(0, benchY, 0, benchY + benchH);
                padGrad.addColorStop(0, '#1c1917');
                padGrad.addColorStop(0.5, '#292524');
                padGrad.addColorStop(1, '#0c0a09');
                ctx.fillStyle = padGrad;
                ctx.strokeStyle = '#a855f7';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.roundRect(benchX, benchY, benchW, benchH, 5);
                ctx.fill();
                ctx.stroke();

                // Bench headrest red/purple accent stitching
                ctx.strokeStyle = '#c084fc';
                ctx.lineWidth = 1;
                ctx.strokeRect(benchX + 6, benchY + 4, 38, benchH - 8);
                ctx.restore();
            }

            // 4. Overhead Commercial Pull-Up Rig (Pull Ups)
            if (exType === 'pullup') {
                ctx.save();
                const barY = h * 0.16;
                const barLeft = cx - 140;
                const barRight = cx + 140;

                // Vertical steel uprights
                ctx.strokeStyle = '#27272a';
                ctx.lineWidth = 10;
                ctx.beginPath();
                ctx.moveTo(barLeft, floorY);
                ctx.lineTo(barLeft, barY);
                ctx.moveTo(barRight, floorY);
                ctx.lineTo(barRight, barY);
                ctx.stroke();

                // High-tensile steel pull-up bar
                const barGrad = ctx.createLinearGradient(barLeft, barY, barRight, barY);
                barGrad.addColorStop(0, '#52525b');
                barGrad.addColorStop(0.5, '#e4e4e7');
                barGrad.addColorStop(1, '#52525b');
                ctx.strokeStyle = barGrad;
                ctx.lineWidth = 7;
                ctx.beginPath();
                ctx.moveTo(barLeft - 15, barY);
                ctx.lineTo(barRight + 15, barY);
                ctx.stroke();
                ctx.restore();
            }
        }

        /**
         * Floor Contact Shadow
         */
        drawContactShadow(ctx, exType, w, floorY, t) {
            const cx = w * 0.5;
            const isHorizontal = ['pushup', 'plank', 'mountain_climber', 'burpee'].includes(exType);
            const isPullup = (exType === 'pullup');
            const isBench = (exType === 'bench_press');

            ctx.save();
            ctx.beginPath();
            let shadowW = 80;
            let shadowAlpha = 0.55;

            if (isHorizontal) {
                shadowW = 160;
                shadowAlpha = 0.65;
            } else if (isBench) {
                shadowW = 140;
                shadowAlpha = 0.70;
            } else if (isPullup) {
                shadowW = 40;
                shadowAlpha = 0.25;
            } else if (exType === 'squat') {
                shadowW = 95 + t * 15;
            }

            ctx.ellipse(cx, floorY + 4, shadowW, 12, 0, 0, Math.PI * 2);
            const grad = ctx.createRadialGradient(cx, floorY + 4, 4, cx, floorY + 4, shadowW);
            grad.addColorStop(0, `rgba(0, 0, 0, ${shadowAlpha})`);
            grad.addColorStop(0.6, `rgba(0, 0, 0, ${shadowAlpha * 0.4})`);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.restore();
        }

        /**
         * Renders the Certified Athletic Human Dummy Model
         */
        drawTrainerDummy(ctx, exType, w, h, floorY, t) {
            const cx = w * 0.5;
            const isFemale = (this.trainerGender === 'female');

            // Skin tones & compression apparel colors
            const skinBase = isFemale ? '#e0a98b' : '#c98a65';
            const skinShadow = isFemale ? '#ba7c5d' : '#a26240';
            const appMain = '#14141d';
            const appAccent = '#a855f7';
            const appSecondary = isFemale ? '#ec4899' : '#8b5cf6';

            switch (exType) {
                case 'pushup':
                    this.drawPushupDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale);
                    break;
                case 'plank':
                    this.drawPlankDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale);
                    break;
                case 'bench_press':
                    this.drawBenchPressDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale);
                    break;
                case 'squat':
                    this.drawSquatDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale);
                    break;
                case 'lunge':
                    this.drawLungeDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale);
                    break;
                case 'deadlift':
                    this.drawDeadliftDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale);
                    break;
                case 'curl':
                    this.drawBicepCurlDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale);
                    break;
                case 'shoulder_press':
                    this.drawShoulderPressDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale);
                    break;
                case 'pullup':
                    this.drawPullUpDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale);
                    break;
                case 'burpee':
                    this.drawBurpeeDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale);
                    break;
                case 'jumping_jacks':
                    this.drawJumpingJacksDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale);
                    break;
                case 'mountain_climber':
                    this.drawMountainClimberDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale);
                    break;
                case 'yoga':
                    this.drawYogaDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale);
                    break;
                case 'stretching':
                    this.drawStretchingDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale);
                    break;
                case 'cardio':
                default:
                    this.drawCardioDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale);
                    break;
            }
        }

        // ==================== 15 INDIVIDUAL DUMMY EXERCISE RENDERERS ====================

        /**
         * 1. PUSHUP (Flawless Horizontal Plank with Smooth Chest Lowering & Drive)
         */
        drawPushupDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale) {
            const matY = floorY - 6;
            // t = 0 (high lockout), t = 1 (chest 2 inches above mat)
            const drop = t * 44;

            const footX = cx - 130;
            const footY = matY - 8;
            const kneeX = cx - 70;
            const kneeY = matY - 20 + drop * 0.4;
            const hipX = cx - 10;
            const hipY = matY - 38 + drop * 0.75;
            const shoulderX = cx + 80;
            const shoulderY = matY - 55 + drop;
            const headX = cx + 115;
            const headY = matY - 60 + drop;

            // Hand on mat
            const handX = cx + 75;
            const handY = matY - 6;
            const elbowX = cx + 60 - t * 12;
            const elbowY = matY - 32 + drop * 0.55;

            // 1. Legs (Sneakers, calves, thighs)
            this.drawLeg(ctx, hipX, hipY, kneeX, kneeY, footX, footY, skinBase, skinShadow, appMain, appAccent, isFemale);

            // 2. Torso (Horizontal rigid spine from hips to shoulders)
            this.drawTorsoHorizontal(ctx, hipX, hipY, shoulderX, shoulderY, appMain, appAccent, isFemale);

            // 3. Head (Facing mat forward)
            this.drawHead(ctx, headX, headY, 15, isFemale, skinBase, skinShadow);

            // 4. Arms (Pushup bending at 45 degree angle)
            this.drawArm(ctx, shoulderX, shoulderY, elbowX, elbowY, handX, handY, skinBase, skinShadow, appAccent, isFemale);
        }

        /**
         * 2. SQUATS (Olympic Barbell on Traps, Deep Parallel 90° Squat, Knee Tracking)
         */
        drawSquatDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale) {
            // t = 0 (standing tall), t = 1 (parallel squat)
            const drop = t * 75;
            const footY = floorY - 6;
            const footSpread = 50 + t * 12;

            const pelvisY = floorY - 170 + drop;
            const shoulderY = floorY - 275 + drop * 0.95;
            const headY = floorY - 310 + drop * 0.95;

            const leftKneeX = cx - footSpread * 0.55 - t * 16;
            const rightKneeX = cx + footSpread * 0.55 + t * 16;
            const kneeY = floorY - 90 + drop * 0.45;

            // Legs
            this.drawLeg(ctx, cx - 18, pelvisY, leftKneeX, kneeY, cx - footSpread, footY, skinBase, skinShadow, appMain, appAccent, isFemale);
            this.drawLeg(ctx, cx + 18, pelvisY, rightKneeX, kneeY, cx + footSpread, footY, skinBase, skinShadow, appMain, appAccent, isFemale);

            // Torso
            this.drawTorsoVertical(ctx, cx, pelvisY, cx, shoulderY, appMain, appAccent, isFemale);

            // Head
            this.drawHead(ctx, cx, headY, 16, isFemale, skinBase, skinShadow);

            // Arms holding barbell behind shoulders
            this.drawArm(ctx, cx - 36, shoulderY + 8, cx - 55, shoulderY + 28, cx - 44, shoulderY - 2, skinBase, skinShadow, appAccent, isFemale);
            this.drawArm(ctx, cx + 36, shoulderY + 8, cx + 55, shoulderY + 28, cx + 44, shoulderY - 2, skinBase, skinShadow, appAccent, isFemale);
        }

        /**
         * 3. LUNGES (90° Knee Bend, Upright Torso, Hex Dumbbells at Sides)
         */
        drawLungeDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale) {
            const drop = t * 65;
            const pelvisY = floorY - 175 + drop;
            const shoulderY = floorY - 275 + drop;
            const headY = floorY - 310 + drop;

            // Front foot (left) forward
            const frontFootX = cx + 70;
            const frontFootY = floorY - 6;
            const frontKneeX = cx + 65;
            const frontKneeY = floorY - 85 + drop * 0.3;

            // Rear foot (right) back on ball of foot
            const backFootX = cx - 80;
            const backFootY = floorY - 6;
            const backKneeX = cx - 30;
            const backKneeY = floorY - 80 + drop * 0.85;

            // Back leg
            this.drawLeg(ctx, cx - 14, pelvisY, backKneeX, backKneeY, backFootX, backFootY, skinBase, skinShadow, appMain, appAccent, isFemale);
            // Front leg
            this.drawLeg(ctx, cx + 14, pelvisY, frontKneeX, frontKneeY, frontFootX, frontFootY, skinBase, skinShadow, appMain, appAccent, isFemale);

            // Torso upright
            this.drawTorsoVertical(ctx, cx, pelvisY, cx, shoulderY, appMain, appAccent, isFemale);
            this.drawHead(ctx, cx, headY, 16, isFemale, skinBase, skinShadow);

            // Arms hanging vertically with dumbbells
            this.drawArm(ctx, cx - 32, shoulderY + 8, cx - 34, shoulderY + 58, cx - 34, shoulderY + 95, skinBase, skinShadow, appAccent, isFemale);
            this.drawArm(ctx, cx + 32, shoulderY + 8, cx + 34, shoulderY + 58, cx + 34, shoulderY + 95, skinBase, skinShadow, appAccent, isFemale);
        }

        /**
         * 4. PLANKS (Isometric Forearm Base, Perfectly Straight Spine)
         */
        drawPlankDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale) {
            const matY = floorY - 6;
            // Subtle breathing motion
            const breath = Math.sin(this.cycleTime * Math.PI * 4) * 3;

            const footX = cx - 130;
            const footY = matY - 8;
            const kneeX = cx - 70;
            const kneeY = matY - 22;
            const hipX = cx - 10;
            const hipY = matY - 38 + breath;
            const shoulderX = cx + 80;
            const shoulderY = matY - 48 + breath;
            const headX = cx + 115;
            const headY = matY - 50 + breath;

            // Forearm base
            const elbowX = cx + 80;
            const elbowY = matY - 8;
            const handX = cx + 110;
            const handY = matY - 6;

            this.drawLeg(ctx, hipX, hipY, kneeX, kneeY, footX, footY, skinBase, skinShadow, appMain, appAccent, isFemale);
            this.drawTorsoHorizontal(ctx, hipX, hipY, shoulderX, shoulderY, appMain, appAccent, isFemale);
            this.drawHead(ctx, headX, headY, 15, isFemale, skinBase, skinShadow);

            // Forearm plank arm (elbow grounded under shoulder, hand forward)
            this.drawArm(ctx, shoulderX, shoulderY, elbowX, elbowY, handX, handY, skinBase, skinShadow, appAccent, isFemale);
        }

        /**
         * 5. BURPEES (Dynamic 4-Phase Transition: Stand -> Drop -> Pushup -> Explosive Jump)
         */
        drawBurpeeDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale) {
            const phase = this.exercisePhase;

            if (phase === 0) {
                // Standing Ready
                this.drawSquatDummy(ctx, cx, floorY, 0, skinBase, skinShadow, appMain, appAccent, isFemale);
            } else if (phase === 1) {
                // Dropping to Mat
                const progress = (this.cycleTime - 0.25) / 0.25;
                this.drawPushupDummy(ctx, cx, floorY, progress, skinBase, skinShadow, appMain, appAccent, isFemale);
            } else if (phase === 2) {
                // Bottom Pushup / Chest Touch
                this.drawPushupDummy(ctx, cx, floorY, 1.0, skinBase, skinShadow, appMain, appAccent, isFemale);
            } else {
                // Explosive Vertical Jump with Arms Overhead
                const jumpProgress = (this.cycleTime - 0.75) / 0.25;
                const jumpHeight = Math.sin(jumpProgress * Math.PI) * 55;
                const footY = floorY - 6 - jumpHeight;

                const pelvisY = floorY - 170 - jumpHeight;
                const shoulderY = floorY - 275 - jumpHeight;
                const headY = floorY - 310 - jumpHeight;

                // Straight jumping legs
                this.drawLeg(ctx, cx - 16, pelvisY, cx - 18, pelvisY + 70, cx - 20, footY, skinBase, skinShadow, appMain, appAccent, isFemale);
                this.drawLeg(ctx, cx + 16, pelvisY, cx + 18, pelvisY + 70, cx + 20, footY, skinBase, skinShadow, appMain, appAccent, isFemale);

                this.drawTorsoVertical(ctx, cx, pelvisY, cx, shoulderY, appMain, appAccent, isFemale);
                this.drawHead(ctx, cx, headY, 16, isFemale, skinBase, skinShadow);

                // Arms reaching overhead
                this.drawArm(ctx, cx - 32, shoulderY + 8, cx - 45, shoulderY - 45, cx - 50, shoulderY - 80, skinBase, skinShadow, appAccent, isFemale);
                this.drawArm(ctx, cx + 32, shoulderY + 8, cx + 45, shoulderY - 45, cx + 50, shoulderY - 80, skinBase, skinShadow, appAccent, isFemale);
            }
        }

        /**
         * 6. JUMPING JACKS (Synchronized Wide Stance & Overhead Arm Sweep)
         */
        drawJumpingJacksDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale) {
            const spread = t * 60;
            const jumpHop = Math.sin(this.cycleTime * Math.PI * 2) > 0 ? 12 : 0;
            const footY = floorY - 6 - jumpHop;

            const pelvisY = floorY - 170 - jumpHop;
            const shoulderY = floorY - 275 - jumpHop;
            const headY = floorY - 310 - jumpHop;

            // Wide legs
            this.drawLeg(ctx, cx - 16, pelvisY, cx - 20 - spread * 0.5, pelvisY + 75, cx - 24 - spread, footY, skinBase, skinShadow, appMain, appAccent, isFemale);
            this.drawLeg(ctx, cx + 16, pelvisY, cx + 20 + spread * 0.5, pelvisY + 75, cx + 24 + spread, footY, skinBase, skinShadow, appMain, appAccent, isFemale);

            this.drawTorsoVertical(ctx, cx, pelvisY, cx, shoulderY, appMain, appAccent, isFemale);
            this.drawHead(ctx, cx, headY, 16, isFemale, skinBase, skinShadow);

            // Overhead arm sweep (arms sweep from sides at t=0 to high overhead at t=1)
            const armAngle = t * Math.PI * 0.75; // 0 to 135 degrees
            const armLen = 85;
            const leftHandX = cx - 32 - Math.sin(armAngle) * armLen;
            const leftHandY = shoulderY + 8 - Math.cos(armAngle) * armLen;
            const rightHandX = cx + 32 + Math.sin(armAngle) * armLen;
            const rightHandY = shoulderY + 8 - Math.cos(armAngle) * armLen;

            this.drawArm(ctx, cx - 32, shoulderY + 8, (cx - 32 + leftHandX) / 2, (shoulderY + leftHandY) / 2, leftHandX, leftHandY, skinBase, skinShadow, appAccent, isFemale);
            this.drawArm(ctx, cx + 32, shoulderY + 8, (cx + 32 + rightHandX) / 2, (shoulderY + rightHandY) / 2, rightHandX, rightHandY, skinBase, skinShadow, appAccent, isFemale);
        }

        /**
         * 7. MOUNTAIN CLIMBERS (Horizontal Plank, High-Cadence Alternating Knee Drives)
         */
        drawMountainClimberDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale) {
            const matY = floorY - 6;
            const hipX = cx - 10;
            const hipY = matY - 38;
            const shoulderX = cx + 80;
            const shoulderY = matY - 55;
            const headX = cx + 115;
            const headY = matY - 60;
            const handX = cx + 75;
            const handY = matY - 6;

            // Alternating knee drive: t sweeps left knee forward, 1-t sweeps right knee
            const leftDrive = t * 65;
            const rightDrive = (1 - t) * 65;

            // Right leg (extended back)
            this.drawLeg(ctx, hipX, hipY, cx - 70 + rightDrive * 0.4, matY - 20, cx - 130 + rightDrive, matY - 8, skinBase, skinShadow, appMain, appAccent, isFemale);
            // Left leg (driving forward)
            this.drawLeg(ctx, hipX, hipY, cx - 50 + leftDrive, matY - 26, cx - 110 + leftDrive, matY - 8, skinBase, skinShadow, appMain, appAccent, isFemale);

            this.drawTorsoHorizontal(ctx, hipX, hipY, shoulderX, shoulderY, appMain, appAccent, isFemale);
            this.drawHead(ctx, headX, headY, 15, isFemale, skinBase, skinShadow);

            // Locked straight arms on mat
            this.drawArm(ctx, shoulderX, shoulderY, shoulderX - 4, handY - 24, handX, handY, skinBase, skinShadow, appAccent, isFemale);
        }

        /**
         * 8. DEADLIFTS (Hinged Spine at 45°, Barbell Grazing Shins to Upright Lockout)
         */
        drawDeadliftDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale) {
            // t = 0 (hinge down to floor), t = 1 (standing lockout)
            const lift = t * 75;
            const footY = floorY - 6;

            const pelvisY = floorY - 145 - lift * 0.35;
            const shoulderY = floorY - 210 - lift * 0.90;
            const headY = floorY - 245 - lift * 0.90;

            const kneeX = cx - 18;
            const kneeY = floorY - 85;

            // Legs
            this.drawLeg(ctx, cx - 18, pelvisY, kneeX - 8, kneeY, cx - 28, footY, skinBase, skinShadow, appMain, appAccent, isFemale);
            this.drawLeg(ctx, cx + 18, pelvisY, kneeX + 8, kneeY, cx + 28, footY, skinBase, skinShadow, appMain, appAccent, isFemale);

            // Torso hinging from 45 deg to upright
            this.drawTorsoVertical(ctx, cx, pelvisY, cx, shoulderY, appMain, appAccent, isFemale);
            this.drawHead(ctx, cx, headY, 16, isFemale, skinBase, skinShadow);

            // Arms gripping bar: hands travel from knee/shin level up to thighs
            const handY = floorY - 80 - lift * 0.85;
            this.drawArm(ctx, cx - 34, shoulderY + 8, cx - 36, (shoulderY + handY) / 2, cx - 38, handY, skinBase, skinShadow, appAccent, isFemale);
            this.drawArm(ctx, cx + 34, shoulderY + 8, cx + 36, (shoulderY + handY) / 2, cx + 38, handY, skinBase, skinShadow, appAccent, isFemale);
        }

        /**
         * 9. BENCH PRESS (Lying on Padded Bench, Smooth Press to Full Lockout)
         */
        drawBenchPressDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale) {
            const benchY = floorY - 80;
            const bodyY = benchY - 14;

            const headX = cx - 100;
            const shoulderX = cx - 60;
            const hipX = cx + 55;
            const footX = cx + 115;

            // Feet planted on floor
            this.drawLeg(ctx, hipX, bodyY, cx + 85, floorY - 45, footX, floorY - 6, skinBase, skinShadow, appMain, appAccent, isFemale);

            // Torso lying flat on bench
            this.drawTorsoHorizontal(ctx, hipX, bodyY, shoulderX, bodyY, appMain, appAccent, isFemale);
            this.drawHead(ctx, headX, bodyY, 15, isFemale, skinBase, skinShadow);

            // Arms pressing barbell vertically: t=0 (lockout above chest), t=1 (bar touching chest)
            const pressDepth = (1 - t) * 48;
            const handY = bodyY - 18 - pressDepth;
            const elbowY = bodyY + 12 - pressDepth * 0.3;

            this.drawArm(ctx, shoulderX, bodyY, shoulderX + 15, elbowY, shoulderX, handY, skinBase, skinShadow, appAccent, isFemale);
        }

        /**
         * 10. BICEP CURLS (Elbows Pinned, Peak Contraction with Hex Dumbbells)
         */
        drawBicepCurlDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale) {
            const footY = floorY - 6;
            const pelvisY = floorY - 170;
            const shoulderY = floorY - 275;
            const headY = floorY - 310;

            // Standing legs
            this.drawLeg(ctx, cx - 18, pelvisY, cx - 20, floorY - 85, cx - 24, footY, skinBase, skinShadow, appMain, appAccent, isFemale);
            this.drawLeg(ctx, cx + 18, pelvisY, cx + 20, floorY - 85, cx + 24, footY, skinBase, skinShadow, appMain, appAccent, isFemale);

            this.drawTorsoVertical(ctx, cx, pelvisY, cx, shoulderY, appMain, appAccent, isFemale);
            this.drawHead(ctx, cx, headY, 16, isFemale, skinBase, skinShadow);

            // Forearm curls upward: t=0 (arms at sides), t=1 (dumbbells at chest)
            const elbowY = shoulderY + 68;
            const curlAngle = t * Math.PI * 0.72; // up to ~130 degrees flexion
            const foreLen = 50;

            const handY = elbowY - Math.sin(curlAngle) * foreLen + (1 - t) * 50;
            const handXLeft = cx - 38 + Math.cos(curlAngle) * 8;
            const handXRight = cx + 38 - Math.cos(curlAngle) * 8;

            this.drawArm(ctx, cx - 34, shoulderY + 8, cx - 36, elbowY, handXLeft, handY, skinBase, skinShadow, appAccent, isFemale);
            this.drawArm(ctx, cx + 34, shoulderY + 8, cx + 36, elbowY, handXRight, handY, skinBase, skinShadow, appAccent, isFemale);
        }

        /**
         * 11. SHOULDER PRESS (Overhead Lockout with Dumbbells)
         */
        drawShoulderPressDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale) {
            const footY = floorY - 6;
            const pelvisY = floorY - 170;
            const shoulderY = floorY - 275;
            const headY = floorY - 310;

            this.drawLeg(ctx, cx - 18, pelvisY, cx - 20, floorY - 85, cx - 24, footY, skinBase, skinShadow, appMain, appAccent, isFemale);
            this.drawLeg(ctx, cx + 18, pelvisY, cx + 20, floorY - 85, cx + 24, footY, skinBase, skinShadow, appMain, appAccent, isFemale);

            this.drawTorsoVertical(ctx, cx, pelvisY, cx, shoulderY, appMain, appAccent, isFemale);
            this.drawHead(ctx, cx, headY, 16, isFemale, skinBase, skinShadow);

            // Press overhead: t=0 (at shoulders), t=1 (fully locked overhead)
            const pressHeight = t * 65;
            const handY = shoulderY - 8 - pressHeight;
            const handXSpread = 48 - t * 16; // converge slightly at top
            const elbowY = shoulderY + 36 - pressHeight * 0.6;

            this.drawArm(ctx, cx - 34, shoulderY + 8, cx - 52 + t * 14, elbowY, cx - handXSpread, handY, skinBase, skinShadow, appAccent, isFemale);
            this.drawArm(ctx, cx + 34, shoulderY + 8, cx + 52 - t * 14, elbowY, cx + handXSpread, handY, skinBase, skinShadow, appAccent, isFemale);
        }

        /**
         * 12. PULL UPS (Hanging Dead Hang to Chin-Over-Bar Clearance)
         */
        drawPullUpDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale) {
            const barY = this.height * 0.16;
            // t = 0 (dead hang), t = 1 (chin over bar)
            const pullLift = t * 75;

            const shoulderY = barY + 110 - pullLift;
            const headY = shoulderY - 35;
            const pelvisY = shoulderY + 105;
            const footY = pelvisY + 140;

            // Crossed legs hanging
            this.drawLeg(ctx, cx - 16, pelvisY, cx - 10, pelvisY + 70, cx - 4, footY, skinBase, skinShadow, appMain, appAccent, isFemale);
            this.drawLeg(ctx, cx + 16, pelvisY, cx + 10, pelvisY + 70, cx + 4, footY, skinBase, skinShadow, appMain, appAccent, isFemale);

            this.drawTorsoVertical(ctx, cx, pelvisY, cx, shoulderY, appMain, appAccent, isFemale);
            this.drawHead(ctx, cx, headY, 16, isFemale, skinBase, skinShadow);

            // Arms gripping pullup bar at cx - 50 and cx + 50
            const elbowY = (barY + shoulderY) / 2 + (1 - t) * 20;
            this.drawArm(ctx, cx - 34, shoulderY + 8, cx - 58 - (1 - t) * 8, elbowY, cx - 50, barY + 4, skinBase, skinShadow, appAccent, isFemale);
            this.drawArm(ctx, cx + 34, shoulderY + 8, cx + 58 + (1 - t) * 8, elbowY, cx + 50, barY + 4, skinBase, skinShadow, appAccent, isFemale);
        }

        /**
         * 13. YOGA (Warrior II Stance with Open Chest & Outstretched Arms)
         */
        drawYogaDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale) {
            const pelvisY = floorY - 165;
            const shoulderY = floorY - 265;
            const headY = floorY - 300;

            // Grounded Warrior II Stance: Front knee (right) at 90°, back leg straight
            const backFootX = cx - 100;
            const frontFootX = cx + 80;
            const frontKneeX = cx + 75;
            const frontKneeY = floorY - 85;

            this.drawLeg(ctx, cx - 16, pelvisY, cx - 60, floorY - 80, backFootX, floorY - 6, skinBase, skinShadow, appMain, appAccent, isFemale);
            this.drawLeg(ctx, cx + 16, pelvisY, frontKneeX, frontKneeY, frontFootX, floorY - 6, skinBase, skinShadow, appMain, appAccent, isFemale);

            this.drawTorsoVertical(ctx, cx, pelvisY, cx, shoulderY, appMain, appAccent, isFemale);
            this.drawHead(ctx, cx + 4, headY, 16, isFemale, skinBase, skinShadow);

            // Outstretched horizontal yoga arms
            this.drawArm(ctx, cx - 34, shoulderY + 8, cx - 75, shoulderY + 8, cx - 110, shoulderY + 8, skinBase, skinShadow, appAccent, isFemale);
            this.drawArm(ctx, cx + 34, shoulderY + 8, cx + 75, shoulderY + 8, cx + 110, shoulderY + 8, skinBase, skinShadow, appAccent, isFemale);
        }

        /**
         * 14. STRETCHING (Chest & Shoulder Mobility with Elastic Resistance Band)
         */
        drawStretchingDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale) {
            const footY = floorY - 6;
            const pelvisY = floorY - 170;
            const shoulderY = floorY - 275;
            const headY = floorY - 310;

            this.drawLeg(ctx, cx - 18, pelvisY, cx - 20, floorY - 85, cx - 24, footY, skinBase, skinShadow, appMain, appAccent, isFemale);
            this.drawLeg(ctx, cx + 18, pelvisY, cx + 20, floorY - 85, cx + 24, footY, skinBase, skinShadow, appMain, appAccent, isFemale);

            this.drawTorsoVertical(ctx, cx, pelvisY, cx, shoulderY, appMain, appAccent, isFemale);
            this.drawHead(ctx, cx, headY, 16, isFemale, skinBase, skinShadow);

            // Arms pulling resistance band wide: t=0 (hands in front), t=1 (arms expanded wide)
            const expand = t * 50;
            const handY = shoulderY + 30;

            this.drawArm(ctx, cx - 34, shoulderY + 8, cx - 50 - expand * 0.5, handY - 5, cx - 55 - expand, handY, skinBase, skinShadow, appAccent, isFemale);
            this.drawArm(ctx, cx + 34, shoulderY + 8, cx + 50 + expand * 0.5, handY - 5, cx + 55 + expand, handY, skinBase, skinShadow, appAccent, isFemale);
        }

        /**
         * 15. CARDIO (High Knees Sprint Drill with Rhythmic Arm Drive)
         */
        drawCardioDummy(ctx, cx, floorY, t, skinBase, skinShadow, appMain, appAccent, isFemale) {
            const footY = floorY - 6;
            const pelvisY = floorY - 175;
            const shoulderY = floorY - 275;
            const headY = floorY - 310;

            // Alternating high knee: Left knee lifts to 90 deg hip level, Right stays grounded
            const leftLift = t * 75;
            const rightLift = (1 - t) * 75;

            this.drawLeg(ctx, cx - 18, pelvisY, cx - 28, floorY - 85 - leftLift, cx - 28, footY - leftLift, skinBase, skinShadow, appMain, appAccent, isFemale);
            this.drawLeg(ctx, cx + 18, pelvisY, cx + 28, floorY - 85 - rightLift, cx + 28, footY - rightLift, skinBase, skinShadow, appMain, appAccent, isFemale);

            this.drawTorsoVertical(ctx, cx, pelvisY, cx, shoulderY, appMain, appAccent, isFemale);
            this.drawHead(ctx, cx, headY, 16, isFemale, skinBase, skinShadow);

            // 90 degree runner arms pumping
            const armSwingLeft = (t - 0.5) * 60;
            const armSwingRight = (0.5 - t) * 60;

            this.drawArm(ctx, cx - 34, shoulderY + 8, cx - 42, shoulderY + 45 + armSwingLeft * 0.5, cx - 46, shoulderY + 65 + armSwingLeft, skinBase, skinShadow, appAccent, isFemale);
            this.drawArm(ctx, cx + 34, shoulderY + 8, cx + 42, shoulderY + 45 + armSwingRight * 0.5, cx + 46, shoulderY + 65 + armSwingRight, skinBase, skinShadow, appAccent, isFemale);
        }

        // ==================== ANATOMICAL DUMMY PRIMITIVE BUILDERS ====================

        /**
         * Draw Anatomical Leg (Thigh, Knee Cap, Calf & Sneaker)
         */
        drawLeg(ctx, hx, hy, kx, ky, fx, fy, skinBase, skinShadow, appMain, appAccent, isFemale) {
            ctx.save();
            const thighThick = isFemale ? 16 : 20;
            const calfThick = isFemale ? 13 : 15;

            // Thigh (Femur with compression wear)
            ctx.strokeStyle = appMain;
            ctx.lineWidth = thighThick;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(hx, hy);
            ctx.lineTo(kx, ky);
            ctx.stroke();

            // Accent stripe on outer quad
            ctx.strokeStyle = appAccent;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(hx + 2, hy);
            ctx.lineTo(kx + 2, ky);
            ctx.stroke();

            // Knee Cap Joint
            ctx.fillStyle = isFemale ? appMain : skinBase;
            ctx.beginPath();
            ctx.arc(kx, ky, thighThick * 0.45, 0, Math.PI * 2);
            ctx.fill();

            // Calf & Shin
            ctx.strokeStyle = isFemale ? appMain : skinBase;
            ctx.lineWidth = calfThick;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(kx, ky);
            ctx.lineTo(fx, fy - 6);
            ctx.stroke();

            // Sneaker / Cross-Trainer
            ctx.fillStyle = '#18181b';
            ctx.strokeStyle = appAccent;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(fx - 14, fy - 8, 28, 12, 3);
            ctx.fill();
            ctx.stroke();

            // White Cushioned Sole
            ctx.fillStyle = '#f4f4f5';
            ctx.fillRect(fx - 14, fy + 1, 28, 3.5);
            ctx.restore();
        }

        /**
         * Draw Vertical Torso (V-Taper Athletic Frame, Deltoids, Pectorals, 6-Pack Abs)
         */
        drawTorsoVertical(ctx, px, py, sx, sy, appMain, appAccent, isFemale) {
            ctx.save();
            const shoulderSpan = isFemale ? 56 : 72;
            const waistSpan = isFemale ? 30 : 38;

            // V-Taper Torso Silhouette
            ctx.beginPath();
            ctx.moveTo(sx - shoulderSpan / 2, sy);
            ctx.lineTo(sx + shoulderSpan / 2, sy);
            ctx.lineTo(px + waistSpan / 2, py);
            ctx.lineTo(px - waistSpan / 2, py);
            ctx.closePath();

            const topGrad = ctx.createLinearGradient(sx, sy, px, py);
            topGrad.addColorStop(0, '#1c1b26');
            topGrad.addColorStop(0.6, '#13121b');
            topGrad.addColorStop(1, '#09090e');
            ctx.fillStyle = topGrad;
            ctx.fill();

            // Ergonomic Purple Piping
            ctx.strokeStyle = appAccent;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(sx - shoulderSpan / 2 + 4, sy + 3);
            ctx.lineTo(px - waistSpan / 2 + 2, py);
            ctx.moveTo(sx + shoulderSpan / 2 - 4, sy + 3);
            ctx.lineTo(px + waistSpan / 2 - 2, py);
            ctx.stroke();

            // Male 6-pack abs lines / Female defined core
            if (!isFemale) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.lineWidth = 1.5;
                const midY = (sy + py) / 2;
                ctx.beginPath();
                ctx.moveTo(sx, midY - 14);
                ctx.lineTo(sx, py - 4);
                ctx.stroke();

                [-4, 12].forEach(offset => {
                    ctx.beginPath();
                    ctx.moveTo(sx - 10, midY + offset);
                    ctx.lineTo(sx + 10, midY + offset);
                    ctx.stroke();
                });
            }

            // FitForge Chest Badge
            ctx.fillStyle = appAccent;
            ctx.beginPath();
            ctx.arc(sx, sy + (py - sy) * 0.35, 3, 0, Math.PI * 2);
            ctx.fill();

            // Shorts / Waistband
            ctx.fillStyle = '#0a0a0f';
            ctx.beginPath();
            ctx.roundRect(px - waistSpan / 2 - 4, py - 4, waistSpan + 8, isFemale ? 16 : 28, 4);
            ctx.fill();
            ctx.restore();
        }

        /**
         * Draw Horizontal Torso (Pushups, Planks, Bench Press)
         */
        drawTorsoHorizontal(ctx, hx, hy, sx, sy, appMain, appAccent, isFemale) {
            ctx.save();
            const thick = isFemale ? 22 : 28;

            ctx.strokeStyle = appMain;
            ctx.lineWidth = thick;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(hx, hy);
            ctx.lineTo(sx, sy);
            ctx.stroke();

            // Spine contour piping
            ctx.strokeStyle = appAccent;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(hx, hy - thick * 0.4);
            ctx.lineTo(sx, sy - thick * 0.4);
            ctx.stroke();
            ctx.restore();
        }

        /**
         * Draw Anatomical Arm (Shoulder Cap, Bicep, Forearm, Wristband & Hand)
         */
        drawArm(ctx, sx, sy, ex, ey, hx, hy, skinBase, skinShadow, appAccent, isFemale) {
            ctx.save();
            const armThick = isFemale ? 11 : 14;
            const foreThick = isFemale ? 9 : 11;

            // Shoulder Deltoid Cap
            ctx.fillStyle = skinBase;
            ctx.beginPath();
            ctx.arc(sx, sy, isFemale ? 8 : 11, 0, Math.PI * 2);
            ctx.fill();

            // Bicep / Upper Arm
            ctx.strokeStyle = skinBase;
            ctx.lineWidth = armThick;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(ex, ey);
            ctx.stroke();

            // Forearm
            ctx.strokeStyle = skinBase;
            ctx.lineWidth = foreThick;
            ctx.beginPath();
            ctx.moveTo(ex, ey);
            ctx.lineTo(hx, hy);
            ctx.stroke();

            // Athletic Wristband
            ctx.strokeStyle = appAccent;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(hx - 3, hy);
            ctx.lineTo(hx + 3, hy);
            ctx.stroke();

            // Hand
            ctx.fillStyle = skinBase;
            ctx.beginPath();
            ctx.arc(hx, hy, isFemale ? 5.5 : 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        /**
         * Draw Athletic Head (Marcus Fade or Elena Swept Ponytail)
         */
        drawHead(ctx, hx, hy, radius, isFemale, skinBase, skinShadow) {
            ctx.save();
            // Muscular Neck
            ctx.fillStyle = skinShadow;
            ctx.fillRect(hx - 6, hy + radius - 6, 12, 14);

            // Head Profile
            ctx.fillStyle = skinBase;
            ctx.beginPath();
            ctx.ellipse(hx, hy, radius * 0.88, radius, 0, 0, Math.PI * 2);
            ctx.fill();

            // Defined Athletic Brow & Eye Focus
            ctx.fillStyle = '#1c1917';
            ctx.fillRect(hx - 4, hy - 2, 3.5, 1.5);
            ctx.fillRect(hx + 1.5, hy - 2, 3.5, 1.5);

            if (isFemale) {
                // High Ponytail with dynamic swing
                ctx.fillStyle = '#3b1d11';
                ctx.beginPath();
                ctx.arc(hx, hy - 4, radius * 0.9, Math.PI, 0);
                ctx.fill();

                const ponySwing = Math.sin(this.cycleTime * Math.PI * 2) * 6;
                ctx.lineWidth = 6.5;
                ctx.strokeStyle = '#3b1d11';
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(hx - 4, hy - 8);
                ctx.quadraticCurveTo(hx - 20 + ponySwing, hy, hx - 16 + ponySwing, hy + 18);
                ctx.stroke();
            } else {
                // Male Athletic Skin Fade
                ctx.fillStyle = '#1c1917';
                ctx.beginPath();
                ctx.arc(hx, hy - 3, radius * 0.92, Math.PI * 0.85, Math.PI * 0.15);
                ctx.fill();
            }
            ctx.restore();
        }

        /**
         * Foreground Equipment (Barbell in Hands, Dumbbells, Resistance Bands)
         */
        drawEquipmentForeground(ctx, exType, w, h, floorY, t) {
            const cx = w * 0.5;

            // 1. Olympic Barbell (Squats, Bench Press, Deadlifts)
            if (['squat', 'bench_press', 'deadlift'].includes(exType)) {
                ctx.save();
                let barY = floorY - 170;
                let barW = 240;
                let plateRadius = 28;

                if (exType === 'squat') {
                    // Resting on upper traps
                    const drop = t * 75;
                    barY = floorY - 275 + drop * 0.95;
                } else if (exType === 'bench_press') {
                    // Moving above chest
                    const pressDepth = (1 - t) * 48;
                    barY = floorY - 112 - pressDepth;
                    barW = 230;
                } else if (exType === 'deadlift') {
                    // Rising from floor along shins
                    const lift = t * 75;
                    barY = floorY - 80 - lift * 0.85;
                    plateRadius = 34; // full 45lb Olympic plate
                }

                // Olympic Barbell Shaft
                const shaftGrad = ctx.createLinearGradient(cx - barW / 2, barY, cx + barW / 2, barY);
                shaftGrad.addColorStop(0, '#52525b');
                shaftGrad.addColorStop(0.5, '#f4f4f5');
                shaftGrad.addColorStop(1, '#52525b');
                ctx.strokeStyle = shaftGrad;
                ctx.lineWidth = 5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(cx - barW / 2, barY);
                ctx.lineTo(cx + barW / 2, barY);
                ctx.stroke();

                // Purple & Black Bumper Plates
                [-barW / 2 + 10, barW / 2 - 10].forEach(px => {
                    ctx.fillStyle = '#18181b';
                    ctx.strokeStyle = '#a855f7';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.roundRect(cx + px - 6, barY - plateRadius, 12, plateRadius * 2, 4);
                    ctx.fill();
                    ctx.stroke();

                    // Metallic Collar
                    ctx.fillStyle = '#d4d4d8';
                    ctx.fillRect(cx + px - 10, barY - 6, 4, 12);
                });
                ctx.restore();
            }

            // 2. Rubber Hex Dumbbells (Bicep Curls, Shoulder Press, Lunges)
            if (['curl', 'shoulder_press', 'lunge'].includes(exType)) {
                ctx.save();
                let leftDumbbell = { x: cx - 40, y: floorY - 140 };
                let rightDumbbell = { x: cx + 40, y: floorY - 140 };

                if (exType === 'lunge') {
                    const drop = t * 65;
                    leftDumbbell.y = floorY - 180 + drop;
                    rightDumbbell.y = floorY - 180 + drop;
                } else if (exType === 'curl') {
                    const curlAngle = t * Math.PI * 0.72;
                    const handY = floorY - 207 - Math.sin(curlAngle) * 50 + (1 - t) * 50;
                    leftDumbbell.y = handY;
                    rightDumbbell.y = handY;
                } else if (exType === 'shoulder_press') {
                    const pressHeight = t * 65;
                    const handY = floorY - 283 - pressHeight;
                    const handXSpread = 48 - t * 16;
                    leftDumbbell = { x: cx - handXSpread, y: handY };
                    rightDumbbell = { x: cx + handXSpread, y: handY };
                }

                [leftDumbbell, rightDumbbell].forEach(db => {
                    // Steel knurled handle
                    ctx.strokeStyle = '#e4e4e7';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(db.x - 12, db.y);
                    ctx.lineTo(db.x + 12, db.y);
                    ctx.stroke();

                    // Rubber Hex Heads
                    ctx.fillStyle = '#18181b';
                    ctx.strokeStyle = '#a855f7';
                    ctx.lineWidth = 1.5;
                    [-14, 14].forEach(off => {
                        ctx.beginPath();
                        ctx.roundRect(db.x + off - 4, db.y - 11, 8, 22, 3);
                        ctx.fill();
                        ctx.stroke();
                    });
                });
                ctx.restore();
            }

            // 3. Elastic Resistance Mobility Band (Stretching Exercises)
            if (exType === 'stretching') {
                ctx.save();
                const expand = t * 50;
                const handY = floorY - 245;
                const lx = cx - 55 - expand;
                const rx = cx + 55 + expand;

                ctx.strokeStyle = '#c084fc';
                ctx.lineWidth = 4.5;
                ctx.shadowColor = '#a855f7';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.moveTo(lx, handY);
                ctx.quadraticCurveTo(cx, handY + 12, rx, handY);
                ctx.stroke();

                // Band handles
                ctx.fillStyle = '#18181b';
                ctx.fillRect(lx - 4, handY - 6, 8, 12);
                ctx.fillRect(rx - 4, handY - 6, 8, 12);
                ctx.restore();
            }
        }

        /**
         * Movement Phase HUD Badge Drawn Directly on Canvas Top
         */
        drawMovementPhaseBadge(ctx, w, h, t) {
            const phases = [
                { name: "PHASE 1: STARTING POSITION", cue: "Postural Calibration • Core Bracing", color: "#38bdf8" },
                { name: "PHASE 2: MOVEMENT PHASE", cue: "Controlled Tempo • Eccentric Loading", color: "#c084fc" },
                { name: "PHASE 3: PEAK CONTRACTION", cue: "Maximum Safe Range of Motion", color: "#10b981" },
                { name: "PHASE 4: RETURN POSITION", cue: "Concentric Drive • Controlled Lockout", color: "#a855f7" }
            ];

            const cur = phases[this.exercisePhase] || phases[0];
            const badgeW = Math.min(w * 0.72, 380);
            const badgeH = 44;
            const badgeX = (w - badgeW) / 2;
            const badgeY = 24;

            if (this.paused) {
                ctx.save();
                ctx.fillStyle = 'rgba(25, 20, 10, 0.90)';
                ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 22);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#f59e0b';
                ctx.beginPath();
                ctx.arc(badgeX + 22, badgeY + badgeH * 0.5, 4.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
                ctx.fillText("DEMO PAUSED", badgeX + 36, badgeY + 18);

                ctx.fillStyle = '#fcd34d';
                ctx.font = '10px system-ui, -apple-system, sans-serif';
                ctx.fillText("Click 'Start Demo' to Resume Exercise", badgeX + 36, badgeY + 33);
                ctx.restore();
                return;
            }

            ctx.save();
            // Glass background
            ctx.fillStyle = 'rgba(15, 14, 23, 0.85)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 22);
            ctx.fill();
            ctx.stroke();

            // Accent beacon dot
            ctx.fillStyle = cur.color;
            ctx.beginPath();
            ctx.arc(badgeX + 22, badgeY + badgeH * 0.5, 4.5, 0, Math.PI * 2);
            ctx.fill();

            // Text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
            ctx.fillText(cur.name, badgeX + 36, badgeY + 18);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
            ctx.font = '10px system-ui, -apple-system, sans-serif';
            ctx.fillText(cur.cue, badgeX + 36, badgeY + 33);

            ctx.restore();
        }
    }

    // Expose engine instance globally
    window.LiveCoachEngine = new LiveCoachEngine();
})();
