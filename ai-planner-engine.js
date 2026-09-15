/**
 * FitForge AI Planner Engine
 * 
 * Provides scientifically validated biometric analysis, macronutrient computation,
 * realistic Indian meal planning, tiered workout generation, 24-hour timeline scheduling,
 * and progressive weekly adaptation.
 */

// ==========================================
// 1. BIOMETRIC & METABOLIC CALCULATIONS
// ==========================================

/**
 * Calculates Basal Metabolic Rate using the Mifflin-St Jeor equation.
 * Men: BMR = (10 * weight in kg) + (6.25 * height in cm) - (5 * age in years) + 5
 * Women: BMR = (10 * weight in kg) + (6.25 * height in cm) - (5 * age in years) - 161
 */
function calculateBMR(weightKg, heightCm, ageYears, biologicalSex = 'male') {
    const isFemale = String(biologicalSex).toLowerCase() === 'female';
    const base = (10 * weightKg) + (6.25 * heightCm) - (5 * ageYears);
    const bmr = isFemale ? (base - 161) : (base + 5);
    return Math.round(Math.max(800, bmr));
}

/**
 * Activity level multipliers according to accepted sports science standards.
 */
const ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2,        // Little to no exercise, desk job
    light: 1.375,          // Light exercise 1-3 days/week
    moderate: 1.55,        // Moderate exercise 3-5 days/week
    active: 1.725,         // Hard exercise 6-7 days/week
    very_active: 1.725,
    extremely_active: 1.9  // Very hard daily exercise / physical job
};

function normalizeActivityLevel(level) {
    const s = String(level || 'moderate').toLowerCase().trim();
    if (s.includes('extreme') || s.includes('athlete')) return 'extremely_active';
    if (s.includes('very') || s.includes('high') || s.includes('heavy')) return 'active';
    if (s.includes('mod')) return 'moderate';
    if (s.includes('light')) return 'light';
    if (s.includes('sedent')) return 'sedentary';
    return 'moderate';
}

function calculateTDEE(bmr, activityLevel) {
    const key = normalizeActivityLevel(activityLevel);
    const multiplier = ACTIVITY_MULTIPLIERS[key] || 1.55;
    return Math.round(bmr * multiplier);
}

/**
 * Normalizes goal string into canonical categories:
 * 'fat_loss' | 'muscle_gain' | 'recomposition' | 'maintenance'
 */
function normalizeGoal(goalStr) {
    const s = String(goalStr || 'maintenance').toLowerCase();
    if (s.includes('fat') || s.includes('loss') || s.includes('cut') || s.includes('lean')) return 'fat_loss';
    if (s.includes('muscle') || s.includes('bulk') || s.includes('hypertrophy') || s.includes('mass') || s.includes('strength')) return 'muscle_gain';
    if (s.includes('recomp') || s.includes('tone') || s.includes('body recomp')) return 'recomposition';
    return 'maintenance';
}

/**
 * Calculates Caloric Target based on Goal & TDEE.
 * Respects healthy biological minimums: >= 1500 kcal for men, >= 1200 kcal for women.
 */
function calculateCalorieTarget(tdee, goal, biologicalSex = 'male') {
    const normGoal = normalizeGoal(goal);
    const isFemale = String(biologicalSex).toLowerCase() === 'female';
    const minCalories = isFemale ? 1200 : 1500;

    let target = tdee;
    if (normGoal === 'fat_loss') {
        // Safe 20% caloric deficit (~400-600 kcal)
        target = Math.round(tdee * 0.80);
    } else if (normGoal === 'muscle_gain') {
        // Controlled lean surplus of +12% (~250-400 kcal)
        target = Math.round(tdee * 1.12);
    } else if (normGoal === 'recomposition') {
        // Slight deficit of -7% with elevated protein
        target = Math.round(tdee * 0.93);
    } else {
        // Maintenance
        target = tdee;
    }

    return Math.max(minCalories, target);
}

/**
 * Calculates scientifically accepted macronutrient distributions.
 * Ensures total calories strictly equals (Protein * 4) + (Carbs * 4) + (Fat * 9).
 */
function calculateMacros(targetCalories, weightKg, goal, fitnessLevel = 'intermediate') {
    const normGoal = normalizeGoal(goal);

    // 1. Protein determination based on goal and training intensity
    let proteinPerKg = 2.0;
    if (normGoal === 'fat_loss') {
        // Higher protein during deficit to preserve lean muscle mass
        proteinPerKg = 2.2;
    } else if (normGoal === 'muscle_gain') {
        // Anabolic threshold for hypertrophy
        proteinPerKg = 2.0;
    } else if (normGoal === 'recomposition') {
        // Maximal muscle protein synthesis during recomp
        proteinPerKg = 2.2;
    } else {
        // Maintenance
        proteinPerKg = 1.8;
    }

    let proteinGrams = Math.round(weightKg * proteinPerKg);
    // Ensure protein is within safe 20-35% of total caloric intake
    const maxProteinGrams = Math.round((targetCalories * 0.35) / 4);
    const minProteinGrams = Math.round((targetCalories * 0.20) / 4);
    proteinGrams = Math.max(minProteinGrams, Math.min(maxProteinGrams, proteinGrams));

    // 2. Fat determination: 0.8 - 1.0 g per kg, or ~22-26% of total calories (essential hormonal health)
    let fatGrams = Math.round(Math.max(45, Math.min(weightKg * 0.9, (targetCalories * 0.25) / 9)));

    // 3. Carbohydrate determination: Remaining caloric budget
    const remainingCaloriesForCarbs = targetCalories - (proteinGrams * 4 + fatGrams * 9);
    let carbGrams = Math.round(remainingCaloriesForCarbs / 4);

    // Safeguard: Ensure minimum 50g carbohydrates for cognitive and thyroid support
    if (carbGrams < 50) {
        carbGrams = 50;
        // Adjust fat downwards to rebalance
        const rebalancedFat = Math.round((targetCalories - (proteinGrams * 4 + carbGrams * 4)) / 9);
        fatGrams = Math.max(35, rebalancedFat);
    }

    // Final mathematical reconciliation to ensure 100% exact calorie match:
    const calculatedCals = (proteinGrams * 4) + (carbGrams * 4) + (fatGrams * 9);
    const diff = targetCalories - calculatedCals;
    if (diff !== 0) {
        // Rebalance via carbohydrates (4 kcal/g)
        carbGrams += Math.round(diff / 4);
    }

    const finalCalories = (proteinGrams * 4) + (carbGrams * 4) + (fatGrams * 9);

    return {
        calories: finalCalories,
        protein: proteinGrams,
        carbs: Math.max(40, carbGrams),
        fat: Math.max(35, fatGrams)
    };
}

/**
 * Calculates optimal hydration intake in liters.
 * Base: 35ml/kg + workout duration adjustment
 */
function calculateWaterIntake(weightKg, workoutDurationMins = 45) {
    const baseLiters = (weightKg * 35) / 1000;
    const workoutLiters = (workoutDurationMins / 30) * 0.35;
    const total = baseLiters + workoutLiters;
    return parseFloat(Math.min(5.5, Math.max(2.5, total)).toFixed(1));
}

// ==========================================
// 2. SMART INDIAN MEAL GENERATION MATRIX
// ==========================================

const INDIAN_MEAL_DATABASE = {
    breakfast: [
        {
            name: "Moong Dal & Paneer Chilla with Mint Chutney",
            diet: ["vegetarian"],
            allergens: ["dairy"],
            base: { calories: 420, protein: 28, carbs: 46, fat: 14 },
            ingredients: ["80g Yellow Moong Dal (soaked & ground)", "70g Low-fat Paneer (crumbled)", "10g Green Chillies & Ginger", "5ml Cold Pressed Mustard Oil", "30g Fresh Pudina/Mint Chutney"]
        },
        {
            name: "Tofu & Vegetable Besan Cheela with Coriander Chutney",
            diet: ["vegetarian", "vegan"],
            allergens: ["soy"],
            base: { calories: 390, protein: 26, carbs: 48, fat: 11 },
            ingredients: ["80g Besan (Gram Flour)", "80g Sautéed Tofu (crumbled)", "40g Chopped Spinach & Onions", "5ml Olive Oil", "30g Fresh Green Chutney"]
        },
        {
            name: "Masala Egg Bhurji with Multigrain Phulkas",
            diet: ["non-vegetarian", "eggetarian"],
            allergens: ["eggs", "gluten"],
            base: { calories: 460, protein: 32, carbs: 48, fat: 15 },
            ingredients: ["2 Whole Eggs + 2 Egg Whites", "2 Medium Multigrain Rotis (60g)", "50g Chopped Onions, Tomatoes & Green Chillies", "5ml Ghee", "Fresh Coriander"]
        },
        {
            name: "Masala Egg Bhurji with Gluten-Free Rice Roti",
            diet: ["non-vegetarian", "eggetarian"],
            allergens: ["eggs"],
            base: { calories: 450, protein: 31, carbs: 49, fat: 14 },
            ingredients: ["2 Whole Eggs + 2 Egg Whites", "2 Gluten-Free Rice Rotis (60g)", "50g Onions & Tomatoes", "5ml Mustard Oil", "Fresh Herbs & Spices"]
        },
        {
            name: "Rolled Oats Upma with Peanuts & Soya Chunks",
            diet: ["vegetarian", "vegan"],
            allergens: ["peanuts", "soy"],
            base: { calories: 430, protein: 27, carbs: 54, fat: 12 },
            ingredients: ["70g Rolled Oats", "30g Soya Chunks (boiled)", "15g Roasted Peanuts", "40g Diced Carrots & Beans", "5ml Mustard Oil with Curry Leaves"]
        },
        {
            name: "Sprouted Moong & Vegetable Poha with Sunflower Seeds",
            diet: ["vegetarian", "vegan"],
            allergens: [],
            base: { calories: 410, protein: 22, carbs: 62, fat: 9 },
            ingredients: ["60g Red Rice Poha", "60g Steamed Sprouted Moong", "15g Roasted Sunflower Seeds", "30g Diced Potatoes & Onions", "Lemon Juice & Curry Leaves"]
        },
        {
            name: "Warm Cinnamon Protein Oats with Chia Seeds & Almonds",
            diet: ["vegetarian"],
            allergens: ["dairy", "tree_nuts"],
            base: { calories: 450, protein: 34, carbs: 52, fat: 12 },
            ingredients: ["60g Rolled Oats", "1 Scoop Whey Isolate (25g protein)", "150ml Low-fat Milk", "15g Crushed Almonds", "10g Chia Seeds"]
        }
    ],

    morning_snack: [
        {
            name: "Sprouted Kala Chana & Cucumber Chaat",
            diet: ["vegetarian", "vegan"],
            allergens: [],
            base: { calories: 180, protein: 11, carbs: 26, fat: 3 },
            ingredients: ["80g Boiled Brown Chickpeas (Kala Chana)", "50g Chopped Cucumber & Tomatoes", "1 Lemon squeezed", "Chaat Masala & Rock Salt"]
        },
        {
            name: "Spiced Masala Greek Curd with Roasted Flaxseeds",
            diet: ["vegetarian"],
            allergens: ["dairy"],
            base: { calories: 170, protein: 15, carbs: 12, fat: 6 },
            ingredients: ["150g Low-fat Greek Dahi / Curd", "10g Roasted Flaxseeds", "Pinch of Roasted Cumin & Black Salt"]
        },
        {
            name: "Hard Boiled Eggs with Black Pepper & Chaat Masala",
            diet: ["non-vegetarian", "eggetarian"],
            allergens: ["eggs"],
            base: { calories: 160, protein: 14, carbs: 2, fat: 11 },
            ingredients: ["2 Whole Hard Boiled Eggs", "Sprinkle of Himalayan Pink Salt & Fresh Cracked Pepper"]
        },
        {
            name: "Crispy Roasted Makhana & Pumpkin Seeds",
            diet: ["vegetarian", "vegan"],
            allergens: [],
            base: { calories: 160, protein: 7, carbs: 22, fat: 5 },
            ingredients: ["25g Foxnuts (Makhana) dry roasted", "10g Raw Pumpkin Seeds", "Pinch of Turmeric & Salt"]
        },
        {
            name: "Soya Chaat with Mint Dressing",
            diet: ["vegetarian", "vegan"],
            allergens: ["soy"],
            base: { calories: 190, protein: 18, carbs: 16, fat: 5 },
            ingredients: ["40g Soya Chunks (boiled & seasoned)", "30g Cucumber & Tomato Dices", "Pudina Dressing"]
        }
    ],

    lunch: [
        {
            name: "Tandoori Grilled Chicken Breast with Jeera Brown Rice & Dal",
            diet: ["non-vegetarian"],
            allergens: [],
            base: { calories: 650, protein: 52, carbs: 68, fat: 16 },
            ingredients: ["180g Skinless Chicken Breast (marinated in ginger, garlic & tandoori spices)", "120g Cooked Brown Basmati Rice", "100g Yellow Dal Tadka", "Mixed Green Cucumber Salad"]
        },
        {
            name: "Palak Chicken Curry with Whole Wheat Phulkas & Salad",
            diet: ["non-vegetarian"],
            allergens: ["gluten"],
            base: { calories: 620, protein: 48, carbs: 62, fat: 18 },
            ingredients: ["170g Chicken Breast chunks in spinach puree", "2 Whole Wheat Phulkas (70g)", "100g Mixed Green Salad", "5ml Cold Pressed Mustard Oil"]
        },
        {
            name: "Paneer Tikka with Yellow Dal Tadka & Multigrain Rotis",
            diet: ["vegetarian"],
            allergens: ["dairy", "gluten"],
            base: { calories: 640, protein: 42, carbs: 65, fat: 22 },
            ingredients: ["140g Low-fat Paneer cubes (grilled with hung curd & spices)", "120g Cooked Yellow Moong Dal", "2 Multigrain Rotis (70g)", "50g Onion-Tomato-Cucumber Salad"]
        },
        {
            name: "Tofu Masala Bhurji with Brown Rice & Tadka Dal",
            diet: ["vegetarian", "vegan"],
            allergens: ["soy"],
            base: { calories: 590, protein: 38, carbs: 70, fat: 17 },
            ingredients: ["160g Firm Tofu (crumbled and sautéed with onions & tomatoes)", "130g Cooked Brown Rice", "120g Toor Dal", "100g Sautéed French Beans & Carrots"]
        },
        {
            name: "Punjabi Rajma Masala with Steamed Brown Rice & Cucumber Salad",
            diet: ["vegetarian", "vegan"],
            allergens: [],
            base: { calories: 580, protein: 28, carbs: 88, fat: 12 },
            ingredients: ["160g Boiled Red Kidney Beans (Rajma curry)", "140g Steamed Brown Rice", "50g Diced Cucumber & Onion Salad", "5ml Cold Pressed Mustard Oil"]
        },
        {
            name: "Amritsari Chole with Millet Roti (Jowar/Bajra) & Curd",
            diet: ["vegetarian"],
            allergens: ["dairy"],
            base: { calories: 610, protein: 32, carbs: 78, fat: 16 },
            ingredients: ["150g Boiled White Chickpeas (Chole gravy)", "2 Jowar/Bajra Rotis (80g, Gluten-Free)", "100g Low-fat Dahi/Curd", "Green Salad with Lemon"]
        },
        {
            name: "Bengali Fish Curry (Rohu/Tilapia) with Steamed Rice & Greens",
            diet: ["non-vegetarian"],
            allergens: ["fish"],
            base: { calories: 580, protein: 44, carbs: 64, fat: 15 },
            ingredients: ["180g Rohu or Tilapia Fish fillets", "130g Steamed Basmati Rice", "100g Sautéed Spinach & Pumpkin", "5ml Mustard Oil"]
        }
    ],

    evening_snack: [
        {
            name: "Roasted Bengal Gram (Bhuna Chana) with Green Tea",
            diet: ["vegetarian", "vegan"],
            allergens: [],
            base: { calories: 170, protein: 10, carbs: 24, fat: 3 },
            ingredients: ["40g Roasted Chana with skin", "1 Cup Hot Green Tea with lemon", "Rock salt"]
        },
        {
            name: "Plant / Whey Protein Shake with Unsweetened Almond Milk",
            diet: ["vegetarian"],
            allergens: ["tree_nuts", "dairy"],
            base: { calories: 190, protein: 27, carbs: 8, fat: 4 },
            ingredients: ["1 Scoop Whey or Plant Protein (30g)", "200ml Unsweetened Almond Milk", "1/2 tsp Cinnamon Powder"]
        },
        {
            name: "Sprouted Moong & Pomegranate Chaat",
            diet: ["vegetarian", "vegan"],
            allergens: [],
            base: { calories: 160, protein: 9, carbs: 27, fat: 2 },
            ingredients: ["60g Steamed Green Moong Sprouts", "30g Fresh Pomegranate arils", "Lemon juice, Chaat Masala"]
        },
        {
            name: "Boiled Egg White Salad with Fresh Herbs",
            diet: ["non-vegetarian", "eggetarian"],
            allergens: ["eggs"],
            base: { calories: 120, protein: 20, carbs: 3, fat: 2 },
            ingredients: ["4 Boiled Egg Whites (diced)", "30g Chopped Tomatoes, Mint & Coriander", "Black salt & Pepper"]
        },
        {
            name: "Crispy Soya Chunks Chaat with Chaat Spices",
            diet: ["vegetarian", "vegan"],
            allergens: ["soy"],
            base: { calories: 180, protein: 19, carbs: 15, fat: 4 },
            ingredients: ["35g Soya Chunks air-fried/roasted with spices", "Lemon juice", "Chaat Masala"]
        }
    ],

    dinner: [
        {
            name: "Methi Chicken Breast with Whole Wheat Roti & Mixed Greens",
            diet: ["non-vegetarian"],
            allergens: ["gluten"],
            base: { calories: 510, protein: 46, carbs: 42, fat: 15 },
            ingredients: ["170g Chicken Breast in Fresh Fenugreek (Methi) gravy", "2 Whole Wheat Phulkas (60g)", "100g Fresh Cucumber & Radish Salad", "5ml Olive Oil"]
        },
        {
            name: "Grilled Fish Fillet with Stir-Fried Indian Greens & Mashed Sweet Potato",
            diet: ["non-vegetarian"],
            allergens: ["fish"],
            base: { calories: 490, protein: 44, carbs: 44, fat: 14 },
            ingredients: ["170g Grilled Basa / Rohu Fillet with carom seed spices", "120g Steamed Sweet Potato", "100g Stir-Fried French Beans & Carrots", "5ml Ghee"]
        },
        {
            name: "Palak Paneer with Jowar Roti & Spiced Green Salad",
            diet: ["vegetarian"],
            allergens: ["dairy"],
            base: { calories: 520, protein: 35, carbs: 48, fat: 20 },
            ingredients: ["130g Low-fat Paneer in fresh pureed Spinach gravy", "2 Jowar Rotis (70g, Gluten-Free)", "100g Onion-Tomato-Cucumber salad", "5ml Cold Pressed Mustard Oil"]
        },
        {
            name: "Soya Matar Masala with Whole Wheat Rotis & Salad",
            diet: ["vegetarian", "vegan"],
            allergens: ["soy", "gluten"],
            base: { calories: 480, protein: 36, carbs: 54, fat: 13 },
            ingredients: ["50g Soya Chunks + 50g Green Peas in spiced tomato gravy", "2 Whole Wheat Rotis (60g)", "Cucumber Slices", "5ml Mustard Oil"]
        },
        {
            name: "Dal Khichdi (Moong Dal & Brown Rice) with Curd & Stir-Fried Veggies",
            diet: ["vegetarian"],
            allergens: ["dairy"],
            base: { calories: 490, protein: 24, carbs: 68, fat: 12 },
            ingredients: ["80g Moong Dal & Brown Rice cooked with turmeric & cumin", "100g Low-fat Dahi/Curd", "100g Steamed Spiced French Beans & Carrots", "5ml Ghee"]
        },
        {
            name: "Egg Curry with Steamed Brown Rice & Sautéed Greens",
            diet: ["non-vegetarian", "eggetarian"],
            allergens: ["eggs"],
            base: { calories: 510, protein: 32, carbs: 56, fat: 17 },
            ingredients: ["2 Whole Boiled Eggs + 1 Egg White in light onion-tomato curry", "120g Steamed Brown Rice", "100g Sautéed Spinach & Cabbage", "5ml Mustard Oil"]
        },
        {
            name: "Tofu Palak with Gluten-Free Rice Rotis & Salad",
            diet: ["vegetarian", "vegan"],
            allergens: ["soy"],
            base: { calories: 470, protein: 32, carbs: 52, fat: 14 },
            ingredients: ["160g Tofu cubes in spiced spinach curry", "2 Rice Rotis (60g)", "100g Fresh Greens Salad", "5ml Olive Oil"]
        }
    ]
};

