/**
 * FitForge Centralized Planner Services
 * Single source of truth for:
 * - AIPlanningService
 * - PlannerService
 * - WorkoutService
 * - NutritionService
 * - ProgressService
 */

const aiPlannerEngine = require('../ai-planner-engine.js');

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getTodayWeekdayName() {
    const today = new Date();
    return DAYS_OF_WEEK[today.getDay() === 0 ? 6 : today.getDay() - 1];
}

function getTodayDateString(offset = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
}

class PlannerServicesManager {
    constructor() {
        this.models = null;
        this.io = null;
    }

    init(models, io = null) {
        this.models = models;
        this.io = io;
    }

    emitStateChange(email, payload = null) {
        if (this.io && email) {
            try {
                this.io.to(email.toLowerCase()).emit('fitforge:state-changed', {
                    email: email.toLowerCase(),
                    timestamp: Date.now(),
                    payload
                });
            } catch (err) {
                console.warn('Socket emit error:', err.message);
            }
        }
    }

    // =========================================================================
    // 1. AI PLANNING SERVICE
    // =========================================================================
    get AIPlanningService() {
        const self = this;
        return {
            async generateAndSavePlan(email, options = {}) {
                const { User, WorkoutPlan, WorkoutSession, WeeklyPlan, DailyProtocol, NutritionPlan, ProgressMetric, AIPlan, ActivityLog } = self.models;
                if (!email) throw new Error("Email is required for plan generation");

                const normalizedEmail = email.toLowerCase();
                const user = await User.findOne({ email: normalizedEmail });

                const profile = {
                    age: user?.protocol?.age || options.age || 26,
                    biologicalSex: user?.protocol?.biologicalSex || options.gender || 'male',
                    weight: user?.protocol?.weight || options.weight || 75,
                    height: user?.protocol?.height || options.height || 176,
                    goal: options.goal || user?.protocol?.goal || user?.protocol?.goals?.[0] || 'Muscle Gain & Athletic Definition',
                    activityLevel: user?.protocol?.activityLevel || options.activityLevel || 'moderate',
                    workoutPreference: user?.protocol?.workoutPreference || options.workoutPreference || 'Strength & Hypertrophy',
                    location: user?.protocol?.location || options.location || 'gym',
                    equipment: user?.protocol?.equipment || ['dumbbells', 'barbell', 'bench', 'pull-up bar'],
                    frequency: options.frequency || 5,
                    splitPreference: options.splitPreference || 'Push/Pull/Legs + Upper/Core',
                    targetBurnCals: options.burnTarget?.targetBurnCals || 450,
                    dietaryType: user?.dietProfile?.dietaryType || 'non-vegetarian',
                    allergies: user?.dietProfile?.allergies || [],
                    healthConditions: user?.dietProfile?.healthConditions || []
                };

                const targetDateStr = options.targetDate || options.date || getTodayDateString(0);
                const dateParts = targetDateStr.split('-').map(Number);
                const targetDateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                const targetWeekday = DAYS_OF_WEEK[targetDateObj.getDay() === 0 ? 6 : targetDateObj.getDay() - 1];

                // Deterministic seed for this specific day so each day gets distinct meals & workouts
                const seedString = `${normalizedEmail}_${targetDateStr}`;
                let hash = 0;
                for (let i = 0; i < seedString.length; i++) {
                    hash = ((hash << 5) - hash) + seedString.charCodeAt(i);
                    hash |= 0;
                }
                const dateSeed = Math.abs(hash) + (options.seed || 0) + (options.forceNew ? Math.floor(Date.now() / 1000) : 0);

                // Run scientific calculations via aiPlannerEngine with day-specific seed
                const masterPlan = aiPlannerEngine.buildMasterPlan(profile, dateSeed, { targetBurnCals: profile.targetBurnCals });

                // Construct full 7-day scientific weekly workout schedule
                const weeklyWorkouts = self.buildWeeklyWorkoutSchedule(profile, masterPlan);
                const restDays = ["Wednesday", "Sunday"];
                if (profile.frequency === 3) restDays.push("Tuesday", "Thursday");
                if (profile.frequency === 4) restDays.push("Saturday");

                const daysMap = {
                    Monday: [],
                    Tuesday: [],
                    Wednesday: [],
                    Thursday: [],
                    Friday: [],
                    Saturday: [],
                    Sunday: []
                };

                // Distribute workouts across days
                weeklyWorkouts.forEach(w => {
                    if (daysMap[w.day]) {
                        daysMap[w.day].push(w);
                    }
                });

                const todayWorkouts = daysMap[targetWeekday] || [];
                const isRestDay = restDays.includes(targetWeekday);

                // Generate smart Indian meals unique to this specific day & seed
                const rawMealObjects = aiPlannerEngine.generateSmartMealPlan(
                    masterPlan.dailyTarget,
                    profile.dietaryType || 'non-vegetarian',
                    profile.allergies || [],
                    dateSeed
                );

                const mealSlotNames = ['Breakfast', 'Mid-Morning', 'Lunch', 'Afternoon Refuel', 'Dinner'];
                const meals = rawMealObjects.map((m, idx) => ({
                    mealType: m.details?.mealType || mealSlotNames[idx] || 'Meal',
                    time: m.time,
                    title: m.details?.suggestedMeal || m.title,
                    calories: m.details?.targetCalories || 400,
                    protein: m.details?.protein || 25,
                    carbs: m.details?.carbs || 45,
                    fat: m.details?.fat || 12,
                    ingredients: m.details?.ingredients || []
                }));

                // 24-Hour Chronological Protocol for this day
                const dailyTimeline = self.buildDailyProtocolTimeline(profile, masterPlan, isRestDay ? null : todayWorkouts[0], meals);

                // 1. Deactivate old AI Plans & Weekly Plans
                await AIPlan.updateMany({ email: normalizedEmail }, { active: false });
                await WeeklyPlan.updateMany({ email: normalizedEmail }, { active: false });
                await WorkoutPlan.updateMany({ email: normalizedEmail }, { active: false });
                await NutritionPlan.updateMany({ email: normalizedEmail }, { active: false });

                // 2. Save AIPlan
                const planId = 'plan_' + Date.now();
                const aiPlanDoc = new AIPlan({
                    email: normalizedEmail,
                    planId: planId,
                    headline: masterPlan.headline || "AI Precision Master Protocol",
                    summary: masterPlan.summary || "Adaptive biometric schedule calibrated to user metabolic goals.",
                    protocolSnapshot: profile,
                    weeklySplit: weeklyWorkouts,
                    dailyTimeline: dailyTimeline,
                    nutritionTarget: masterPlan.dailyTarget,
                    recoverySchedule: [
                        { day: "Wednesday", focus: "Central Nervous System Deload, Gentle Walk, 8h Sleep" },
                        { day: "Sunday", focus: "Full Glycogen Repletion, Cold/Hot Contrast, 8h Sleep" }
                    ],
                    aiReasoning: masterPlan.aiReasoning || {},
                    active: true
                });
                await aiPlanDoc.save();

                // 3. Save WeeklyPlan
                const weeklyPlanDoc = new WeeklyPlan({
                    email: normalizedEmail,
                    weekOffset: 0,
                    weekStartDate: new Date(),
                    weekEndDate: new Date(Date.now() + 7 * 86400000),
                    days: daysMap,
                    restDays: restDays,
                    active: true
                });
                await weeklyPlanDoc.save();

                // 4. Save WorkoutPlan
                const workoutPlanDoc = new WorkoutPlan({
                    email: normalizedEmail,
                    planId: planId,
                    goal: profile.goal,
                    splitPreference: profile.splitPreference,
                    frequency: profile.frequency,
                    targetMuscles: ['Chest', 'Back', 'Shoulders', 'Legs', 'Core'],
                    schedule: weeklyWorkouts,
                    active: true
                });
                await workoutPlanDoc.save();

                // 5. Save DailyProtocol for the target date
                await DailyProtocol.deleteMany({ email: normalizedEmail, date: targetDateStr });
                const dailyProtocolDoc = new DailyProtocol({
                    email: normalizedEmail,
                    date: targetDateStr,
                    weekday: targetWeekday,
                    timeline: dailyTimeline,
                    meals: meals,
                    workout: isRestDay ? null : todayWorkouts[0],
                    targets: {
                        bmr: masterPlan.dailyTarget?.bmr || 1780,
                        tdee: masterPlan.dailyTarget?.tdee || 2450,
                        calories: masterPlan.dailyTarget?.calories || 2150,
                        protein: masterPlan.dailyTarget?.protein || 165,
                        carbs: masterPlan.dailyTarget?.carbs || 220,
                        fat: masterPlan.dailyTarget?.fat || 65,
                        waterLiters: masterPlan.dailyTarget?.waterLiters || 3.5,
                        burnTarget: profile.targetBurnCals
                    },
                    adherence: {
                        doneCount: 0,
                        totalCount: dailyTimeline.length,
                        percentage: 0
                    }
                });
                await dailyProtocolDoc.save();

                // 6. Save NutritionPlan
                const nutritionPlanDoc = new NutritionPlan({
                    email: normalizedEmail,
                    dailyCalories: masterPlan.dailyTarget?.calories || 2150,
                    protein: masterPlan.dailyTarget?.protein || 165,
                    carbs: masterPlan.dailyTarget?.carbs || 220,
                    fat: masterPlan.dailyTarget?.fat || 65,
                    waterTargetLiters: masterPlan.dailyTarget?.waterLiters || 3.5,
                    meals: meals,
                    active: true
                });
                await nutritionPlanDoc.save();

                // 7. Save WorkoutSession items for each day to allow independent tracking
                for (const w of weeklyWorkouts) {
                    await WorkoutSession.findOneAndUpdate(
                        { email: normalizedEmail, sessionId: w.id },
                        {
                            email: normalizedEmail,
                            sessionId: w.id,
                            workoutName: w.title,
                            category: w.category,
                            difficulty: w.difficulty,
                            duration: w.duration,
                            calories: w.calories,
                            targetMuscles: w.targetMuscles,
                            day: w.day,
                            exercises: w.exercises,
                            completed: false
                        },
                        { upsert: true, new: true }
                    );
                }

                // 8. Update ProgressMetrics
                await self.ProgressService.recalculateMetrics(normalizedEmail);

                // 9. Activity Log
                await ActivityLog.create({
                    email: normalizedEmail,
                    activityType: 'plan_generated',
                    description: `Generated AI Master Protocol for ${targetDateStr} calibrated for ${profile.goal} (${profile.frequency} days/week).`,
                    metadata: { planId, goal: profile.goal, date: targetDateStr, calories: masterPlan.dailyTarget?.calories }
                });

                const state = await self.PlannerService.getPlannerState(normalizedEmail, targetDateStr);
                self.emitStateChange(normalizedEmail, state);
                return state;
            }
        };
    }

