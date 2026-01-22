const User = require('../models/user');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const Session = require('../models/session');
const useragent = require('useragent');
const Order = require('../models/order');
const { generateVerificationEmail } = require('../helpers/emailUtils');
const sendEmail = require('../config/mailer');

// Register endpoint
const registerUser = async (req, res) => {
    try {
        const { firstName, lastName, username, email, password } = req.body;

        // Check if username was entered and if it's correct format
        const usernameRegex = /^[a-zA-Z0-9._-]+$/;
        if (!username || !usernameRegex.test(username)) {
            return res.status(400).json({
                error: 'Username is required and can only contain letters, numbers, ".", "-", or "_".'
            })
        }

        // Check email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({
                error: 'A valid email is required.'
            });
        }

        // Check if password is good
        if (!password || password.length < 8) {
            return res.status(400).json({
                error: 'Password is required and should be at least 8 characters long.'
            })
        }

        // Check if name is good
        const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
        if (!firstName || !nameRegex.test(firstName) || !lastName || !nameRegex.test(lastName)) {
            return res.status(400).json({
                error: 'First name and last name are required and should only contain letters and spaces.'
            });
        }

        // Check if email or username is already in use
        let existingUser;
        existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already in use' });
        }

        // Capitalize the first letter of each name
        const formattedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
        const formattedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1);

        // Create new user
        const user = new User({
            firstName: formattedFirstName,
            lastName: formattedLastName,
            fullName: `${formattedFirstName} ${formattedLastName}`,
            username,
            email
        })

        const registeredUser = await User.register(user, password)

        // Generate a verification token
        const verificationToken = jwt.sign(
            { userId: registeredUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        registeredUser.verificationToken = verificationToken;
        await registeredUser.save();

        // Send verification email
        const { subject, html } = generateVerificationEmail(registeredUser, verificationToken);
        await sendEmail(registeredUser.email, subject, html);

        // Return the user data without the password
        const { salt, hash, ...userWithoutPassword } = registeredUser._doc;

        return res.json(userWithoutPassword);
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
}

// Login endpoint
const loginUser = async (req, res, next) => {
    passport.authenticate('local', async (err, user, info) => {
        if (err) {
            return next(err);
        }
        // If user is not found or credentials are wrong
        if (!user) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        // Check if user is banned
        if (user.status === 'banned') {
            return res.status(403).json({ error: 'Your account has been banned. Please contact support.' });
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(403).json({ error: "Please verify your email before logging in." });
        }

        // Reactivate an inactive account
        if (user.status === 'inactive') {
            try {
                await User.findByIdAndUpdate(user._id, { status: 'active' });
                console.log(`User ${user.email} has been reactivated.`);
                user.status = 'active';
            } catch (updateError) {
                console.error('Error reactivating user:', updateError);
                return res.status(500).json({ error: 'Failed to update user status' });
            }
        }

        // Authentication is successful, log the user in
        req.logIn(user, async (err) => {
            if (err) {
                console.error('Login error:', err);
                return res.status(500).json({ error: 'Login failed' });
            }

            // Generate a JWT token
            const accessToken = jwt.sign(
                {
                    UserInfo: {
                        id: user._id,
                        role: user.role
                    }
                },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            )

            // Detect device information
            const agent = useragent.parse(req.headers['user-agent']);
            const deviceType = agent.device.family || 'Unknown';
            const deviceName = `${agent.os.family} ${agent.os.major}`;
            const ipAddress = req.ip;

            // Store the session in the database
            try {
                const session = new Session({
                    userId: user._id,
                    token: accessToken,
                    deviceType,
                    deviceName,
                    ipAddress,
                    createdAt: new Date()
                });
                await session.save();
            } catch (sessionError) {
                console.error('Session save error:', sessionError);
                return res.status(500).json({ error: 'Failed to create user session' });
            }

            // If there's a guest cart, move the data to the logged-in user
            const guestId = req.cookies.guestId;

            if (guestId) {
                try {
                    const guestCart = await Order.findOne({ guestId: guestId, status: 'cart' });

                    if (guestCart) {
                        guestCart.user = user._id;
                        guestCart.guestId = undefined; // Remove guestId
                        await guestCart.save();
                    }
                } catch (error) {
                    console.error('Error moving guest cart to user:', error);
                    return res.status(500).json({ error: 'Failed to move guest cart to user' });
                }

                // Remove the guestId cookie
                res.clearCookie('guestId');
            }

            // Update lastLogin timestamp
            try {
                await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
            } catch (updateError) {
                console.error('Error updating lastLogin:', updateError);
            }

            // Storing token in cookies
            res.cookie('token', accessToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 7 * 24 * 60 * 60 * 1000
            })

            // Sending back user without password data
            const { salt, hash, ...userWithoutPassword } = user._doc;

            res.json({ message: 'Logged in successfully', user: userWithoutPassword, token: accessToken });
        })
    })(req, res, next);
}

const getAuth = (req, res) => {
    const { token } = req.cookies;

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: 'Invalid Token' });
            }

            // Check if the session exists and is valid
            const session = await Session.findOne({ userId: decoded.UserInfo.id, token });

            if (!session) {
                return res.status(401).json({ message: 'Invalid or expired session!' });
            }

            res.json({ user: decoded.UserInfo, accessToken: token });
        })
    } else {
        return res.status(401).json({ error: 'No token found' });
    }
}

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ error: "Invalid token or user not found." });
        }

        user.isVerified = true;
        user.verificationToken = null;
        await user.save();

        return res.json({ message: "Email verified successfully!" });
    } catch (error) {
        return res.status(400).json({ error: "Invalid or expired token." });
    }
}

const forgotPassword = async (req, res) => {
    const { email } = req.body;

    console.log(email)

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const resetToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        user.resetToken = resetToken;
        user.resetTokenExpires = Date.now() + 3600000;
        await user.save();

        const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
        const emailContent =
            `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #fc814a; text-align: center;">Password Reset</h2>
                <p style="text-align: center;">Click the link below to reset your password:</p>
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${resetLink}" 
                       style="background-color: #fc814a; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-size: 16px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p style="text-align: center;">This link will expire in 1 hour.</p>
                <p style="text-align: center;">If you did not request a password change, you can ignore this email.</p>
                <p style="text-align: center;">Best regards,<br>ProcureWise</p>
            </div>
        `

        await sendEmail(user.email, "Password Reset Request", emailContent);

        res.json({ message: "Reset password link has been sent to your email" });

    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
}

const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    console.log(newPassword)

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({
            _id: decoded.userId,
            resetToken: token,
            resetTokenExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        console.log(newPassword)

        if (newPassword.length < 8) {
            return res.status(400).json({
                message: 'Password should be at least 8 characters long.'
            })
        }

        await user.setPassword(newPassword);
        await user.save();

        user.resetToken = undefined;
        user.resetTokenExpires = undefined;

        await user.save();

        // Delete all active sessions after password change
        await Session.deleteMany({ userId: user._id });

        res.json({ message: "Password has been reset successfully" });

    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
}

module.exports = {
    registerUser,
    loginUser,
    getAuth,
    verifyEmail,
    forgotPassword,
    resetPassword
}