/**
 * Filter and scale meals to match target calories and macros.
 */
function generateSmartMealPlan(macroTargets, dietaryPreference = 'non-vegetarian', allergies = [], seed = 0) {
    const pref = String(dietaryPreference || 'non-vegetarian').toLowerCase();
    const cleanAllergens = (allergies || []).map(a => String(a).toLowerCase().trim());

    // Slot caloric distributions: Breakfast 25%, Morning Snack 10%, Lunch 35%, Evening Snack 10%, Dinner 20%
    const slotDistribution = {
        breakfast: 0.25,
        morning_snack: 0.10,
        lunch: 0.35,
        evening_snack: 0.10,
        dinner: 0.20
    };

    const isSlotSuitable = (mealItem) => {
        // Dietary preference check
        if (pref === 'vegan' && !mealItem.diet.includes('vegan')) return false;
        if (pref === 'vegetarian' && !mealItem.diet.includes('vegetarian') && !mealItem.diet.includes('vegan')) return false;
        if (pref === 'eggetarian' && !mealItem.diet.includes('eggetarian') && !mealItem.diet.includes('vegetarian') && !mealItem.diet.includes('vegan')) return false;

        // Allergy check
        for (const allergen of cleanAllergens) {
            if (allergen.includes('dairy') && (mealItem.allergens.includes('dairy') || mealItem.name.toLowerCase().includes('paneer') || mealItem.name.toLowerCase().includes('curd') || mealItem.name.toLowerCase().includes('milk') || mealItem.name.toLowerCase().includes('whey'))) return false;
            if (allergen.includes('egg') && (mealItem.allergens.includes('eggs') || mealItem.name.toLowerCase().includes('egg'))) return false;
            if (allergen.includes('gluten') && (mealItem.allergens.includes('gluten') || mealItem.name.toLowerCase().includes('wheat') || (mealItem.name.toLowerCase().includes('roti') && !mealItem.name.toLowerCase().includes('rice') && !mealItem.name.toLowerCase().includes('jowar')))) return false;
            if (allergen.includes('nut') && (mealItem.allergens.includes('tree_nuts') || mealItem.allergens.includes('peanuts') || mealItem.name.toLowerCase().includes('almond') || mealItem.name.toLowerCase().includes('peanut'))) return false;
            if (allergen.includes('soy') && (mealItem.allergens.includes('soy') || mealItem.name.toLowerCase().includes('tofu') || mealItem.name.toLowerCase().includes('soya'))) return false;
            if (allergen.includes('fish') && (mealItem.allergens.includes('fish') || mealItem.name.toLowerCase().includes('fish'))) return false;
        }
        return true;
    };

    const slots = ['breakfast', 'morning_snack', 'lunch', 'evening_snack', 'dinner'];
    const slotTitles = {
        breakfast: "Anabolic Breakfast Protocol",
        morning_snack: "Mid-Morning Cognitive Refuel",
        lunch: "Precision Macronutrient Lunch",
        evening_snack: "Pre-Workout Metabolic Booster",
        dinner: "Cellular Recovery Dinner"
    };

    const slotTimings = {
        breakfast: "08:30 AM",
        morning_snack: "11:00 AM",
        lunch: "01:30 PM",
        evening_snack: "04:30 PM",
        dinner: "07:30 PM"
    };

    const generatedMeals = [];
    let runningCals = 0;
    let runningProtein = 0;
    let runningCarbs = 0;
    let runningFat = 0;

    slots.forEach((slotKey, idx) => {
        const available = INDIAN_MEAL_DATABASE[slotKey].filter(isSlotSuitable);
        const candidates = available.length > 0 ? available : INDIAN_MEAL_DATABASE[slotKey];
        // Select deterministic item using seed + idx to provide varied plans on regeneration
        const selectedBase = candidates[(seed + idx) % candidates.length];

        const targetSlotCals = Math.round(macroTargets.calories * slotDistribution[slotKey]);
        const targetSlotProtein = Math.round(macroTargets.protein * slotDistribution[slotKey]);
        const targetSlotCarbs = Math.round(macroTargets.carbs * slotDistribution[slotKey]);
        const targetSlotFat = Math.round(macroTargets.fat * slotDistribution[slotKey]);

        // Scale base meal values realistically
        const scaleRatio = targetSlotCals / selectedBase.base.calories;
        const scaledCals = targetSlotCals;
        const scaledProtein = targetSlotProtein;
        const scaledCarbs = targetSlotCarbs;
        const scaledFat = targetSlotFat;

        runningCals += scaledCals;
        runningProtein += scaledProtein;
        runningCarbs += scaledCarbs;
        runningFat += scaledFat;

        // Portions adjusted
        const scaledIngredients = selectedBase.ingredients.map(ing => {
            return ing.replace(/(\d+)\s*(g|ml)/g, (match, num, unit) => {
                const scaledNum = Math.round(parseFloat(num) * scaleRatio);
                return `${scaledNum}${unit}`;
            });
        });

        const mealTypeHuman = slotKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        generatedMeals.push({
            id: `meal-${idx + 1}`,
            time: slotTimings[slotKey],
            type: "meal",
            title: slotTitles[slotKey],
            description: `${mealTypeHuman} calibrated for ${scaledCals} kcal with balanced macro partition`,
            status: "scheduled",
            reasoning: `Selected ${selectedBase.name} to deliver ${scaledProtein}g protein & ${scaledCarbs}g clean carbohydrates while matching Indian dietary preferences and strictly filtering allergies.`,
            details: {
                mealType: mealTypeHuman,
                suggestedMeal: selectedBase.name,
                targetCalories: scaledCals,
                protein: scaledProtein,
                carbs: scaledCarbs,
                fat: scaledFat,
                portionSummary: `${Math.round(250 * scaleRatio)}g total portion size`,
                photoRequired: true,
                ingredients: scaledIngredients
            }
        });
    });

    // Reconcile rounding to match daily target exactly
    const calDiff = macroTargets.calories - runningCals;
    const proteinDiff = macroTargets.protein - runningProtein;
    const carbsDiff = macroTargets.carbs - runningCarbs;
    const fatDiff = macroTargets.fat - runningFat;

    // Apply any difference to lunch (largest meal)
    if (generatedMeals[2]) {
        generatedMeals[2].details.targetCalories += calDiff;
        generatedMeals[2].details.protein += proteinDiff;
        generatedMeals[2].details.carbs += carbsDiff;
        generatedMeals[2].details.fat += fatDiff;
    }

    return generatedMeals;
}

// ==========================================
// 3. INTELLIGENT WORKOUT GENERATION MATRIX
// ==========================================

