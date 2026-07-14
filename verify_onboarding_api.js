async function verifyUserFlow(location, equipment, duration, fitnessLevel, goals, forbiddenWords) {
    const email = `verify_${Date.now()}_${location}_${fitnessLevel}@fitforge.com`;
    console.log(`\n=== Running Test: Location=${location}, Level=${fitnessLevel}, Equipment=${JSON.stringify(equipment)} ===`);

    // 1. Sign Up
    const signupRes = await fetch("http://localhost:3050/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Verify Robot", email, password: "Password123!" })
    });
    if (!signupRes.ok) throw new Error(`Signup failed: ${signupRes.statusText}`);

    // 2. Submit Protocol
    const protocolPayload = {
        email,
        age: 25,
        biologicalSex: "male",
        height: 180,
        weight: 75,
        occupation: "QA Engineer",
        activityLevel: "moderate",
        goals,
        location,
        equipment,
        duration,
        fitnessLevel
    };
    const protoSaveRes = await fetch("http://localhost:3050/api/user/protocol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(protocolPayload)
    });
    if (!protoSaveRes.ok) throw new Error(`Protocol save failed: ${protoSaveRes.statusText}`);

    // 3. Synthesize Plan
    const workoutRes = await fetch("http://localhost:3050/api/user/workout-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    });
    if (!workoutRes.ok) throw new Error(`Workout synthesis failed: ${workoutRes.statusText}`);

    const workoutData = await workoutRes.json();
    const plan = workoutData.plan;
    console.log(`Plan Type: ${plan.planType}`);

    // Verify Rest
    let expectedRest = 90;
    if (fitnessLevel === "intermediate") expectedRest = 60;
    if (fitnessLevel === "advanced") expectedRest = 45;
    console.log(`Verifying Rest: ${plan.restSecs}s (Expected: ${expectedRest}s)`);
    if (plan.restSecs !== expectedRest) {
        throw new Error(`Rest calibration mismatch: Got ${plan.restSecs}s instead of ${expectedRest}s`);
    }

    // Verify Exercises
    const expectedNumExercises = Math.min(5, Math.max(2, Math.floor(duration / 15) + 1));
    const days = plan.days;

    for (let dNum = 1; dNum <= 7; dNum++) {
        const day = days[dNum];
        if (day) {
            console.log(`  Day ${dNum}: ${day.name} - ${day.exercises.length} exercises`);
            if (day.exercises.length !== expectedNumExercises) {
                throw new Error(`Exercise quantity mismatch: Day ${dNum} has ${day.exercises.length} exercises instead of ${expectedNumExercises}`);
            }

            day.exercises.forEach((ex, idx) => {
                console.log(`    ${idx + 1}. ${ex.name} (Sets: ${ex.sets})`);

                // Check forbidden equipment
                forbiddenWords.forEach(word => {
                    if (ex.name.toLowerCase().includes(word.toLowerCase())) {
                        throw new Error(`Strict Equipment constraint violated: Found forbid word '${word}' in exercise '${ex.name}'`);
                    }
                });
            });
        }
    }

    console.log(`🟢 Custom profile checks passed successfully!`);
}

async function runAllTests() {
    console.log("=== Staging FitForge Equipment Adaptations Verification ===");

    // Test 1: Home Location, Dumbbells & Bodyweight only. Checked that no heavy gym tools (Barbell, Cable, Machine) are recommended.
    await verifyUserFlow(
        "home",
        ["bodyweight", "dumbbells"],
        30,
        "intermediate",
        ["Muscle Gain", "Flexibility"],
        ["Barbell", "Cable", "Smith Machine", "Leg Press", "Lat Pulldown"]
    );

    // Test 2: Gym Location, Bodyweight-only. Checked that NO external tools (Barbell, Dumbbell, Kettlebell, Band, Machine) are recommended.
    await verifyUserFlow(
        "gym",
        ["bodyweight"],
        45,
        "beginner",
        ["Weight Loss", "Flexibility"],
        ["Barbell", "Dumbbell", "Kettlebell", "Resistance Band", "Cable", "Smith Machine", "Leg Press", "Lat Pulldown"]
    );

    console.log("\n🎉 ALL STRICT EQUIPMENT ADAPTATION TESTS PASSED!");
}

runAllTests().catch(err => {
    console.error("\n❌ Testing Failed:\n", err);
    process.exit(1);
});