    // =========================================================================
    // 2. PLANNER SERVICE (State & Protocol Step Toggling)
    // =========================================================================
    get PlannerService() {
        const self = this;
        return {
            async getPlannerState(email, dateStr = null) {
                const { WeeklyPlan, DailyProtocol, NutritionPlan, ProgressMetric, AIPlan, WorkoutSession } = self.models;
                const normalizedEmail = email ? email.toLowerCase() : 'athlete@fitforge.com';
                const targetDate = dateStr || getTodayDateString(0);

                let weeklyPlan = await WeeklyPlan.findOne({ email: normalizedEmail, active: true });
                let dailyProtocol = await DailyProtocol.findOne({ email: normalizedEmail, date: targetDate });
                let nutritionPlan = await NutritionPlan.findOne({ email: normalizedEmail, active: true });
                let metrics = await ProgressMetric.findOne({ email: normalizedEmail });
                let aiPlan = await AIPlan.findOne({ email: normalizedEmail, active: true });

                const allWorkouts = [];
                if (weeklyPlan && weeklyPlan.days) {
                    for (const day of DAYS_OF_WEEK) {
                        if (Array.isArray(weeklyPlan.days[day])) {
                            allWorkouts.push(...weeklyPlan.days[day]);
                        }
                    }
                }

                // CRITICAL: Do NOT auto-generate default plans! Users generate their plan daily.
                if (!dailyProtocol) {
                    return {
                        success: true,
                        email: normalizedEmail,
                        date: targetDate,
                        hasPlan: false,
                        aiPlan: null,
                        weeklyPlan: weeklyPlan || null,
                        workouts: allWorkouts,
                        restDays: weeklyPlan?.restDays || ['Sunday'],
                        dailyProtocol: null,
                        nutritionPlan: null,
                        progressMetrics: metrics || await self.ProgressService.recalculateMetrics(normalizedEmail)
                    };
                }

                // Ensure latest workout session statuses match weekly plan days
                const sessions = await WorkoutSession.find({ email: normalizedEmail });
                const sessionMap = new Map(sessions.map(s => [s.sessionId, s]));

                if (weeklyPlan && weeklyPlan.days) {
                    let changed = false;
                    for (const day of DAYS_OF_WEEK) {
                        const dayList = weeklyPlan.days[day] || [];
                        dayList.forEach(w => {
                            if (sessionMap.has(w.id)) {
                                const dbSession = sessionMap.get(w.id);
                                if (w.completed !== dbSession.completed) {
                                    w.completed = dbSession.completed;
                                    changed = true;
                                }
                            }
                        });
                    }
                    if (changed) {
                        await WeeklyPlan.updateOne({ _id: weeklyPlan._id }, { days: weeklyPlan.days });
                    }
                }

                return {
                    success: true,
                    email: normalizedEmail,
                    date: targetDate,
                    hasPlan: true,
                    aiPlan,
                    weeklyPlan,
                    workouts: allWorkouts,
                    restDays: weeklyPlan?.restDays || ['Sunday'],
                    dailyProtocol,
                    nutritionPlan: {
                        ...(nutritionPlan ? (nutritionPlan.toObject ? nutritionPlan.toObject() : nutritionPlan) : {}),
                        meals: (dailyProtocol.meals && dailyProtocol.meals.length > 0) ? dailyProtocol.meals : (nutritionPlan?.meals || [])
                    },
                    progressMetrics: metrics || await self.ProgressService.recalculateMetrics(normalizedEmail)
                };
            },

            async toggleProtocolStep(email, dateStr, stepId, title) {
                const { DailyProtocol, ActivityLog } = self.models;
                const normalizedEmail = email.toLowerCase();
                const targetDate = dateStr || getTodayDateString(0);

                let protocol = await DailyProtocol.findOne({ email: normalizedEmail, date: targetDate });
                if (!protocol) {
                    await self.PlannerService.getPlannerState(normalizedEmail, targetDate);
                    protocol = await DailyProtocol.findOne({ email: normalizedEmail, date: targetDate });
                }

                if (!protocol) throw new Error("Daily protocol not found for date: " + targetDate);

                let isStepDone = false;
                protocol.timeline.forEach(item => {
                    if (item.id === stepId) {
                        item.isDone = !item.isDone;
                        item.completedAt = item.isDone ? new Date() : null;
                        isStepDone = item.isDone;
                    }
                });

                // Update adherence
                const doneCount = protocol.timeline.filter(i => i.isDone).length;
                const totalCount = protocol.timeline.length;
                protocol.adherence = {
                    doneCount,
                    totalCount,
                    percentage: Math.round((doneCount / totalCount) * 100)
                };

                await DailyProtocol.updateOne({ _id: protocol._id }, {
                    timeline: protocol.timeline,
                    adherence: protocol.adherence
                });

                // If this is the workout step and viewing today, sync with Today's workout session
                if (stepId === 'step-workout' && targetDate === getTodayDateString(0)) {
                    const todayDay = getTodayWeekdayName();
                    await self.WorkoutService.setDayWorkoutCompletion(normalizedEmail, todayDay, isStepDone);
                }

                await self.ProgressService.recalculateMetrics(normalizedEmail);

                await ActivityLog.create({
                    email: normalizedEmail,
                    activityType: 'protocol_ticked',
                    description: `${isStepDone ? 'Completed' : 'Unticked'} protocol step: "${title || stepId}"`,
                    metadata: { stepId, isStepDone, date: targetDate }
                });

                const state = await self.PlannerService.getPlannerState(normalizedEmail, targetDate);
                self.emitStateChange(normalizedEmail, state);
                return { success: true, isStepDone, state };
            },

            async toggleRestDay(email, dayName) {
                const { WeeklyPlan, ActivityLog } = self.models;
                const normalizedEmail = email.toLowerCase();

                let weekly = await WeeklyPlan.findOne({ email: normalizedEmail, active: true });
                if (!weekly) return { success: false, error: "Weekly plan not found" };

                let restDays = weekly.restDays || [];
                let isRest = false;
                if (restDays.includes(dayName)) {
                    restDays = restDays.filter(d => d !== dayName);
                    isRest = false;
                } else {
                    restDays.push(dayName);
                    isRest = true;
                }
                weekly.restDays = restDays;
                await WeeklyPlan.updateOne({ _id: weekly._id }, { restDays: restDays });

                await self.ProgressService.recalculateMetrics(normalizedEmail);

                await ActivityLog.create({
                    email: normalizedEmail,
                    activityType: 'rest_day_toggled',
                    description: `${dayName} marked as ${isRest ? 'Rest Day' : 'Training Day'}`,
                    metadata: { dayName, isRest }
                });

                const state = await self.PlannerService.getPlannerState(normalizedEmail);
                self.emitStateChange(normalizedEmail, state);
                return { success: true, isRest, state };
            }
        };
    }