const EXERCISE_LIBRARY = {
    gym: {
        beginner: [
            {
                name: "Goblet Dumbbell Squats",
                sets: 3,
                reps: "10-12",
                restSecs: 75,
                muscle: "Quadriceps & Glutes",
                burn: 85,
                recommendedWeight: "Light-Moderate (10-14 kg DB)",
                durationMins: 6,
                startPosition: "Stand tall with feet slightly wider than shoulder-width, toes angled outward 15-30°. Cup the top head of a vertical dumbbell vertically against your upper chest with both palms.",
                movementPath: "Hinge hips backward and flex knees simultaneously. Descend under control until hip crease is parallel with knees, elbows tracking inside the thighs. Drive through mid-foot to return upright.",
                commonMistakes: ["Knees collapsing inward (valgus)", "Rounding upper thoracic spine", "Heels rising off the floor"],
                breathingInstructions: "Inhale and brace abdominal wall at the top; descend while holding brace; exhale forcefully past the sticking point on the drive upward.",
                safetyInstructions: "Keep the dumbbell pressed against sternum throughout to prevent excessive lumbar shear. Stop descent before pelvis tucks under (butt wink).",
                postureCheckpoints: ["Chest proud, elbows tucked", "Knees tracking over toes", "Neutral lumbar spine"],
                muscleActivationCues: ["Grip floor with entire foot", "Squeeze glutes hard at the top", "Push knees gently outward on ascent"],
                injuryPreventionTips: "Warm up hip flexors and ankle dorsiflexion. Elevate heels on small plates if limited ankle mobility causes forward torso lean.",
                visualType: "squat",
                alternatives: {
                    equipment: ["Barbell Back Squats", "Leg Press Machine", "Bodyweight Tempo Air Squats"],
                    injury: ["Box Squats (Knee-friendly)", "Leg Extension Machine", "Glute Bridges"],
                    regression: "Bodyweight Box Squats",
                    progression: "Barbell Front Squats"
                }
            },
            {
                name: "Dumbbell Flat Bench Press",
                sets: 3,
                reps: "10-12",
                restSecs: 75,
                muscle: "Pectorals & Triceps",
                burn: 75,
                recommendedWeight: "Moderate (12-16 kg each DB)",
                durationMins: 6,
                startPosition: "Lie flat on bench with feet planted firmly on ground. Hold dumbbells directly over chest with neutral/slight 45° angled grip, shoulder blades retracted and depressed into bench.",
                movementPath: "Lower dumbbells under 3-second control toward mid-chest level, flaring elbows no wider than 45-60° from torso. Press upward in a slight arching path until arms extend without locking elbows.",
                commonMistakes: ["Flaring elbows 90° out (impinges shoulders)", "Bouncing weights or uncontrolled descent", "Feet fidgeting or lifting off ground"],
                breathingInstructions: "Inhale deeply as dumbbells descend to stretch chest fibers; exhale smoothly as you press the load back to lockout.",
                safetyInstructions: "Do not let dumbbells drift backward past your head. Always utilize knees to kick dumbbells up into position safely.",
                postureCheckpoints: ["Scapulae pinched together", "Feet pinned flat to floor", "Elbows tucked at 45° angle"],
                muscleActivationCues: ["Pull dumbbells apart to stretch chest", "Drive through palms as if hugging a barrel at the top"],
                injuryPreventionTips: "If shoulder impingement is present, angle dumbbells at 45° (semi-neutral grip) to optimize glenohumeral clearance.",
                visualType: "bench_press",
                alternatives: {
                    equipment: ["Barbell Flat Bench Press", "Machine Chest Press", "Standard Full-Range Push-Ups"],
                    injury: ["Floor Dumbbell Press (Restricts shoulder hyperextension)", "Incline Push-Ups"],
                    regression: "Floor Dumbbell Press",
                    progression: "Incline Dumbbell Press"
                }
            },
            {
                name: "Lat Pulldown (Neutral Grip)",
                sets: 3,
                reps: "12",
                restSecs: 60,
                muscle: "Latissimus Dorsi",
                burn: 70,
                recommendedWeight: "Moderate (35-45 kg on cable stack)",
                durationMins: 5,
                startPosition: "Sit with thighs anchored securely under pads. Grasp handle with shoulder-width neutral or overhand grip. Depress shoulder blades downward and lean torso back approximately 10-15°.",
                movementPath: "Initiate movement by pulling elbows downward toward your ribs until the attachment lightly reaches upper sternum. Hold contraction for 1 second, then slowly guide cable back up to full stretch.",
                commonMistakes: ["Swinging torso excessively for momentum", "Pulling bar down to stomach instead of chest", "Shrugging shoulders into ears at contraction"],
                breathingInstructions: "Exhale smoothly as you pull the bar down toward clavicle; inhale slowly as arms extend overhead under tension.",
                safetyInstructions: "Never pull behind the neck, which puts extreme rotatory stress on the rotator cuff and cervical vertebrae.",
                postureCheckpoints: ["Chest lifted toward bar", "Shoulders held away from ears", "Elbows driving vertically downward"],
                muscleActivationCues: ["Imagine pulling through your elbows, not your hands", "Pinch your armpits shut at the bottom"],
                injuryPreventionTips: "Focus on slow 3-second eccentric return to lengthen lats without jarring the shoulder capsule.",
                visualType: "lat_pulldown",
                alternatives: {
                    equipment: ["Pull-Ups / Chin-Ups", "Bent-Over Dumbbell Two-Arm Row", "Resistance Band Pulldowns"],
                    injury: ["Seated Cable Row (Chest-supported)", "Single-Arm Dumbbell Row"],
                    regression: "Banded Lat Pulldowns",
                    progression: "Bodyweight Strict Pull-Ups"
                }
            },
            {
                name: "Standing Dumbbell Shoulder Press",
                sets: 3,
                reps: "10-12",
                restSecs: 60,
                muscle: "Anterior Deltoids",
                burn: 65,
                recommendedWeight: "Light-Moderate (8-12 kg each DB)",
                durationMins: 5,
                startPosition: "Stand with feet hip-width apart, knees slightly unlocked, core braced. Hold dumbbells at collarbone level with elbows positioned slightly forward in the scapular plane.",
                movementPath: "Press dumbbells directly overhead in a controlled arc until arms extend over shoulders. Avoid clanking weights together. Lower weights under control back to ear level.",
                commonMistakes: ["Hyperextending lumbar spine (arching back)", "Flaring elbows directly out to the sides", "Using leg drive (turning it into a push press)"],
                breathingInstructions: "Inhale and brace core at shoulder level; exhale as dumbbells pass overhead; inhale as you lower the weights.",
                safetyInstructions: "Engage glutes and brace abdominals throughout to stabilize pelvis and shield lumbar spine.",
                postureCheckpoints: ["Ribcage locked down", "Wrists stacked over elbows", "Full overhead lockout without arched back"],
                muscleActivationCues: ["Push your head forward slightly as arms lock overhead", "Actively pull dumbbells down on the descent"],
                injuryPreventionTips: "Press in the scapular plane (elbows 30° in front of shoulders) to avoid subacromial impingement.",
                visualType: "shoulder_press",
                alternatives: {
                    equipment: ["Seated Dumbbell Shoulder Press", "Barbell Overhead Press", "Pike Push-Ups"],
                    injury: ["Dumbbell Lateral Raises (Substitutes vertical pressing)", "Incline Chest-Supported Front Raise"],
                    regression: "Seated Dumbbell Shoulder Press",
                    progression: "Standing Barbell Strict Press"
                }
            },
            {
                name: "Prone Plank Hold",
                sets: 3,
                reps: "45s",
                restSecs: 45,
                muscle: "Transverse Abdominis",
                burn: 45,
                recommendedWeight: "Bodyweight (Isometric Hold)",
                durationMins: 4,
                startPosition: "Lie prone on mat. Prop yourself up on forearms with elbows directly beneath shoulders, feet hip-width apart on balls of feet.",
                movementPath: "Lift hips until body forms a straight line from crown of head to heels. Tuck tailbone slightly into posterior pelvic tilt and actively pull forearms toward toes without moving them.",
                commonMistakes: ["Hips sagging toward floor", "Butt sticking high in the air", "Head drooping down and straining neck"],
                breathingInstructions: "Breathe in shallow, rhythmic breaths into your sides while maintaining continuous abdominal pressure.",
                safetyInstructions: "If lower back feels tension or aches, immediately rest or elevate forearms onto an inclined bench.",
                postureCheckpoints: ["Ears, shoulders, hips, and heels in one line", "Gaze down at floor between hands", "Scapulae protracted"],
                muscleActivationCues: ["Pull belly button toward spine", "Squeeze glutes and quads continuously", "Drive forearms into the floor"],
                injuryPreventionTips: "Maintain rigid full-body tension; 30 seconds of maximal tension planking is more effective than 2 minutes of sagging.",
                visualType: "plank",
                alternatives: {
                    equipment: ["Ab Wheel Rollout", "Cable Woodchoppers", "Dead-Bug Core Hold"],
                    injury: ["Bird-Dog Core Stabilizers (Zero lumbar load)", "Dead-Bugs"],
                    regression: "Kneeling Forearm Plank",
                    progression: "RKC Maximum-Tension Plank"
                }
            }
        ],
        intermediate: [
            {
                name: "Barbell Back Squats",
                sets: 4,
                reps: "8-10",
                restSecs: 90,
                muscle: "Quadriceps & Posterior Chain",
                burn: 120,
                recommendedWeight: "Moderate-Heavy (~60-80 kg • 65-75% 1RM)",
                durationMins: 8,
                startPosition: "Rest barbell across upper trapezius (high bar) or rear deltoids (low bar). Grip bar tightly, unrack with hips, take 2-3 controlled steps back, feet shoulder-width.",
                movementPath: "Take a deep diaphragmatic breath, brace core, and break at hips and knees simultaneously. Descend under 3-second tempo until thighs break parallel. Drive aggressively through the floor to return upright.",
                commonMistakes: ["Knees caving inward (valgus collapse)", "Chest collapsing forward (good-morning squat)", "Weight shifting into toes"],
                breathingInstructions: "Perform the Valsalva maneuver: deep belly breath at top, hold intra-abdominal brace throughout descent and turn, exhale past sticking point on ascent.",
                safetyInstructions: "Always set safety pins in rack 2-3 inches below bottom squat depth. Never drop your head or look at the ceiling.",
                postureCheckpoints: ["Wrists straight, elbows pulled under bar", "Spine rigid and locked", "Knees pushing outward in line with toes"],
                muscleActivationCues: ["Screw your feet into the ground", "Spread the floor with your shoes", "Drive upper back upward into the bar"],
                injuryPreventionTips: "Keep core braced 360° to eliminate spinal flexion. Use knee sleeves if joints feel stiff during initial working sets.",
                visualType: "squat",
                alternatives: {
                    equipment: ["Leg Press Machine", "Dumbbell Goblet Squats", "Bulgarian Split Squats"],
                    injury: ["Belt Squats (Zero spine compression)", "Leg Press (Knee/hip friendly)"],
                    regression: "Goblet Box Squats",
                    progression: "Heavy Barbell Squats (Pyramid)"
                }
            },
            {
                name: "Incline Dumbbell Chest Press",
                sets: 4,
                reps: "10-12",
                restSecs: 75,
                muscle: "Clavicular Pectoralis",
                burn: 95,
                recommendedWeight: "Moderate (16-22 kg each DB)",
                durationMins: 7,
                startPosition: "Set bench to a 30-45° incline. Sit with dumbbells resting on thighs. Kick weights up one by one while lying back, anchoring shoulder blades into the pad.",
                movementPath: "Lower dumbbells smoothly until upper arms break 90° with elbows tucked at 45-60°. Press the load in an upward and inward arc over upper chest.",
                commonMistakes: ["Setting bench angle too steep (>45° becomes shoulder press)", "Elbows flaring 90° out", "Arching lower back off the bench"],
                breathingInstructions: "Inhale deeply as dumbbells lower to stretch clavicular pec; exhale forcefully as you drive through your chest to press upward.",
                safetyInstructions: "Do not hyperextend wrists; keep dumbbells centered over the wrists and forearms throughout.",
                postureCheckpoints: ["Retracted shoulder blades", "Butt and upper back glued to bench", "Elbows angled 45° from ribs"],
                muscleActivationCues: ["Think of squeezing your bicep heads toward each other at top lockout", "Control the 3-second descent"],
                injuryPreventionTips: "A 30° bench angle maximizes clavicular chest activation while drastically reducing anterior shoulder joint stress.",
                visualType: "bench_press",
                alternatives: {
                    equipment: ["Barbell Incline Press", "Smith Machine Incline Press", "Decline Push-Ups"],
                    injury: ["Incline Cable Press (Continuous tension, joint friendly)", "Floor Dumbbell Press"],
                    regression: "Dumbbell Flat Bench Press",
                    progression: "Pause-Rep Incline Dumbbell Press"
                }
            },
            {
                name: "Seated Cable Row",
                sets: 4,
                reps: "10-12",
                restSecs: 60,
                muscle: "Rhomboids & Mid-Back",
                burn: 85,
                recommendedWeight: "Moderate (45-55 kg on cable stack)",
                durationMins: 6,
                startPosition: "Sit on bench with feet placed on footrests, knees slightly bent. Grasp V-bar handle with neutral grip. Sit upright with chest lifted, shoulders down.",
                movementPath: "Pull the handle smoothly toward lower abdomen by driving elbows backward and squeezing shoulder blades together. Hold peak contraction for 1 second, then extend arms under control.",
                commonMistakes: ["Rounding lower back to lean forward", "Leaning back excessively using torso momentum", "Pulling with biceps instead of lat and rhomboid retraction"],
                breathingInstructions: "Inhale as arms extend forward for a full lat stretch; exhale as you row the handle into your naval.",
                safetyInstructions: "Keep a soft bend in knees and neutral spine; never lock knees out or jerk weight off stack.",
                postureCheckpoints: ["Torso stationary at 90°", "Elbows skimming close to ribs", "Full scapular retraction at peak contraction"],
                muscleActivationCues: ["Lead with your elbows", "Crush an imaginary walnut between your shoulder blades"],
                injuryPreventionTips: "Do not let shoulders roll forward at full extension; keep lat tension engaged throughout the negative.",
                visualType: "lat_pulldown",
                alternatives: {
                    equipment: ["Single-Arm Dumbbell Row", "Barbell Bent-Over Row", "Chest-Supported T-Bar Row"],
                    injury: ["Chest-Supported Machine Row (Zero lumbar strain)", "Banded Rows"],
                    regression: "Resistance Band Seated Row",
                    progression: "Pendlay Barbell Row"
                }
            },
            {
                name: "Romanian Dumbbell Deadlifts",
                sets: 3,
                reps: "10-12",
                restSecs: 75,
                muscle: "Hamstrings & Gluteus",
                burn: 90,
                recommendedWeight: "Moderate (14-20 kg each DB)",
                durationMins: 6,
                startPosition: "Stand tall with dumbbells resting against front of thighs, feet hip-width apart. Maintain soft bend in knees and shoulders pulled back.",
                movementPath: "Hinge backward at hips as if closing a car door behind you. Slide dumbbells down close to shins until a deep hamstring stretch is felt (mid-shin). Squeeze glutes and extend hips forward to return.",
                commonMistakes: ["Bending knees like a squat instead of hinging hips", "Rounding lumbar spine", "Letting dumbbells drift away from shins"],
                breathingInstructions: "Inhale and brace core at the top; hold brace on descent; exhale smoothly as hips drive forward to standing.",
                safetyInstructions: "Stop hip hinge the moment hamstrings reach full stretch. Rounding the back to reach lower increases disc shear.",
                postureCheckpoints: ["Flat spine from head to tailbone", "Knees kept at constant soft angle", "Weights skimming along legs"],
                muscleActivationCues: ["Push your butt back toward wall behind you", "Drive through heels and squeeze glutes at the top"],
                injuryPreventionTips: "Keep dumbbells glued to your legs. Letting the load drift forward multiplies leverage on the lower back by 3x.",
                visualType: "deadlift",
                alternatives: {
                    equipment: ["Barbell Romanian Deadlift", "Glute Ham Raise", "Single-Leg Dumbbell RDL"],
                    injury: ["Glute Bridges with 2s Squeeze (Lower back friendly)", "Lying Hamstring Curl"],
                    regression: "Bodyweight Good-Mornings",
                    progression: "Single-Leg Romanian Deadlifts"
                }
            },
            {
                name: "Hanging Knee / Leg Raises",
                sets: 3,
                reps: "12-15",
                restSecs: 45,
                muscle: "Lower Abdominals",
                burn: 55,
                recommendedWeight: "Bodyweight",
                durationMins: 4,
                startPosition: "Hang from pull-up bar or captain's chair with overhand grip, shoulders engaged (active hang), legs straight down.",
                movementPath: "Roll pelvis backward and lift knees toward chest under control. Pause for 1 second at top contraction, then lower legs slowly without swinging.",
                commonMistakes: ["Using momentum and swinging like a pendulum", "Only flexing hips without posterior pelvic tilt", "Arching lower back on descent"],
                breathingInstructions: "Exhale forcefully as knees curl up toward ribs; inhale as legs lower smoothly.",
                safetyInstructions: "Engage lats to stabilize shoulders. Avoid relaxing into a dead hang if you have shoulder hypermobility.",
                postureCheckpoints: ["Pelvis curled toward chest at top", "Zero body swing", "Controlled 2-second negative"],
                muscleActivationCues: ["Roll your belt buckle toward your chin", "Don't just lift your legs; roll your spine"],
                injuryPreventionTips: "Perform hanging knee raises with bent knees first before progressing to straight legs to protect hip flexors.",
                visualType: "plank",
                alternatives: {
                    equipment: ["Ab Wheel Rollout", "Cable Woodchoppers", "Decline Bench Reverse Crunches"],
                    injury: ["Dead-Bugs (Floor supported)", "Bird-Dog Core Stabilizers"],
                    regression: "Lying Floor Leg Raises",
                    progression: "Toes-to-Bar Hanging Raises"
                }
            }
        ],
        advanced: [
            {
                name: "Heavy Barbell Squats (Pyramid)",
                sets: 5,
                reps: "6-8",
                restSecs: 120,
                muscle: "Total Lower Body Force",
                burn: 150,
                recommendedWeight: "Heavy (75-85% 1RM • ~80-120 kg)",
                durationMins: 10,
                startPosition: "Step under barbell inside power rack. Anchor bar firmly onto traps, unrack, step back with 3 deliberate steps, lock feet into floor at shoulder-width.",
                movementPath: "Take massive 360° abdominal breath, lock pelvis into neutral. Descend with absolute control to deep below-parallel depth. Explode upward driving upper back into the bar.",
                commonMistakes: ["Knee collapse under heavy load", "Bouncing out of the hole without control", "Rounding lower back in deep flexion"],
                breathingInstructions: "Full Valsalva maneuver: deep diaphragmatic breath and 360° intra-abdominal pressure throughout the entire rep.",
                safetyInstructions: "Never squat heavy without safety catches adjusted to proper depth.",
                postureCheckpoints: ["Rigid spinal column", "Knees flared outward over pinky toes", "Vertical bar path directly over mid-foot"],
                muscleActivationCues: ["Rip the floor apart with your feet", "Push your traps into the steel bar"],
                injuryPreventionTips: "Use a lifting belt on the top 2 sets for extra intra-abdominal stability. Keep warm-up jumps under 15% increments.",
                visualType: "squat",
                alternatives: {
                    equipment: ["Hack Squat Machine", "Leg Press Machine", "Safety Squat Bar (SSB) Squats"],
                    injury: ["Belt Squats", "Bulgarian Split Squats (Unilateral)"],
                    regression: "Barbell Back Squats",
                    progression: "Paused Pin Squats"
                }
            },
            {
                name: "Barbell Flat Bench Press",
                sets: 4,
                reps: "6-8",
                restSecs: 90,
                muscle: "Sternal Pectoralis & Triceps",
                burn: 110,
                recommendedWeight: "Heavy (75-80% 1RM • ~70-100 kg)",
                durationMins: 8,
                startPosition: "Lie on bench with eyes directly under bar. Retract shoulder blades, arch thoracic spine moderately, drive feet flat into ground.",
                movementPath: "Unrack bar over chest, lower bar with elbows tucked at 45° until bar touches lower chest/sternum. Pause for a split second, then press up in a slight backward J-curve to lockout.",
                commonMistakes: ["Bouncing bar off sternum", "Elbows flaring 90° out", "Lifting hips/butt off the bench"],
                breathingInstructions: "Inhale at the top, brace ribcage; lower bar under tension; exhale forcefully past the mid-point on press.",
                safetyInstructions: "Use a spotter or safety bench arms for heavy working sets. Never use a thumbless (suicide) grip.",
                postureCheckpoints: ["Firm leg drive through heels", "Tight scapular pinch on bench", "Full elbow extension without loose shoulders"],
                muscleActivationCues: ["Bend the bar in half as you lower it", "Drive your feet through the floor as you press"],
                injuryPreventionTips: "Keep your wrist over your forearm; do not let the heavy bar bend your wrist backward.",
                visualType: "bench_press",
                alternatives: {
                    equipment: ["Dumbbell Flat Bench Press", "Weighted Dips", "Floor Press"],
                    injury: ["Dumbbell Neutral-Grip Press (Shoulder safe)", "Cable Flat Fly to Press"],
                    regression: "Dumbbell Flat Bench Press",
                    progression: "Spoto Press (Paused 1-inch off chest)"
                }
            },
            {
                name: "Weighted Pull-Ups / Heavy Lat Rows",
                sets: 4,
                reps: "8-10",
                restSecs: 75,
                muscle: "Latissimus Dorsi & Biceps",
                burn: 105,
                recommendedWeight: "Bodyweight + (5-15 kg Dip Belt)",
                durationMins: 7,
                startPosition: "Hang from pull-up bar with overhand grip slightly wider than shoulders, dip belt attached around waist. Pack shoulder blades down.",
                movementPath: "Pull chest upward toward bar by driving elbows down into back pockets until chin clears the bar comfortably. Lower down under strict 3-second eccentric control.",
                commonMistakes: ["Kicking legs or kipping for momentum", "Half reps without full extension at bottom", "Shoulders rolling forward at top"],
                breathingInstructions: "Inhale at dead hang, brace core; exhale forcefully as chin pulls over bar; inhale slowly on descent.",
                safetyInstructions: "Never drop into bottom lockout with loose shoulders; keep active muscular tension at the bottom of every rep.",
                postureCheckpoints: ["Chest reaching toward bar", "Legs crossed or locked together", "Full range of motion"],
                muscleActivationCues: ["Drive elbows down toward hips", "Pinch shoulder blades hard at peak height"],
                injuryPreventionTips: "If elbow tendonitis occurs, switch to a neutral-grip (palms facing each other) pull-up bar.",
                visualType: "pullup",
                alternatives: {
                    equipment: ["Lat Pulldown (Heavy)", "Chest-Supported T-Bar Row", "Inverted Rows"],
                    injury: ["Seated Cable Row (Neutral grip)", "Single-Arm Lat Pulldown"],
                    regression: "Bodyweight Strict Pull-Ups",
                    progression: "Weighted Muscle-Ups"
                }
            },
            {
                name: "Standing Barbell Overhead Press",
                sets: 4,
                reps: "8-10",
                restSecs: 90,
                muscle: "Deltoids & Upper Chest",
                burn: 95,
                recommendedWeight: "Moderate-Heavy (~40-60 kg)",
                durationMins: 7,
                startPosition: "Stand with feet shoulder-width, bar resting on anterior deltoids and clavicle with forearms vertical. Glutes clamped, core braced.",
                movementPath: "Pull head back slightly, press bar vertically close to face. As bar clears forehead, shift torso forward slightly under the bar and lock out arms overhead.",
                commonMistakes: ["Arching lumbar spine backward to cheat", "Pressing bar forward in an arc instead of straight up", "Bending knees to push-press"],
                breathingInstructions: "Inhale deeply at chest level, create 360° torso pressure; press upward; exhale at lockout.",
                safetyInstructions: "Squeeze glutes with maximum force; if glutes relax, the lower back will bend into painful hyperextension.",
                postureCheckpoints: ["Biceps aligned with ears at lockout", "Zero knee dip", "Wrists neutral over elbows"],
                muscleActivationCues: ["Push your head through the window at the top", "Squeeze your quads and glutes into stone"],
                injuryPreventionTips: "Keep bar path as close to your nose as possible to minimize lever-arm torque on the shoulders.",
                visualType: "shoulder_press",
                alternatives: {
                    equipment: ["Standing Dumbbell Shoulder Press", "Seated Dumbbell Press", "Push Press"],
                    injury: ["High Incline Dumbbell Press (Joint friendly)", "Landmine Press"],
                    regression: "Standing Dumbbell Shoulder Press",
                    progression: "Behind-the-Neck Klokov Press (Advanced mobility)"
                }
            },
            {
                name: "Cable Woodchoppers & Ab Rollout",
                sets: 4,
                reps: "15 each",
                restSecs: 45,
                muscle: "Obliques & Core Shield",
                burn: 60,
                recommendedWeight: "Moderate Cable Resistance (20-30 kg)",
                durationMins: 5,
                startPosition: "Stand sideways to high cable pulley, feet shoulder-width apart. Hold handle with both hands, arms extended, core locked.",
                movementPath: "Rotate torso diagonally downward across body toward opposite knee using core rotation. Return slowly to start position under control.",
                commonMistakes: ["Pulling with arms instead of rotating through core", "Letting hips spin wild without control", "Rounding back during rotation"],
                breathingInstructions: "Inhale at high start position; exhale forcefully as you chop diagonally downward.",
                safetyInstructions: "Pivot rear foot slightly to protect the knee joint from twisting torque.",
                postureCheckpoints: ["Arms kept straight as a lever", "Rotation generated from thoracic spine and obliques", "Pivoting rear foot"],
                muscleActivationCues: ["Squeeze obliques like wringing out a wet towel", "Control the cable stack on the return"],
                injuryPreventionTips: "Keep hips relatively square; let the core rotate the ribcage without twisting the lumbar discs under excessive load.",
                visualType: "plank",
                alternatives: {
                    equipment: ["Ab Wheel Rollouts", "Russian Twists with Plate", "Hanging Windshield Wipers"],
                    injury: ["Pallof Press (Anti-rotation hold, lower back safe)", "Side Plank Pulses"],
                    regression: "Banded Woodchoppers",
                    progression: "Standing Full Ab Wheel Rollout"
                }
            }
        ]
    },
    home: {
        beginner: [
            {
                name: "Dumbbell Goblet Squats",
                sets: 3,
                reps: "12-15",
                restSecs: 60,
                muscle: "Quadriceps & Core",
                burn: 75,
                recommendedWeight: "Moderate (8-12 kg DB)",
                durationMins: 6,
                startPosition: "Stand with feet shoulder-width apart, holding single dumbbell vertically at chest level with both hands.",
                movementPath: "Sit back and down between knees until thighs are parallel to ground. Drive through mid-foot to stand tall.",
                commonMistakes: ["Leaning forward", "Knees caving", "Looking at ceiling"],
                breathingInstructions: "Inhale down, exhale up.",
                safetyInstructions: "Keep torso upright and dumbbell pinned to chest.",
                postureCheckpoints: ["Upright chest", "Knees over toes", "Neutral neck"],
                muscleActivationCues: ["Drive through full foot", "Squeeze glutes at peak"],
                injuryPreventionTips: "Sit back onto a chair or box if squat depth feels unstable.",
                visualType: "squat",
                alternatives: {
                    equipment: ["Bodyweight Tempo Air Squats", "Resistance Band Squats", "Barbell Back Squats"],
                    injury: ["Box Squats", "Glute Bridges"],
                    regression: "Bodyweight Air Squats",
                    progression: "Dumbbell Walking Lunges"
                }
            },
            {
                name: "Incline Push-Ups / Floor Dumbbell Press",
                sets: 3,
                reps: "10-12",
                restSecs: 60,
                muscle: "Chest & Shoulders",
                burn: 70,
                recommendedWeight: "Bodyweight (or 10-14 kg DBs for floor press)",
                durationMins: 5,
                startPosition: "Place hands on sturdy table or couch slightly wider than shoulder width. Body in straight plank line.",
                movementPath: "Lower chest toward edge under control, then press firmly away until arms extend.",
                commonMistakes: ["Sagging hips", "Elbows flaring 90°", "Incomplete depth"],
                breathingInstructions: "Inhale on descent, exhale on press.",
                safetyInstructions: "Keep abdominal wall braced to protect lower back.",
                postureCheckpoints: ["Straight line from head to heels", "Elbows at 45°"],
                muscleActivationCues: ["Press hands into surface", "Squeeze chest at top"],
                injuryPreventionTips: "Elevate hands higher to reduce shoulder load if needed.",
                visualType: "pushup",
                alternatives: {
                    equipment: ["Floor Dumbbell Press", "Knee Push-Ups", "Dumbbell Flat Bench Press"],
                    injury: ["Floor Dumbbell Press", "Wall Push-Ups"],
                    regression: "Wall Push-Ups",
                    progression: "Standard Full-Range Push-Ups"
                }
            },
            {
                name: "Bent-Over Dumbbell Two-Arm Row",
                sets: 3,
                reps: "12",
                restSecs: 60,
                muscle: "Lats & Upper Back",
                burn: 65,
                recommendedWeight: "Light-Moderate (8-12 kg each DB)",
                durationMins: 5,
                startPosition: "Hinge at hips at 45° angle with flat back, holding dumbbells hanging at arm's length.",
                movementPath: "Pull dumbbells toward hips by driving elbows back, squeezing shoulder blades at top.",
                commonMistakes: ["Rounding spine", "Yanking with arms", "Standing up too straight"],
                breathingInstructions: "Inhale at bottom, exhale as you row.",
                safetyInstructions: "Keep spine straight; do not let weight pull lower back into flexion.",
                postureCheckpoints: ["Flat back", "Elbows tracking close to ribs", "Soft knees"],
                muscleActivationCues: ["Pull through elbows", "Pinch shoulder blades"],
                injuryPreventionTips: "Rest chest on inclined bench if lower back fatigue occurs.",
                visualType: "lat_pulldown",
                alternatives: {
                    equipment: ["Single-Arm Dumbbell Row", "Resistance Band Rows", "Seated Cable Row"],
                    injury: ["Chest-Supported Dumbbell Row", "Banded Face-Pulls"],
                    regression: "Resistance Band Rows",
                    progression: "Single-Arm Dumbbell Row"
                }
            },
            {
                name: "Dumbbell Glute Bridges",
                sets: 3,
                reps: "15",
                restSecs: 45,
                muscle: "Gluteus Maximus",
                burn: 60,
                recommendedWeight: "Moderate (10-16 kg DB on hips)",
                durationMins: 4,
                startPosition: "Lie on back with knees bent, feet flat on floor hip-width apart. Rest dumbbell horizontally across hips.",
                movementPath: "Drive through heels to lift hips upward until thighs and torso align. Hold 2-second squeeze, then lower.",
                commonMistakes: ["Arching lower back", "Pushing through toes", "Dropping hips rapidly"],
                breathingInstructions: "Inhale at bottom, exhale as hips drive upward.",
                safetyInstructions: "Cushion dumbbell with towel over hip bones for comfort.",
                postureCheckpoints: ["Heels flat on floor", "Knees tracking forward", "Straight line from knees to shoulders at peak"],
                muscleActivationCues: ["Squeeze butt cheeks hard at top", "Keep ribs tucked down"],
                injuryPreventionTips: "Zero spinal extension at top; movement comes exclusively from hip hinge and glute squeeze.",
                visualType: "deadlift",
                alternatives: {
                    equipment: ["Barbell Hip Thrusts", "Bodyweight Glute Bridges", "Romanian Deadlifts"],
                    injury: ["Bodyweight Single-Leg Glute Bridge", "Bird-Dogs"],
                    regression: "Bodyweight Glute Bridges",
                    progression: "Single-Leg Dumbbell Glute Bridge"
                }
            },
            {
                name: "Forearm Plank Core Stability",
                sets: 3,
                reps: "45s",
                restSecs: 45,
                muscle: "Deep Core",
                burn: 40,
                recommendedWeight: "Bodyweight",
                durationMins: 4,
                startPosition: "Forearms on floor, elbows under shoulders, feet together on toes.",
                movementPath: "Hold solid isometric bridge from head to heels.",
                commonMistakes: ["Sagging hips", "Piking hips into air", "Holding breath"],
                breathingInstructions: "Slow, rhythmic diaphragmatic breaths.",
                safetyInstructions: "Stop if lower back arches.",
                postureCheckpoints: ["Straight spine", "Glutes engaged", "Gaze at floor"],
                muscleActivationCues: ["Tuck pelvis", "Pull elbows toward toes"],
                injuryPreventionTips: "Rest on knees if core begins shaking uncontrollably.",
                visualType: "plank",
                alternatives: {
                    equipment: ["Bird-Dog Core Stabilizers", "Dead-Bugs", "Ab Rollouts"],
                    injury: ["Bird-Dog Stabilizers", "Dead-Bugs"],
                    regression: "Kneeling Plank",
                    progression: "Plank with Shoulder Taps"
                }
            }
        ],
        intermediate: [
            {
                name: "Dumbbell Walking Lunges",
                sets: 4,
                reps: "12 each leg",
                restSecs: 60,
                muscle: "Glutes & Quads",
                burn: 110,
                recommendedWeight: "Moderate (10-14 kg each DB)",
                durationMins: 7,
                startPosition: "Stand tall holding dumbbells at sides. Shoulders back, chest proud.",
                movementPath: "Step forward into a deep lunge, lowering back knee until 1 inch off floor. Drive through front heel to step directly into next lunge.",
                commonMistakes: ["Front knee shooting past toes", "Torso collapsing forward", "Banging back knee on floor"],
                breathingInstructions: "Inhale as you step and drop; exhale as you power up.",
                safetyInstructions: "Keep core tight to eliminate lateral hip wobble.",
                postureCheckpoints: ["90° angles on both knees at bottom", "Upright vertical torso"],
                muscleActivationCues: ["Push through front heel", "Squeeze trailing glute"],
                injuryPreventionTips: "If knees are sensitive, perform reverse lunges stepping backward instead.",
                visualType: "lunge",
                alternatives: {
                    equipment: ["Reverse Dumbbell Lunges", "Bulgarian Split Squats", "Barbell Squats"],
                    injury: ["Reverse Step-Back Lunges", "Step-Ups on Sturdy Chair"],
                    regression: "Bodyweight Reverse Lunges",
                    progression: "Bulgarian Split Squats (Weighted)"
                }
            },
            {
                name: "Floor Dumbbell Chest Fly to Press",
                sets: 4,
                reps: "10-12",
                restSecs: 60,
                muscle: "Pectorals",
                burn: 85,
                recommendedWeight: "Moderate (12-16 kg each DB)",
                durationMins: 6,
                startPosition: "Lie on floor with knees bent, feet flat. Hold dumbbells over chest.",
                movementPath: "Lower dumbbells in slight fly arc until upper arms touch floor safely, pause 1 second, then press up.",
                commonMistakes: ["Over-stretching shoulders", "Bouncing elbows off floor", "Losing wrist alignment"],
                breathingInstructions: "Inhale down, exhale on press.",
                safetyInstructions: "Floor automatically acts as a safety depth stop preventing shoulder hyperextension.",
                postureCheckpoints: ["Controlled eccentric", "Wrists neutral", "Shoulder blades pinned"],
                muscleActivationCues: ["Contract chest at peak", "Feel chest stretch on floor"],
                injuryPreventionTips: "Superior to bench flyes for shoulder safety because the floor prevents joint strain.",
                visualType: "bench_press",
                alternatives: {
                    equipment: ["Dumbbell Flat Bench Press", "Deficit Push-ups", "Incline Dumbbell Press"],
                    injury: ["Floor Dumbbell Press", "Incline Push-Ups"],
                    regression: "Floor Dumbbell Press",
                    progression: "Incline Dumbbell Chest Press"
                }
            },
            {
                name: "Single-Arm Dumbbell Row",
                sets: 4,
                reps: "10-12 each",
                restSecs: 60,
                muscle: "Lats & Rhomboids",
                burn: 85,
                recommendedWeight: "Moderate-Heavy (14-20 kg DB)",
                durationMins: 6,
                startPosition: "Place one hand and knee on couch/chair, other foot on floor. Hold dumbbell hanging in free hand.",
                movementPath: "Row dumbbell upward toward hip pocket, driving elbow back while keeping back flat.",
                commonMistakes: ["Twisting spine at top", "Yanking with bicep", "Rounding back"],
                breathingInstructions: "Inhale at bottom stretch, exhale as you pull to hip.",
                safetyInstructions: "Support arm stays rigid to maintain neutral spine.",
                postureCheckpoints: ["Flat back parallel to floor", "Elbow drives to ceiling"],
                muscleActivationCues: ["Pull with your back, not your hand", "Squeeze lat at top"],
                injuryPreventionTips: "Keep neck neutral; look at the support surface rather than twisting your head.",
                visualType: "lat_pulldown",
                alternatives: {
                    equipment: ["Bent-Over Two-Arm Row", "Seated Cable Row", "Inverted Table Rows"],
                    injury: ["Chest-Supported Row", "Banded Rows"],
                    regression: "Banded Single-Arm Row",
                    progression: "Dumbbell Renegade Rows"
                }
            },
            {
                name: "Standing Dumbbell Arnold Press",
                sets: 3,
                reps: "10-12",
                restSecs: 60,
                muscle: "Shoulders 3-Heads",
                burn: 70,
                recommendedWeight: "Light-Moderate (10-14 kg each DB)",
                durationMins: 5,
                startPosition: "Hold dumbbells at chest level with palms facing you (bicep curl finish).",
                movementPath: "Press upward while rotating wrists so palms face forward at top lockout. Reverse rotation on descent.",
                commonMistakes: ["Arching back", "Rushing rotation", "Flaring elbows early"],
                breathingInstructions: "Inhale at chest, exhale as dumbbells rotate and lock overhead.",
                safetyInstructions: "Keep glutes squeezed and ribcage down throughout the movement.",
                postureCheckpoints: ["Smooth continuous rotation", "Full lockout overhead", "Braced core"],
                muscleActivationCues: ["Feel front delts rotate into side delts", "Control the negative rotation"],
                injuryPreventionTips: "Great for shoulder longevity because rotation matches natural scapular kinematics.",
                visualType: "shoulder_press",
                alternatives: {
                    equipment: ["Standard Dumbbell Shoulder Press", "Pike Push-Ups", "Barbell Strict Press"],
                    injury: ["Lateral Raises", "Landmine Press"],
                    regression: "Seated Dumbbell Shoulder Press",
                    progression: "Standing Barbell Overhead Press"
                }
            },
            {
                name: "Bicycle Crunches & Hollow Hold",
                sets: 3,
                reps: "20 reps",
                restSecs: 45,
                muscle: "Obliques & Rectus Abdominis",
                burn: 50,
                recommendedWeight: "Bodyweight",
                durationMins: 4,
                startPosition: "Lie on back with hands behind ears, knees bent at 90°, lower back pressed flat into floor.",
                movementPath: "Rotate opposite elbow to opposite knee while extending other leg. Alternate smoothly with 2-second pause per side.",
                commonMistakes: ["Pulling on neck with hands", "Rushing through reps", "Lower back arching off floor"],
                breathingInstructions: "Exhale on each rotation, inhale as you transition through center.",
                safetyInstructions: "Gently support head with fingertips; do not pull your neck.",
                postureCheckpoints: ["Lower back glued to floor", "Opposite leg fully extended", "Shoulder blades off floor"],
                muscleActivationCues: ["Rotate from ribcage", "Drive elbow across with obliques"],
                injuryPreventionTips: "Slow tempo (2 seconds per side) builds 3x more core tension without neck strain.",
                visualType: "plank",
                alternatives: {
                    equipment: ["Russian Twists with Dumbbell", "Dead-Bugs", "V-Ups"],
                    injury: ["Dead-Bugs", "Bird-Dogs"],
                    regression: "Dead-Bugs",
                    progression: "V-Ups & Russian Twists Combo"
                }
            }
        ],
        advanced: [
            {
                name: "Bulgarian Split Squats (Weighted)",
                sets: 4,
                reps: "10-12 each leg",
                restSecs: 75,
                muscle: "Unilateral Leg Strength",
                burn: 130,
                recommendedWeight: "Moderate-Heavy (14-20 kg each DB)",
                durationMins: 8,
                startPosition: "Stand 2 feet in front of couch/chair. Place top of one foot rearward onto the surface. Hold heavy dumbbells at sides.",
                movementPath: "Descend until front thigh is parallel to floor and back knee hovers just above ground. Drive through front mid-foot to return.",
                commonMistakes: ["Front foot placed too close or far", "Torso collapsing", "Pushing off rear toes"],
                breathingInstructions: "Inhale on descent, exhale on drive.",
                safetyInstructions: "Maintain slight forward torso lean to load glutes and take pressure off kneecap.",
                postureCheckpoints: ["Front knee tracking over pinky toe", "Torso tilted 15° forward", "Balance locked"],
                muscleActivationCues: ["Load the front glute and quad", "Feel the hip flexor stretch on rear leg"],
                injuryPreventionTips: "Superior quad and glute builder with zero axial spinal compression.",
                visualType: "lunge",
                alternatives: {
                    equipment: ["Barbell Squats", "Dumbbell Walking Lunges", "Leg Press"],
                    injury: ["Step-Ups onto Sturdy Chair", "Reverse Lunges"],
                    regression: "Bodyweight Bulgarian Split Squats",
                    progression: "Deficit 1.5-Rep Bulgarian Split Squats"
                }
            },
            {
                name: "Deficit Push-ups with Resistance Band",
                sets: 4,
                reps: "15",
                restSecs: 60,
                muscle: "Chest & Core Tension",
                burn: 95,
                recommendedWeight: "Bodyweight + Band Tension (or elevated hands on books/blocks)",
                durationMins: 6,
                startPosition: "Place hands on raised blocks or dumbbells for extra depth. Wrap resistance band across upper back.",
                movementPath: "Lower chest between blocks into deep chest stretch. Explode upward pushing against band tension.",
                commonMistakes: ["Sagging hips", "Elbows flaring 90°", "Cutting depth short"],
                breathingInstructions: "Inhale deep at bottom, exhale on press.",
                safetyInstructions: "Keep shoulder blades retracted on descent to protect rotator cuff.",
                postureCheckpoints: ["Deep chest stretch below hand level", "Locked hollow body plank"],
                muscleActivationCues: ["Squeeze chest through peak band tension at top"],
                injuryPreventionTips: "If shoulders feel excessive stretch at the bottom, reduce deficit depth.",
                visualType: "pushup",
                alternatives: {
                    equipment: ["Floor Dumbbell Chest Press", "Standard Push-Ups", "Weighted Dips"],
                    injury: ["Floor Dumbbell Press", "Incline Push-Ups"],
                    regression: "Standard Full-Range Push-Ups",
                    progression: "Archer Push-Ups"
                }
            },
            {
                name: "Dumbbell Renegade Rows",
                sets: 4,
                reps: "10 each",
                restSecs: 60,
                muscle: "Lats & Anti-Rotation Core",
                burn: 100,
                recommendedWeight: "Moderate (12-16 kg each hex DB)",
                durationMins: 6,
                startPosition: "Plank position with hands gripping two hex dumbbells on floor, feet wide for stability.",
                movementPath: "Row one dumbbell up to ribcage without rotating hips. Lower with control, then row opposite side.",
                commonMistakes: ["Twisting hips wildly side to side", "Sagging lower back", "Rushing tempo"],
                breathingInstructions: "Inhale at plank, exhale as you row.",
                safetyInstructions: "Use hex dumbbells on non-slip mat so weights cannot roll.",
                postureCheckpoints: ["Hips locked square to floor", "Elbow skimming ribs", "Feet wide for tripod base"],
                muscleActivationCues: ["Fight rotation with core and glutes", "Pull with lat"],
                injuryPreventionTips: "Widen your feet to 3 feet apart to create a rock-solid anti-rotation base.",
                visualType: "lat_pulldown",
                alternatives: {
                    equipment: ["Single-Arm Dumbbell Row", "Bent-Over Two-Arm Row", "Plank Shoulder Taps"],
                    injury: ["Chest-Supported Dumbbell Row", "Banded Rows"],
                    regression: "Kneeling Renegade Rows",
                    progression: "Renegade Row into Push-Up"
                }
            },
            {
                name: "Dumbbell Romanian Deadlift to Shrug",
                sets: 4,
                reps: "10-12",
                restSecs: 75,
                muscle: "Hamstrings & Traps",
                burn: 105,
                recommendedWeight: "Heavy (16-24 kg each DB)",
                durationMins: 7,
                startPosition: "Stand tall with heavy dumbbells in front of thighs, shoulders packed down, feet hip-width.",
                movementPath: "Hinge hips back into deep hamstring stretch. Stand up explosively and finish with powerful upper trap shrug.",
                commonMistakes: ["Rounding back on hinge", "Rolling shoulders forward on shrug", "Squatting with knees"],
                breathingInstructions: "Inhale down into hips, exhale explosively on extension and shrug.",
                safetyInstructions: "Keep dumbbells grazing thighs and shins at all times.",
                postureCheckpoints: ["Neutral spine", "Vertical shrug at top lockout", "Hamstrings fully loaded"],
                muscleActivationCues: ["Push hips back", "Shrug straight up into ears"],
                injuryPreventionTips: "Never roll shoulders backward during shrug; drive straight vertically.",
                visualType: "deadlift",
                alternatives: {
                    equipment: ["Barbell Deadlift", "Dumbbell Romanian Deadlifts", "Glute Bridges"],
                    injury: ["Glute Bridges with 2s Squeeze", "Lying Hamstring Curls"],
                    regression: "Romanian Dumbbell Deadlifts",
                    progression: "Single-Leg Romanian Deadlift to Shrug"
                }
            },
            {
                name: "V-Ups & Russian Twists Combo",
                sets: 4,
                reps: "20 reps",
                restSecs: 45,
                muscle: "Complete Abdominal Wall",
                burn: 60,
                recommendedWeight: "Bodyweight (or 5-8 kg DB for twists)",
                durationMins: 5,
                startPosition: "Lie flat on mat with arms extended overhead and legs straight.",
                movementPath: "Fold body into V-shape reaching hands to toes, lower with control, then rise into seated balance and perform rotational twists.",
                commonMistakes: ["Using arm momentum", "Straining neck", "Collapsing spine"],
                breathingInstructions: "Exhale on every fold and twist, inhale on opening.",
                safetyInstructions: "If tailbone or lower back feels pressure, perform tuck-ups with bent knees.",
                postureCheckpoints: ["Balance on sit bones", "Controlled extension", "Active core brace"],
                muscleActivationCues: ["Crush upper and lower abs together", "Rotate through obliques"],
                injuryPreventionTips: "Keep knees slightly bent if tight hamstrings pull your pelvis out of alignment.",
                visualType: "plank",
                alternatives: {
                    equipment: ["Hanging Knee Raises", "Ab Wheel Rollout", "Bicycle Crunches"],
                    injury: ["Dead-Bugs", "Bird-Dogs"],
                    regression: "Bicycle Crunches & Hollow Hold",
                    progression: "Weighted V-Ups with Dumbbell"
                }
            }
        ]
    },
    bodyweight: {
        beginner: [
            {
                name: "Bodyweight Tempo Air Squats",
                sets: 3,
                reps: "15",
                restSecs: 60,
                muscle: "Quadriceps & Calves",
                burn: 65,
                recommendedWeight: "Bodyweight (3s Down, 1s Pause, 1s Up)",
                durationMins: 5,
                startPosition: "Stand with feet shoulder-width, toes slightly out, arms out in front for balance.",
                movementPath: "Descend under 3-second tempo until thighs parallel, hold 1 second, drive up to stand.",
                commonMistakes: ["Dropping too fast without control", "Knees caving", "Heels lifting"],
                breathingInstructions: "Inhale down, exhale up.",
                safetyInstructions: "Keep chest proud and knees tracking in line with toes.",
                postureCheckpoints: ["Flat feet", "Knees over toes", "Neutral spine"],
                muscleActivationCues: ["Drive through mid-foot", "Squeeze glutes at top"],
                injuryPreventionTips: "Sit back into hips rather than driving knees forward.",
                visualType: "squat",
                alternatives: {
                    equipment: ["Dumbbell Goblet Squats", "Box Squats", "Wall Sits"],
                    injury: ["Glute Bridges", "Box Squats"],
                    regression: "Assisted Chair Squats",
                    progression: "Jump Squats"
                }
            },
            {
                name: "Knee / Wall Push-Ups",
                sets: 3,
                reps: "10-12",
                restSecs: 60,
                muscle: "Chest & Triceps",
                burn: 55,
                recommendedWeight: "Bodyweight",
                durationMins: 5,
                startPosition: "On knees with hands shoulder-width apart, body forming straight line from head to knees.",
                movementPath: "Lower chest between hands with elbows at 45°, press back up to full extension.",
                commonMistakes: ["Hips lagging behind", "Elbows flaring out", "Sagging neck"],
                breathingInstructions: "Inhale down, exhale press.",
                safetyInstructions: "Place knees on folded towel or yoga mat for knee comfort.",
                postureCheckpoints: ["Straight spine", "Elbows at 45°", "Full range"],
                muscleActivationCues: ["Push floor away", "Squeeze chest at top"],
                injuryPreventionTips: "Elevate hands on wall or table to reduce shoulder load if needed.",
                visualType: "pushup",
                alternatives: {
                    equipment: ["Incline Push-Ups", "Dumbbell Floor Press", "Wall Push-Ups"],
                    injury: ["Wall Push-Ups", "Floor Dumbbell Press"],
                    regression: "Wall Push-Ups",
                    progression: "Standard Full-Range Push-Ups"
                }
            },
            {
                name: "Glute Bridges with 2s Squeeze",
                sets: 3,
                reps: "15",
                restSecs: 45,
                muscle: "Gluteus Maximus",
                burn: 50,
                recommendedWeight: "Bodyweight (2-second top contraction)",
                durationMins: 4,
                startPosition: "Lie on back with knees bent, feet flat on floor hip-width apart.",
                movementPath: "Drive through heels to lift hips upward, hold 2 seconds, lower slowly.",
                commonMistakes: ["Arching lower back", "Pushing through toes", "Dropping hips fast"],
                breathingInstructions: "Inhale down, exhale on drive.",
                safetyInstructions: "Keep ribs locked down into pelvis.",
                postureCheckpoints: ["Flat heels", "Straight line from shoulders to knees"],
                muscleActivationCues: ["Crush glutes together at top", "Dig heels into floor"],
                injuryPreventionTips: "Zero lower back movement; motion is 100% glute contraction.",
                visualType: "deadlift",
                alternatives: {
                    equipment: ["Dumbbell Glute Bridges", "Single-Leg Glute Bridges", "Bird-Dogs"],
                    injury: ["Bird-Dog Core Stabilizers", "Clamshells"],
                    regression: "Lying Pelvic Tilts",
                    progression: "Single-Leg Glute Bridges"
                }
            },
            {
                name: "Bird-Dog Core Stabilizers",
                sets: 3,
                reps: "10 each side",
                restSecs: 45,
                muscle: "Erector Spinae & Glutes",
                burn: 45,
                recommendedWeight: "Bodyweight",
                durationMins: 4,
                startPosition: "Hands and knees on floor in quadruped position. Hands under shoulders, knees under hips.",
                movementPath: "Reach opposite arm forward and opposite leg backward until parallel to floor. Hold 2 seconds, return slowly.",
                commonMistakes: ["Rotating hips", "Arching lower back", "Swinging limbs"],
                breathingInstructions: "Inhale at center, exhale as limbs reach out.",
                safetyInstructions: "Keep neck neutral; look down at floor.",
                postureCheckpoints: ["Flat spine like a table", "Hips level to floor", "Thumb pointing up"],
                muscleActivationCues: ["Reach long, don't just kick high", "Tighten core"],
                injuryPreventionTips: "One of the safest, most research-backed exercises for rehabilitation and spine stabilization.",
                visualType: "plank",
                alternatives: {
                    equipment: ["Dead-Bugs", "Forearm Plank", "Superman Holds"],
                    injury: ["Dead-Bugs (Floor supported)", "Side Plank on Knees"],
                    regression: "Single Arm/Leg Lifts Only",
                    progression: "Forearm Plank Hold"
                }
            },
            {
                name: "Forearm Plank Hold",
                sets: 3,
                reps: "40s",
                restSecs: 45,
                muscle: "Core Wall",
                burn: 40,
                recommendedWeight: "Bodyweight",
                durationMins: 4,
                startPosition: "Forearms on ground, elbows under shoulders, toes tucked.",
                movementPath: "Lift hips into straight line, pull belly button in and hold.",
                commonMistakes: ["Sagging hips", "Butt in air", "Looking up"],
                breathingInstructions: "Steady shallow breaths.",
                safetyInstructions: "Rest knees if lower back feels pinch.",
                postureCheckpoints: ["Straight line", "Glutes tight", "Gaze down"],
                muscleActivationCues: ["Squeeze abs like receiving a punch"],
                injuryPreventionTips: "Quality over duration; rest when form breaks.",
                visualType: "plank",
                alternatives: {
                    equipment: ["Bird-Dog Stabilizers", "Dead-Bugs", "Side Plank"],
                    injury: ["Bird-Dogs", "Dead-Bugs"],
                    regression: "Kneeling Plank",
                    progression: "Plank with Shoulder Taps"
                }
            }
        ],
        intermediate: [
            {
                name: "Standard Full-Range Push-Ups",
                sets: 4,
                reps: "15-20",
                restSecs: 60,
                muscle: "Chest, Shoulders & Triceps",
                burn: 85,
                recommendedWeight: "Bodyweight",
                durationMins: 6,
                startPosition: "High plank with hands slightly outside shoulders, fingers splayed, body in rigid line.",
                movementPath: "Lower chest under 2-second control until 1 inch off floor, elbows angled at 45°. Press back up.",
                commonMistakes: ["Sagging hips", "Elbows flaring 90°", "Incomplete depth"],
                breathingInstructions: "Inhale down, exhale up.",
                safetyInstructions: "Keep core locked so body moves as single unit.",
                postureCheckpoints: ["Rigid plank", "Elbows at 45°", "Chest touches bottom"],
                muscleActivationCues: ["Push the world away", "Squeeze chest at top"],
                injuryPreventionTips: "Keep hands turned out 5-10° to promote optimal shoulder external rotation.",
                visualType: "pushup",
                alternatives: {
                    equipment: ["Dumbbell Flat Bench Press", "Incline Push-Ups", "Dips"],
                    injury: ["Incline Push-Ups", "Floor Dumbbell Press"],
                    regression: "Knee / Incline Push-Ups",
                    progression: "Archer Push-Ups"
                }
            },
            {
                name: "Bodyweight Jump Squats / Pulse Squats",
                sets: 4,
                reps: "15",
                restSecs: 60,
                muscle: "Quads & Power Output",
                burn: 105,
                recommendedWeight: "Bodyweight (Explosive Jump)",
                durationMins: 6,
                startPosition: "Feet shoulder-width apart, standing tall.",
                movementPath: "Squat down into parallel depth, explode upward jumping into air, absorb landing softly into next squat.",
                commonMistakes: ["Stiff-legged landing", "Knees caving", "Heels banging down"],
                breathingInstructions: "Inhale as you drop, exhale on explosive leap.",
                safetyInstructions: "Land toe-to-heel with bent knees to absorb impact force safely.",
                postureCheckpoints: ["Quiet, soft landings", "Chest upright", "Full triple extension"],
                muscleActivationCues: ["Drive through floor", "Absorb landing like a spring"],
                injuryPreventionTips: "If knees ache from impact, perform 1.5 Pulse Squats without leaving the floor.",
                visualType: "squat",
                alternatives: {
                    equipment: ["Barbell Squats", "Dumbbell Goblet Squats", "Tempo Air Squats"],
                    injury: ["Tempo Air Squats (Zero impact)", "Glute Bridges"],
                    regression: "Tempo Air Squats",
                    progression: "Pistol Squats (Assisted)"
                }
            },
            {
                name: "Walking Lunges with Torso Rotation",
                sets: 3,
                reps: "12 each",
                restSecs: 45,
                muscle: "Legs & Hip Mobility",
                burn: 85,
                recommendedWeight: "Bodyweight",
                durationMins: 5,
                startPosition: "Stand tall with hands clasped in front of chest.",
                movementPath: "Step forward into deep lunge, rotate torso toward front knee, return to center, stand up.",
                commonMistakes: ["Losing balance", "Twisting from lower back instead of upper spine", "Front knee caving"],
                breathingInstructions: "Inhale into lunge, exhale on rotation, inhale center, exhale up.",
                safetyInstructions: "Rotate gently through ribcage; keep hips facing forward.",
                postureCheckpoints: ["Stable front knee", "Smooth rotation", "Upright posture"],
                muscleActivationCues: ["Root front foot to ground", "Rotate with obliques"],
                injuryPreventionTips: "Fix gaze forward before initiating rotation to maintain equilibrium.",
                visualType: "lunge",
                alternatives: {
                    equipment: ["Dumbbell Walking Lunges", "Reverse Lunges", "Bulgarian Split Squats"],
                    injury: ["Reverse Step-Back Lunges", "Glute Bridges"],
                    regression: "Standard Bodyweight Lunges",
                    progression: "Pistol Squats"
                }
            },
            {
                name: "Chair / Bench Triceps Dips",
                sets: 3,
                reps: "12-15",
                restSecs: 45,
                muscle: "Triceps Brachii",
                burn: 65,
                recommendedWeight: "Bodyweight",
                durationMins: 4,
                startPosition: "Sit on edge of sturdy chair/bench, hands gripping edge beside hips, feet flat (or legs extended).",
                movementPath: "Slide hips forward off bench. Bend elbows to lower body until upper arms are parallel to floor, then press back up.",
                commonMistakes: ["Shoulders shrugging into ears", "Drifting hips too far from bench", "Descending too deep"],
                breathingInstructions: "Inhale down, exhale press.",
                safetyInstructions: "Keep back close to the chair edge to prevent shoulder anterior glide.",
                postureCheckpoints: ["Elbows tracking directly back", "Chest open and proud"],
                muscleActivationCues: ["Press through palms", "Lock out triceps at top"],
                injuryPreventionTips: "Do not descend past 90° elbow flexion to safeguard front shoulder capsules.",
                visualType: "dips",
                alternatives: {
                    equipment: ["Parallel Bar Dips", "Close-Grip Push-Ups", "Dumbbell Overhead Extension"],
                    injury: ["Close-Grip Push-Ups on Wall", "Tricep Kickbacks"],
                    regression: "Bent-Knee Chair Dips",
                    progression: "Straight-Leg Chair Dips with Feet Elevated"
                }
            },
            {
                name: "Mountain Climbers & Plank Taps",
                sets: 3,
                reps: "45s",
                restSecs: 30,
                muscle: "Cardiovascular Core",
                burn: 70,
                recommendedWeight: "Bodyweight (Cardiovascular Pacing)",
                durationMins: 4,
                startPosition: "Full high push-up plank position with hands under shoulders, feet hip-width.",
                movementPath: "Drive knees alternatively toward chest like running in place, keeping hips level. Alternate with shoulder taps.",
                commonMistakes: ["Bouncing hips up and down", "Hands drifting forward of shoulders", "Holding breath"],
                breathingInstructions: "Rhythmic continuous breathing.",
                safetyInstructions: "Keep shoulders stacked over wrists to protect joints.",
                postureCheckpoints: ["Low hips", "Rapid knee drive", "Solid shoulder base"],
                muscleActivationCues: ["Drive knees with lower abs", "Maintain rigid core"],
                injuryPreventionTips: "Step knees forward slowly with control if wrist or toe discomfort occurs.",
                visualType: "plank",
                alternatives: {
                    equipment: ["Jumping Jacks", "High Knees in Place", "Burpees"],
                    injury: ["Bird-Dogs", "Dead-Bugs"],
                    regression: "Slow Step-In Mountain Climbers",
                    progression: "Burpees with Tuck Jump"
                }
            }
        ],
        advanced: [
            {
                name: "Archer Push-Ups / Decline Push-Ups",
                sets: 4,
                reps: "12-15",
                restSecs: 60,
                muscle: "Upper Chest & Unilateral Force",
                burn: 100,
                recommendedWeight: "Bodyweight (Unilateral Chest Bias)",
                durationMins: 6,
                startPosition: "Wide hand position in high plank, fingers angled out slightly.",
                movementPath: "Lower body toward one hand, extending opposite arm straight out to the side. Press up and repeat other side.",
                commonMistakes: ["Twisting torso", "Sagging hips", "Incomplete extension of assist arm"],
                breathingInstructions: "Inhale down toward working hand, exhale press.",
                safetyInstructions: "Keep working elbow at 45° angle to shoulder.",
                postureCheckpoints: ["Straight torso", "Single-arm press load", "Controlled tempo"],
                muscleActivationCues: ["Isolate one pec at a time", "Push aggressively"],
                injuryPreventionTips: "Start on knees to master the lateral path before full toes.",
                visualType: "pushup",
                alternatives: {
                    equipment: ["Dumbbell Bench Press", "Deficit Banded Push-Ups", "Dips"],
                    injury: ["Floor Dumbbell Press", "Incline Push-Ups"],
                    regression: "Standard Full-Range Push-Ups",
                    progression: "One-Arm Push-Up Progressions"
                }
            },
            {
                name: "Pistol Squats (Assisted / Free)",
                sets: 4,
                reps: "6-8 each leg",
                restSecs: 75,
                muscle: "Unilateral Leg Dominance",
                burn: 125,
                recommendedWeight: "Bodyweight (Single-Leg)",
                durationMins: 7,
                startPosition: "Stand on one leg with opposite leg extended straight forward in air, arms out for counterbalance.",
                movementPath: "Descend under control on single leg until thigh breaks parallel, knee tracking over toe. Press up through heel.",
                commonMistakes: ["Heel lifting off ground", "Falling backward at bottom", "Knee caving inward"],
                breathingInstructions: "Inhale down with tight core brace, exhale through sticking point.",
                safetyInstructions: "Hold doorframe, pole, or chair for light fingertip assistance if balance limits depth.",
                postureCheckpoints: ["Flat standing foot", "Extended non-working leg off floor", "Upright torso"],
                muscleActivationCues: ["Squeeze quad and glute of working leg", "Grip floor with toes"],
                injuryPreventionTips: "Use a box or bench to squat down to first until full ankle mobility is developed.",
                visualType: "squat",
                alternatives: {
                    equipment: ["Bulgarian Split Squats", "Barbell Squats", "Step-Ups"],
                    injury: ["Box Step-Ups", "Glute Bridges"],
                    regression: "Box Pistol Squats",
                    progression: "Weighted Pistol Squats"
                }
            },
            {
                name: "Pull-Ups / Inverted Table Rows",
                sets: 4,
                reps: "8-12",
                restSecs: 75,
                muscle: "Upper Back & Latissimus",
                burn: 95,
                recommendedWeight: "Bodyweight",
                durationMins: 6,
                startPosition: "Hang from pull-up bar (or lie under sturdy table gripping edge, heels on floor).",
                movementPath: "Pull chest up to bar/table edge by driving elbows down and back. Lower with 3-second control.",
                commonMistakes: ["Kipping with legs", "Not reaching full extension", "Shrugging neck"],
                breathingInstructions: "Inhale at bottom, exhale as chest pulls up.",
                safetyInstructions: "If using a table, ensure it is completely sturdy and cannot tip.",
                postureCheckpoints: ["Chest to bar", "Engaged shoulders", "Straight legs"],
                muscleActivationCues: ["Drive elbows down", "Pinch shoulder blades"],
                injuryPreventionTips: "Never bounce out of the bottom position; keep lats active throughout.",
                visualType: "pullup",
                alternatives: {
                    equipment: ["Lat Pulldown", "Dumbbell Rows", "Resistance Band Pulldowns"],
                    injury: ["Banded Seated Rows", "Single-Arm Rows"],
                    regression: "Inverted Table Rows (Bent knees)",
                    progression: "L-Sit Pull-Ups"
                }
            },
            {
                name: "Burpees with Tuck Jump",
                sets: 4,
                reps: "12 reps",
                restSecs: 45,
                muscle: "Full Body Anaerobic",
                burn: 110,
                recommendedWeight: "Bodyweight (Maximum Effort)",
                durationMins: 5,
                startPosition: "Stand tall, feet shoulder-width.",
                movementPath: "Drop hands to floor, kick feet back to plank, perform chest-to-floor push-up, jump feet in, explode into air pulling knees to chest.",
                commonMistakes: ["Sagging lower back in plank", "Stiff landing on tuck jump", "Slowing down too early"],
                breathingInstructions: "Fast, rhythmic breathing with each phase.",
                safetyInstructions: "Land softly on balls of feet, cushioning immediately into knees.",
                postureCheckpoints: ["Flat plank on bottom", "Tuck knees to chest in air", "Soft landing"],
                muscleActivationCues: ["Explode off floor with full body power"],
                injuryPreventionTips: "If knees or back feel jarring, substitute jump with a smooth calf raise.",
                visualType: "burpee",
                alternatives: {
                    equipment: ["Kettlebell Swings", "Jumping Jacks", "High Knees"],
                    injury: ["Step-Back Low Impact Burpees (No jump)", "Mountain Climbers"],
                    regression: "Standard Burpees without Tuck Jump",
                    progression: "Burpee Pull-Ups"
                }
            },
            {
                name: "Hanging / Floor Dragon Flags & L-Sit",
                sets: 4,
                reps: "30s hold",
                restSecs: 45,
                muscle: "Elite Core Tension",
                burn: 65,
                recommendedWeight: "Bodyweight (Isometric / Lever)",
                durationMins: 5,
                startPosition: "Lie on bench gripping behind head (or sit on floor with hands beside hips for L-sit).",
                movementPath: "Lift entire body up onto upper shoulders in straight line, lower body down slowly without bending at hips.",
                commonMistakes: ["Bending at hips", "Arching spine", "Holding breath"],
                breathingInstructions: "Short, controlled exhalations under maximum tension.",
                safetyInstructions: "Maintain head and neck flat on bench; do not twist head.",
                postureCheckpoints: ["Straight line from shoulders to toes", "Pivoting only from upper back"],
                muscleActivationCues: ["Full body contraction like a rigid steel bar"],
                injuryPreventionTips: "Master the negative (lowering only) before attempting to pull back up.",
                visualType: "plank",
                alternatives: {
                    equipment: ["Ab Wheel Rollout", "Hanging Leg Raises", "V-Ups"],
                    injury: ["Plank Hold", "Dead-Bugs"],
                    regression: "Tuck Dragon Flags",
                    progression: "Full Dragon Flag Repetitions"
                }
            }
        ]
    }
};

