require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fitforge';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Schemas & Models
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  protocol: {
    age: { type: Number },
    biologicalSex: { type: String },
    height: { type: Number },
    weight: { type: Number },
    occupation: { type: String },
    activityLevel: { type: String },
    goals: [{ type: String }],
    location: { type: String },
    equipment: [{ type: String }],
    duration: { type: Number },
    fitnessLevel: { type: String }
  },
  workoutPlan: { type: Object, default: null },
  dietProfile: {
    dietaryType: { type: String, default: 'non-vegetarian' },
    allergies: [{ type: String }],
    budget: { type: String, default: 'mid' },
    dailyCalories: { type: Number, default: 2000 }
  },
  dietPlan: { type: Object, default: null },
  subscription: {
    plan: { type: String, enum: ['none', 'trial', 'monthly', '6month', '12month'], default: 'none' },
    status: { type: String, enum: ['none', 'active', 'canceled', 'expired'], default: 'none' },
    trialStart: { type: Date, default: null },
    trialEnd: { type: Date, default: null },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null }
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const workoutSchema = new mongoose.Schema({
  email: { type: String, required: true },
  duration: { type: Number, required: true }, // in seconds
  steps: { type: Number, required: true },
  distance: { type: Number, required: true }, // in meters
  calories: { type: Number },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

const Workout = mongoose.model('Workout', workoutSchema);


// API Routes

// 1. Signup Route
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Account already exists with this email.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    await newUser.save();
    res.status(201).json({ message: 'Account initialized.', email: newUser.email, name: newUser.name });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to process signup.' });
  }
});

// 2. Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    res.status(200).json({ message: 'Access granted.', email: user.email, name: user.name });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to process login.' });
  }
});

// Google Authentication Configurations API
app.get('/api/auth/google-config', (req, res) => {
  res.status(200).json({ googleClientId: process.env.GOOGLE_CLIENT_ID || '' });
});

// Google Authentication API
app.post('/api/auth/google', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Google email and name are required.' });
    }

    const normalizedEmail = email.toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });
    let isNewUser = false;

    if (!user) {
      // User is registering via Google for the first time
      isNewUser = true;

      // Hash a random placeholder password since schema requires password
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = new User({
        name,
        email: normalizedEmail,
        password: hashedPassword
      });

      await user.save();
    }

    res.status(200).json({
      message: isNewUser ? 'Account initialized.' : 'Access granted.',
      email: user.email,
      name: user.name,
      isNewUser
    });
  } catch (error) {
    console.error('Google Auth error:', error);
    res.status(500).json({ error: 'Failed to process Google authentication.' });
  }
});

// 3. Save/Update Protocol Telemetry Route
app.post('/api/user/protocol', async (req, res) => {
  try {
    const { email, age, biologicalSex, height, weight, occupation, activityLevel, goals, location, equipment, duration, fitnessLevel } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'User email is required to save protocol.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    // Update protocol telemetry
    user.protocol = {
      age: age ? Number(age) : undefined,
      biologicalSex,
      height: height ? Number(height) : undefined,
      weight: weight ? Number(weight) : undefined,
      occupation,
      activityLevel,
      goals,
      location,
      equipment,
      duration: duration ? Number(duration) : undefined,
      fitnessLevel
    };

    await user.save();
    res.status(200).json({ message: 'Telemetry calibrated successfully.' });
  } catch (error) {
    console.error('Save protocol error:', error);
    res.status(500).json({ error: 'Failed to save protocol telemetry.' });
  }
});

// 4. Get User Protocol Route
app.get('/api/user/protocol', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'User email is required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.status(200).json({ protocol: user.protocol || {} });
  } catch (error) {
    console.error('Get protocol error:', error);
    res.status(500).json({ error: 'Failed to retrieve protocol telemetry.' });
  }
});

// 4b. Get User Profile Route
app.get('/api/user/profile', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'User email is required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.status(200).json({
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      protocol: user.protocol || {}
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to retrieve user profile.' });
  }
});

// 4b2. Subscription Routes

// A. Get subscription status
app.get('/api/user/subscription', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'User email is required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let sub = user.subscription || { plan: 'none', status: 'none' };
    let hasChanged = false;

    // Check if subscription has expired
    if (sub.status === 'active' || sub.status === 'canceled') {
      const now = new Date();
      if (sub.plan === 'trial') {
        if (sub.trialEnd && now > new Date(sub.trialEnd)) {
          sub.status = 'expired';
          sub.plan = 'none';
          hasChanged = true;
        }
      } else {
        if (sub.endDate && now > new Date(sub.endDate)) {
          if (sub.status === 'active') {
            // Mock auto-renewal for paid subscriptions
            const durationMs = new Date(sub.endDate) - new Date(sub.startDate);
            sub.startDate = new Date();
            sub.endDate = new Date(Date.now() + durationMs);
            hasChanged = true;
          } else {
            // Cancelled subscription finished its term -> expired
            sub.status = 'expired';
            sub.plan = 'none';
            hasChanged = true;
          }
        }
      }
    }

    if (hasChanged) {
      user.subscription = sub;
      await user.save();
    }

    res.status(200).json({ subscription: sub });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to retrieve subscription status.' });
  }
});

// B. Subscribe/Start Trial
app.post('/api/user/subscribe', async (req, res) => {
  try {
    const { email, plan } = req.body;
    if (!email || !plan) {
      return res.status(400).json({ error: 'Email and plan are required.' });
    }

    const validPlans = ['trial', 'monthly', '6month', '12month'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan selection.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Initialize subscription object if not present
    if (!user.subscription) {
      user.subscription = { plan: 'none', status: 'none', trialStart: null, trialEnd: null, startDate: null, endDate: null };
    }

    const now = new Date();

    if (plan === 'trial') {
      // Check if they already had a trial
      if (user.subscription.trialStart) {
        return res.status(400).json({ error: 'You have already exhausted your 15-day free trial.' });
      }

      user.subscription.plan = 'trial';
      user.subscription.status = 'active';
      user.subscription.trialStart = now;
      user.subscription.trialEnd = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days
    } else {
      // Paid plan subscription (monthly, 6month, 12month)
      let durationMs = 30 * 24 * 60 * 60 * 1000; // default 30 days
      if (plan === '6month') {
        durationMs = 6 * 30 * 24 * 60 * 60 * 1000;
      } else if (plan === '12month') {
        durationMs = 365 * 24 * 60 * 60 * 1000;
      }

      user.subscription.plan = plan;
      user.subscription.status = 'active';
      user.subscription.startDate = now;
      user.subscription.endDate = new Date(now.getTime() + durationMs);
    }

    await user.save();
    res.status(200).json({ message: 'Subscription successfully activated.', subscription: user.subscription });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to update subscription.' });
  }
});

// C. Cancel subscription
app.post('/api/user/cancel-subscription', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'User email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!user.subscription || user.subscription.status === 'none' || user.subscription.status === 'expired') {
      return res.status(400).json({ error: 'No active subscription or trial found to cancel.' });
    }

    if (user.subscription.plan === 'trial') {
      // Cancelling trial terminates it immediately
      user.subscription.plan = 'none';
      user.subscription.status = 'none';
      user.subscription.trialEnd = new Date(); // end it now
    } else {
      // Paid subscription is set to canceled, but remains active until end date
      user.subscription.status = 'canceled';
    }

    await user.save();
    res.status(200).json({ message: 'Subscription canceled successfully.', subscription: user.subscription });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription.' });
  }
});

// 4c. Get Saved Workout Plan
app.get('/api/user/workout-plan', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'User email is required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.status(200).json({ plan: user.workoutPlan });
  } catch (error) {
    console.error('Get workout plan error:', error);
    res.status(500).json({ error: 'Failed to retrieve workout plan.' });
  }
});

