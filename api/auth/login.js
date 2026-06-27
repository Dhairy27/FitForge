const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { connectToDatabase } = require('../lib/db');

// Helper to verify passwords against salt and hash
function verifyPassword(password, salt, storedHash) {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === storedHash;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { email, password } = req.body;

  // 1. Validate inputs
  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter both email and password.' });
  }

  try {
    // 2. Connect to database
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    const cleanEmail = email.toLowerCase().trim();

    // 3. Find User
    const user = await usersCollection.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 4. Verify user has password credentials (wasn't just registered via Google)
    if (!user.passwordHash || !user.passwordSalt) {
      return res.status(401).json({ 
        error: 'This account was registered using Google Sign-In. Please click "Sign in with Google" instead.' 
      });
    }

    // 5. Verify password
    const isPasswordValid = verifyPassword(password, user.passwordSalt, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 6. Sign JWT session token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: 'Server configuration error: JWT Secret is missing.' });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // 7. Return session details
    return res.status(200).json({
      token,
      user: {
        name: user.name,
        email: user.email,
        picture: user.picture || null
      },
      state: user.appState
    });

  } catch (error) {
    console.error('Credentials Login API error:', error);
    return res.status(500).json({ error: 'Internal Server Error during sign in.' });
  }
};
