/**
 * FitForge Real Human Exercise Video & Voice Coach Engine
 * 
 * Inspired by RayFit simple, powerful coaching:
 * 1. Real Human Exercise Videos:
 *    - HTML5 Video playback with actual MP4 demonstration videos.
 *    - Demonstrates correct exercise form clearly.
 *    - Consistent male trainer across exercises.
 * 2. Voice Counting:
 *    - When starting: "Get ready!" -> "3... 2... 1... START!"
 *    - During exercise: "1... 2... 3... 4... 5..." spoken in sync with repetition counter.
 *    - On completion: "Excellent! Exercise completed!"
 * 3. 3-Set Progression & Integration:
 *    - Reads exercises dynamically from the existing workout plan.
 *    - Automatically tracks 3 sets per exercise with rest periods.
 *    - Automatically advances to the next exercise upon completing all 3 sets.
 * 4. Simple Interface Controls:
 *    - Start, Pause, Resume, Stop.
 *    - Voice Mute/Unmute.
 */

(function () {
    'use strict';

    // =========================================================================
    // EXERCISE VIDEO CONFIGURATION (Actual MP4 Demonstration Videos)
    // =========================================================================
    const EXERCISE_CONFIG = {
        squat: {
            name: "Bodyweight Squats",
            file: "/public/videos/squat.mp4",
            fallbackUrls: ["/videos/squat.mp4"],
            repTempo: 3.0,
            isTimed: false
        },
        pushup: {
            name: "Standard Bodyweight Push-Up",
            file: "/public/videos/pushup.mp4",
            fallbackUrls: ["/videos/pushup.mp4"],
            repTempo: 2.8,
            isTimed: false
        },
        jumping_jacks: {
            name: "Jumping Jacks",
            file: "/public/videos/jumping-jacks.mp4",
            fallbackUrls: ["/videos/jumping-jacks.mp4"],
            repTempo: 1.8,
            isTimed: false
        },
        lunges: {
            name: "Forward Lunges",
            file: "/public/videos/lunges.mp4",
            fallbackUrls: ["/videos/lunges.mp4"],
            repTempo: 3.2,
            isTimed: false
        },
        plank: {
            name: "Core Plank Hold",
            file: "/public/videos/plank.mp4",
            fallbackUrls: ["/videos/plank.mp4"],
            repTempo: 2.8,
            isTimed: true
        },
        crunches: {
            name: "Abdominal Crunches",
            file: "/public/videos/crunches.mp4",
            fallbackUrls: ["/videos/crunches.mp4"],
            repTempo: 2.6,
            isTimed: false
        },
        burpees: {
            name: "Standard Burpees",
            file: "/public/videos/burpees.mp4",
            fallbackUrls: ["/videos/burpees.mp4"],
            repTempo: 3.5,
            isTimed: false
        },
        mountain_climbers: {
            name: "Mountain Climbers",
            file: "/public/videos/mountain-climbers.mp4",
            fallbackUrls: ["/videos/mountain-climbers.mp4"],
            repTempo: 1.6,
            isTimed: false
        },
        high_knees: {
            name: "High Knee Sprint",
            file: "/public/videos/high-knees.mp4",
            fallbackUrls: ["/videos/high-knees.mp4"],
            repTempo: 1.3,
            isTimed: false
        }
    };

    function resolveExerciseKey(exercise) {
        if (!exercise) return 'squat';
        const anim = (exercise.animationType || '').toLowerCase();
        const name = (exercise.name || '').toLowerCase();
        const id = (exercise.id || '').toLowerCase();

        // 1. Burpees
        if (id.includes('burpee') || name.includes('burpee') || anim.includes('burpee')) return 'burpees';

        // 2. Mountain Climbers
        if (id.includes('mountain') || name.includes('mountain') || name.includes('climber')) return 'mountain_climbers';

        // 3. High Knees
        if (id.includes('highknee') || name.includes('high knee') || name.includes('knees sprint')) return 'high_knees';

        // 4. Jumping Jacks
        if (id.includes('jumpingjack') || name.includes('jack') || (anim === 'cardio' && !name.includes('burpee') && !name.includes('knee'))) return 'jumping_jacks';

        // 5. Push-ups & Presses
        if (anim === 'pushup' || anim === 'benchpress' || name.includes('push') || name.includes('press') || name.includes('dip') || name.includes('fly')) return 'pushup';

        // 6. Crunches & Abs
        if (id.includes('crunch') || name.includes('crunch') || anim === 'crunch' || name.includes('sit-up') || name.includes('situp')) return 'crunches';

        // 7. Planks & Core Holds & Yoga
        if (anim === 'plank' || anim === 'yoga' || name.includes('plank') || name.includes('hold') || name.includes('pose') || name.includes('stretch') || name.includes('bridge') || name.includes('superman') || name.includes('deadbug')) return 'plank';

        // 8. Lunges
        if (anim === 'lunge' || name.includes('lunge') || name.includes('split squat')) return 'lunges';

        // 9. Squats & Lower Body / Compound
        if (anim === 'squat' || anim === 'deadlift' || anim === 'curl' || name.includes('squat') || name.includes('deadlift') || name.includes('curl') || name.includes('row')) return 'squat';

        return 'squat';
    }


    // =========================================================================
    // AI VOICE COACH (SpeechSynthesis + Audio Feedback)
    // =========================================================================
    class AIVoiceCoach {
        constructor() {
            this.synth = window.speechSynthesis || null;
            this.selectedVoice = null;
            this.audioCtx = null;
            this.muted = false;
            this.isSpeaking = false;
            this.initVoices();
        }

        initVoices() {
            if (!this.synth) return;
            const pick = () => {
                const voices = this.synth.getVoices() || [];
                if (voices.length === 0) return;
                this.selectedVoice = voices.find(v => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('David') || v.name.includes('Guy') || v.name.includes('Mark')) && v.lang.startsWith('en'))
                    || voices.find(v => v.lang.startsWith('en'))
                    || voices[0];
            };
            pick();
            if (this.synth.onvoiceschanged !== undefined) {
                this.synth.onvoiceschanged = pick;
            }
        }

        ensureAudioContext() {
            try {
                if (!this.audioCtx) {
                    const AudioCtx = window.AudioContext || window.webkitAudioContext;
                    if (AudioCtx) this.audioCtx = new AudioCtx();
                }
                if (this.audioCtx && this.audioCtx.state === 'suspended') {
                    this.audioCtx.resume();
                }
            } catch (e) { }
        }

        playChime(frequency = 587.33, duration = 0.12) {
            if (this.muted) return;
            try {
                this.ensureAudioContext();
                if (!this.audioCtx) return;

                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(frequency * 1.35, this.audioCtx.currentTime + duration);

                gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);

                osc.start();
                osc.stop(this.audioCtx.currentTime + duration);
            } catch (e) { }
        }

        speak(text, { priority = false, rate = 1.1, pitch = 1.05, onEnd = null } = {}) {
            if (this.muted || !text || !this.synth) {
                if (onEnd) onEnd();
                return;
            }

            try {
                this.ensureAudioContext();
                if (this.synth.paused) this.synth.resume();
                if (priority) this.synth.cancel();

                if (!this.selectedVoice) {
                    const voices = this.synth.getVoices() || [];
                    if (voices.length > 0) {
                        this.selectedVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
                    }
                }

                const utter = new SpeechSynthesisUtterance(text);
                if (this.selectedVoice) utter.voice = this.selectedVoice;
                utter.rate = rate;
                utter.pitch = pitch;

                utter.onstart = () => {
                    this.isSpeaking = true;
                    this.updateVoiceUI(true, text);
                };

                utter.onend = () => {
                    this.isSpeaking = false;
                    this.updateVoiceUI(false);
                    if (onEnd) onEnd();
                };

                utter.onerror = () => {
                    this.isSpeaking = false;
                    this.updateVoiceUI(false);
                    if (onEnd) onEnd();
                };

                this.synth.speak(utter);
            } catch (err) {
                if (onEnd) onEnd();
            }
        }

        cancel() {
            if (this.synth) this.synth.cancel();
            this.isSpeaking = false;
            this.updateVoiceUI(false);
        }

        toggleMute() {
            this.muted = !this.muted;
            if (this.muted) this.cancel();
            this.updateMuteUI();
            return this.muted;
        }

        updateMuteUI() {
            const btn = document.getElementById('coach-mute-toggle-btn');
            const icon = document.getElementById('coach-mute-icon');
            const text = document.getElementById('coach-mute-text');

            if (this.muted) {
                if (icon) icon.textContent = 'volume_off';
                if (text) text.textContent = 'MUTED';
                if (btn) {
                    btn.classList.add('border-red-500/40', 'text-red-400');
                    btn.classList.remove('border-white/20', 'text-white');
                }
            } else {
                if (icon) icon.textContent = 'volume_up';
                if (text) text.textContent = 'UNMUTED';
                if (btn) {
                    btn.classList.remove('border-red-500/40', 'text-red-400');
                    btn.classList.add('border-white/20', 'text-white');
                }
            }

            // Sync with main player top header Voice Coach button
            const voiceStatus = document.getElementById('voice-coach-status');
            const voiceText = document.getElementById('voice-status-text');
            if (voiceStatus) {
                const voiceIcon = voiceStatus.querySelector('.material-symbols-outlined');
                if (voiceIcon) voiceIcon.textContent = this.muted ? 'volume_off' : 'volume_up';
                if (voiceText) voiceText.textContent = this.muted ? 'Coach Muted' : 'Voice Coach';
                if (this.muted) {
                    voiceStatus.classList.add('text-red-400', 'border-red-500/30');
                    voiceStatus.classList.remove('text-secondary', 'border-white/10');
                } else {
                    voiceStatus.classList.remove('text-red-400', 'border-red-500/30');
                    voiceStatus.classList.add('text-secondary', 'border-white/10');
                }
            }
        }

        updateVoiceUI(speaking, text = '') {
            const voicePill = document.getElementById('voice-coach-status');
            const textEl = document.getElementById('voice-status-text');
            if (textEl && !this.muted) {
                if (speaking) {
                    textEl.textContent = text ? `Coach: "${text.length > 20 ? text.slice(0, 18) + '...' : text}"` : "Speaking...";
                } else {
                    textEl.textContent = "AI Voice Coach: Active";
                }
            }
            if (voicePill) {
                if (speaking && !this.muted) {
                    voicePill.classList.add('bg-purple-500/25', 'border-purple-400', 'text-purple-200');
                } else {
                    voicePill.classList.remove('bg-purple-500/25', 'border-purple-400', 'text-purple-200');
                }
            }
        }

        startExerciseCountdown(onFinish) {
            // Coach says: "Get ready!" -> "3... 2... 1... START!"
            this.speak("Get ready!", {
                priority: true,
                rate: 1.05,
                onEnd: () => {
                    this.run321Countdown(onFinish);
                }
            });
        }

        run321Countdown(onFinish) {
            const overlay = document.getElementById('coach-countdown-overlay');
            const numEl = document.getElementById('coach-countdown-number');
            const subEl = document.getElementById('coach-countdown-subtitle');

            if (overlay) overlay.classList.remove('hidden');

            const steps = [
                { num: "3", word: "Three", sub: "GET READY", freq: 440 },
                { num: "2", word: "Two", sub: "SET POSTURE", freq: 554.37 },
                { num: "1", word: "One", sub: "FOCUS FORM", freq: 659.25 },
                { num: "START!", word: "Start!", sub: "BEGIN", freq: 880 }
            ];

            let idx = 0;

            const nextStep = () => {
                if (idx >= steps.length) {
                    if (overlay) overlay.classList.add('hidden');
                    if (onFinish) onFinish();
                    return;
                }

                const s = steps[idx];
                if (numEl) numEl.textContent = s.num;
                if (subEl) subEl.textContent = s.sub;
                this.playChime(s.freq, 0.15);

                this.speak(s.word, {
                    priority: true,
                    rate: 1.15,
                    onEnd: () => {
                        idx++;
                        setTimeout(nextStep, 150);
                    }
                });
            };

            nextStep();
        }

        announceRep(count, onEnd = null) {
            this.playChime(659.25, 0.1);
            const NUMBER_WORDS = [
                "", "One", "Two", "Three", "Four", "Five", 
                "Six", "Seven", "Eight", "Nine", "Ten", 
                "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", 
                "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty"
            ];
            const word = NUMBER_WORDS[count] || String(count);
            this.speak(word, { priority: true, rate: 1.25, pitch: 1.08, onEnd });
        }

        congratulateSet(setNumber, targetSets, onEnd) {
            this.playChime(784, 0.2);
            this.speak("Excellent! Set completed. Take a rest.", {
                priority: true,
                rate: 1.05,
                onEnd
            });
        }

        congratulateExercise(onEnd) {
            this.playChime(880, 0.25);
            this.speak("Excellent! Exercise completed!", {
                priority: true,
                rate: 1.05,
                onEnd
            });
        }

        finishWorkout(onEnd) {
            this.playChime(1046.5, 0.35);
            this.speak("Excellent! Workout completed! You did an amazing job!", {
                priority: true,
                rate: 1.05,
                onEnd
            });
        }
    }


    // =========================================================================
    // REAL HUMAN EXERCISE VIDEO CONTROLLER
    // =========================================================================
    class VideoCoachManager {
        constructor() {
            this.videoEl = null;
            this.currentKey = 'squat';
            this.currentExercise = null;
        }

        init(videoElementId = 'trainer-exercise-video') {
            this.videoEl = document.getElementById(videoElementId);
            if (!this.videoEl) return;

            this.videoEl.muted = true;
            this.videoEl.loop = true;
            this.videoEl.setAttribute('loop', 'true');
            this.videoEl.playsInline = true;
            this.videoEl.autoplay = true;
            this.videoEl.style.objectFit = 'contain';
            this.videoEl.style.width = '100%';
            this.videoEl.style.height = '100%';
            this.videoEl.style.imageRendering = '-webkit-optimize-contrast';

            // Continuous loop handler - ensure video never stops during active reps
            this.videoEl.onended = () => {
                this.videoEl.currentTime = 0;
                this.videoEl.play().catch(() => { });
            };

            this.videoEl.onerror = () => {
                this.loadFallback();
            };

            this.videoEl.onplay = () => {
                this.updateVideoPlayIcon(true);
            };

            this.videoEl.onpause = () => {
                this.updateVideoPlayIcon(false);
            };

            this.updateVideoMuteIcon(this.videoEl.muted);
        }

        loadExercise(key, exercise = null) {
            this.currentKey = key;
            this.currentExercise = exercise;
            if (!this.videoEl) {
                this.init('trainer-exercise-video');
            }
            if (!this.videoEl) {
                this.videoEl = document.getElementById('trainer-exercise-video');
            }
            if (!this.videoEl) return;

            // Resolve from EXERCISES_DATABASE if exercise or videoUrl is missing
            if (!exercise || !exercise.videoUrl) {
                if (typeof EXERCISES_DATABASE !== 'undefined' && Array.isArray(EXERCISES_DATABASE)) {
                    const match = EXERCISES_DATABASE.find(item => 
                        (exercise && item.id === exercise.id) || 
                        (exercise && item.name && item.name.toLowerCase() === exercise.name.toLowerCase()) ||
                        (item.id === key)
                    );
                    if (match && match.videoUrl) {
                        exercise = Object.assign({}, exercise || {}, match);
                        this.currentExercise = exercise;
                    }
                }
            }

            // Direct dedicated database videoUrl (e.g. /public/videos/exercises/{id}.mp4)
            if (exercise && exercise.videoUrl) {
                // Hide missing/unavailable overlay
                const unavail = document.getElementById('live-video-unavailable-overlay');
                if (unavail) unavail.classList.add('hidden');

                let targetSrc = exercise.videoUrl;
                if (window.location.protocol === 'file:') {
                    targetSrc = targetSrc.replace(/^\/+/, '');
                }

                if (!this.videoEl.src.endsWith(targetSrc.replace(/^\/+/, ''))) {
                    this.videoEl.src = targetSrc;
                    this.videoEl.currentTime = 0;
                    this.videoEl.load();
                }
                this.videoEl.loop = true;
                this.videoEl.setAttribute('loop', 'true');
                this.videoEl.onended = () => {
                    this.videoEl.currentTime = 0;
                    this.videoEl.play().catch(() => { });
                };
                this.videoEl.muted = true;
                this.videoEl.play().catch(() => { });
                this.updateVideoPlayIcon(true);
                return;
            }

            // CRITICAL: NEVER display another exercise's video or robotic mannequin as fallback!
            this.videoEl.pause();
            this.videoEl.src = "";
            this.updateVideoPlayIcon(false);

            const unavail = document.getElementById('live-video-unavailable-overlay');
            if (unavail) {
                unavail.classList.remove('hidden');
                const nameEl = document.getElementById('live-missing-exercise-name');
                if (nameEl) nameEl.textContent = exercise ? exercise.name : 'Selected Exercise';
                const idEl = document.getElementById('live-missing-exercise-id');
                if (idEl) idEl.textContent = exercise ? exercise.id : '';
            }
        }

        loadFallback() {
            // NEVER silently replace a failed video with squat.mp4 or another exercise
            console.warn(`[VideoCoachManager] Exercise demonstration video unavailable or failed to load: ${this.currentKey}`);
            if (this.videoEl) {
                this.videoEl.pause();
            }
            this.updateVideoPlayIcon(false);

            const unavail = document.getElementById('live-video-unavailable-overlay');
            if (unavail) {
                unavail.classList.remove('hidden');
                const nameEl = document.getElementById('live-missing-exercise-name');
                if (nameEl && this.currentExercise) nameEl.textContent = this.currentExercise.name;
                const idEl = document.getElementById('live-missing-exercise-id');
                if (idEl && this.currentExercise) idEl.textContent = this.currentExercise.id;
            }
        }

        play() {
            if (this.videoEl && this.videoEl.src) {
                this.videoEl.play().catch(() => { });
                this.updateVideoPlayIcon(true);
            }
        }

        pause() {
            if (this.videoEl) {
                this.videoEl.pause();
                this.updateVideoPlayIcon(false);
            }
        }

        replay() {
            if (!this.videoEl) return;
            this.videoEl.currentTime = 0;
            if (this.videoEl.src) {
                this.videoEl.play().catch(() => { });
                this.updateVideoPlayIcon(true);
            }
        }

        togglePlay() {
            if (!this.videoEl) return;
            if (this.videoEl.paused) {
                this.play();
            } else {
                this.pause();
            }
        }

        toggleMute() {
            if (!this.videoEl) return false;
            this.videoEl.muted = !this.videoEl.muted;
            this.updateVideoMuteIcon(this.videoEl.muted);
            return this.videoEl.muted;
        }

        toggleFit() {
            if (!this.videoEl) return;
            const current = this.videoEl.style.objectFit || 'contain';
            const next = current === 'contain' ? 'cover' : 'contain';
            this.videoEl.style.objectFit = next;
            const label = document.getElementById('video-ctrl-fit-label');
            if (label) label.textContent = next === 'contain' ? 'FIT' : 'FILL';
            const icon = document.getElementById('video-ctrl-fit-icon');
            if (icon) icon.textContent = next === 'contain' ? 'fit_screen' : 'aspect_ratio';
        }

        toggleFullscreen() {
            const container = document.getElementById('live-stage-container') || document.getElementById('live-demo-viewport') || this.videoEl;
            if (!container) return;

            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                if (container.requestFullscreen) {
                    container.requestFullscreen().catch(() => {});
                } else if (container.webkitRequestFullscreen) {
                    container.webkitRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen().catch(() => {});
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
            }
        }

        updateVideoPlayIcon(isPlaying) {
            const icon = document.getElementById('video-ctrl-play-icon');
            if (icon) {
                icon.textContent = isPlaying ? 'pause' : 'play_arrow';
            }
        }

        updateVideoMuteIcon(isMuted) {
            const icon = document.getElementById('video-ctrl-mute-icon');
            if (icon) {
                icon.textContent = isMuted ? 'volume_off' : 'volume_up';
            }
            const label = document.getElementById('video-ctrl-mute-label');
            if (label) {
                label.textContent = isMuted ? 'MUTED' : 'AUDIO';
            }
        }
    }


    // =========================================================================
    // CORE LIVE COACH ENGINE
    // =========================================================================
    class LiveCoachEngineClass {
        constructor() {
            this.voiceCoach = new AIVoiceCoach();
            this.videoManager = new VideoCoachManager();

            this.active = false;
            this.paused = true;
            this.isStarted = false;
            this.isResting = false;

            this.currentExercise = null;
            this.currentExerciseKey = 'squat';
            this.currentRep = 0;
            this.targetReps = 12;
            this.currentSet = 1;
            this.targetSets = 3;

            this.repTimer = null;
            this.sessionTimer = null;
            this.restTimer = null;

            this.sessionSeconds = 0;
            this.caloriesBurned = 0;
            this.isPlankHold = false;
            this.holdSeconds = 0;
            this.targetHoldSeconds = 45;
        }

        init({ videoId = 'trainer-exercise-video' } = {}) {
            this.videoManager.init(videoId);
            this.voiceCoach.initVoices();
            this.voiceCoach.updateMuteUI();
        }

        setStudioView(mode) {
            // Maintained for backward compatibility; single real-human video mode is standard.
        }

        prepareSession(exercise, options = {}) {
            this.active = false;
            this.paused = true;
            this.isStarted = false;
            this.isResting = false;
            this.hasSavedSession = false;

            this.currentExercise = exercise;
            this.currentExerciseKey = resolveExerciseKey(exercise);
            const config = EXERCISE_CONFIG[this.currentExerciseKey] || EXERCISE_CONFIG.squat;

            // Seconds concept is strictly for simple plank only; all other exercises use repetitions
            const nameLower = (exercise.name || '').toLowerCase();
            const idLower = (exercise.id || '').toLowerCase();
            const isSimplePlank = (idLower === 'ex-plank' || idLower === 'ex-home-high-plank' || nameLower === 'plank' || nameLower === 'high plank hold' || nameLower === 'standard plank' || nameLower === 'core plank hold') && !nameLower.includes('jack') && !nameLower.includes('in-out');

            this.isPlankHold = isSimplePlank;
            this.currentRep = 0;
            this.holdSeconds = 0;
            this.currentSet = 1;
            this.targetSets = parseInt(exercise.sets) || 3;

            if (this.isPlankHold) {
                // Minimum seconds for simple plank is 15 seconds
                const parsedSecs = parseInt(exercise.duration || exercise.reps, 10) || 30;
                this.targetHoldSeconds = Math.max(15, parsedSecs);
                this.targetReps = 1;
            } else {
                this.targetHoldSeconds = 0;
                let parsedReps = 12;
                if (exercise.reps) {
                    const repMatch = String(exercise.reps).match(/(\d+)/);
                    if (repMatch) parsedReps = parseInt(repMatch[1], 10);
                }
                // Minimum 12 reps across all exercises
                this.targetReps = Math.max(12, parsedReps);
            }

            this.sessionSeconds = 0;
            this.caloriesBurned = 0;

            this.clearRepTimer();
            if (this.sessionTimer) {
                clearInterval(this.sessionTimer);
                this.sessionTimer = null;
            }
            if (this.restTimer) {
                clearInterval(this.restTimer);
                this.restTimer = null;
            }

            // Hide countdown & paused overlays on initial load
            const countdownEl = document.getElementById('coach-countdown-overlay');
            if (countdownEl) countdownEl.classList.add('hidden');
            const pauseEl = document.getElementById('trainer-paused-overlay');
            if (pauseEl) pauseEl.classList.add('hidden');
            const restOverlay = document.getElementById('player-rest-overlay');
            if (restOverlay) restOverlay.classList.add('hidden');
            const activeCtrls = document.getElementById('player-active-controls');
            if (activeCtrls) activeCtrls.classList.remove('hidden');

            // Load Video Demonstration
            this.videoManager.loadExercise(this.currentExerciseKey, exercise);

            // Update UI & Status
            this.updateUI();
            this.updateToggleButton(false, false); // Shows "START WORKOUT"

            const statusDot = document.getElementById('coach-status-dot');
            const statusText = document.getElementById('coach-status-text');
            if (statusDot) statusDot.className = "w-2 h-2 rounded-full bg-emerald-400 animate-pulse";
            if (statusText) statusText.textContent = "READY";
        }

        startSession(exercise, options = {}) {
            this.prepareSession(exercise, options);
            if (options.autoStart) {
                this.startWorkout();
            }
        }

        startWorkout() {
            if (this.isStarted && !this.paused) return;

            this.isStarted = true;
            this.active = true;
            this.paused = false;
            this.isResting = false;

            // Pause and rewind video to frame 0 during the countdown
            if (this.videoManager && this.videoManager.videoEl) {
                this.videoManager.videoEl.pause();
                this.videoManager.videoEl.currentTime = 0;
            }

            const pauseEl = document.getElementById('trainer-paused-overlay');
            if (pauseEl) pauseEl.classList.add('hidden');

            this.startSessionTimer();
            this.updateToggleButton(true); // Shows "PAUSE WORKOUT"

            const statusDot = document.getElementById('coach-status-dot');
            const statusText = document.getElementById('coach-status-text');
            if (statusDot) statusDot.className = "w-2 h-2 rounded-full bg-cyan-400 animate-pulse";
            if (statusText) statusText.textContent = "COUNTDOWN";

            // Coach says: "Get ready!" -> "3... 2... 1... START!"
            this.voiceCoach.startExerciseCountdown(() => {
                if (statusDot) statusDot.className = "w-2 h-2 rounded-full bg-emerald-400 animate-pulse";
                if (statusText) statusText.textContent = "ACTIVE";
                this.startActiveSet();
            });
        }

        startActiveSet() {
            this.paused = false;
            this.isResting = false;
            this.updateToggleButton(true);

            // Synchronize video to start of repetition 1 exactly as the countdown ends
            if (this.videoManager && this.videoManager.videoEl) {
                this.videoManager.videoEl.currentTime = 0;
            }
            this.videoManager.play();
            this.startRepetitionTracking();
        }

        pauseWorkout() {
            if (!this.isStarted || this.paused) return;
            this.paused = true;
            this.videoManager.pause();
            this.clearRepTimer();

            const pauseEl = document.getElementById('trainer-paused-overlay');
            if (pauseEl) pauseEl.classList.remove('hidden');

            this.updateToggleButton(false, true); // Shows "RESUME WORKOUT"

            const statusDot = document.getElementById('coach-status-dot');
            const statusText = document.getElementById('coach-status-text');
            if (statusDot) statusDot.className = "w-2 h-2 rounded-full bg-amber-400";
            if (statusText) statusText.textContent = "PAUSED";
        }

        resumeWorkout() {
            if (!this.isStarted || !this.paused) return;
            this.paused = false;

            const pauseEl = document.getElementById('trainer-paused-overlay');
            if (pauseEl) pauseEl.classList.add('hidden');

            this.updateToggleButton(true); // Shows "PAUSE WORKOUT"
            this.videoManager.play();
            this.startRepetitionTracking();

            const statusDot = document.getElementById('coach-status-dot');
            const statusText = document.getElementById('coach-status-text');
            if (statusDot) statusDot.className = "w-2 h-2 rounded-full bg-emerald-400 animate-pulse";
            if (statusText) statusText.textContent = "ACTIVE";
        }

        togglePause() {
            if (!this.isStarted) {
                this.startWorkout();
            } else if (this.paused) {
                this.resumeWorkout();
            } else {
                this.pauseWorkout();
            }
        }

        recalculateCalories() {
            if (!this.currentExercise) {
                this.caloriesBurned = 0;
                return;
            }

            const baseCalories = Number(this.currentExercise.calories) || 12;

            if (this.isPlankHold) {
                // Simple plank hold: calories synced with hold seconds
                if (this.holdSeconds <= 0 || !this.targetHoldSeconds) {
                    this.caloriesBurned = 0;
                } else {
                    const holdRatio = Math.min(1.5, this.holdSeconds / this.targetHoldSeconds);
                    this.caloriesBurned = Math.round(holdRatio * baseCalories);
                }
            } else {
                // Repetition-based exercise: calories strictly synced with actual completed reps and completed sets
                // If 0 reps done: exactly 0 calories!
                const completedSets = Math.max(0, this.currentSet - 1);
                const fullSetsCalories = completedSets * baseCalories;

                if (this.currentRep <= 0 || !this.targetReps) {
                    this.caloriesBurned = fullSetsCalories;
                } else {
                    const repRatio = Math.min(1, this.currentRep / this.targetReps);
                    const currentSetCalories = repRatio * baseCalories;
                    this.caloriesBurned = Math.round(fullSetsCalories + currentSetCalories);
                }
            }

            this.caloriesBurned = Math.max(0, this.caloriesBurned);
        }

        startSessionTimer() {
            if (this.sessionTimer) clearInterval(this.sessionTimer);
            this.sessionTimer = setInterval(() => {
                if (this.paused || !this.active) return;
                this.sessionSeconds++;
                this.recalculateCalories();
                this.updateSessionClock();
            }, 1000);
        }

        startRepetitionTracking() {
            if (this.paused || !this.active) return;
            this.clearRepTimer();

            const config = EXERCISE_CONFIG[this.currentExerciseKey] || EXERCISE_CONFIG.squat;
            const video = this.videoManager ? this.videoManager.videoEl : null;

            if (this.isPlankHold) {
                // Timed isometric hold
                this.repTimer = setInterval(() => {
                    if (this.paused || this.isResting) return;
                    if (video && (video.paused || video.ended)) {
                        video.play().catch(() => { });
                    }
                    this.holdSeconds++;
                    this.recalculateCalories();
                    this.updateUI();

                    if (this.holdSeconds === 15) {
                        this.voiceCoach.speak("15 seconds down! Hold strong!", { rate: 1.1 });
                    } else if (this.holdSeconds === Math.floor(this.targetHoldSeconds / 2)) {
                        this.voiceCoach.speak("Halfway there! Keep breathing!", { rate: 1.1 });
                    } else if (this.holdSeconds === this.targetHoldSeconds - 5) {
                        this.voiceCoach.speak("Final 5 seconds! Finish strong!", { rate: 1.15 });
                    }

                    if (this.holdSeconds >= this.targetHoldSeconds) {
                        this.clearRepTimer();
                        this.onSetComplete();
                    }
                }, 1000);
            } else {
                // Natural Paced Repetition Cadence (Controlled, Normal Human Speed)
                // Ensures steady, rhythmic pacing without skipping or rushing
                const isCardio = config.isCardio || /jumping_jacks|mountain_climbers|high_knees|burpees/i.test(this.currentExerciseKey);
                // Standard human strength tempo: 3.0 seconds (eccentric, pause, concentric)
                // Fast cardio tempo: 1.8 - 2.0 seconds
                const repDuration = isCardio ? Math.max(1.8, config.repTempo || 2.0) : Math.max(3.0, config.repTempo || 3.0);

                // Calibrate video playback to match the comfortable repetition tempo smoothly
                if (video) {
                    video.loop = true;
                    const syncVideoRate = () => {
                        if (video.duration && !isNaN(video.duration) && video.duration > 0.5) {
                            const dur = video.duration;
                            if (dur < 2.5) {
                                // Short 1-rep loops (e.g. 1.3s - 2.0s): play at relaxed speed matching normal tempo
                                const targetRate = Math.min(1.0, Math.max(0.65, dur / repDuration));
                                video.playbackRate = targetRate;
                            } else {
                                video.playbackRate = 1.0;
                            }
                        }
                    };
                    syncVideoRate();
                    video.addEventListener('loadedmetadata', syncVideoRate, { once: true });
                }

                let repAccumulator = 0;
                const TICK_MS = 50;

                this.repTimer = setInterval(() => {
                    if (this.paused || this.isResting || !this.active) return;

                    // Ensure video continues looping smoothly while active
                    if (video && video.paused && !video.ended) {
                        video.play().catch(() => { });
                    }

                    repAccumulator += (TICK_MS / 1000);

                    // When 1 full normal rep cycle (e.g. 3.0s) has completed
                    if (repAccumulator >= repDuration) {
                        repAccumulator -= repDuration;
                        this.recordRepetition();
                    }
                }, TICK_MS);
            }
        }

        recordRepetition() {
            if (this.paused || this.isResting || !this.active) return;

            this.currentRep++;
            this.recalculateCalories();
            this.updateUI();

            const isLastRep = this.currentRep >= this.targetReps;

            if (isLastRep) {
                this.clearRepTimer();
                this.videoManager.pause();

                let completed = false;
                const proceed = () => {
                    if (completed) return;
                    completed = true;
                    setTimeout(() => this.onSetComplete(), 350);
                };

                // Safety timer so the set proceeds even if browser speech synthesis drops the callback
                const safetyTimer = setTimeout(proceed, 1200);

                // Coach speaks final repetition number (e.g. "Twelve!") and waits for it to complete
                this.voiceCoach.announceRep(this.currentRep, () => {
                    clearTimeout(safetyTimer);
                    proceed();
                });
            } else {
                // Coach speaks repetition number ("1... 2... 3... 4...")
                this.voiceCoach.announceRep(this.currentRep);
            }
        }

        clearRepTimer() {
            if (this.repTimer) {
                clearInterval(this.repTimer);
                this.repTimer = null;
            }
        }

        onSetComplete() {
            this.clearRepTimer();

            if (this.currentSet < this.targetSets) {
                // Set completed! Announce set completion and start rest
                this.voiceCoach.congratulateSet(this.currentSet, this.targetSets, () => {
                    this.startRest(30);
                });
            } else {
                // All 3 sets completed! Announce exercise completion and advance
                this.onExerciseComplete();
            }
        }

        startRest(seconds = 30) {
            this.isResting = true;
            this.videoManager.pause();
            this.clearRepTimer();

            const restOverlay = document.getElementById('player-rest-overlay');
            const activeCtrls = document.getElementById('player-active-controls');
            if (restOverlay) restOverlay.classList.remove('hidden');
            if (activeCtrls) activeCtrls.classList.add('hidden');

            const statusEl = document.getElementById('rest-set-status-text');
            if (statusEl) statusEl.textContent = `Set ${this.currentSet} of ${this.targetSets} Completed`;

            let remaining = seconds;
            const secEl = document.getElementById('rest-timer-secs');
            const ringEl = document.getElementById('rest-timer-ring');
            const circ = 2 * Math.PI * 50;

            const tick = () => {
                if (secEl) secEl.textContent = remaining;
                if (ringEl) {
                    const frac = remaining / seconds;
                    ringEl.style.strokeDashoffset = circ * (1 - frac);
                }
                if (remaining <= 0) {
                    this.skipRest();
                } else {
                    remaining--;
                }
            };

            tick();
            if (this.restTimer) clearInterval(this.restTimer);
            this.restTimer = setInterval(tick, 1000);
        }

        skipRest() {
            if (this.restTimer) {
                clearInterval(this.restTimer);
                this.restTimer = null;
            }
            this.isResting = false;

            const restOverlay = document.getElementById('player-rest-overlay');
            const activeCtrls = document.getElementById('player-active-controls');
            if (restOverlay) restOverlay.classList.add('hidden');
            if (activeCtrls) activeCtrls.classList.remove('hidden');

            // Advance to next set
            this.currentSet++;
            this.currentRep = 0;
            this.holdSeconds = 0;
            this.updateUI();

            // Pause and reset video to frame 0 during the set transition countdown
            if (this.videoManager && this.videoManager.videoEl) {
                this.videoManager.videoEl.pause();
                this.videoManager.videoEl.currentTime = 0;
            }

            // Next set countdown: "Get ready!" -> "3... 2... 1... START!"
            this.voiceCoach.startExerciseCountdown(() => {
                this.startActiveSet();
            });
        }

        onExerciseComplete() {
            // Coach announces: "Excellent! Exercise completed!"
            this.voiceCoach.congratulateExercise(() => {
                setTimeout(() => {
                    if (typeof window.finishLiveExercise === 'function') {
                        window.finishLiveExercise();
                    }
                }, 600);
            });
        }

        logSet() {
            this.onSetComplete();
        }

        finishWorkout() {
            this.active = false;
            this.paused = true;
            this.clearRepTimer();
            if (this.sessionTimer) {
                clearInterval(this.sessionTimer);
                this.sessionTimer = null;
            }
            this.videoManager.pause();

            // Populate Completion Modal Telemetry
            const durationMins = Math.max(1, Math.round(this.sessionSeconds / 60));
            const durationEl = document.getElementById('complete-duration');
            if (durationEl) durationEl.textContent = `${durationMins} mins`;

            const calEl = document.getElementById('complete-calories');
            if (calEl) calEl.textContent = `${this.caloriesBurned} kcal`;

            const repsEl = document.getElementById('complete-reps');
            if (repsEl) repsEl.textContent = `${this.currentRep} Reps`;

            const listEl = document.getElementById('complete-exercises-list');
            if (listEl) {
                const exName = this.currentExercise ? this.currentExercise.name : "Workout Session";
                listEl.innerHTML = `<div class="flex justify-between items-center py-1 border-b border-white/5"><span>${exName}</span><span class="text-purple-300 font-mono">${this.currentSet} sets</span></div>`;
            }

            const compModal = document.getElementById('completion-modal');
            if (compModal) compModal.classList.remove('hidden');

            this.voiceCoach.finishWorkout();
            this.saveWorkoutSession();
        }

        saveWorkoutSession() {
            try {
                if (this.hasSavedSession) return;

                // Do not save a record if the workout was never started and has zero activity
                if (!this.isStarted && (!this.sessionSeconds || this.sessionSeconds <= 0) && (!this.currentRep || this.currentRep <= 0)) {
                    return;
                }

                this.hasSavedSession = true;

                this.recalculateCalories();

                const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('fitforge_email') || '';
                if (!userEmail) return;

                const totalDurationSecs = Math.max(0, Number(this.sessionSeconds) || 0);
                const durationMins = Math.round(totalDurationSecs / 60);
                const workoutName = this.currentExercise ? this.currentExercise.name : "Workout Session";
                const setsDone = this.currentRep >= this.targetReps ? this.currentSet : Math.max(0, this.currentSet - 1);

                const payload = {
                    email: userEmail,
                    workoutName: workoutName,
                    duration: totalDurationSecs,
                    durationSeconds: totalDurationSecs,
                    durationMinutes: durationMins,
                    calories: this.caloriesBurned,
                    repsCompleted: this.currentRep,
                    setsCompleted: setsDone,
                    avgFormScore: 98,
                    completedAt: new Date().toISOString()
                };

                // Single centralized persistence: /api/workout-session/complete saves both WorkoutSession and Workout
                fetch('/api/workout-session/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).then(res => {
                    if (!res.ok) {
                        // Fallback to /api/workouts only if /api/workout-session/complete fails
                        return fetch('/api/workouts', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                email: userEmail,
                                workoutName: workoutName,
                                duration: totalDurationSecs,
                                steps: this.currentRep * 12,
                                distance: this.currentRep * 8,
                                calories: this.caloriesBurned,
                                date: new Date().toISOString()
                            })
                        });
                    }
                }).then(() => {
                    if (typeof window.fetchStatsAndLogs === 'function') {
                        window.fetchStatsAndLogs();
                    }
                }).catch(() => { });

            } catch (e) { }
        }

        requestStopWorkout() {
            this.pauseWorkout();
            const modal = document.getElementById('stop-workout-modal');
            if (modal) modal.classList.remove('hidden');
        }

        confirmStopWorkout() {
            const modal = document.getElementById('stop-workout-modal');
            if (modal) modal.classList.add('hidden');
            // Save the session only if the workout was started or has elapsed time/reps
            if (this.isStarted || this.sessionSeconds > 0 || this.currentRep > 0) {
                this.saveWorkoutSession();
            }
            this.exitSession();
            if (typeof window.closeLivePlayer === 'function') {
                window.closeLivePlayer();
            }
        }

        cancelStopWorkout() {
            const modal = document.getElementById('stop-workout-modal');
            if (modal) modal.classList.add('hidden');
            this.resumeWorkout();
        }

        exitSession() {
            this.active = false;
            this.paused = true;
            this.isStarted = false;
            this.clearRepTimer();
            if (this.sessionTimer) {
                clearInterval(this.sessionTimer);
                this.sessionTimer = null;
            }
            if (this.restTimer) {
                clearInterval(this.restTimer);
                this.restTimer = null;
            }
            this.videoManager.pause();
            const countdownEl = document.getElementById('coach-countdown-overlay');
            if (countdownEl) countdownEl.classList.add('hidden');
            const pauseEl = document.getElementById('trainer-paused-overlay');
            if (pauseEl) pauseEl.classList.add('hidden');
            this.updateToggleButton(false, false);
            const statusDot = document.getElementById('coach-status-dot');
            const statusText = document.getElementById('coach-status-text');
            if (statusDot) statusDot.className = "w-2 h-2 rounded-full bg-emerald-400 animate-pulse";
            if (statusText) statusText.textContent = "READY";
        }

        updateToggleButton(isPlaying, isPaused = false) {
            const btn = document.getElementById('player-btn-toggle');
            if (!btn) return;

            if (isPlaying) {
                btn.className = "w-full py-4 px-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-headline text-xs uppercase tracking-wider font-bold active:scale-95 transition-all shadow-[0_0_25px_rgba(245,158,11,0.4)] cursor-pointer flex items-center justify-center gap-2 border border-amber-400/50";
                btn.innerHTML = `<span class="material-symbols-outlined text-lg">pause</span><span>PAUSE WORKOUT</span>`;
            } else if (isPaused) {
                btn.className = "w-full py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-headline text-xs uppercase tracking-wider font-bold active:scale-95 transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/50";
                btn.innerHTML = `<span class="material-symbols-outlined text-lg">play_arrow</span><span>RESUME WORKOUT</span>`;
            } else {
                btn.className = "w-full py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-headline text-xs uppercase tracking-wider font-bold active:scale-95 transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/50";
                btn.innerHTML = `<span class="material-symbols-outlined text-lg">play_arrow</span><span>START WORKOUT</span>`;
            }
        }

        updateUI() {
            const repCountEl = document.getElementById('live-rep-count');
            const targetEl = document.getElementById('live-target-reps');
            const ringEl = document.getElementById('live-rep-ring');
            const circ = 289.026;

            if (this.isPlankHold) {
                if (repCountEl) repCountEl.textContent = `${this.holdSeconds}s`;
                if (targetEl) targetEl.textContent = `/ ${this.targetHoldSeconds}s HOLD`;

                if (ringEl) {
                    const progress = Math.min(1, this.holdSeconds / Math.max(1, this.targetHoldSeconds));
                    ringEl.style.strokeDashoffset = circ * (1 - progress);
                }
            } else {
                if (repCountEl) repCountEl.textContent = `${this.currentRep}`;
                if (targetEl) targetEl.textContent = `/ ${this.targetReps} REPS`;

                if (ringEl) {
                    const progress = Math.min(1, this.currentRep / Math.max(1, this.targetReps));
                    ringEl.style.strokeDashoffset = circ * (1 - progress);
                }
            }

            const compSetsEl = document.getElementById('player-completed-sets');
            const targetSetsEl = document.getElementById('player-target-sets');
            if (compSetsEl) compSetsEl.textContent = this.currentSet;
            if (targetSetsEl) targetSetsEl.textContent = this.targetSets;

            this.updateSessionClock();
        }

        updateSessionClock() {
            const timeEl = document.getElementById('player-session-time');
            if (timeEl) {
                const mins = String(Math.floor(this.sessionSeconds / 60)).padStart(2, '0');
                const secs = String(this.sessionSeconds % 60).padStart(2, '0');
                timeEl.textContent = `${mins}:${secs}`;
            }

            const calEl = document.getElementById('live-calories-burned');
            if (calEl) calEl.textContent = `${this.caloriesBurned} kcal`;
        }

        // Live Exercise Video Player Controls
        toggleMute() {
            return this.voiceCoach.toggleMute();
        }

        toggleVideoPlay() {
            this.videoManager.togglePlay();
        }

        replayVideo() {
            this.videoManager.replay();
        }

        toggleVideoMute() {
            return this.videoManager.toggleMute();
        }

        toggleFullscreen() {
            this.videoManager.toggleFullscreen();
        }
    }

    // Expose Singleton instance and control helpers globally
    window.LiveCoachEngine = new LiveCoachEngineClass();
    window.toggleTrainerVideoPlay = () => window.LiveCoachEngine.toggleVideoPlay();
    window.replayTrainerVideo = () => window.LiveCoachEngine.replayVideo();
    window.toggleTrainerVideoMute = () => window.LiveCoachEngine.toggleVideoMute();
    window.toggleTrainerVideoFullscreen = () => window.LiveCoachEngine.toggleFullscreen();
    window.toggleTrainerVideoFit = () => window.LiveCoachEngine.videoManager.toggleFit();

})();