// 4d. Generate & Save Adaptive AI Workout Plan
app.post('/api/user/workout-plan', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'User email is required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const proto = user.protocol || {};
    if (!proto.age || !proto.height || !proto.weight || !proto.biologicalSex) {
      return res.status(400).json({ error: 'Onboarding telemetry incomplete. Please fill out details first.' });
    }

    // Determine strategy based on goals
    const goalsStr = (proto.goals || []).join(' ').toLowerCase();
    let planType = 'General Physical Preparedness';
    let planDescription = 'Balanced weekly split focusing on overall functional strength, stability, and cardiovascular health.';

    // Base volume parameters based on Fitness Level
    let sets = 3;
    let restSecs = 90;
    let volumeTag = 'Beginner';
    const fitLevel = (proto.fitnessLevel || 'beginner').toLowerCase();

    if (fitLevel === 'intermediate') {
      sets = 4;
      restSecs = 60;
      volumeTag = 'Intermediate';
    } else if (fitLevel === 'advanced') {
      sets = 4;
      restSecs = 45;
      volumeTag = 'Advanced';
    }

    // Adjust for age
    let jointFriendly = false;
    if (proto.age > 50) {
      jointFriendly = true;
      sets = Math.max(2, sets - 1);
      restSecs += 15;
    }

    const placeholderImg = 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0X97aehtRdspJEqsisVKwrnSLo5h8WOAxfdIzFTRcccc-qrXGFS0CZEglW_kPGCm9M2-c34lO-M7BJdvbwSXpAn1B8xGkOvrTYo8qEIbi-lDBMQ4PkBY3c_kzmYpaCMLyAl2Cn2yBRoXLwUzp1P9y8HXAWL_4xjUBoZ1D90rG_rbonxYyP8hOyyvlS7L6nVGS4LW4XtZN0pFWAuSXS_5PRrzVNQDtWfKvROrKYDyQiLxyF1o-p8eN';

    // Helper functions for adaptive equipment substitutions
    const isHome = (proto.location || 'gym').toLowerCase() === 'home';
    const equip = (proto.equipment || []).map(e => e.toLowerCase());

    function adaptExercise(ex) {
      const name = ex.name;
      let adaptedName = name;

      const hasDumbbells = equip.includes('dumbbells') || equip.includes('dumbbell');
      const hasKettlebell = equip.includes('kettlebell');
      const hasBands = equip.includes('resistance bands') || equip.includes('resistance_bands') || equip.includes('bands');
      const hasBarbell = equip.includes('barbell');
      const hasPullup = equip.includes('pull-up bar') || equip.includes('pull_up_bar') || equip.includes('pullup');

      if (name.includes("Goblet Squat") && !hasDumbbells && !hasKettlebell) {
        adaptedName = "Bodyweight Squats";
      } else if (name.includes("Barbell") && !hasBarbell) {
        if (hasDumbbells) {
          adaptedName = name.replace("Barbell", "Dumbbell");
        } else if (hasKettlebell) {
          adaptedName = name.replace("Barbell", "Kettlebell");
        } else if (hasBands) {
          adaptedName = name.replace("Barbell", "Resistance Band");
        } else {
          if (name.includes("Squats") || name.includes("Squat")) adaptedName = "Bodyweight Squats";
          else if (name.includes("Bench Press") || name.includes("Chest Press") || name.includes("Press")) adaptedName = "Bodyweight Pushups";
          else if (name.includes("Deadlift")) adaptedName = "Single-Leg Bodyweight Romanian Deadlifts";
          else if (name.includes("Row")) adaptedName = "Doorframe Bodyweight Rows";
          else adaptedName = "Bodyweight Squats";
        }
      } else if (name.includes("Dumbbell") && !hasDumbbells) {
        if (hasBarbell) {
          adaptedName = name.replace("Dumbbell", "Barbell");
        } else if (hasKettlebell) {
          adaptedName = name.replace("Dumbbell", "Kettlebell");
        } else if (hasBands) {
          adaptedName = name.replace("Dumbbell", "Resistance Band");
        } else {
          if (name.includes("Squats") || name.includes("Squat") || name.includes("Lunges") || name.includes("Lunge")) adaptedName = "Bodyweight Squats";
          else if (name.includes("Bench Press") || name.includes("Press")) adaptedName = "Bodyweight Pushups";
          else if (name.includes("Row")) adaptedName = "Bodyweight Towel Rows";
          else if (name.includes("Curls") || name.includes("Curl")) adaptedName = "Bodyweight Arm Isometric Holds";
          else adaptedName = "Bodyweight Squats";
        }
      } else if (name.includes("Kettlebell") && !hasKettlebell) {
        if (hasDumbbells) {
          adaptedName = name.replace("Kettlebell", "Dumbbell");
        } else if (hasBarbell) {
          adaptedName = name.replace("Kettlebell", "Barbell");
        } else if (hasBands) {
          adaptedName = name.replace("Kettlebell", "Resistance Band");
        } else {
          if (name.includes("Swings") || name.includes("Swing")) adaptedName = "Bodyweight Jump Squats";
          else if (name.includes("Squat")) adaptedName = "Bodyweight Squats";
          else adaptedName = "Bodyweight Squats";
        }
      } else if (name.includes("Lat Pulldown") || name.includes("Lat Pull") || name.includes("Pullups") || name.includes("Pull-up") || name.includes("Chinup") || name.includes("Chin-up")) {
        if (name.includes("Pullups") || name.includes("Pull-up") || name.includes("Chinup") || name.includes("Chin-up")) {
          if (!hasPullup) {
            if (hasBands) adaptedName = "Resistance Band Lat Pulldowns";
            else if (hasDumbbells) adaptedName = "Dumbbell Pullovers";
            else adaptedName = "Bodyweight Superman Pulls";
          }
        } else {
          if (isHome || !equip.includes("gym machines")) {
            if (hasPullup) adaptedName = "Pullups";
            else if (hasBands) adaptedName = "Resistance Band Lat Pulldowns";
            else if (hasDumbbells) adaptedName = "Dumbbell Pullovers";
            else adaptedName = "Bodyweight Superman Pulls";
          }
        }
      } else if (name.includes("Cable") || name.includes("Smith Machine") || name.includes("Leg Press") || name.includes("Leg Extension") || name.includes("Lying Leg Curl")) {
        if (isHome || !equip.includes("gym machines")) {
          if (name.includes("Leg Press") || name.includes("Leg Extension")) {
            if (hasDumbbells) adaptedName = "Dumbbell Goblet Squats";
            else if (hasKettlebell) adaptedName = "Kettlebell Goblet Squats";
            else if (hasBarbell) adaptedName = "Barbell Back Squats";
            else adaptedName = "Bodyweight Squats";
          } else if (name.includes("Leg Curl")) {
            if (hasDumbbells) adaptedName = "Dumbbell Romanian Deadlifts";
            else if (hasBands) adaptedName = "Resistance Band Hamstring Curls";
            else if (hasBarbell) adaptedName = "Barbell Romanian Deadlifts";
            else adaptedName = "Single-Leg Bodyweight Romanian Deadlifts";
          } else if (name.includes("Cable Row") || name.includes("Cable Pulldown")) {
            if (hasDumbbells) adaptedName = "Dumbbell Bent-Over Rows";
            else if (hasBands) adaptedName = "Resistance Band Rows";
            else if (hasBarbell) adaptedName = "Barbell Bent-Over Rows";
            else adaptedName = "Doorframe Bodyweight Rows";
          } else if (name.includes("Cable Crossover") || name.includes("Cable Flyes")) {
            if (hasDumbbells) adaptedName = "Dumbbell Chest Flyes";
            else if (hasBands) adaptedName = "Resistance Band Chest Flyes";
            else adaptedName = "Bodyweight Pushups";
          } else {
            if (hasDumbbells) adaptedName = "Dumbbell Shoulder Press";
            else if (hasBarbell) adaptedName = "Barbell Shoulder Press";
            else adaptedName = "Bodyweight Pushups";
          }
        }
      }

      return { ...ex, name: adaptedName };
    }

    let days = {};

    if (goalsStr.includes('muscle') || goalsStr.includes('hypertrophy') || goalsStr.includes('gain')) {
      planType = 'Hypertrophy & Neuromuscular Power Program';
      planDescription = 'Optimized weekly progressive overload split designed to maximize myofibrillar protein synthesis and raw force development.';

      rawDays = {
        1: {
          name: "Day 1: Upper Body Push Force",
          exercises: [
            { name: "Dumbbell Flat Bench Press", sets: sets, reps: "8-12", target: "Pectoralis Major, Anterior Deltoids, Triceps", hold: "1s peak squeeze", image: placeholderImg },
            { name: "Standing Overhead Press", sets: sets - 1, reps: "8-10", target: "Anterior/Lateral Deltoids, Core Stabilizers", hold: "None", image: placeholderImg },
            { name: "Dumbbell Lateral Raises", sets: sets, reps: "12-15", target: "Lateral Deltoids", hold: "1s peak contraction", image: placeholderImg },
            { name: "Dumbbell Tricep Overhead Extensions", sets: sets - 1, reps: "12", target: "Triceps (Long Head)", hold: "None", image: placeholderImg },
            { name: "Incline Dumbbell Press", sets: sets, reps: "10-12", target: "Upper Pectorals", hold: "None", image: placeholderImg }
          ]
        },
        2: {
          name: "Day 2: Posterior Chain Pull Density",
          exercises: [
            { name: jointFriendly ? "Weighted Hip Thrusts" : "Dumbbell Romanian Deadlift", sets: sets, reps: "8-10", target: "Gluteus Maximus, Hamstrings, Erector Spinae", hold: "1s hold", image: placeholderImg },
            { name: "Dumbbell Bent-Over Row", sets: sets, reps: "10-12", target: "Latissimus Dorsi, Rhomboids, Trapezius", hold: "1s squeeze", image: placeholderImg },
            { name: "Wide Grip Lat Pulldown", sets: sets, reps: "10-12", target: "Latissimus Dorsi, Teres Major", hold: "1s contraction", image: placeholderImg },
            { name: "Seated Hammer Curls", sets: sets - 1, reps: "12", target: "Brachialis, Biceps Brachii", hold: "None", image: placeholderImg },
            { name: "Dumbbell Rear Delt Flyes", sets: sets, reps: "12-15", target: "Posterior Deltoids", hold: "None", image: placeholderImg }
          ]
        },
        3: {
          name: "Day 3: Lower Body Squat Volume",
          exercises: [
            { name: jointFriendly ? "Goblet Box Squats" : "Barbell Back Squats", sets: sets, reps: "8-10", target: "Quadriceps, Gluteus Maximus", hold: "None", image: placeholderImg },
            { name: "Bulgarian Split Squats", sets: sets - 1, reps: "10-12 per leg", target: "Quadriceps, Glute Medius", hold: "None", image: placeholderImg },
            { name: "Dumbbell Romanian Deadlift", sets: sets, reps: "10-12", target: "Hamstrings, Gluteus", hold: "None", image: placeholderImg },
            { name: "Standing Calf Raises", sets: sets, reps: "15", target: "Gastrocnemius, Soleus", hold: "2s stretch", image: placeholderImg },
            { name: "Dumbbell Walking Lunges", sets: sets, reps: "12 steps per leg", target: "Quads, Glutes", hold: "None", image: placeholderImg }
          ]
        },
        4: {
          name: "Day 4: Core & Active Regeneration",
          exercises: [
            { name: "Plank Hold", sets: 3, reps: "45s-60s", target: "Rectus Abdominis, Transverse Abdominis", hold: "Active hollow body", image: placeholderImg },
            { name: "Bird-Dog Extensions", sets: 3, reps: "12 per side", target: "Erector Spinae, Glutes, Deltoids", hold: "2s hold at peak", image: placeholderImg },
            { name: "Russian Twists", sets: 3, reps: "20 per side", target: "Obliques, Core", hold: "None", image: placeholderImg },
            { name: "Cobra Pose Stretch", sets: 2, reps: "30s", target: "Abdominals, Hip Flexors", hold: "Static stretch", image: placeholderImg },
            { name: "Superman Holds", sets: 3, reps: "30s", target: "Lower Back, Glutes", hold: "None", image: placeholderImg }
          ]
        },
        5: {
          name: "Day 5: Upper Body Hypertrophy Split",
          exercises: [
            { name: "Incline Dumbbell Press", sets: sets, reps: "10-12", target: "Upper Pectorals, Anterior Deltoids", hold: "None", image: placeholderImg },
            { name: "Wide Grip Lat Pulldown", sets: sets, reps: "10-12", target: "Latissimus Dorsi, Teres Major", hold: "1s contraction", image: placeholderImg },
            { name: "Dumbbell Flat Bench Press", sets: sets, reps: "8-12", target: "Pectoralis Major", hold: "None", image: placeholderImg },
            { name: "Dumbbell Tricep Overhead Extensions", sets: sets - 1, reps: "12", target: "Triceps (Long Head)", hold: "None", image: placeholderImg },
            { name: "Seated Hammer Curls", sets: sets - 1, reps: "12", target: "Brachialis, Biceps Brachii", hold: "None", image: placeholderImg }
          ]
        },
        6: {
          name: "Day 6: Metabolic Engine Synthesis",
          exercises: [
            { name: "Dumbbell Thrusters", sets: sets, reps: "12-15", target: "Full Body, Cardiovascular System", hold: "None", image: placeholderImg },
            { name: "Russian Kettlebell Swings", sets: sets, reps: "20", target: "Hamstrings, Glutes, Lower Back", hold: "None", image: placeholderImg },
            { name: "Hanging Knee Raises", sets: sets, reps: "15", target: "Rectus Abdominis", hold: "1s peak hold", image: placeholderImg },
            { name: "Mountain Climbers", sets: 3, reps: "45s", target: "Core, Cardio", hold: "None", image: placeholderImg },
            { name: "Pushups to Plank Shoulder Taps", sets: 3, reps: "10 reps", target: "Chest, Core", hold: "None", image: placeholderImg }
          ]
        },
        7: {
          name: "Day 7: Neuromuscular Recovery & Mobility",
          exercises: [
            { name: "Child's Pose Stretch", sets: 2, reps: "60s", target: "Lats, Lower Back, Shoulders", hold: "Static stretch", image: placeholderImg },
            { name: "Shoulder Pass-Throughs", sets: 3, reps: "10", target: "Rotator Cuff, Chest Mobility", hold: "None", image: placeholderImg },
            { name: "Dynamic Hip Opener Flow", sets: 2, reps: "10 per side", target: "Psoas, Adductors", hold: "Active stretching", image: placeholderImg },
            { name: "Hamstring Static Stretch", sets: 2, reps: "30s per leg", target: "Posterior leg chain", hold: "Static", image: placeholderImg },
            { name: "Cat-Cow Stretch", sets: 2, reps: "60s", target: "Spinal Mobility, Core Relief", hold: "Active breathing", image: placeholderImg }
          ]
        }
      };
    } else if (goalsStr.includes('loss') || goalsStr.includes('fat') || goalsStr.includes('weight')) {
      planType = 'High-Intensity Metabolic Synthesis Program';
      planDescription = 'High-density conditioning split using complex movement patterns to elevate excess post-exercise oxygen consumption (EPOC) and maximize daily energy expenditure.';

      rawDays = {
        1: {
          name: "Day 1: High Intensity Metabolic Blast",
          exercises: [
            { name: "Dumbbell Thrusters", sets: sets, reps: "12-15", target: "Full Body, Cardio", hold: "None", image: placeholderImg },
            { name: "Russian Kettlebell Swings", sets: sets, reps: "20", target: "Posterior Chain, Cardio", hold: "None", image: placeholderImg },
            { name: "Mountain Climbers", sets: 3, reps: "45s", target: "Core, Cardiovascular endurance", hold: "None", image: placeholderImg },
            { name: "Dumbbell Flat Bench Press", sets: sets, reps: "12", target: "Chest, Cardio", hold: "None", image: placeholderImg },
            { name: "Jumping Jacks", sets: 3, reps: "60s", target: "Cardio", hold: "None", image: placeholderImg }
          ]
        },
        2: {
          name: "Day 2: Posterior Chain & Core Strength",
          exercises: [
            { name: "Dumbbell Romanian Deadlift", sets: sets, reps: "12", target: "Glutes, Hamstrings", hold: "None", image: placeholderImg },
            { name: "Plank Shoulder Taps", sets: 3, reps: "15 per side", target: "Transverse Abdominis, Deltoids", hold: "None", image: placeholderImg },
            { name: "Bicycle Crunches", sets: 3, reps: "20 per side", target: "Rectus Abdominis, Obliques", hold: "None", image: placeholderImg },
            { name: "Dumbbell Walking Lunges", sets: sets, reps: "10 per leg", target: "Quads, Glutes", hold: "None", image: placeholderImg },
            { name: "Hollow Body Hold", sets: 3, reps: "30s", target: "Core", hold: "None", image: placeholderImg }
          ]
        },
        3: {
          name: "Day 3: Upper Body Conditioning",
          exercises: [
            { name: "Dumbbell Push Press", sets: sets, reps: "12", target: "Shoulders, Triceps", hold: "None", image: placeholderImg },
            { name: "Dumbbell Bent-Over Row", sets: sets, reps: "12", target: "Upper Back, Lats", hold: "None", image: placeholderImg },
            { name: jointFriendly ? "Wall Pushups" : "Incline Pushups", sets: sets, reps: "15", target: "Chest, Triceps", hold: "None", image: placeholderImg },
            { name: "Mountain Climbers", sets: 3, reps: "45s", target: "Cardio, Core", hold: "None", image: placeholderImg },
            { name: "Jumping Jacks", sets: 3, reps: "45s", target: "Cardio", hold: "None", image: placeholderImg }
          ]
        },
        4: {
          name: "Day 4: Active Recovery & Flow",
          exercises: [
            { name: "Cat-Cow Stretch", sets: 2, reps: "60s", target: "Spinal Mobility, Core Relief", hold: "Active breathing", image: placeholderImg },
            { name: "Child's Pose", sets: 2, reps: "60s", target: "Lats, Lower Back, Hips", hold: "Static stretch", image: placeholderImg },
            { name: "Bird-Dog Extensions", sets: 3, reps: "10 per side", target: "Lower Back, Glutes", hold: "2s hold", image: placeholderImg },
            { name: "Cobra Pose", sets: 2, reps: "45s", target: "Abdominals", hold: "None", image: placeholderImg },
            { name: "Shoulder Pass-Throughs", sets: 3, reps: "10", target: "Shoulder Mobility", hold: "None", image: placeholderImg }
          ]
        },
        5: {
          name: "Day 5: Lower Body Metabolic Burn",
          exercises: [
            { name: "Goblet Squats", sets: sets, reps: "15", target: "Quadriceps, Glutes", hold: "None", image: placeholderImg },
            { name: jointFriendly ? "Alternating Reverse Lunges" : "Alternating Lunge Jumps", sets: sets - 1, reps: "12 per leg", target: "Lower Body Explosiveness", hold: "None", image: placeholderImg },
            { name: "Glute Bridge Squeezes", sets: sets, reps: "20", target: "Gluteus Maximus", hold: "2s squeeze at peak", image: placeholderImg },
            { name: "Dumbbell Romanian Deadlift", sets: sets, reps: "12", target: "Hamstrings", hold: "None", image: placeholderImg },
            { name: "Standing Calf Raises", sets: sets, reps: "15", target: "Calves", hold: "None", image: placeholderImg }
          ]
        },
        6: {
          name: "Day 6: Cardio Engine Sprint",
          exercises: [
            { name: jointFriendly ? "Half-Burpees (No Jump)" : "Full Burpees", sets: sets, reps: "10-12", target: "Full Body conditioning", hold: "None", image: placeholderImg },
            { name: "Mountain Climbers", sets: 3, reps: "45s", target: "Core, Cardio", hold: "None", image: placeholderImg },
            { name: "High Knees Sprint", sets: 3, reps: "30s", target: "Aerobic Engine", hold: "None", image: placeholderImg },
            { name: "Russian Kettlebell Swings", sets: sets, reps: "20", target: "Posterior Chain", hold: "None", image: placeholderImg },
            { name: "Jumping Jacks", sets: 3, reps: "45s", target: "Cardio", hold: "None", image: placeholderImg }
          ]
        },
        7: {
          name: "Day 7: Active Recovery & Mobility",
          exercises: [
            { name: "Cobra Pose", sets: 2, reps: "45s", target: "Abdominals, Hip Flexors", hold: "Static stretch", image: placeholderImg },
            { name: "Dynamic Hip Openers", sets: 2, reps: "10 per leg", target: "Hip flexors, Hamstrings", hold: "Active stretching", image: placeholderImg },
            { name: "Hamstring Static Stretch", sets: 2, reps: "30s per leg", target: "Posterior leg chain", hold: "Static", image: placeholderImg },
            { name: "Child's Pose", sets: 2, reps: "60s", target: "Lats, Hips", hold: "None", image: placeholderImg },
            { name: "Cat-Cow Stretch", sets: 2, reps: "60s", target: "Spine", hold: "None", image: placeholderImg }
          ]
        }
      };
    } else if (goalsStr.includes('flexibility') || goalsStr.includes('mobility') || goalsStr.includes('stretch')) {
      planType = 'Flexibility, Mobility & Restorative Flow';
      planDescription = 'Dedicated movement routine focusing on joint range of motion, muscle decompression, spinal alignment, and dynamic recovery.';

      rawDays = {
        1: {
          name: "Day 1: Spinal Range & Decompression",
          exercises: [
            { name: "Cat-Cow Spinal Flow", sets: 2, reps: "60s slow flow", target: "Erector Spinae, Rhomboids, Spine", hold: "None", image: placeholderImg },
            { name: "Sphinx/Cobra Extension", sets: 2, reps: "45s static hold", target: "Rectus Abdominis, Hip Flexors", hold: "Static hold", image: placeholderImg },
            { name: "Thoracic Rotation Flow", sets: 2, reps: "10 per side", target: "Thoracic Spine, Shoulders", hold: "None", image: placeholderImg },
            { name: "Deep Child's Pose Decompression", sets: 2, reps: "60s static hold", target: "Lats, Lower Back", hold: "Static hold", image: placeholderImg },
            { name: "Seated Spinal Twist", sets: 2, reps: "30s per side", target: "Glutes, Obliques, Spine", hold: "None", image: placeholderImg }
          ]
        },
        2: {
          name: "Day 2: Hip Opening & Pelvic Alignment",
          exercises: [
            { name: "Deep Lizard Pose Stretch", sets: 2, reps: "45s per side", target: "Hip Flexors, Hamstrings, Groin", hold: "Static hold", image: placeholderImg },
            { name: "Restorative Pigeon Pose", sets: 2, reps: "45s per side", target: "Glutes, Piriformis, Hip Rotators", hold: "Static hold", image: placeholderImg },
            { name: "Butterfly Adductor Release", sets: 2, reps: "60s slow pulse", target: "Adductors, Groin", hold: "Dynamic", image: placeholderImg },
            { name: "Decompressing Happy Baby Pose", sets: 2, reps: "45s hold", target: "Lower Back, Glutes, Hamstrings", hold: "None", image: placeholderImg },
            { name: "Frog Pose Hip Opener", sets: 2, reps: "30s hold", target: "Groin, Hips", hold: "None", image: placeholderImg }
          ]
        },
        3: {
          name: "Day 3: Shoulder, Chest & Upper Body Opener",
          exercises: [
            { name: "Chest & Bicep Wall Stretch", sets: 2, reps: "30s per side", target: "Pectoralis Major, Biceps", hold: "Static", image: placeholderImg },
            { name: "Shoulder Pass-Throughs (with towel/band)", sets: 2, reps: "12 slow reps", target: "Rotator Cuff, Deltoids", hold: "Dynamic", image: placeholderImg },
            { name: "Puppy Pose Shoulder Opener", sets: 2, reps: "60s hold", target: "Shoulders, Upper Back, Lats", hold: "Static", image: placeholderImg },
            { name: "Behind-the-Back Shoulder Clasp", sets: 2, reps: "30s per side", target: "Shoulders, Rotators", hold: "None", image: placeholderImg },
            { name: "Neck & Trapezius Releases", sets: 2, reps: "30s per side", target: "Upper Trapezius, Scalenes", hold: "None", image: placeholderImg }
          ]
        },
        4: {
          name: "Day 4: Core Stability & Alignment",
          exercises: [
            { name: "Bird-Dog Extensions", sets: 2, reps: "12 slow reps", target: "Erector Spinae, Gluteus, Core", hold: "2s hold", image: placeholderImg },
            { name: "Deadbug Core Alignment", sets: 2, reps: "12 slow reps", target: "Transverse Abdominis, Core", hold: "None", image: placeholderImg },
            { name: "Plank Hold", sets: 2, reps: "45s hold", target: "Rectus Abdominis, Shoulder Stabilizers", hold: "None", image: placeholderImg },
            { name: "Glute Bridge Squeezes", sets: 2, reps: "15 slow reps", target: "Gluteus Maximus, Hamstrings", hold: "1s squeeze", image: placeholderImg },
            { name: "Sphinx/Cobra Extension", sets: 2, reps: "30s static", target: "Abdominals", hold: "None", image: placeholderImg }
          ]
        },
        5: {
          name: "Day 5: Full-Body Dynamic Yoga Flow",
          exercises: [
            { name: "Downward Facing Dog", sets: 2, reps: "45s hold", target: "Posterior Chain, Shoulders, Calves", hold: "Static", image: placeholderImg },
            { name: "Low Lunge Crescent Twist", sets: 2, reps: "8 per side", target: "Psoas, Thoracic Spine, Quads", hold: "None", image: placeholderImg },
            { name: "Warrior II Grounded Alignment", sets: 2, reps: "30s per side", target: "Glutes, Adductors, Shoulders", hold: "None", image: placeholderImg },
            { name: "Hamstring Triangle Pose", sets: 2, reps: "30s per side", target: "Hamstrings, Obliques, Shoulders", hold: "None", image: placeholderImg },
            { name: "Tree Pose Balance Flow", sets: 2, reps: "30s per leg", target: "Ankle Stabilizers, Core, Balance", hold: "None", image: placeholderImg }
          ]
        },
        6: {
          name: "Day 6: Posterior Chain & Hamstring Release",
          exercises: [
            { name: "Seated Forward Fold", sets: 2, reps: "60s hold", target: "Hamstrings, Calves, Lower Back", hold: "Static", image: placeholderImg },
            { name: "Ragdoll Standing Forward Fold", sets: 2, reps: "60s loose hold", target: "Spine, Hamstrings, Hips", hold: "Static", image: placeholderImg },
            { name: "Couch Stretches for Quads", sets: 2, reps: "45s per leg", target: "Quadriceps, Hip flexors", hold: "Static", image: placeholderImg },
            { name: "Lying Figure-4 Glute Stretch", sets: 2, reps: "45s per leg", target: "Gluteus Maximus, Piriformis", hold: "Static", image: placeholderImg },
            { name: "Calf Wall Flexion Stretch", sets: 2, reps: "30s per leg", target: "Gastrocnemius, Soleus", hold: "None", image: placeholderImg }
          ]
        },
        7: {
          name: "Day 7: Restorative Release & Savasana",
          exercises: [
            { name: "Deep Child's Pose Decompression", sets: 1, reps: "90s hold", target: "Full Body Relaxation", hold: "Static", image: placeholderImg },
            { name: "Sphinx Pose Neck Rolls", sets: 2, reps: "45s slow rolls", target: "Cervical Spine, Trapezius", hold: "Dynamic", image: placeholderImg },
            { name: "Supine Knees-to-Chest Hug", sets: 1, reps: "60s hold", target: "Lower Back, Glutes", hold: "Static", image: placeholderImg },
            { name: "Corpse Pose Savasana Breathing", sets: 1, reps: "5 mins breathing", target: "CNS Recovery, Autonomic nervous system", hold: "None", image: placeholderImg },
            { name: "Seated Head-to-Knee Side Bend", sets: 2, reps: "30s per side", target: "Lats, QL, Hamstrings", hold: "None", image: placeholderImg }
          ]
        }
      };
    } else {
      planType = 'Aerobic & Anaerobic Conditioning Program';
      planDescription = 'High-repetition split designed to increase mitochondrial density, lactic acid clearance rate, and active sports performance capacity.';

      rawDays = {
        1: {
          name: "Day 1: Upper Body Endurance & Stabilizers",
          exercises: [
            { name: jointFriendly ? "Incline Wall Pushups" : "Pushups (High Rep)", sets: sets, reps: "15-20", target: "Chest, Shoulders, Triceps", hold: "None", image: placeholderImg },
            { name: "Dumbbell Bent-Over Row", sets: sets, reps: "15", target: "Latissimus Dorsi, Back", hold: "None", image: placeholderImg },
            { name: "Plank-to-Pushup Flow", sets: sets - 1, reps: "10", target: "Shoulders, Chest, Core endurance", hold: "None", image: placeholderImg },
            { name: "Dumbbell Lateral Raises", sets: sets, reps: "15", target: "Shoulders", hold: "None", image: placeholderImg },
            { name: "Jumping Jacks", sets: 3, reps: "60s", target: "Cardio", hold: "None", image: placeholderImg }
          ]
        },
        2: {
          name: "Day 2: Lower Body Unilateral Stability",
          exercises: [
            { name: "Bulgarian Split Squats", sets: sets, reps: "12-15 per leg", target: "Quadriceps, Glutes, Unilateral Balance", hold: "None", image: placeholderImg },
            { name: "Dumbbell Step-Ups", sets: sets - 1, reps: "12 per leg", target: "Quads, Hip Flexors, Glutes", hold: "None", image: placeholderImg },
            { name: "Single Leg Glute Bridges", sets: sets, reps: "12 per side", target: "Hamstrings, Glute Medius", hold: "1s squeeze", image: placeholderImg },
            { name: "Standing Calf Raises", sets: sets, reps: "15", target: "Calves", hold: "None", image: placeholderImg },
            { name: "Dumbbell Walking Lunges", sets: sets, reps: "12 per leg", target: "Quads, Hips", hold: "None", image: placeholderImg }
          ]
        },
        3: {
          name: "Day 3: Back & Core Stamina",
          exercises: [
            { name: "Wide Grip Lat Pulldown", sets: sets, reps: "12-15", target: "Latissimus Dorsi", hold: "None", image: placeholderImg },
            { name: "Hanging Knee Raises", sets: sets, reps: "15", target: "Rectus Abdominis", hold: "1s peak hold", image: placeholderImg },
            { name: "Russian Twists", sets: 3, reps: "20 per side", target: "Obliques, Core", hold: "None", image: placeholderImg },
            { name: "Plank Hold", sets: 3, reps: "60s", target: "Core", hold: "None", image: placeholderImg },
            { name: "Superman Holds", sets: 3, reps: "45s", target: "Back", hold: "None", image: placeholderImg }
          ]
        },
        4: {
          name: "Day 4: Active Recovery / Flow",
          exercises: [
            { name: "Cat-Cow Stretch", sets: 2, reps: "60s", target: "Spinal Mobility, Core Relief", hold: "Active breathing", image: placeholderImg },
            { name: "Child's Pose", sets: 2, reps: "60s", target: "Lats, Lower Back, Hips", hold: "Static stretch", image: placeholderImg },
            { name: "Bird-Dog Extensions", sets: 3, reps: "10 per side", target: "Lower Back, Glutes", hold: "2s hold", image: placeholderImg },
            { name: "Sphinx/Cobra Extension", sets: 2, reps: "45s", target: "Abdominals", hold: "None", image: placeholderImg },
            { name: "Shoulder Pass-Throughs (with towel/band)", sets: 3, reps: "10", target: "Shoulder Mobility", hold: "None", image: placeholderImg }
          ]
        },
        5: {
          name: "Day 5: Lower Body Quadriceps Endurance",
          exercises: [
            { name: "Goblet Squats", sets: sets, reps: "15", target: "Quadriceps, Glutes", hold: "None", image: placeholderImg },
            { name: "Walking Lunges", sets: sets - 1, reps: "15 per leg", target: "Quads, Hamstrings, Balance", hold: "None", image: placeholderImg },
            { name: "Bodyweight Squats (High Rep)", sets: 3, reps: "25", target: "Muscular Endurance", hold: "None", image: placeholderImg },
            { name: "Glute Bridge Squeezes", sets: sets, reps: "15", target: "Glutes", hold: "None", image: placeholderImg },
            { name: "Standing Calf Raises", sets: sets, reps: "15", target: "Calves", hold: "None", image: placeholderImg }
          ]
        },
        6: {
          name: "Day 6: Full Body Conditioning",
          exercises: [
            { name: "Russian Kettlebell Swings", sets: sets, reps: "20", target: "Posterior Chain, Cardio", hold: "None", image: placeholderImg },
            { name: "Dumbbell Thrusters", sets: sets - 1, reps: "12", target: "Full Body, Cardio", hold: "None", image: placeholderImg },
            { name: "Mountain Climbers", sets: 3, reps: "45s", target: "Core, Cardio", hold: "None", image: placeholderImg },
            { name: "Jumping Jacks", sets: 3, reps: "60s", target: "Cardio", hold: "None", image: placeholderImg },
            { name: "Plank Jacks", sets: 3, reps: "45s", target: "Core", hold: "None", image: placeholderImg }
          ]
        },
        7: {
          name: "Day 7: Active Recovery / Joint Mobility",
          exercises: [
            { name: "Shoulder Mobility Drills", sets: 2, reps: "12", target: "Shoulder Rotators", hold: "None", image: placeholderImg },
            { name: "Foam Rolling Flow", sets: 1, reps: "5 mins", target: "Myofascial Release", hold: "None", image: placeholderImg },
            { name: "Child's Pose Stretch", sets: 2, reps: "60s", target: "Lats, Lower Back", hold: "Static", image: placeholderImg },
            { name: "Cat-Cow Stretch", sets: 2, reps: "60s", target: "Spine", hold: "None", image: placeholderImg },
            { name: "Sphinx/Cobra Extension", sets: 2, reps: "30s", target: "Abs", hold: "None", image: placeholderImg }
          ]
        }
      };
    }

    // Determine workout duration constraints
    const durationMin = proto.duration ? Number(proto.duration) : 30;
    let numExercises = 3;
    if (durationMin <= 15) numExercises = 2;
    else if (durationMin <= 30) numExercises = 3;
    else if (durationMin <= 45) numExercises = 4;
    else numExercises = 5;

    days = {};
    for (let dayNum = 1; dayNum <= 7; dayNum++) {
      const dayData = rawDays[dayNum];
      if (dayData) {
        // Adapt exercises based on equipment/location
        const adaptedExs = dayData.exercises.map(ex => adaptExercise(ex));
        // Slice exercises depending on duration and adjust sets
        const finalExs = adaptedExs.slice(0, numExercises).map(ex => {
          let adjustedSets = sets;
          if (durationMin <= 15) {
            adjustedSets = 2; // Keep sets lower for 15-minute quick workouts
          }
          return {
            ...ex,
            sets: adjustedSets
          };
        });
        days[dayNum] = {
          name: dayData.name,
          exercises: finalExs
        };
      }
    }

    const plan = {
      startDate: new Date().toISOString(),
      planType,
      planDescription,
      restSecs,
      sets,
      volumeTag,
      jointFriendly,
      days
    };

    user.workoutPlan = plan;
    await user.save();

    res.status(200).json({ plan });
  } catch (error) {
    console.error('Generate workout plan error:', error);
    res.status(500).json({ error: 'Failed to generate workout plan.' });
  }
});