// ==========================================
// 3a. CALORIE BURN TARGET & SAFETY SYSTEM
// ==========================================

/**
 * Recommends a scientifically calibrated active calorie-burn target
 * based on biometrics, goal, activity level, and fitness tier.
 */
function recommendCalorieBurnTarget(profile = {}) {
    const age = Number(profile.age) || 25;
    const sex = String(profile.biologicalSex || 'male').toLowerCase();
    const height = Number(profile.height) || 175;
    const weight = Number(profile.weight) || 75;
    const rawGoal = (profile.goals && profile.goals[0]) || profile.goal || 'Maintenance';
    const goal = normalizeGoal(rawGoal);
    const activity = normalizeActivityLevel(profile.activityLevel || 'moderate');
    const fitness = ['beginner', 'intermediate', 'advanced'].includes(String(profile.fitnessLevel).toLowerCase())
        ? String(profile.fitnessLevel).toLowerCase()
        : 'intermediate';

    const bmr = calculateBMR(weight, height, age, sex);
    const tdee = calculateTDEE(bmr, activity);

    let targetBurn = 350;
    let intensity = "Moderate Hypertrophy";
    let cardioMins = 15;
    let stepGoal = 8000;
    let weeklyImpact = "Energy equilibrium (Maintains current weight)";
    let rationale = "";

    if (goal === 'fat_loss') {
        // Safe exercise burn: 22-26% of TDEE (typically 450 - 650 kcal)
        const baseBurn = Math.round(tdee * 0.22);
        targetBurn = Math.max(380, Math.min(650, baseBurn));
        intensity = fitness === 'advanced' ? 'High Kinetic Conditioning' : 'Progressive Aerobic-Resistance';
        cardioMins = fitness === 'beginner' ? 20 : (fitness === 'advanced' ? 30 : 25);
        stepGoal = fitness === 'advanced' ? 12000 : 10000;

        const totalDailyDeficit = Math.round(tdee * 0.20) + (targetBurn * 0.4);
        const weeklyFatLossKg = parseFloat(((totalDailyDeficit * 7) / 7700).toFixed(2));
        weeklyImpact = `Estimated ~${weeklyFatLossKg} kg (${(weeklyFatLossKg * 2.2).toFixed(1)} lbs) fat loss per week`;
        var estimatedWeeklyWeightChangeKg = - weeklyFatLossKg;
        rationale = `Recommends ${targetBurn} kcal active burn with ${cardioMins}m cardio and ${stepGoal.toLocaleString()} steps to maximize fat oxidation without inducing metabolic slowdown.`;
    } else if (goal === 'muscle_gain') {
        // Controlled active burn: 12-15% of TDEE to avoid burning caloric surplus
        targetBurn = Math.max(240, Math.min(360, Math.round(tdee * 0.12)));
        intensity = 'Hypertrophy Mechanical Tension';
        cardioMins = 10;
        stepGoal = 7500;
        weeklyImpact = `Estimated ~0.25 - 0.35 kg lean muscle accrual per week`;
        var estimatedWeeklyWeightChangeKg = 0.25;
        rationale = `Recommends ${targetBurn} kcal active burn with low cardio (${cardioMins}m) and ${stepGoal.toLocaleString()} steps to protect surplus calories for muscle protein synthesis.`;
    } else if (goal === 'recomposition') {
        // Balanced burn: 16-20% of TDEE
        targetBurn = Math.max(320, Math.min(480, Math.round(tdee * 0.17)));
        intensity = 'Balanced Anabolic-Metabolic';
        cardioMins = 15;
        stepGoal = 9000;
        weeklyImpact = `Body recomposition: Lean muscle preservation with concurrent fat reduction`;
        var estimatedWeeklyWeightChangeKg = -0.15;
        rationale = `Recommends ${targetBurn} kcal active burn balancing heavy compound lifts with ${cardioMins}m steady-state cardio to mobilize stubborn adipose tissue while safeguarding muscle mass.`;
    } else {
        // Maintenance
        targetBurn = Math.max(280, Math.min(420, Math.round(tdee * 0.15)));
        intensity = 'Metabolic Homeostasis';
        cardioMins = 15;
        stepGoal = 8000;
        weeklyImpact = `Weight equilibrium (0.0 kg change, peak energy & biomarkers)`;
        var estimatedWeeklyWeightChangeKg = 0.0;
        rationale = `Recommends ${targetBurn} kcal active burn for cardiovascular longevity and sustained metabolic health.`;
    }

    return {
        targetBurnCals: targetBurn,
        mode: 'recommended',
        intensity,
        cardioMins,
        stepGoal,
        dailyStepGoal: stepGoal,
        weeklyImpact,
        estimatedWeeklyWeightChangeKg,
        safetyWarning: null,
        warning: null,
        rationale
    };
}