    // =========================================================================
    // 3. WORKOUT SERVICE (Add, Update, Delete, Toggle Completion)
    // =========================================================================
    get WorkoutService() {
        const self = this;
        return {
            async addWorkout(email, workoutData) {
                const { WorkoutSession, WeeklyPlan, DailyProtocol, ActivityLog } = self.models;
                const normalizedEmail = email.toLowerCase();

                const workoutId = 'w-' + Date.now();
                const day = workoutData.day || getTodayWeekdayName();
                const duration = parseInt(workoutData.duration, 10) || 45;
                const calories = parseInt(workoutData.calories, 10) || 400;

                const exercises = Array.isArray(workoutData.exercises) && workoutData.exercises.length > 0 
                    ? workoutData.exercises 
                    : [
                        { name: "Primary Compound Movement", sets: 4, reps: "10-12", completed: false },
                        { name: "Secondary Accessory Movement", sets: 3, reps: "12", completed: false },
                        { name: "Metabolic Finisher", sets: 3, reps: "15", completed: false }
                    ];

                const session = new WorkoutSession({
                    email: normalizedEmail,
                    sessionId: workoutId,
                    workoutName: workoutData.title || workoutData.name || "Custom Workout Session",
                    category: workoutData.category || "Strength",
                    difficulty: workoutData.difficulty || "Intermediate",
                    duration: duration,
                    calories: calories,
                    targetMuscles: workoutData.targetMuscles || "Full Body Compound",
                    day: day,
                    notes: workoutData.notes || "",
                    exercises: exercises,
                    completed: false
                });
                await session.save();

                // Add to WeeklyPlan
                const weekly = await WeeklyPlan.findOne({ email: normalizedEmail, active: true });
                if (weekly && weekly.days) {
                    if (!weekly.days[day]) weekly.days[day] = [];
                    weekly.days[day].push({
                        id: workoutId,
                        day: day,
                        time: workoutData.time || "09:00 AM",
                        title: session.workoutName,
                        category: session.category,
                        difficulty: session.difficulty,
                        duration: session.duration,
                        calories: session.calories,
                        targetMuscles: session.targetMuscles,
                        completed: false,
                        exercises: session.exercises
                    });

                    // Remove from rest days if it was marked rest
                    if (weekly.restDays && weekly.restDays.includes(day)) {
                        weekly.restDays = weekly.restDays.filter(d => d !== day);
                    }

                    await WeeklyPlan.updateOne({ _id: weekly._id }, {
                        days: weekly.days,
                        restDays: weekly.restDays
                    });
                }

                // If scheduled for Today, update DailyProtocol workout step
                const todayDay = getTodayWeekdayName();
                if (day === todayDay) {
                    const todayDate = getTodayDateString(0);
                    const protocol = await DailyProtocol.findOne({ email: normalizedEmail, date: todayDate });
                    if (protocol) {
                        protocol.timeline.forEach(step => {
                            if (step.id === 'step-workout') {
                                step.title = session.workoutName;
                                step.desc = `${session.category} • ${session.duration}m • ${session.calories} kcal • Target: ${session.targetMuscles}`;
                                step.isDone = false;
                            }
                        });
                        await DailyProtocol.updateOne({ _id: protocol._id }, { timeline: protocol.timeline });
                    }
                }

                await self.ProgressService.recalculateMetrics(normalizedEmail);

                await ActivityLog.create({
                    email: normalizedEmail,
                    activityType: 'workout_added',
                    description: `Added "${session.workoutName}" to ${day}'s schedule.`,
                    metadata: { workoutId, day, calories }
                });

                const state = await self.PlannerService.getPlannerState(normalizedEmail);
                self.emitStateChange(normalizedEmail, state);
                return { success: true, workout: session, state };
            },

            async toggleWorkoutCompletion(email, workoutId) {
                const { WorkoutSession, WeeklyPlan, DailyProtocol, ActivityLog } = self.models;
                const normalizedEmail = email.toLowerCase();

                const session = await WorkoutSession.findOne({ email: normalizedEmail, sessionId: workoutId });
                if (!session) throw new Error("Workout session not found: " + workoutId);

                session.completed = !session.completed;
                session.completedAt = session.completed ? new Date() : null;
                if (session.exercises) {
                    session.exercises.forEach(e => e.completed = session.completed);
                }
                await session.save();

                // Update WeeklyPlan
                const weekly = await WeeklyPlan.findOne({ email: normalizedEmail, active: true });
                if (weekly && weekly.days && weekly.days[session.day]) {
                    weekly.days[session.day].forEach(w => {
                        if (w.id === workoutId) {
                            w.completed = session.completed;
                            if (w.exercises) w.exercises.forEach(e => e.completed = session.completed);
                        }
                    });
                    await WeeklyPlan.updateOne({ _id: weekly._id }, { days: weekly.days });
                }

                // If this workout is on today, sync DailyProtocol step-workout
                const todayDay = getTodayWeekdayName();
                if (session.day === todayDay) {
                    const todayDate = getTodayDateString(0);
                    const protocol = await DailyProtocol.findOne({ email: normalizedEmail, date: todayDate });
                    if (protocol) {
                        protocol.timeline.forEach(step => {
                            if (step.id === 'step-workout') {
                                step.isDone = session.completed;
                                step.completedAt = session.completed ? new Date() : null;
                            }
                        });
                        const doneCount = protocol.timeline.filter(i => i.isDone).length;
                        const totalCount = protocol.timeline.length;
                        protocol.adherence = {
                            doneCount,
                            totalCount,
                            percentage: Math.round((doneCount / totalCount) * 100)
                        };
                        await DailyProtocol.updateOne({ _id: protocol._id }, {
                            timeline: protocol.timeline,
                            adherence: protocol.adherence
                        });
                    }
                }

                await self.ProgressService.recalculateMetrics(normalizedEmail);

                await ActivityLog.create({
                    email: normalizedEmail,
                    activityType: 'workout_completed',
                    description: `${session.completed ? 'Finished and ticked' : 'Unticked'}: "${session.workoutName}" (${session.calories} kcal).`,
                    metadata: { workoutId, completed: session.completed, calories: session.calories }
                });

                const state = await self.PlannerService.getPlannerState(normalizedEmail);
                self.emitStateChange(normalizedEmail, state);
                return { success: true, completed: session.completed, state };
            },

            async setDayWorkoutCompletion(email, dayName, isCompleted) {
                const { WorkoutSession, WeeklyPlan } = self.models;
                const normalizedEmail = email.toLowerCase();

                await WorkoutSession.updateMany(
                    { email: normalizedEmail, day: dayName },
                    { completed: isCompleted, completedAt: isCompleted ? new Date() : null }
                );

                const weekly = await WeeklyPlan.findOne({ email: normalizedEmail, active: true });
                if (weekly && weekly.days && weekly.days[dayName]) {
                    weekly.days[dayName].forEach(w => {
                        w.completed = isCompleted;
                        if (w.exercises) w.exercises.forEach(e => e.completed = isCompleted);
                    });
                    await WeeklyPlan.updateOne({ _id: weekly._id }, { days: weekly.days });
                }
            },

            async deleteWorkout(email, workoutId) {
                const { WorkoutSession, WeeklyPlan, ActivityLog } = self.models;
                const normalizedEmail = email.toLowerCase();

                const session = await WorkoutSession.findOne({ email: normalizedEmail, sessionId: workoutId });
                if (session) {
                    await WorkoutSession.deleteOne({ _id: session._id });

                    const weekly = await WeeklyPlan.findOne({ email: normalizedEmail, active: true });
                    if (weekly && weekly.days && weekly.days[session.day]) {
                        weekly.days[session.day] = weekly.days[session.day].filter(w => w.id !== workoutId);
                        await WeeklyPlan.updateOne({ _id: weekly._id }, { days: weekly.days });
                    }

                    await self.ProgressService.recalculateMetrics(normalizedEmail);

                    await ActivityLog.create({
                        email: normalizedEmail,
                        activityType: 'workout_deleted',
                        description: `Removed workout "${session.workoutName}" from ${session.day}.`,
                        metadata: { workoutId }
                    });
                }

                const state = await self.PlannerService.getPlannerState(normalizedEmail);
                self.emitStateChange(normalizedEmail, state);
                return { success: true, state };
            },

            async completeLiveWorkoutSession(email, sessionDetails = {}) {
                const { WorkoutSession, WeeklyPlan, DailyProtocol, ActivityLog, Workout } = self.models;
                const normalizedEmail = email.toLowerCase();

                const sessionId = sessionDetails.sessionId || ('ws-' + Date.now());
                const durationMinutes = Number(sessionDetails.duration) || Math.max(1, Math.round((Number(sessionDetails.durationSeconds) || 1800) / 60));
                const calories = Number(sessionDetails.calories) || 350;
                const workoutName = sessionDetails.workoutName || "Live Workout Session";
                const day = sessionDetails.day || getTodayWeekdayName();
                const todayDate = getTodayDateString(0);
                const reps = Number(sessionDetails.repsCompleted) || 0;
                const sets = Number(sessionDetails.setsCompleted) || 0;
                const formScore = Number(sessionDetails.avgFormScore) || 95;

                // 1. Create or update WorkoutSession in MongoDB
                const session = await WorkoutSession.findOneAndUpdate(
                    { email: normalizedEmail, sessionId: sessionId },
                    {
                        email: normalizedEmail,
                        sessionId: sessionId,
                        workoutName: workoutName,
                        category: sessionDetails.category || "Strength & Form",
                        difficulty: sessionDetails.difficulty || "Intermediate",
                        duration: durationMinutes,
                        calories: calories,
                        targetMuscles: sessionDetails.targetMuscles || "Full Body",
                        day: day,
                        date: new Date(),
                        notes: sessionDetails.notes || `Live coaching session with real-time pose form score of ${formScore}%.`,
                        exercises: sessionDetails.exercises || [],
                        completed: true,
                        completedAt: new Date(),
                        repsCompleted: reps,
                        setsCompleted: sets,
                        avgFormScore: formScore
                    },
                    { upsert: true, new: true }
                );

                // 2. Also log to Workout collection for workout analytics
                if (Workout) {
                    await Workout.create({
                        email: normalizedEmail,
                        workoutName: workoutName,
                        duration: durationMinutes,
                        steps: reps * 12,
                        distance: reps * 8,
                        calories: calories,
                        date: new Date()
                    });
                }

                // 3. Sync DailyProtocol step-workout
                const protocol = await DailyProtocol.findOne({ email: normalizedEmail, date: todayDate });
                if (protocol && protocol.timeline) {
                    protocol.timeline.forEach(step => {
                        if (step.id === 'step-workout') {
                            step.title = workoutName;
                            step.desc = `Live Session Completed • ${durationMinutes}m • ${calories} kcal • Form: ${formScore}%`;
                            step.isDone = true;
                            step.completedAt = new Date();
                        }
                    });
                    const doneCount = protocol.timeline.filter(i => i.isDone).length;
                    const totalCount = protocol.timeline.length;
                    protocol.adherence = {
                        doneCount,
                        totalCount,
                        percentage: Math.round((doneCount / totalCount) * 100)
                    };
                    await DailyProtocol.updateOne({ _id: protocol._id }, {
                        timeline: protocol.timeline,
                        adherence: protocol.adherence
                    });
                }

                // 4. Sync WeeklyPlan
                const weekly = await WeeklyPlan.findOne({ email: normalizedEmail, active: true });
                if (weekly && weekly.days) {
                    if (!weekly.days[day]) weekly.days[day] = [];
                    const existingIndex = weekly.days[day].findIndex(w => w.id === sessionId || w.title === workoutName);
                    if (existingIndex >= 0) {
                        weekly.days[day][existingIndex].completed = true;
                        weekly.days[day][existingIndex].duration = durationMinutes;
                        weekly.days[day][existingIndex].calories = calories;
                    } else {
                        weekly.days[day].push({
                            id: sessionId,
                            day: day,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            title: workoutName,
                            category: session.category,
                            difficulty: session.difficulty,
                            duration: durationMinutes,
                            calories: calories,
                            completed: true
                        });
                    }
                    await WeeklyPlan.updateOne({ _id: weekly._id }, { days: weekly.days });
                }

                // 5. Recalculate ProgressMetrics
                const metrics = await self.ProgressService.recalculateMetrics(normalizedEmail);

                // 6. Log Activity
                await ActivityLog.create({
                    email: normalizedEmail,
                    activityType: 'live_workout_completed',
                    description: `Finished Live Trainer Session: "${workoutName}" (${calories} kcal burned, ${durationMinutes} mins, Form Score: ${formScore}%).`,
                    metadata: { sessionId, calories, duration: durationMinutes, reps, sets, formScore }
                });

                // 7. Emit real-time state change across socket.io and planner
                const state = await self.PlannerService.getPlannerState(normalizedEmail);
                self.emitStateChange(normalizedEmail, {
                    type: 'workout_completed',
                    workoutName,
                    calories,
                    duration: durationMinutes,
                    reps,
                    sets,
                    streak: metrics?.activeStreak || 1,
                    plannerState: state
                });

                return {
                    success: true,
                    session,
                    metrics,
                    state
                };
            }
        };
    }