// 5. Save Workout Session Route
app.post('/api/workouts', async (req, res) => {
  try {
    const { email, duration, steps, distance, calories } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'User email is required to save workout.' });
    }
    const workout = new Workout({
      email: email.toLowerCase(),
      duration: Number(duration),
      steps: Number(steps),
      distance: Number(distance),
      calories: calories ? Number(calories) : undefined
    });
    await workout.save();
    res.status(201).json({ message: 'Workout saved successfully.', workout });
  } catch (error) {
    console.error('Save workout error:', error);
    res.status(500).json({ error: 'Failed to save workout.' });
  }
});

// 6. Get Workouts History Route
app.get('/api/workouts', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'User email is required.' });
    }
    const workouts = await Workout.find({ email: email.toLowerCase() }).sort({ date: -1 });
    res.status(200).json(workouts);
  } catch (error) {
    console.error('Get workouts error:', error);
    res.status(500).json({ error: 'Failed to fetch workouts.' });
  }
});


// ==========================================
// AI DIET PLANNER ROUTES & RECIPE DATABASE
// ==========================================

// Predefined recipes catalog categorized by type, meal, allergens, and budget
const RECIPES_DATABASE = [
  // BREAKFASTS
  {
    name: "Oatmeal with Banana & Peanut Butter",
    type: "vegetarian",
    calories: 450, protein: 15, carbs: 65, fat: 18,
    allergens: ["nuts", "peanuts"],
    budgetTier: "low",
    mealType: "breakfast",
    ingredients: ["1 cup oats", "1 medium banana", "2 tbsp peanut butter", "1 cup water"]
  },
  {
    name: "Oatmeal with Banana & Flaxseeds",
    type: "vegan",
    calories: 420, protein: 12, carbs: 68, fat: 12,
    allergens: [],
    budgetTier: "low",
    mealType: "breakfast",
    ingredients: ["1 cup oats", "1 medium banana", "2 tbsp ground flaxseeds", "1 cup water"]
  },
  {
    name: "Scrambled Eggs with Toast & Butter",
    type: "non-vegetarian",
    calories: 480, protein: 22, carbs: 32, fat: 26,
    allergens: ["eggs", "dairy", "gluten"],
    budgetTier: "low",
    mealType: "breakfast",
    ingredients: ["3 whole eggs", "2 slices whole wheat toast", "1 tbsp butter"]
  },
  {
    name: "Greek Yogurt Parfait with Honey & Berries",
    type: "vegetarian",
    calories: 460, protein: 25, carbs: 55, fat: 12,
    allergens: ["dairy"],
    budgetTier: "mid",
    mealType: "breakfast",
    ingredients: ["1 cup low fat greek yogurt", "1 tbsp honey", "0.5 cup organic berries", "2 tbsp granola"]
  },
  {
    name: "Avocado Toast on Sourdough with Chia Seeds",
    type: "vegan",
    calories: 410, protein: 10, carbs: 52, fat: 20,
    allergens: ["gluten"],
    budgetTier: "mid",
    mealType: "breakfast",
    ingredients: ["1 slice sourdough bread", "0.5 ripe avocado", "1 tbsp chia seeds", "lemon juice"]
  },
  {
    name: "Turkey Bacon & Egg White Wrap",
    type: "non-vegetarian",
    calories: 430, protein: 28, carbs: 35, fat: 14,
    allergens: ["eggs", "gluten"],
    budgetTier: "mid",
    mealType: "breakfast",
    ingredients: ["4 egg whites", "2 slices turkey bacon", "1 whole wheat tortilla wrap"]
  },
  {
    name: "Acai Bowl with Organic Hemp Hearts & Almond Butter",
    type: "vegetarian",
    calories: 520, protein: 14, carbs: 70, fat: 24,
    allergens: ["nuts"],
    budgetTier: "high",
    mealType: "breakfast",
    ingredients: ["1 organic acai pack", "1 cup almond milk", "1 tbsp organic almond butter", "2 tbsp hemp seeds"]
  },
  {
    name: "Smoked Tofu & Avocado Scramble on Seed Bread",
    type: "vegan",
    calories: 490, protein: 22, carbs: 38, fat: 28,
    allergens: ["soy"],
    budgetTier: "high",
    mealType: "breakfast",
    ingredients: ["150g firm tofu", "0.5 avocado (cubed)", "2 slices organic seed bread", "turmeric seasoning"]
  },
  {
    name: "Smoked Salmon & Cream Cheese Bagel",
    type: "non-vegetarian",
    calories: 580, protein: 32, carbs: 58, fat: 22,
    allergens: ["fish", "dairy", "gluten"],
    budgetTier: "high",
    mealType: "breakfast",
    ingredients: ["100g smoked salmon", "2 tbsp cream cheese", "1 whole wheat bagel"]
  },

  // LUNCHES
  {
    name: "Black Bean & Rice Bowl with Melted Cheddar",
    type: "vegetarian",
    calories: 620, protein: 24, carbs: 90, fat: 16,
    allergens: ["dairy"],
    budgetTier: "low",
    mealType: "lunch",
    ingredients: ["1 cup black beans", "1.5 cups jasmine rice", "30g cheddar cheese", "salsa"]
  },
  {
    name: "Spicy Chickpea & Rice Bowl with Veggies",
    type: "vegan",
    calories: 580, protein: 18, carbs: 94, fat: 12,
    allergens: ["soy"],
    budgetTier: "low",
    mealType: "lunch",
    ingredients: ["1 cup chickpeas", "1.5 cups white rice", "1 cup frozen mixed vegetables", "soy sauce"]
  },
  {
    name: "Canned Tuna Salad Sandwich",
    type: "non-vegetarian",
    calories: 590, protein: 38, carbs: 48, fat: 18,
    allergens: ["fish", "eggs", "gluten"],
    budgetTier: "low",
    mealType: "lunch",
    ingredients: ["1 can chunk light tuna", "1 tbsp mayonnaise", "2 slices whole wheat bread", "lettuce"]
  },
  {
    name: "Mediterranean Quinoa Bowl with Feta & Olives",
    type: "vegetarian",
    calories: 650, protein: 20, carbs: 75, fat: 25,
    allergens: ["dairy"],
    budgetTier: "mid",
    mealType: "lunch",
    ingredients: ["1 cup cooked quinoa", "50g Greek feta cheese", "6 kalamata olives", "diced cucumber & tomato"]
  },
  {
    name: "Lentil Soup with Sweet Potatoes & Spinach",
    type: "vegan",
    calories: 520, protein: 22, carbs: 85, fat: 6,
    allergens: [],
    budgetTier: "mid",
    mealType: "lunch",
    ingredients: ["1 cup brown lentils", "1 medium sweet potato", "2 cups fresh baby spinach", "vegetable broth"]
  },
  {
    name: "Grilled Chicken & Jasmine Rice with Broccoli",
    type: "non-vegetarian",
    calories: 680, protein: 46, carbs: 78, fat: 12,
    allergens: [],
    budgetTier: "mid",
    mealType: "lunch",
    ingredients: ["150g lean chicken breast", "1.5 cups cooked jasmine rice", "1 cup steamed broccoli", "1 tbsp olive oil"]
  },
  {
    name: "Arugula Salad with Goat Cheese, Walnuts & Figs",
    type: "vegetarian",
    calories: 690, protein: 15, carbs: 58, fat: 42,
    allergens: ["dairy", "nuts"],
    budgetTier: "high",
    mealType: "lunch",
    ingredients: ["3 cups fresh arugula", "60g soft goat cheese", "0.25 cup chopped walnuts", "4 dry figs"]
  },
  {
    name: "Quinoa Pilaf with Avocado & Grilled Tempeh",
    type: "vegan",
    calories: 680, protein: 26, carbs: 82, fat: 24,
    allergens: ["soy"],
    budgetTier: "high",
    mealType: "lunch",
    ingredients: ["1 cup cooked quinoa", "0.5 fresh avocado", "100g organic tempeh", "saffron broth"]
  },
  {
    name: "Air-fried Steak Bites with Potatoes & Asparagus",
    type: "non-vegetarian",
    calories: 820, protein: 55, carbs: 45, fat: 44,
    allergens: ["dairy"],
    budgetTier: "high",
    mealType: "lunch",
    ingredients: ["200g grass-fed steak", "200g baby potatoes", "1 bunch asparagus", "1.5 tbsp garlic butter"]
  },

  // DINNERS
  {
    name: "Cheesy Lentil Pasta with Marinara Sauce",
    type: "vegetarian",
    calories: 600, protein: 32, carbs: 85, fat: 12,
    allergens: ["dairy", "gluten"],
    budgetTier: "low",
    mealType: "dinner",
    ingredients: ["100g red lentil pasta", "1 cup marinara sauce", "2 tbsp shredded parmesan"]
  },
  {
    name: "Tofu & Mixed Veggie Stir-Fry",
    type: "vegan",
    calories: 550, protein: 24, carbs: 72, fat: 18,
    allergens: ["soy"],
    budgetTier: "low",
    mealType: "dinner",
    ingredients: ["150g firm tofu (cubed)", "2 cups fresh stir-fry veggie mix", "1 tbsp vegetable oil", "jasmine rice"]
  },
  {
    name: "Baked Chicken Thighs with White Rice & Green Beans",
    type: "non-vegetarian",
    calories: 650, protein: 38, carbs: 62, fat: 26,
    allergens: [],
    budgetTier: "low",
    mealType: "dinner",
    ingredients: ["2 bone-in chicken thighs", "1 cup cooked white rice", "100g steamed green beans"]
  },
  {
    name: "Stuffed Bell Peppers with Brown Rice & Mozzarella",
    type: "vegetarian",
    calories: 640, protein: 22, carbs: 78, fat: 24,
    allergens: ["dairy"],
    budgetTier: "mid",
    mealType: "dinner",
    ingredients: ["2 large bell peppers", "1 cup brown rice", "0.5 cup black beans", "60g shredded mozzarella"]
  },
  {
    name: "Chickpea Coconut Curry with Basmati Rice",
    type: "vegan",
    calories: 680, protein: 18, carbs: 92, fat: 26,
    allergens: [],
    budgetTier: "mid",
    mealType: "dinner",
    ingredients: ["1 cup boiled chickpeas", "0.5 cup light coconut milk", "curry spices", "1 cup basmati rice"]
  },
  {
    name: "Pan-Seared Salmon with Quinoa & Asparagus",
    type: "non-vegetarian",
    calories: 710, protein: 42, carbs: 54, fat: 32,
    allergens: ["fish"],
    budgetTier: "mid",
    mealType: "dinner",
    ingredients: ["150g fresh salmon fillet", "1 cup cooked quinoa", "100g pan-grilled asparagus", "lemon juice"]
  },
  {
    name: "Truffle Mushroom Risotto with Parmesan & Pine Nuts",
    type: "vegetarian",
    calories: 780, protein: 18, carbs: 96, fat: 34,
    allergens: ["dairy", "nuts"],
    budgetTier: "high",
    mealType: "dinner",
    ingredients: ["1 cup arborio rice", "150g portobello mushrooms", "2 tbsp parmesan cheese", "1 tbsp truffle oil", "1 tbsp roasted pine nuts"]
  },
  {
    name: "Portobello Steak with Mashed Cauliflower & Avocado",
    type: "vegan",
    calories: 590, protein: 15, carbs: 42, fat: 36,
    allergens: [],
    budgetTier: "high",
    mealType: "dinner",
    ingredients: ["2 large portobello mushroom caps", "300g cauliflower mash", "1 whole avocado (sliced)", "2 tbsp olive oil"]
  },
  {
    name: "Ribeye Steak with Sweet Potato Mash & Spinach",
    type: "non-vegetarian",
    calories: 920, protein: 58, carbs: 48, fat: 54,
    allergens: [],
    budgetTier: "high",
    mealType: "dinner",
    ingredients: ["250g ribeye steak", "1 large sweet potato", "2 cups baby spinach", "1 tbsp butter"]
  },

  // SNACKS
  {
    name: "Cottage Cheese with Cucumber",
    type: "vegetarian",
    calories: 180, protein: 18, carbs: 8, fat: 6,
    allergens: ["dairy"],
    budgetTier: "low",
    mealType: "snack",
    ingredients: ["1 cup cottage cheese", "1 sliced cucumber", "black pepper"]
  },
  {
    name: "Apple Slices with Peanut Butter",
    type: "vegan",
    calories: 220, protein: 6, carbs: 28, fat: 12,
    allergens: ["nuts", "peanuts"],
    budgetTier: "low",
    mealType: "snack",
    ingredients: ["1 medium apple", "1.5 tbsp peanut butter"]
  },
  {
    name: "Hard-Boiled Eggs",
    type: "non-vegetarian",
    calories: 140, protein: 12, carbs: 1, fat: 10,
    allergens: ["eggs"],
    budgetTier: "low",
    mealType: "snack",
    ingredients: ["2 large eggs"]
  },
  {
    name: "Mixed Dry Roasted Almonds & Raisins",
    type: "vegetarian",
    calories: 240, protein: 8, carbs: 22, fat: 16,
    allergens: ["nuts"],
    budgetTier: "mid",
    mealType: "snack",
    ingredients: ["30g roasted almonds", "30g organic dark raisins"]
  },
  {
    name: "Hummus with Carrots & Celery",
    type: "vegan",
    calories: 190, protein: 5, carbs: 18, fat: 11,
    allergens: [],
    budgetTier: "mid",
    mealType: "snack",
    ingredients: ["3 tbsp roasted garlic hummus", "2 carrots (sliced)", "2 celery stalks"]
  },
  {
    name: "Turkey Jerky",
    type: "non-vegetarian",
    calories: 160, protein: 22, carbs: 6, fat: 4,
    allergens: [],
    budgetTier: "mid",
    mealType: "snack",
    ingredients: ["50g lean turkey jerky"]
  },
  {
    name: "Organic Dark Chocolate & Strawberries",
    type: "vegetarian",
    calories: 290, protein: 4, carbs: 32, fat: 18,
    allergens: ["dairy"],
    budgetTier: "high",
    mealType: "snack",
    ingredients: ["40g organic 85% dark chocolate", "100g fresh strawberries"]
  },
  {
    name: "Roasted Pumpkin Seeds & Freeze-Dried Mangoes",
    type: "vegan",
    calories: 250, protein: 9, carbs: 26, fat: 14,
    allergens: [],
    budgetTier: "high",
    mealType: "snack",
    ingredients: ["30g shell-less pumpkin seeds", "25g freeze-dried mango chips"]
  },
  {
    name: "Prosciutto & Goat Cheese Roll",
    type: "non-vegetarian",
    calories: 280, protein: 18, carbs: 4, fat: 22,
    allergens: ["dairy"],
    budgetTier: "high",
    mealType: "snack",
    ingredients: ["3 slices prosciutto", "40g soft goat cheese"]
  }
];