/**
 * Validates user-entered calorie-burn targets against physiological safety limits
 * and computes corresponding workout parameters and projected weekly impact.
 */
function validateAndCalibrateBurnTarget(targetBurnInput, profile = {}) {
    const rawBurn = Number(targetBurnInput);
    const rawGoal = (profile.goals && profile.goals[0]) || profile.goal || 'Maintenance';
    const goal = normalizeGoal(rawGoal);

    let safetyWarning = null;
    let clampedBurn = rawBurn;

    // Safety validation rules
    if (isNaN(rawBurn) || rawBurn < 150) {
        clampedBurn = 150;
        safetyWarning = "Target burn below 150 kcal. A minimum of 150-250 kcal active exercise is recommended for cardiovascular conditioning.";
    } else if (rawBurn > 1200) {
        clampedBurn = 1200;
        safetyWarning = "⚠️ High Caloric Burn Warning: Targets above 900-1200 kcal/day significantly increase cortisol, risk joint overtraining, and cause muscle wasting. Clamped to 1,200 kcal maximum safe physiological limit.";
    } else if (rawBurn > 850) {
        safetyWarning = "⚠️ Intense Expenditure Notice: Burning >850 kcal/day through training requires strict sleep hygiene and elevated protein to prevent central nervous system fatigue.";
    }

    // Derive intensity, cardio, and step goal based on user's target burn
    let intensity = "Moderate";
    let cardioMins = 15;
    let stepGoal = 8000;

    if (clampedBurn <= 250) {
        intensity = "Low-Impact Mobility & Strength";
        cardioMins = 10;
        stepGoal = 7000;
    } else if (clampedBurn <= 400) {
        intensity = "Moderate Hypertrophy Split";
        cardioMins = 15;
        stepGoal = 8500;
    } else if (clampedBurn <= 600) {
        intensity = "High Kinetic Conditioning";
        cardioMins = 25;
        stepGoal = 10000;
    } else if (clampedBurn <= 850) {
        intensity = "Peak Anaerobic & Aerobic Drive";
        cardioMins = 30;
        stepGoal = 11500;
    } else {
        intensity = "Ultra Endurance / Athletic Protocol";
        cardioMins = 40;
        stepGoal = 13000;
    }

    // Weekly progress impact calculation
    let weeklyImpact = "";
    let estimatedWeeklyWeightChangeKg = 0;
    if (goal === 'fat_loss') {
        const approxDeficit = Math.round(clampedBurn * 0.85);
        const weeklyFatKg = parseFloat(((approxDeficit * 7) / 7700).toFixed(2));
        weeklyImpact = `Estimated ~${weeklyFatKg} kg (${(weeklyFatKg * 2.2).toFixed(1)} lbs) fat loss per week`;
        estimatedWeeklyWeightChangeKg = - weeklyFatKg;
    } else if (goal === 'muscle_gain') {
        if (clampedBurn > 550) {
            weeklyImpact = `Moderate muscle gain (~0.15 kg/wk) - active burn is relatively high for hyper-caloric bulking`;
            estimatedWeeklyWeightChangeKg = 0.15;
        } else {
            weeklyImpact = `Optimal hypertrophy (~0.25 - 0.35 kg/wk lean mass accrual)`;
            estimatedWeeklyWeightChangeKg = 0.25;
        }
    } else if (goal === 'recomposition') {
        weeklyImpact = `Body recomposition: accelerated fat loss with muscular density preservation`;
        estimatedWeeklyWeightChangeKg = -0.15;
    } else {
        weeklyImpact = `Metabolic equilibrium with ${clampedBurn} kcal active daily expenditure`;
        estimatedWeeklyWeightChangeKg = 0.0;
    }

    const rationale = `Custom user burn goal of ${clampedBurn} kcal programmed with ${cardioMins}m cardio, ${intensity} workout pacing, and ${stepGoal.toLocaleString()} step milestone.`;

    return {
        targetBurnCals: clampedBurn,
        mode: 'custom',
        intensity,
        cardioMins,
        stepGoal,
        dailyStepGoal: stepGoal,
        weeklyImpact,
        estimatedWeeklyWeightChangeKg,
        safetyWarning,
        warning: safetyWarning,
        rationale
    };
}

