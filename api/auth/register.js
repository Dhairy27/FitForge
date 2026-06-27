const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { connectToDatabase } = require('../lib/db');

// Helper to hash password using Node's native crypto
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { name, email, password } = req.body;

  // 1. Validate inputs
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please provide name, email, and password.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  try {
    // 2. Connect to database
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    const cleanEmail = email.toLowerCase().trim();

    // 3. Check if user already exists
    const existingUser = await usersCollection.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // 4. Securely hash password
    const { salt, hash } = hashPassword(password);

    // 5. Create user record
    const newUser = {
      name: name.trim(),
      email: cleanEmail,
      passwordSalt: salt,
      passwordHash: hash,
      createdAt: new Date(),
      updatedAt: new Date(),
      appState: null
    };

    const insertResult = await usersCollection.insertOne(newUser);

    // 6. Sign JWT session token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: 'Server configuration error: JWT Secret is missing.' });
    }

    const token = jwt.sign(
      { userId: insertResult.insertedId.toString(), email: cleanEmail },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // 7. Return session
    return res.status(201).json({
      token,
      user: {
        name: newUser.name,
        email: newUser.email,
        picture: null
      },
      state: null
    });

  } catch (error) {
    console.error('Registration API error:', error);
    return res.status(500).json({ error: 'Internal Server Error during registration.' });
  }
};