// Helper to filter and adapt a recipe based on dietary preferences, budget, and allergies
function findAndFilterRecipe(mealType, dietaryType, budget, allergies) {
  let candidates = RECIPES_DATABASE.filter(r => r.mealType === mealType);

  if (dietaryType === 'vegan') {
    candidates = candidates.filter(r => r.type === 'vegan');
  } else if (dietaryType === 'vegetarian') {
    candidates = candidates.filter(r => r.type === 'vegan' || r.type === 'vegetarian');
  }

  if (allergies && allergies.length > 0) {
    const allergyLower = allergies.map(a => a.toLowerCase().trim());
    candidates = candidates.filter(r => {
      const hasAllergy = r.allergens.some(allg => allergyLower.includes(allg.toLowerCase()));
      return !hasAllergy;
    });
  }

  let budgetMatches = candidates.filter(r => r.budgetTier === budget);
  if (budgetMatches.length === 0) {
    budgetMatches = candidates;
  }

  if (budgetMatches.length === 0) {
    const ultimateFallback = RECIPES_DATABASE.find(r => r.mealType === mealType);
    return JSON.parse(JSON.stringify(ultimateFallback));
  }

  const selected = budgetMatches[Math.floor(Math.random() * budgetMatches.length)];
  const cloned = JSON.parse(JSON.stringify(selected));

  if (allergies && allergies.length > 0) {
    const allergyLower = allergies.map(a => a.toLowerCase().trim());
    if (allergyLower.includes('gluten')) {
      cloned.name = cloned.name.replace("Toast", "Gluten-Free Toast").replace("Bread", "Gluten-Free Bread").replace("Bagel", "Gluten-Free Bagel").replace("Pasta", "Gluten-Free Pasta");
      cloned.ingredients = cloned.ingredients.map(ing =>
        ing.replace("bread", "gluten-free bread").replace("toast", "gluten-free toast").replace("bagel", "gluten-free bagel").replace("pasta", "gluten-free pasta")
      );
    }
    if (allergyLower.includes('dairy') || allergyLower.includes('milk')) {
      cloned.name = cloned.name.replace("Greek Yogurt", "Coconut Yogurt").replace("Cheddar", "Vegan Cheese").replace("Cheese", "Vegan Cheese").replace("Butter", "Olive Oil");
      cloned.ingredients = cloned.ingredients.map(ing =>
        ing.replace("greek yogurt", "coconut yogurt").replace("cheddar cheese", "vegan cheddar").replace("cheese", "vegan cheese").replace("butter", "olive oil")
      );
    }
    if (allergyLower.includes('nuts') || allergyLower.includes('peanuts')) {
      cloned.name = cloned.name.replace("Peanut Butter", "Sunflower Seed Butter").replace("Almond Butter", "Tahini").replace("Walnuts", "Pumpkin Seeds").replace("Almonds", "Soy Nuts").replace("Pine Nuts", "Sunflower Seeds");
      cloned.ingredients = cloned.ingredients.map(ing =>
        ing.replace("peanut butter", "sunflower seed butter").replace("almond butter", "tahini").replace("walnuts", "pumpkin seeds").replace("almonds", "soy nuts").replace("pine nuts", "sunflower seeds")
      );
    }
    if (allergyLower.includes('soy')) {
      cloned.name = cloned.name.replace("Tofu", "Chickpeas").replace("Tempeh", "Lentils").replace("Soy Sauce", "Coconut Aminos").replace("soy sauce", "coconut aminos");
      cloned.ingredients = cloned.ingredients.map(ing =>
        ing.toLowerCase().includes("soy sauce") ? ing.replace(/soy sauce/gi, "coconut aminos") :
          ing.toLowerCase().includes("tofu") ? ing.replace(/tofu/gi, "chickpeas") :
            ing.toLowerCase().includes("tempeh") ? ing.replace(/tempeh/gi, "lentils") : ing
      );
    }
  }

  return cloned;
}