    // =========================================================================
    // 4. NUTRITION SERVICE (Daily targets, Logging & Adherence)
    // =========================================================================
    get NutritionService() {
        const self = this;
        return {
            async getDailyNutrition(email) {
                const { NutritionPlan } = self.models;
                const normalizedEmail = email.toLowerCase();
                let plan = await NutritionPlan.findOne({ email: normalizedEmail, active: true });
                return plan;
            }
        };
    }

    // =========================================================================
    // 5. PROGRESS SERVICE (Metrics, Streak, Adherence, Dynamic Dashboard Cards)
    // =========================================================================
    get ProgressService() {
        const self = this;
        return {
            async recalculateMetrics(email) {
                const { User, WorkoutSession, WeeklyPlan, ProgressMetric, Achievement } = self.models;
                const normalizedEmail = email.toLowerCase();

                const user = await User.findOne({ email: normalizedEmail });
                const sessions = await WorkoutSession.find({ email: normalizedEmail });
                const weekly = await WeeklyPlan.findOne({ email: normalizedEmail, active: true });

                const totalScheduled = sessions.length;
                const completedSessions = sessions.filter(s => s.completed);
                const totalWorkouts = completedSessions.length;
                const totalCaloriesBurned = completedSessions.reduce((sum, s) => sum + (Number(s.calories) || 0), 0);

                // Weekly Goal Adherence
                const targetWeeklyWorkouts = weekly?.restDays ? (7 - weekly.restDays.length) : Math.max(5, totalScheduled);
                const weeklyAdherenceRate = targetWeeklyWorkouts > 0 
                    ? Math.min(100, Math.round((totalWorkouts / targetWeeklyWorkouts) * 100)) 
                    : 0;

                // Monthly Completion Rate
                const monthlyCompletionRate = totalScheduled > 0 
                    ? Math.round((totalWorkouts / totalScheduled) * 100) 
                    : 0;

                // Active Split calculation
                const restDaysCount = weekly?.restDays ? weekly.restDays.length : 2;
                const activeSplit = 7 - restDaysCount;

                // Active Streak calculation (dynamic, based on completed workouts)
                const activeStreak = Math.min(14, Math.max(totalWorkouts > 0 ? 1 : 0, Math.round(totalWorkouts * 1.2)));

                const weight = user?.protocol?.weight || 75;
                const height = user?.protocol?.height || 176;
                const bmi = Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10;

                const metricsDoc = await ProgressMetric.findOneAndUpdate(
                    { email: normalizedEmail },
                    {
                        email: normalizedEmail,
                        weight: weight,
                        height: height,
                        bmi: bmi,
                        totalWorkouts: totalWorkouts,
                        totalCaloriesBurned: totalCaloriesBurned,
                        activeStreak: activeStreak,
                        weeklyAdherenceRate: weeklyAdherenceRate,
                        monthlyCompletionRate: monthlyCompletionRate,
                        activeSplit: activeSplit,
                        restDaysCount: restDaysCount,
                        lastWorkoutDate: completedSessions.length > 0 ? completedSessions[completedSessions.length - 1].completedAt || new Date() : null
                    },
                    { upsert: true, new: true }
                );

                // Check and unlock achievements
                if (totalWorkouts >= 1) {
                    await Achievement.findOneAndUpdate(
                        { email: normalizedEmail, badgeId: 'first_workout' },
                        { email: normalizedEmail, badgeId: 'first_workout', title: 'First Blood', description: 'Completed your first scheduled workout session!', icon: 'military_tech' },
                        { upsert: true }
                    );
                }
                if (totalWorkouts >= 5) {
                    await Achievement.findOneAndUpdate(
                        { email: normalizedEmail, badgeId: 'weekly_crusher' },
                        { email: normalizedEmail, badgeId: 'weekly_crusher', title: 'Weekly Titan', description: 'Ticked 5 workouts in a single training cycle!', icon: 'workspace_premium' },
                        { upsert: true }
                    );
                }
                if (totalCaloriesBurned >= 2000) {
                    await Achievement.findOneAndUpdate(
                        { email: normalizedEmail, badgeId: 'calorie_furnace' },
                        { email: normalizedEmail, badgeId: 'calorie_furnace', title: 'Calorie Furnace', description: 'Burned over 2,000 active metabolic kcal!', icon: 'local_fire_department' },
                        { upsert: true }
                    );
                }

                return metricsDoc;
            }
        };
    }

