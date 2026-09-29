const http = require('http');

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'http://localhost:3000');
    const reqHeaders = { ...headers };
    let payload = null;
    if (body) {
      payload = JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch(e) {
          resolve({ status: res.statusCode, raw: data, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runJourney() {
  const timestamp = Date.now();
  const testUser = {
    name: "Auditor User",
    email: `audit_${timestamp}@fitforge.test`,
    password: "Password@123"
  };

  console.log("=== STEP 1: User Signup ===");
  const signupRes = await request('POST', '/api/auth/signup', testUser);
  console.log("Signup status:", signupRes.status, signupRes.data.message || signupRes.data.error);
  if (signupRes.status !== 201) throw new Error("Signup failed");

  console.log("\n=== STEP 2: User Login & Token Acquisition ===");
  const loginRes = await request('POST', '/api/auth/login', { email: testUser.email, password: testUser.password });
  console.log("Login status:", loginRes.status, "Token acquired:", !!loginRes.data.token);
  if (loginRes.status !== 200 || !loginRes.data.token) throw new Error("Login failed");
  const authToken = loginRes.data.token;
  const authHeaders = { 'Authorization': `Bearer ${authToken}` };

  console.log("\n=== STEP 3: Save User Protocol Baseline ===");
  const protoRes = await request('POST', '/api/user/protocol', {
    email: testUser.email,
    goal: 'muscle_gain',
    experienceLevel: 'intermediate',
    location: 'gym',
    equipment: ['barbell', 'dumbbells']
  }, authHeaders);
  console.log("Save protocol status:", protoRes.status, protoRes.data.message || protoRes.data.error);
  if (protoRes.status !== 200) throw new Error("Save protocol failed");

  console.log("\n=== STEP 4: Query User Protocol with Ownership Verification ===");
  const getProtoRes = await request('GET', `/api/user/protocol?email=${encodeURIComponent(testUser.email)}`, null, authHeaders);
  console.log("Get protocol status:", getProtoRes.status, "Goal:", getProtoRes.data.protocol?.goal);
  if (getProtoRes.status !== 200 || getProtoRes.data.protocol?.goal !== 'muscle_gain') throw new Error("Get protocol failed");

  console.log("\n=== STEP 5: IDOR Protection Test (Attacking Another User's Profile) ===");
  const hackerRes = await request('GET', `/api/user/protocol?email=admin@gmail.com`, null, authHeaders);
  console.log("IDOR Attack status:", hackerRes.status, "(Expected 403 Forbidden)");
  if (hackerRes.status !== 403) throw new Error("IDOR protection failed!");

  console.log("\n=== STEP 6: Log Nutrition Entry ===");
  const logMealRes = await request('POST', '/api/nutrition/log', {
    email: testUser.email,
    foodName: "Grilled Chicken Breast with Quinoa",
    calories: 450,
    protein: 42,
    carbs: 35,
    fat: 8
  }, authHeaders);
  console.log("Nutrition log status:", logMealRes.status, "Log ID:", logMealRes.data.log?._id);
  if (logMealRes.status !== 201 || !logMealRes.data.log?._id) throw new Error("Log nutrition failed");
  const logId = logMealRes.data.log._id;

  console.log("\n=== STEP 7: Retrieve Nutrition Logs ===");
  const getLogsRes = await request('GET', `/api/nutrition/logs?email=${encodeURIComponent(testUser.email)}`, null, authHeaders);
  console.log("Get logs status:", getLogsRes.status, "Count:", getLogsRes.data.logs?.length);
  if (getLogsRes.status !== 200 || getLogsRes.data.logs?.length < 1) throw new Error("Get nutrition logs failed");

  console.log("\n=== STEP 8: Delete Nutrition Log Entry ===");
  const delLogRes = await request('DELETE', `/api/nutrition/log/${logId}?email=${encodeURIComponent(testUser.email)}`, null, authHeaders);
  console.log("Delete log status:", delLogRes.status, delLogRes.data.message || delLogRes.data.error);
  if (delLogRes.status !== 200) throw new Error("Delete nutrition log failed");

  console.log("\n=== STEP 9: Log Workout Session ===");
  const logWorkoutRes = await request('POST', '/api/workouts', {
    email: testUser.email,
    workoutName: "Hypertrophy Push Force",
    duration: 3600,
    calories: 420,
    steps: 1200
  }, authHeaders);
  console.log("Workout log status:", logWorkoutRes.status, "Saved workout:", logWorkoutRes.data.workout?.workoutName);
  if (logWorkoutRes.status !== 201) throw new Error("Log workout failed");

  console.log("\n=== STEP 10: Query Workout History ===");
  const getWorkoutsRes = await request('GET', `/api/workouts?email=${encodeURIComponent(testUser.email)}`, null, authHeaders);
  console.log("Workouts list status:", getWorkoutsRes.status, "Count:", getWorkoutsRes.data?.length);
  if (getWorkoutsRes.status !== 200 || getWorkoutsRes.data?.length < 1) throw new Error("Get workouts failed");

  console.log("\n=== STEP 11: Clean Up / Account Deletion ===");
  const delAccountRes = await request('DELETE', `/api/user/account?email=${encodeURIComponent(testUser.email)}`, null, authHeaders);
  console.log("Delete account status:", delAccountRes.status, delAccountRes.data.message || delAccountRes.data.error);
  if (delAccountRes.status !== 200) throw new Error("Delete account failed");

  console.log("\n🎉 ALL PRODUCTION AUDIT INTEGRATION JOURNEY TESTS PASSED SUCCESSFULLY! 🚀");
}

runJourney().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