// 4e. Save Diet Profile Telemetry
app.post('/api/user/diet-profile', async (req, res) => {
  try {
    const { email, dietaryType, allergies, budget, dailyCalories } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'User email is required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    user.dietProfile = {
      dietaryType: dietaryType || 'non-vegetarian',
      allergies: Array.isArray(allergies) ? allergies : [],
      budget: budget || 'mid',
      dailyCalories: Number(dailyCalories) || 2000
    };

    await user.save();
    res.status(200).json({ message: "Diet profile updated successfully.", dietProfile: user.dietProfile });
  } catch (error) {
    console.error("Save diet profile error:", error);
    res.status(500).json({ error: "Failed to save diet profile." });
  }
});

// 4f. Get Diet Profile
app.get('/api/user/diet-profile', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'User email is required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.status(200).json({ dietProfile: user.dietProfile || {} });
  } catch (error) {
    console.error("Get diet profile error:", error);
    res.status(500).json({ error: "Failed to fetch diet profile." });
  }
});

// 4g. Generate & Save AI Diet Plan
app.post('/api/user/diet-plan', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'User email is required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const dProfile = user.dietProfile || {};
    const weight = user.protocol?.weight || 70;
    const targetKcal = dProfile.dailyCalories || 2000;
    const dietaryType = dProfile.dietaryType || 'non-vegetarian';
    const budget = dProfile.budget || 'mid';
    const allergies = dProfile.allergies || [];

    const calculatedWater = (weight * 35) / 1000;
    const waterGoal = Math.min(5.0, Math.max(2.0, Number(calculatedWater.toFixed(1))));

    const scaleMeal = (meal, targetMealKcal) => {
      const baseScale = targetMealKcal / meal.calories;
      return {
        name: meal.name,
        calories: Math.round(meal.calories * baseScale),
        protein: Math.round(meal.protein * baseScale),
        carbs: Math.round(meal.carbs * baseScale),
        fat: Math.round(meal.fat * baseScale),
        ingredients: meal.ingredients
      };
    };

    const compileDaysPlan = () => {
      const bMealRaw = findAndFilterRecipe("breakfast", dietaryType, budget, allergies);
      const lMealRaw = findAndFilterRecipe("lunch", dietaryType, budget, allergies);
      const dMealRaw = findAndFilterRecipe("dinner", dietaryType, budget, allergies);
      const sMealRaw = findAndFilterRecipe("snack", dietaryType, budget, allergies);

      const breakfast = scaleMeal(bMealRaw, targetKcal * 0.25);
      const lunch = scaleMeal(lMealRaw, targetKcal * 0.35);
      const dinner = scaleMeal(dMealRaw, targetKcal * 0.30);
      const snack = scaleMeal(sMealRaw, targetKcal * 0.10);

      return { breakfast, lunch, dinner, snack };
    };

    const dailyMeals = compileDaysPlan();

    const weeklyMeals = {};
    for (let dayNum = 1; dayNum <= 7; dayNum++) {
      weeklyMeals[dayNum] = compileDaysPlan();
    }

    const shoppingSet = new Set();
    const addShoppingIngredients = (mealsObj) => {
      Object.keys(mealsObj).forEach(key => {
        mealsObj[key].ingredients.forEach(ing => {
          const cleanedText = ing.replace(/^\d+(\.\d+)?\s+(\w+)\s+(of\s+)?/i, '').trim();
          shoppingSet.add(cleanedText.charAt(0).toUpperCase() + cleanedText.slice(1));
        });
      });
    };

    for (let dNum = 1; dNum <= 7; dNum++) {
      addShoppingIngredients(weeklyMeals[dNum]);
    }
    const shoppingList = Array.from(shoppingSet);

    const plan = {
      generatedAt: new Date().toISOString(),
      waterGoal,
      dailyMeals,
      weeklyMeals,
      shoppingList
    };

    user.dietPlan = plan;
    await user.save();

    res.status(200).json({ plan });
  } catch (error) {
    console.error("Generate diet plan error:", error);
    res.status(500).json({ error: "Failed to generate AI diet plan." });
  }
});

// 4h. Get Saved Diet Plan
app.get('/api/user/diet-plan', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'User email is required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.status(200).json({ plan: user.dietPlan || null });
  } catch (error) {
    console.error("Get diet plan error:", error);
    res.status(500).json({ error: "Failed to fetch diet plan." });
  }
});

// Serve Static Frontend files from root
app.use(express.static(path.join(__dirname)));

// Fallback to signup page if non-matching HTML
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Export app for Vercel serverless deployments
module.exports = app;

// Start local server if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}