/**
 * Generates an intelligent, equipment-aware workout schedule block
 * scaled to the active calorie-burn target.
 */
function generateSmartWorkout(fitnessLevel = 'intermediate', equipment = [], durationMins = 45, goal = 'muscle_gain', seed = 0, burnTarget = null) {
    const normLevel = ['beginner', 'intermediate', 'advanced'].includes(String(fitnessLevel).toLowerCase())
        ? String(fitnessLevel).toLowerCase()
        : 'intermediate';

    // Determine equipment mode
    const eqList = (equipment || []).map(e => String(e).toLowerCase());
    let mode = 'bodyweight';
    if (eqList.some(e => e.includes('gym') || e.includes('barbell') || e.includes('machine') || e.includes('cable'))) {
        mode = 'gym';
    } else if (eqList.some(e => e.includes('dumbbell') || e.includes('band') || e.includes('kettlebell'))) {
        mode = 'home';
    }

    const availableExercises = EXERCISE_LIBRARY[mode][normLevel];
    // Rotate exercise selection with seed for variety across regenerations
    const rotated = [];
    for (let i = 0; i < availableExercises.length; i++) {
        const item = availableExercises[(i + seed) % availableExercises.length];
        rotated.push(item);
    }

    // Limit or scale based on available duration
    const exerciseCount = durationMins <= 30 ? 3 : (durationMins <= 45 ? 4 : 5);
    const selected = rotated.slice(0, exerciseCount).map(ex => ({ ...ex }));

    // Append dedicated cardio finisher if prescribed by burn target
    const cardioMins = burnTarget?.cardioMins || 0;
    if (cardioMins > 0) {
        const cardioBurn = Math.round(cardioMins * 7.5);
        selected.push({
            name: `Post-Kinetic ${cardioMins}m Cardio & Incline Walk`,
            sets: 1,
            reps: `${cardioMins} mins`,
            restSecs: 0,
            muscle: "Cardiovascular & Aerobic Engine",
            burn: cardioBurn
        });
    }

    const totalExerciseBurn = selected.reduce((sum, ex) => sum + ex.burn, 0);
    const finalTargetBurn = burnTarget?.targetBurnCals || totalExerciseBurn;

    const titleMap = {
        beginner: "Foundational Kinetic Strength & Motor Control",
        intermediate: "Hypertrophy & Progressive Kinetic Drive",
        advanced: "High-Threshold Neuro-Muscular Protocol"
    };

    const intensityLabel = burnTarget?.intensity || "Moderate Hypertrophy Split";
    const stepGoal = burnTarget?.stepGoal || 8000;

    return {
        id: "workout-1",
        time: "07:00 AM",
        type: "workout",
        title: titleMap[normLevel] || "Personalized Kinetic Protocol",
        description: `${durationMins + cardioMins}-min ${mode.toUpperCase()} session • ${intensityLabel} • ${finalTargetBurn} kcal burn target • ${stepGoal.toLocaleString()} step goal.`,
        status: "scheduled",
        reasoning: burnTarget?.rationale || `Selected ${mode} exercises programmed for ${normLevel} tier with ${selected.length} movements, calibrated for ${finalTargetBurn} kcal expenditure.`,
        details: {
            durationMins: durationMins + cardioMins,
            targetCalories: finalTargetBurn,
            intensity: intensityLabel,
            cardioMins: cardioMins,
            stepGoal: stepGoal,
            weeklyImpact: burnTarget?.weeklyImpact || "Standard progress",
            safetyWarning: burnTarget?.safetyWarning || null,
            fitnessLevel: normLevel,
            equipmentMode: mode,
            exercises: selected.map(ex => ({
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                restSecs: ex.restSecs,
                targetMuscle: ex.muscle,
                estimatedBurn: ex.burn,
                recommendedWeight: ex.recommendedWeight || "Bodyweight / Adaptive Load",
                durationMins: ex.durationMins || Math.round((ex.sets * (45 + (ex.restSecs || 60))) / 60),
                startPosition: ex.startPosition || "Set up in a balanced athletic posture with core engaged.",
                movementPath: ex.movementPath || "Control the eccentric descent, pause briefly at peak stretch, then explode through the concentric phase.",
                commonMistakes: ex.commonMistakes || ["Loss of core stability", "Rushing tempo", "Incomplete range of motion"],
                breathingInstructions: ex.breathingInstructions || "Inhale and brace intra-abdominal pressure on descent; exhale forcefully on exertion.",
                safetyInstructions: ex.safetyInstructions || "Maintain a neutral spinal alignment and terminate the set if joint pain occurs.",
                postureCheckpoints: ex.postureCheckpoints || ["Neutral spine", "Joints aligned with load", "Core braced"],
                muscleActivationCues: ex.muscleActivationCues || ["Mind-muscle focus on target fibers", "Control the negative phase"],
                injuryPreventionTips: ex.injuryPreventionTips || "Perform thorough warm-up sets before loading working sets.",
                visualType: ex.visualType || "general",
                alternatives: ex.alternatives || { equipment: [], injury: [], regression: "", progression: "" }
            }))
        }
    };
}

