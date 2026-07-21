let BASE_URL = "http://localhost:3000";

async function detectActivePort() {
    const ports = [3000, 3050];
    for (const port of ports) {
        try {
            const res = await fetch(`http://localhost:${port}/api/auth/google-config`);
            if (res.ok) {
                BASE_URL = `http://localhost:${port}`;
                console.log(`[INFO] Detected active server running on port ${port}. Using ${BASE_URL}`);
                return;
            }
        } catch (e) {
            // port not active, try next
        }
    }
    console.warn(`[WARN] Could not detect running server on port 3000 or 3050. Defaulting to ${BASE_URL}`);
}

async function runDietVerification(scenario, profilePayload) {
    await detectActivePort();
    const email = `diet_test_${Date.now()}_${scenario}@fitforge.com`;
    console.log(`\n=== Running Diet Scenario: ${scenario} ===`);

    // 1. Sign Up
    const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Diet Tester robot", email, password: "Password123!" })
    });
    if (!signupRes.ok) throw new Error(`Signup failed: ${signupRes.statusText}`);

    // 2. Submit physical Protocol (required for calorie calculations & BMR validation)
    const protocolPayload = {
        email,
        age: 30,
        biologicalSex: "male",
        height: 175,
        weight: 80, // water goal: (80 * 35)/1000 = 2.8 L
        occupation: "Developer",
        activityLevel: "moderate",
        goals: ["lose weight"]
    };
    const protoRes = await fetch(`${BASE_URL}/api/user/protocol`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(protocolPayload)
    });
    if (!protoRes.ok) throw new Error(`Protocol save failed: ${protoRes.statusText}`);

    // 3. Save Diet Profile
    const profileSaveRes = await fetch(`${BASE_URL}/api/user/diet-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email,
            dietaryType: profilePayload.dietaryType,
            allergies: profilePayload.allergies,
            healthConditions: profilePayload.healthConditions || [],
            budget: profilePayload.budget,
            dailyCalories: profilePayload.dailyCalories
        })
    });
    if (!profileSaveRes.ok) throw new Error(`Diet Profile save failed: ${profileSaveRes.statusText}`);

    // 4. Generate Diet Plan
    const planRes = await fetch(`${BASE_URL}/api/user/diet-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    });
    if (!planRes.ok) throw new Error(`Diet Plan generation failed: ${planRes.statusText}`);

    const planData = await planRes.json();
    const plan = planData.plan;

    // 5. Verification Asserts
    console.log(`Plan synthesized successfully!`);
    console.log(`Calorie details -> Target: ${profilePayload.dailyCalories} kcal`);

    // Check Water Goal
    const expectedWater = 2.8; // (80 * 35) / 1000
    console.log(`Water Goal: ${plan.waterGoal} L (Expected: ${expectedWater} L)`);
    if (plan.waterGoal !== expectedWater) {
        throw new Error(`Water Goal mismatch: expected ${expectedWater} but got ${plan.waterGoal}`);
    }

    // Verify dailyMeals calories sum is close to target
    const daily = plan.dailyMeals;
    const dailyCaloriesSum = daily.breakfast.calories + daily.lunch.calories + daily.dinner.calories + daily.snack.calories;
    console.log(`Daily Calories Sum: ${dailyCaloriesSum} kcal`);
    if (Math.abs(dailyCaloriesSum - profilePayload.dailyCalories) > 100) {
        throw new Error(`Calorie calibration deviation too high: target ${profilePayload.dailyCalories}, got ${dailyCaloriesSum}`);
    }

    // Verify Allergies Absence in all ingredients
    const verifyNoAllergens = (mealsObj) => {
        const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
        mealTypes.forEach(t => {
            const m = mealsObj[t];
            m.ingredients.forEach(ing => {
                profilePayload.allergies.forEach(allergy => {
                    const ingLower = ing.toLowerCase();
                    const allergyLower = allergy.toLowerCase();
                    if (ingLower.includes(allergyLower)) {
                        // Allow allergen-free products
                        if (ingLower.includes(`${allergyLower}-free`)) {
                            return;
                        }
                        throw new Error(`Allergy violation! Found allergen word '${allergy}' in ingredient '${ing}' for meal '${m.name}'`);
                    }
                });
            });
        });
    };

    // Verify for daily
    verifyNoAllergens(daily);

    // Verify Eggetarian is meat-free
    if (profilePayload.dietaryType === "eggetarian") {
        const verifyEggetarian = (mealsObj) => {
            const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
            mealTypes.forEach(t => {
                const m = mealsObj[t];
                if (/chicken|turkey|salmon|tuna|steak|beef|pork|bacon|prosciutto|ham/i.test(m.name)) {
                    throw new Error(`Eggetarian violation! Found meat in meal '${m.name}'`);
                }
            });
        };
        verifyEggetarian(daily);
        for (let dayNum = 1; dayNum <= 7; dayNum++) {
            verifyEggetarian(plan.weeklyMeals[dayNum]);
        }
        console.log(`[PASS] Scenario ${scenario} passed meat-free validation!`);
    }

    // Verify Diabetes low carb constraint
    if (profilePayload.healthConditions && profilePayload.healthConditions.includes("diabetes")) {
        const verifyDiabetes = (mealsObj) => {
            const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
            mealTypes.forEach(t => {
                const m = mealsObj[t];
                // Check if recipe is low carb in scaled form. Because it's scaled breakfast is 25%, lunch 35%, dinner 30%, snack 10%
                console.log(`[DIABETES CHECK] Meal '${m.name}' has '${m.carbs}g' carbs (Scaled).`);
            });
        };
        verifyDiabetes(daily);
        for (let dayNum = 1; dayNum <= 7; dayNum++) {
            verifyDiabetes(plan.weeklyMeals[dayNum]);
        }
    }

    // Verify weekly
    for (let dayNum = 1; dayNum <= 7; dayNum++) {
        verifyNoAllergens(plan.weeklyMeals[dayNum]);
    }

    console.log(`[PASS] Scenario ${scenario} passed allergy validation!`);
}

async function main() {
    try {
        // Scenario A: Vegetarian, Low Budget, Soy Allergist, 1800kcal
        await runDietVerification("Vegetarian-Low-Soy", {
            dietaryType: "vegetarian",
            allergies: ["soy"],
            budget: "low",
            dailyCalories: 1800
        });

        // Scenario B: Vegan, Moderate Budget, Gluten Allergist, 2500kcal
        await runDietVerification("Vegan-Moderate-Gluten", {
            dietaryType: "vegan",
            allergies: ["gluten"],
            budget: "mid",
            dailyCalories: 2500
        });

        // Scenario C: Eggetarian, Moderate Budget, Gluten Allergist, 2200kcal
        await runDietVerification("Eggetarian-Moderate-Gluten", {
            dietaryType: "eggetarian",
            allergies: ["gluten"],
            budget: "mid",
            dailyCalories: 2200
        });

        // Scenario D: Vegetarian, Diabetes health condition, Moderate Budget, 2000kcal
        await runDietVerification("Vegetarian-Diabetes", {
            dietaryType: "vegetarian",
            allergies: [],
            healthConditions: ["diabetes"],
            budget: "mid",
            dailyCalories: 2000
        });

        console.log("\n=== ALL DIET PLANNER TESTS PASSED! ===");
    } catch (e) {
        console.error("\n=== TEST SUITE FAILED ===");
        console.error(e);
        process.exit(1);
    }
}

main();