    // =========================================================================
    // HELPER: BUILD 7-DAY SCIENTIFIC WEEKLY SPLIT
    // =========================================================================
    buildWeeklyWorkoutSchedule(profile, masterPlan) {
        const workouts = [
            {
                id: 'w-mon-' + Date.now(),
                day: 'Monday',
                time: '07:30 AM',
                title: 'Chest & Anterior Deltoid Hypertrophy',
                category: 'Strength',
                difficulty: 'Intermediate',
                duration: 45,
                calories: 420,
                targetMuscles: 'Pectorals, Anterior Deltoids, Triceps',
                completed: false,
                exercises: [
                    { name: 'Barbell Flat Bench Press', sets: 4, reps: '8-10', completed: false },
                    { name: 'Incline Dumbbell Chest Press', sets: 3, reps: '10-12', completed: false },
                    { name: 'Dumbbell Lateral Raises', sets: 4, reps: '15', completed: false },
                    { name: 'Cable Triceps Pushdowns', sets: 3, reps: '12', completed: false }
                ]
            },
            {
                id: 'w-tue-' + Date.now(),
                day: 'Tuesday',
                time: '07:30 AM',
                title: 'Back & Posterior Chain Density',
                category: 'Strength',
                difficulty: 'Intermediate',
                duration: 50,
                calories: 450,
                targetMuscles: 'Latissimus Dorsi, Rhomboids, Biceps',
                completed: false,
                exercises: [
                    { name: 'Neutral Grip Lat Pulldowns', sets: 4, reps: '10-12', completed: false },
                    { name: 'Chest-Supported Dumbbell Rows', sets: 4, reps: '10', completed: false },
                    { name: 'Face Pulls with Rope', sets: 3, reps: '15', completed: false },
                    { name: 'Incline Dumbbell Bicep Curls', sets: 3, reps: '12', completed: false }
                ]
            },
            {
                id: 'w-thu-' + Date.now(),
                day: 'Thursday',
                time: '07:30 AM',
                title: 'Quadriceps, Glutes & Posterior Chain Power',
                category: 'Strength',
                difficulty: 'Intermediate',
                duration: 50,
                calories: 480,
                targetMuscles: 'Quadriceps, Gluteus Maximus, Hamstrings',
                completed: false,
                exercises: [
                    { name: 'Goblet Dumbbell Squats', sets: 4, reps: '10-12', completed: false },
                    { name: 'Romanian Dumbbell Deadlifts', sets: 4, reps: '10', completed: false },
                    { name: 'Walking Dumbbell Lunges', sets: 3, reps: '12/leg', completed: false },
                    { name: 'Standing Calf Raises', sets: 4, reps: '15', completed: false }
                ]
            },
            {
                id: 'w-fri-' + Date.now(),
                day: 'Friday',
                time: '07:30 AM',
                title: 'Upper Body Neuromuscular Power & Deltoids',
                category: 'Strength',
                difficulty: 'Intermediate',
                duration: 45,
                calories: 410,
                targetMuscles: 'Shoulders, Upper Back, Arms',
                completed: false,
                exercises: [
                    { name: 'Standing Dumbbell Overhead Press', sets: 4, reps: '8-10', completed: false },
                    { name: 'Seated Cable Row (Wide Grip)', sets: 3, reps: '12', completed: false },
                    { name: 'Incline Dumbbell Flyes', sets: 3, reps: '12', completed: false },
                    { name: 'Hanging Knee Raises', sets: 3, reps: '15', completed: false }
                ]
            },
            {
                id: 'w-sat-' + Date.now(),
                day: 'Saturday',
                time: '08:00 AM',
                title: 'High-Intensity Metabolic Conditioning & Core',
                category: 'HIIT',
                difficulty: 'Intermediate',
                duration: 40,
                calories: 440,
                targetMuscles: 'Full Body Functional Core & Aerobic Capacity',
                completed: false,
                exercises: [
                    { name: 'Kettlebell Swings', sets: 4, reps: '20', completed: false },
                    { name: 'Burpees over Bar', sets: 4, reps: '12', completed: false },
                    { name: 'Rowing Machine Sprint Intervals', sets: 5, reps: '250m', completed: false },
                    { name: 'Prone Plank Isometric Hold', sets: 3, reps: '60s', completed: false }
                ]
            }
        ];
        return workouts;
    }