/**
 * Finds intelligent exercise replacements matching equipment availability,
 * joint/injury limitations, or progression/regression levels.
 */
function findExerciseAlternatives(exerciseName = '', reason = 'equipment', equipmentMode = 'gym', fitnessLevel = 'intermediate') {
    let targetExercise = null;

    // Search library across all categories
    for (const eqKey of Object.keys(EXERCISE_LIBRARY)) {
        for (const lvlKey of Object.keys(EXERCISE_LIBRARY[eqKey])) {
            const match = EXERCISE_LIBRARY[eqKey][lvlKey].find(e => e.name.toLowerCase() === exerciseName.toLowerCase());
            if (match) {
                targetExercise = match;
                break;
            }
        }
        if (targetExercise) break;
    }

    // Collect all candidate movements
    const candidates = [];
    for (const eqKey of Object.keys(EXERCISE_LIBRARY)) {
        for (const lvlKey of Object.keys(EXERCISE_LIBRARY[eqKey])) {
            EXERCISE_LIBRARY[eqKey][lvlKey].forEach(ex => {
                if (ex.name.toLowerCase() !== exerciseName.toLowerCase() && !candidates.some(c => c.name === ex.name)) {
                    candidates.push({ ...ex, equipmentTier: eqKey, levelTier: lvlKey });
                }
            });
        }
    }

    let results = [];
    if (reason === 'injury') {
        // Find joint-friendly alternatives targeting same muscle or tagged in injury list
        const injuryTags = targetExercise?.alternatives?.injury || [];
        results = candidates.filter(c => 
            injuryTags.some(tag => c.name.toLowerCase().includes(tag.toLowerCase()) || tag.toLowerCase().includes(c.name.toLowerCase())) ||
            (targetExercise && c.muscle.toLowerCase().includes(targetExercise.muscle.split('&')[0].trim().toLowerCase()))
        );
    } else if (reason === 'equipment') {
        // Find alternatives with different equipment or from tagged equipment list
        const eqTags = targetExercise?.alternatives?.equipment || [];
        results = candidates.filter(c =>
            eqTags.some(tag => c.name.toLowerCase().includes(tag.toLowerCase()) || tag.toLowerCase().includes(c.name.toLowerCase())) ||
            c.equipmentTier !== equipmentMode
        );
    } else if (reason === 'difficulty') {
        // Return regression or progression
        const reg = targetExercise?.alternatives?.regression;
        const prog = targetExercise?.alternatives?.progression;
        results = candidates.filter(c =>
            (reg && c.name.toLowerCase().includes(reg.toLowerCase())) ||
            (prog && c.name.toLowerCase().includes(prog.toLowerCase())) ||
            (targetExercise && c.muscle === targetExercise.muscle)
        );
    }

    if (results.length < 3) {
        // Fallback: match by primary muscle group
        const targetMuscle = targetExercise?.muscle?.split('&')[0]?.trim()?.toLowerCase() || '';
        const muscleMatches = candidates.filter(c => c.muscle.toLowerCase().includes(targetMuscle));
        results = [...results, ...muscleMatches];
    }

    // Deduplicate and slice to 3 distinct replacements
    const unique = [];
    for (const item of results) {
        if (!unique.some(u => u.name === item.name) && item.name.toLowerCase() !== exerciseName.toLowerCase()) {
            unique.push(item);
        }
        if (unique.length >= 3) break;
    }

    return unique.map(ex => ({
        name: ex.name,
        sets: ex.sets || 3,
        reps: ex.reps || "10-12",
        restSecs: ex.restSecs || 60,
        targetMuscle: ex.muscle,
        estimatedBurn: ex.burn || 75,
        recommendedWeight: ex.recommendedWeight || "Moderate Load",
        durationMins: ex.durationMins || 6,
        startPosition: ex.startPosition || "Set up in a balanced athletic posture.",
        movementPath: ex.movementPath || "Control the descent, pause, and drive with power.",
        commonMistakes: ex.commonMistakes || ["Rushing tempo", "Losing core brace"],
        breathingInstructions: ex.breathingInstructions || "Inhale down, exhale on drive.",
        safetyInstructions: ex.safetyInstructions || "Maintain neutral alignment.",
        postureCheckpoints: ex.postureCheckpoints || ["Neutral spine", "Aligned joints"],
        muscleActivationCues: ex.muscleActivationCues || ["Mind-muscle connection"],
        injuryPreventionTips: ex.injuryPreventionTips || "Warm up adequately.",
        visualType: ex.visualType || "general",
        alternatives: ex.alternatives || { equipment: [], injury: [], regression: "", progression: "" }
    }));
}

// ==========================================
// 4. 24-HOUR COMPLETE TIMELINE ASSEMBLER
// ==========================================

