/**
 * FitForge AI Exercise Video Generation Service
 * 
 * Reads the existing 45-exercise database and manages:
 * 1. AI Video Prompt Synthesis (matching the 3D anatomical style with blue highlights & black background)
 * 2. External AI Video Generation Provider Integration (Runway Gen-3, Luma, Replicate, Veo, InVideo)
 * 3. Client-side WebGL Anatomical Video Recording & Storage
 * 4. Database sync (saving unique videoUrl per exercise ID)
 * 5. Generation Status and Verification Reporting
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DB_PATH = path.join(__dirname, 'exercises_database.json');
const VIDEOS_DIR = path.join(__dirname, 'public', 'videos', 'exercises');

// Ensure videos directory exists
if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

class ExerciseVideoGenerationService {
    constructor() {
        this.exercises = [];
        this.loadDatabase();
    }

    loadDatabase() {
        try {
            if (fs.existsSync(DB_PATH)) {
                this.exercises = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
            } else {
                this.exercises = [];
            }
        } catch (e) {
            console.error('Error loading exercises database:', e.message);
            this.exercises = [];
        }
    }

    saveDatabase() {
        try {
            fs.writeFileSync(DB_PATH, JSON.stringify(this.exercises, null, 2), 'utf8');
            return true;
        } catch (e) {
            console.error('Error saving exercises database:', e.message);
            return false;
        }
    }

    /**
     * Synthesizes the exact AI generation prompt for an exercise record
     * following the strict human trainer tutorial requirements:
     * - Realistic adult human trainer with natural anatomy & proportions
     * - Consistent appearance across all videos (Coach Marcus in athletic gym wear)
     * - Clean, distraction-free modern gym studio environment
     * - Correct exercise posture, technique, and proper equipment
     * - Full-body clear view showing starting position, execution, and return in a smooth loop
     */
    buildAIPrompt(exercise) {
        if (!exercise) return '';

        const equipmentDesc = exercise.equipment === 'No Equipment' 
            ? 'bodyweight floor space on a high-density black training mat' 
            : `using professional gym ${exercise.equipment}`;

        const instructionsText = Array.isArray(exercise.instructions) 
            ? exercise.instructions.join(' ') 
            : (exercise.instructions || '');

        return `Professional fitness exercise tutorial video of ${exercise.name}. ` +
               `Subject: A fit, athletic adult male human trainer (Coach Marcus) with natural, authentic human anatomy and athletic physique. ` +
               `Attire: Sleek black athletic gym tank top, dark athletic training shorts, and training shoes. Consistent coach appearance. ` +
               `Environment: Clean, high-end modern gym studio with dark aesthetic, subtle ambient lighting, zero distractions. ` +
               `Equipment: ${equipmentDesc}. ` +
               `Movement execution: ${exercise.postureDescription || instructionsText}. ` +
               `Target muscles engaged: ${exercise.targetMuscles || exercise.muscle || 'Full Body'}. ` +
               `Shot framing: Full-body camera angle showing the complete movement clearly from start to finish. ` +
               `Biomechanics: Smooth, controlled natural human tempo, full range of motion, showing starting position, concentric drive, and controlled eccentric return in a seamless continuous loop. ` +
               `Cinematic 4K UHD, 60fps, crisp authentic real-human exercise tutorial footage. No CGI mannequins, no robotic avatars, no cartoon graphics.`;
    }

    /**
     * Checks configured AI Video Generation Providers & API Keys
     */
    getProviderStatus() {
        const env = process.env;
        const providers = {
            gemini: {
                name: "Google Gemini AI",
                configured: !!env.GEMINI_API_KEY && env.GEMINI_API_KEY.length > 5,
                keyMask: env.GEMINI_API_KEY ? `${env.GEMINI_API_KEY.slice(0, 6)}...` : null,
                role: "Biomechanical Prompt Refinement & Plan Generation"
            },
            runway: {
                name: "Runway Gen-3 Alpha Video API",
                configured: !!env.RUNWAY_API_KEY,
                keyMask: env.RUNWAY_API_KEY ? `${env.RUNWAY_API_KEY.slice(0, 4)}...` : null,
                role: "Direct Text-to-Video Anatomical Generation"
            },
            luma: {
                name: "Luma Dream Machine API",
                configured: !!env.LUMA_API_KEY,
                keyMask: env.LUMA_API_KEY ? `${env.LUMA_API_KEY.slice(0, 4)}...` : null,
                role: "High-Fidelity 3D Kinematic Video Generation"
            },
            replicate: {
                name: "Replicate Video Models (SVD / Minimax)",
                configured: !!env.REPLICATE_API_TOKEN,
                keyMask: env.REPLICATE_API_TOKEN ? `${env.REPLICATE_API_TOKEN.slice(0, 4)}...` : null,
                role: "Cloud GPU Open-Source Video Diffusion"
            },
            invideo: {
                name: "InVideo AI Studio",
                configured: !!env.INVIDEO_API_KEY,
                keyMask: env.INVIDEO_API_KEY ? `${env.INVIDEO_API_KEY.slice(0, 4)}...` : null,
                role: "Video Timeline & Asset Generation"
            },
            webglRenderer: {
                name: "FitForge Three.js 3D Anatomical Synthesizer",
                configured: true,
                keyMask: "BUILT-IN (Active)",
                role: "Real-Time 3D Anatomical Muscle Rendering & Video Stream Export"
            }
        };

        return providers;
    }

    /**
     * Get detailed status of all 45 exercises in the database
     */
    getExerciseStatusSummary() {
        this.loadDatabase();

        const total = this.exercises.length;
        let completed = 0;
        let pending = 0;

        const exerciseList = this.exercises.map(ex => {
            // Check if dedicated video file exists on disk
            const expectedFileMp4 = path.join(VIDEOS_DIR, `${ex.id}.mp4`);
            const expectedFileWebm = path.join(VIDEOS_DIR, `${ex.id}.webm`);
            const fileExists = fs.existsSync(expectedFileMp4) || fs.existsSync(expectedFileWebm);

            let videoUrl = ex.videoUrl || '';
            if (fileExists && !videoUrl) {
                videoUrl = fs.existsSync(expectedFileMp4) 
                    ? `/public/videos/exercises/${ex.id}.mp4` 
                    : `/public/videos/exercises/${ex.id}.webm`;
                ex.videoUrl = videoUrl;
            }

            let status = (ex.videoStatus === 'completed' || ex.videoStatus === 'available' || !!videoUrl) 
                ? 'completed' 
                : (fileExists ? 'completed' : 'pending');

            if (status === 'completed' && videoUrl) {
                completed++;
            } else {
                pending++;
            }

            return {
                id: ex.id,
                name: ex.name,
                category: ex.category,
                targetMuscles: ex.targetMuscles || ex.muscle,
                difficulty: ex.difficulty,
                equipment: ex.equipment,
                status: status,
                videoUrl: videoUrl,
                aiPrompt: this.buildAIPrompt(ex)
            };
        });

        // Persist any updated file-matched URLs
        this.saveDatabase();

        return {
            totalExercises: total,
            completedCount: completed,
            pendingCount: pending,
            completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
            providers: this.getProviderStatus(),
            exercises: exerciseList
        };
    }

    /**
     * Assigns a generated or recorded video to an exercise ID
     */
    assignVideo(exerciseId, videoUrl) {
        this.loadDatabase();
        const ex = this.exercises.find(item => item.id === exerciseId);
        if (!ex) {
            throw new Error(`Exercise ID '${exerciseId}' not found in database.`);
        }

        ex.videoUrl = videoUrl;
        ex.videoStatus = 'completed';
        ex.videoGeneratedAt = new Date().toISOString();
        ex.aiPromptUsed = this.buildAIPrompt(ex);

        this.saveDatabase();
        return ex;
    }

    /**
     * Saves a recorded video binary stream (e.g. from WebGL Canvas capture or API)
     */
    saveRecordedVideoBuffer(exerciseId, buffer, format = 'mp4') {
        const fileName = `${exerciseId}.${format}`;
        const filePath = path.join(VIDEOS_DIR, fileName);
        fs.writeFileSync(filePath, buffer);

        const videoUrl = `/public/videos/exercises/${fileName}`;
        return this.assignVideo(exerciseId, videoUrl);
    }
}

module.exports = new ExerciseVideoGenerationService();