    // =========================================================================
    // HELPER: BUILD 24-HOUR DAILY PROTOCOL TIMELINE
    // =========================================================================
    buildDailyProtocolTimeline(profile, masterPlan, todayWorkout = null, meals = []) {
        const timeline = [];

        // 1. Circadian Awakening
        timeline.push({
            id: "step-wake",
            time: "06:30 AM",
            type: "wake",
            title: "Circadian Awakening & Natural Sunlight",
            desc: "Natural sunlight exposure upon waking to anchor circadian clock and boost metabolic alertness.",
            icon: "wb_sunny",
            color: "text-amber-400",
            isDone: false
        });

        // 2. Scheduled Training or Active Recovery Walk
        if (todayWorkout) {
            timeline.push({
                id: "step-workout",
                time: todayWorkout.time || "07:30 AM",
                type: "workout",
                title: todayWorkout.title,
                desc: `${todayWorkout.category} • ${todayWorkout.duration} mins • Target: ${todayWorkout.calories} kcal • Progressive overload biomechanical training.`,
                icon: "fitness_center",
                color: "text-purple-400",
                isDone: false
            });
        } else {
            timeline.push({
                id: "step-workout",
                time: "07:30 AM",
                type: "workout",
                title: "Active Rest & Light Mobility Walk",
                desc: "20-30 min gentle walk or stretching to promote muscular recovery and blood flow.",
                icon: "self_improvement",
                color: "text-sky-400",
                isDone: false
            });
        }

        // 3. Dynamic Meals Matrix (Distinct meals per day, no hydration items)
        const defaultMeals = [
            { mealType: 'Breakfast', time: '08:30 AM', title: 'High-Protein Breakfast Protocol', calories: 480, protein: 28 },
            { mealType: 'Mid-Morning', time: '11:00 AM', title: 'Nutrient Dense Morning Refuel', calories: 180, protein: 8 },
            { mealType: 'Lunch', time: '01:30 PM', title: 'Balanced Macronutrient Lunch', calories: 620, protein: 38 },
            { mealType: 'Afternoon Refuel', time: '04:30 PM', title: 'Pre-Evening Metabolic Snack', calories: 240, protein: 14 },
            { mealType: 'Dinner', time: '07:30 PM', title: 'Nutrient Rich Recovery Dinner', calories: 540, protein: 26 }
        ];
        const activeMeals = (meals && meals.length > 0) ? meals : defaultMeals;

        activeMeals.forEach((m, idx) => {
            timeline.push({
                id: `step-meal-${idx + 1}`,
                time: m.time || (idx === 0 ? "08:30 AM" : idx === 1 ? "11:00 AM" : idx === 2 ? "01:30 PM" : idx === 3 ? "04:30 PM" : "07:30 PM"),
                type: "meal",
                title: `${m.mealType}: ${m.title}`,
                desc: `Calibrated meal: ${m.calories} kcal • ${m.protein}g Protein${m.carbs ? ` • ${m.carbs}g Carbs` : ''}${m.fat ? ` • ${m.fat}g Fat` : ''}.`,
                icon: "restaurant",
                color: "text-accent-emerald",
                isDone: false
            });
        });

        // 4. Sleep
        timeline.push({
            id: "step-sleep",
            time: "10:15 PM",
            type: "sleep",
            title: "Circadian Sleep Architecture & Melatonin Optimization",
            desc: "Screen off, cool dark room (19°C), 8h deep restorative sleep for cellular and neural recovery.",
            icon: "bedtime",
            color: "text-purple-400",
            isDone: false
        });

        return timeline;
    }
}

const plannerServicesInstance = new PlannerServicesManager();
module.exports = plannerServicesInstance;