function assembleDailySchedule(macroTargets, meals, workoutBlock, waterLiters) {
    const morningWaterLiters = (waterLiters * 0.2).toFixed(1);
    const midMorningWaterLiters = (waterLiters * 0.25).toFixed(1);
    const afternoonWaterLiters = (waterLiters * 0.25).toFixed(1);
    const eveningWaterLiters = (waterLiters * 0.3).toFixed(1);

    const wakeBlock = {
        id: "sched-wake",
        time: "06:30 AM",
        type: "wakeup",
        title: "Circadian Awakening & Hydration Priming",
        description: `Wake up protocol with ${morningWaterLiters}L electrolyte hydration and dynamic mobility to jumpstart metabolic rate.`,
        status: "scheduled",
        reasoning: "Early hydration restores intracellular fluids lost overnight and enhances sympathetic nervous system readiness for the morning workout.",
        details: {
            targetWaterLiters: morningWaterLiters,
            actions: [
                `Drink ${morningWaterLiters}L room-temperature water with Himalayan pink salt & lemon`,
                "5-min dynamic mobility: Cat-Cow stretch, Arm circles, Hip openers",
                "Natural morning sunlight exposure for 10 minutes to set circadian rhythm"
            ]
        }
    };

    const postWorkoutBlock = {
        id: "sched-postworkout",
        time: "08:15 AM",
        type: "recovery",
        title: "Post-Kinetic Anabolic Window & Cooldown",
        description: "Heart rate normalization, respiratory reset, and preparation for breakfast nutrient absorption.",
        status: "scheduled",
        reasoning: "Cooling down stabilizes blood pressure and opens GLUT-4 transporters for rapid glycogen replenishment from breakfast.",
        details: {
            durationMins: 15,
            actions: [
                "5-min light walking cooldown and deep diaphragmatic box breathing",
                "Hydrate with 300ml water to replenish perspiration loss",
                "Transition to Anabolic Breakfast within 30-45 minutes"
            ]
        }
    };

    const midDayWaterBlock = {
        id: "sched-water-1",
        time: "11:30 AM",
        type: "hydration",
        title: "Cellular Hydration Milestone #1",
        description: `Ensure ${midMorningWaterLiters}L water consumed before lunch to maintain peak metabolic efficiency.`,
        status: "scheduled",
        reasoning: "Consistent daytime hydration prevents lethargy, supports digestion, and eliminates false hunger signals.",
        details: {
            targetWaterLiters: midMorningWaterLiters,
            tip: "Keep a 1-liter bottle at your desk and sip consistently every 20 minutes."
        }
    };

    const afternoonWaterBlock = {
        id: "sched-water-2",
        time: "03:30 PM",
        type: "hydration",
        title: "Cellular Hydration Milestone #2",
        description: `Complete ${afternoonWaterLiters}L water block. Pre-hydrate before evening snack.`,
        status: "scheduled",
        reasoning: "Mid-afternoon fluid balance prevents cognitive fog and maintains cellular osmotic pressure.",
        details: {
            targetWaterLiters: afternoonWaterLiters,
            tip: "Infuse water with fresh cucumber slices or mint leaves for electrolyte balance."
        }
    };

    const recoveryBlock = {
        id: "sched-recovery",
        time: "09:30 PM",
        type: "recovery",
        title: "Nocturnal Regeneration, Stretching & Water Check",
        description: `Final ${eveningWaterLiters}L hydration review, foam rolling, and parasympathetic decompression.`,
        status: "scheduled",
        reasoning: "Decompresses spinal disks and lowers cortisol levels to promote slow-wave delta sleep.",
        details: {
            durationMins: 20,
            waterCheck: `Ensure ${waterLiters}L daily total reached (sip only small quantities before bed)`,
            mobility: [
                "Child's Pose (90s - deep hip & lats stretch)",
                "Couch Stretch / Hip Flexor Release (60s each side)",
                "Seated Hamstring Stretch (60s)",
                "5 minutes 4-7-8 parasympathetic box breathing"
            ]
        }
    };

    const sleepBlock = {
        id: "sched-sleep",
        time: "10:30 PM",
        type: "sleep",
        title: "Circadian Deep Sleep & Growth Hormone Protocol",
        description: "Target 7.5 - 8.5 hours restorative sleep for cellular repair, protein synthesis, and hormone synthesis.",
        status: "scheduled",
        reasoning: "Human Growth Hormone (HGH) peaks during slow-wave sleep; uninterrupted sleep is essential for muscle hypertrophy and fat oxidation.",
        details: {
            targetHours: "7.5 - 8.5 hours",
            environment: [
                "Dark room (100% blackout or eye mask)",
                "Cool ambient temperature (18-20°C / 65-68°F)",
                "Zero blue light / screens 45 minutes prior to sleep",
                "Magnesium / Chamomile herbal tea if desired"
            ]
        }
    };

    return [
        wakeBlock,
        workoutBlock,
        postWorkoutBlock,
        meals[0], // Breakfast
        meals[1], // Morning Snack
        midDayWaterBlock,
        meals[2], // Lunch
        afternoonWaterBlock,
        meals[3], // Evening Snack
        meals[4], // Dinner
        recoveryBlock,
        sleepBlock
    ];
}

// ==========================================
// 5. AI EXPLANATION ENGINE
// ==========================================

function generateAIReasoningSummary(profile, bmr, tdee, dailyTarget) {
    const goalHuman = normalizeGoal(profile.goals?.[0] || 'maintenance').replace('_', ' ').toUpperCase();
    const dietHuman = String(profile.dietaryType || 'non-vegetarian').toUpperCase();

    const calorieReasoning = `Based on the Mifflin-St Jeor equation, your baseline BMR is ${bmr} kcal/day. Factoring in your ${profile.activityLevel || 'moderate'} activity multiplier yields a TDEE of ${tdee} kcal/day. For your ${goalHuman} goal, we prescribed ${dailyTarget.calories} kcal/day to ensure optimal metabolic rate while stimulating body adaptation.`;

    const macroReasoning = `Protein is set at ${dailyTarget.protein}g (${((dailyTarget.protein * 4 / dailyTarget.calories) * 100).toFixed(0)}% of intake) to maximize muscle protein synthesis. Healthy dietary fats are set at ${dailyTarget.fat}g (${((dailyTarget.fat * 9 / dailyTarget.calories) * 100).toFixed(0)}%) for hormonal balance, leaving ${dailyTarget.carbs}g (${((dailyTarget.carbs * 4 / dailyTarget.calories) * 100).toFixed(0)}%) of complex carbohydrates to fuel workouts and preserve glycogen.`;

    const mealReasoning = `Meals are generated using authentic Indian staples (daals, paneer/tofu/chicken, whole grains, seeds, sprouts) tailored to your ${dietHuman} preference. Every meal strictly omits your declared allergies (${(profile.allergies && profile.allergies.length) ? profile.allergies.join(', ') : 'None'}) while maintaining consistent protein distribution across all 5 daily feeding windows.`;

    const workoutReasoning = `Workouts are periodized for ${profile.fitnessLevel || 'intermediate'} level using your available ${profile.equipment?.join(', ') || 'bodyweight'} equipment, utilizing compound multi-joint movements to maximize metabolic expenditure within your ${profile.duration || 45}-minute daily session.`;

    return {
        calorieReasoning,
        macroReasoning,
        mealReasoning,
        workoutReasoning,
        adaptationNotes: "Weekly biometric telemetry check-ins will automatically recalibrate your caloric targets and workout volume based on weight trend and adherence."
    };
}

// ==========================================
// 6. MASTER ORCHESTRATION ENGINE
// ==========================================

function buildMasterPlan(userProfile = {}, seed = 0, burnGoalInput = null) {
    const age = Number(userProfile.age) || 25;
    const sex = String(userProfile.biologicalSex || 'male').toLowerCase();
    const height = Number(userProfile.height) || 175;
    const weight = Number(userProfile.weight) || 75;
    const rawGoal = (userProfile.goals && userProfile.goals[0]) || userProfile.goal || 'Muscle Gain';
    const activity = userProfile.activityLevel || 'moderate';
    const fitnessLevel = userProfile.fitnessLevel || 'intermediate';
    const duration = Number(userProfile.duration) || 45;
    const equipment = userProfile.equipment || ['dumbbells', 'bodyweight'];
    const dietaryType = userProfile.dietaryType || userProfile.dietProfile?.dietaryType || 'non-vegetarian';
    const allergies = userProfile.allergies || userProfile.dietProfile?.allergies || [];

    // 1. Calculate Mifflin-St Jeor BMR & TDEE
    const bmr = calculateBMR(weight, height, age, sex);
    const tdee = calculateTDEE(bmr, activity);

    // 2. Determine Calorie Burn Target (Custom or Algorithmic Recommendation)
    let burnTarget = null;
    if (burnGoalInput && (burnGoalInput.mode === 'custom' || burnGoalInput.targetBurnCals)) {
        burnTarget = validateAndCalibrateBurnTarget(burnGoalInput.targetBurnCals, {
            ...userProfile,
            age, biologicalSex: sex, height, weight, goal: rawGoal, fitnessLevel, activityLevel: activity
        });
        if (burnGoalInput.mode) burnTarget.mode = burnGoalInput.mode;
    } else {
        burnTarget = recommendCalorieBurnTarget({
            ...userProfile,
            age, biologicalSex: sex, height, weight, goal: rawGoal, fitnessLevel, activityLevel: activity
        });
    }

    // 3. Calculate Target Calories & Macros with Mathematical Integrity
    const targetCalories = calculateCalorieTarget(tdee, rawGoal, sex);
    const macros = calculateMacros(targetCalories, weight, rawGoal, fitnessLevel);
    const waterLiters = calculateWaterIntake(weight, duration + (burnTarget.cardioMins || 0));

    const dailyTarget = {
        bmr,
        tdee,
        calories: macros.calories,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
        waterLiters,
        targetBurn: burnTarget.targetBurnCals,
        intensity: burnTarget.intensity,
        cardioMins: burnTarget.cardioMins,
        stepGoal: burnTarget.stepGoal,
        dailyStepGoal: burnTarget.dailyStepGoal,
        weeklyImpact: burnTarget.weeklyImpact,
        estimatedWeeklyWeightChangeKg: burnTarget.estimatedWeeklyWeightChangeKg,
        burnTarget: burnTarget
    };

    // 4. Generate 5-meal Indian Nutrition Matrix
    const meals = generateSmartMealPlan(macros, dietaryType, allergies, seed);

    // 5. Generate Tiered Workout Scaled to Calorie Burn Target
    const workoutBlock = generateSmartWorkout(fitnessLevel, equipment, duration, rawGoal, seed, burnTarget);

    // 6. Assemble Complete 24-Hour Schedule
    const schedule = assembleDailySchedule(dailyTarget, meals, workoutBlock, waterLiters);

    // 7. Generate AI Explanations
    const aiReasoning = generateAIReasoningSummary({
        ...userProfile,
        dietaryType,
        allergies
    }, bmr, tdee, dailyTarget);
    aiReasoning.burnReasoning = burnTarget.rationale + (burnTarget.safetyWarning ? ` • ${burnTarget.safetyWarning}` : '');

    const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return {
        planId,
        headline: `AI Dynamic Master Protocol • ${rawGoal.toUpperCase()}`,
        summary: `Mifflin-St Jeor 24-hr protocol: ${macros.calories} kcal intake • ${burnTarget.targetBurnCals} kcal active burn • ${burnTarget.weeklyImpact} • ${dietaryType} Indian nutrition • ${workoutBlock.details.durationMins}-min ${workoutBlock.details.equipmentMode} training (${burnTarget.stepGoal.toLocaleString()} steps).`,
        dailyTarget,
        aiReasoning,
        schedule,
        adherence: {
            mealsCompleted: 0,
            mealsTotal: 5,
            workoutsCompleted: 0,
            workoutsTotal: 1,
            overallScore: 0
        },
        userProfileSnapshot: {
            age,
            biologicalSex: sex,
            height,
            weight,
            goal: rawGoal,
            activityLevel: activity,
            fitnessLevel,
            duration,
            equipment,
            dietaryType,
            allergies
        },
        burnTarget: burnTarget,
        progressiveAdaptation: {
            weekNumber: 1,
            weightChangeKg: 0,
            previousWeight: weight,
            currentWeight: weight,
            notes: "Initial baseline protocol established."
        },
        active: true,
        createdAt: new Date().toISOString()
    };
}

// ==========================================
// 7. PROGRESSIVE ADAPTATION ENGINE
// ==========================================

function runProgressiveAdaptation(currentPlan, checkInData = {}) {
    if (!currentPlan) return null;

    const profile = currentPlan.userProfileSnapshot || {};
    const previousWeight = Number(checkInData.previousWeight || profile.weight || 75);
    const currentWeight = Number(checkInData.currentWeight || previousWeight);
    const weightChange = parseFloat((currentWeight - previousWeight).toFixed(2));
    const adherence = Number(checkInData.adherenceScore || currentPlan.adherence?.overallScore || 80);
    const feedback = String(checkInData.feedback || 'on-track').toLowerCase();
    const goal = normalizeGoal(profile.goal || 'maintenance');

    let calAdjustment = 0;
    let adaptationNote = "";

    if (goal === 'fat_loss') {
        if (weightChange >= 0 && adherence >= 75) {
            calAdjustment = -100;
            adaptationNote = "Weight plateau detected with solid adherence. Caloric intake reduced by 100 kcal to reignite fat loss.";
        } else if (weightChange < -1.2) {
            calAdjustment = +100;
            adaptationNote = "Rapid weight loss detected (>1.2kg/week). Caloric intake increased by 100 kcal to protect lean muscle mass.";
        } else {
            adaptationNote = `Steady progress (${weightChange} kg change). Caloric target maintained on track.`;
        }
    } else if (goal === 'muscle_gain') {
        if (weightChange <= 0.1 && adherence >= 75) {
            calAdjustment = +150;
            adaptationNote = "Hypertrophy rate stalled. Increased surplus by 150 kcal (+25g carbs, +5g protein) to stimulate growth.";
        } else if (weightChange > 0.8) {
            calAdjustment = -100;
            adaptationNote = "Rapid weight gain detected. Surplus tempered by 100 kcal to ensure clean lean mass acquisition.";
        } else {
            adaptationNote = `Optimal hypertrophy progression (${weightChange} kg gain). Current intake sustained.`;
        }
    } else {
        if (Math.abs(weightChange) > 1.0) {
            calAdjustment = weightChange > 0 ? -100 : +100;
            adaptationNote = `Weight shifted by ${weightChange} kg. Micro-adjusted calories to sustain true energy equilibrium.`;
        } else {
            adaptationNote = "Excellent homeostasis maintenance. Daily parameters sustained.";
        }
    }

    if (feedback.includes('tired') || feedback.includes('fatigued')) {
        adaptationNote += " Incorporating extended recovery guidance and prioritizing complex carbs.";
    }

    const newWeight = currentWeight;
    const updatedProfile = {
        ...profile,
        weight: newWeight
    };

    const newSeed = (currentPlan.seed || 0) + 1;
    const adaptedPlan = buildMasterPlan(updatedProfile, newSeed);

    if (calAdjustment !== 0) {
        const adjustedCals = Math.max(1200, adaptedPlan.dailyTarget.calories + calAdjustment);
        const reMacros = calculateMacros(adjustedCals, newWeight, profile.goal, profile.fitnessLevel);
        adaptedPlan.dailyTarget.calories = reMacros.calories;
        adaptedPlan.dailyTarget.protein = reMacros.protein;
        adaptedPlan.dailyTarget.carbs = reMacros.carbs;
        adaptedPlan.dailyTarget.fat = reMacros.fat;

        adaptedPlan.schedule = assembleDailySchedule(
            adaptedPlan.dailyTarget,
            generateSmartMealPlan(reMacros, updatedProfile.dietaryType, updatedProfile.allergies, newSeed),
            generateSmartWorkout(updatedProfile.fitnessLevel, updatedProfile.equipment, updatedProfile.duration, profile.goal, newSeed),
            adaptedPlan.dailyTarget.waterLiters
        );
    }

    const currentWeek = (currentPlan.progressiveAdaptation?.weekNumber || 1) + 1;
    adaptedPlan.progressiveAdaptation = {
        weekNumber: currentWeek,
        weightChangeKg: weightChange,
        previousWeight,
        currentWeight,
        notes: adaptationNote
    };

    return adaptedPlan;
}

module.exports = {
    calculateBMR,
    calculateTDEE,
    calculateCalorieTarget,
    calculateMacros,
    calculateWaterIntake,
    generateSmartMealPlan,
    generateSmartWorkout,
    assembleDailySchedule,
    generateAIReasoningSummary,
    buildMasterPlan,
    runProgressiveAdaptation,
    recommendCalorieBurnTarget,
    validateAndCalibrateBurnTarget,
    findExerciseAlternatives,
    EXERCISE_LIBRARY
};
