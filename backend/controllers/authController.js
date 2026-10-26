import bcrypt from 'bcrypt';
import UserModel from '../models/usersModel.js';
import Club from '../models/Club.js';
import { registerSchema, verifySchema, resendSchema, loginSchema, forgotSchema, resetSchema } from '../validators/authValidations.js';
import jwt from 'jsonwebtoken';
import { generateOTP, sendEmailOTP, sendPhoneOTP } from '../utils/notification.js';
export const register = async (req, res) => {
    try {
        const result = registerSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ errors: result.error.issues[0].message });
        }

        const { name, email, password, q_id, phone, course, year, section } = result.data;

        const emailOtp = generateOTP();
        const phoneOtp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await UserModel.create({
            name, email, phone, section, q_id, year, course,
            password: hashedPassword,
            emailOtp,
            phoneOtp,
            otpExpiry,
            role: 'student'
        });
        if (!user) {
            return res.status(400).json({
                message: "User with this email or phone already exists"
            })
        }

        try {
            await Promise.all([
                sendEmailOTP(email, emailOtp),
                sendPhoneOTP(phone, phoneOtp)
            ]);
        } catch (err) {
            console.error("Error sending OTPs:", err);
        }

        return res.status(201).json({
            message: "Registration successful. Please verify your email and phone.",
            userId: user._id
        });

    } catch (error) {
        return res.status(500).json({ message: "Registration failed", error: error.message });
    }
};
export const login = async (req, res) => {
    try {
        const result = loginSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.issues[0].message });
        }

        const { identifier, password } = result.data;
        if (!identifier || !password) {
            return res.status(400).json({ message: "Please provide Q-ID/Email/Phone or Club ID and password" });
        }

        // --- 1. Try to authenticate as regular user (student/admin) ---
        let user = await UserModel.findOne({
            $or: [
                { email: identifier },
                { phone: identifier },
                { q_id: identifier }
            ]
        }).select("+password");

        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Invalid credentials" });
            }

            if (!user.isVerified) {
                return res.status(403).json({
                    message: "Account not verified. Please verify your details.",
                    isVerified: false,
                    userId: user._id
                });
            }

            const token = jwt.sign(
                { id: user._id, role: user.role || "student" },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );
            return res.status(200).json({
                message: "Login successful",
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    q_id: user.q_id,
                    email: user.email,
                    role: user.role || 'student'
                }
            });
        }

        // --- 2. Fallback: authenticate as club using clubId or contactEmail ---
        const club = await Club.findOne({
            $or: [
                { clubId: identifier },
                { contactEmail: identifier.toLowerCase() }
            ]
        });

        if (!club) {
            return res.status(404).json({ message: "User or club not found" });
        }

        const clubMatch = await bcrypt.compare(password, club.passwordHash);
        if (!clubMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: club._id, role: 'club' },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: club._id,
                name: club.name,
                clubId: club.clubId,
                role: 'club'
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ message: "Login failed", error: error.message });
    }
};

export const verifyUser = async (req, res) => {
    try {
        const result = verifySchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.issues[0].message });
        }

        const { userId, otp, type } = result.data;

        if (!userId || !otp || !['email', 'phone'].includes(type)) {
            return res.status(400).json({ message: "Invalid request. Provide userId, otp, and type ('email' or 'phone')." });
        }

        const user = await UserModel.findById(userId).select("+emailOtp +phoneOtp +otpExpiry");
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.isVerified) {
            return res.status(400).json({ message: "User is already fully verified." });
        }

        if (!user.otpExpiry || user.otpExpiry.getTime() < Date.now()) {
            return res.status(400).json({ message: "OTP has expired. Please request a resend." });
        }

        let isCurrentVerificationSuccessful = false;

        if (type === 'email') {
            if (!user.emailOtp) return res.status(400).json({ message: "Email is already verified." });

            if (user.emailOtp === otp) {
                user.emailOtp = null;
                isCurrentVerificationSuccessful = true;
            } else {
                return res.status(400).json({ message: "Invalid Email OTP." });
            }
        }

        else if (type === 'phone') {
            if (!user.phoneOtp) return res.status(400).json({ message: "Phone is already verified." });

            if (user.phoneOtp === otp) {
                user.phoneOtp = null;
                isCurrentVerificationSuccessful = true;
            } else {
                return res.status(400).json({ message: "Invalid Phone OTP." });
            }
        }
        let token = null;
        if (!user.emailOtp && !user.phoneOtp) {
            user.isVerified = true;
            user.otpExpiry = null;
            token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        }

        await user.save();

        if (user.isVerified) {
            return res.status(200).json({
                message: "Account fully verified!",
                status: "fully_verified",
                token,
            });
        } else {
            return res.status(200).json({
                message: `${type === 'email' ? 'Email' : 'Phone'} verified successfully.`,
                status: "partially_verified",
                pending: type === 'email' ? "phone" : "email"
            });
        }

    } catch (error) {
        return res.status(500).json({ message: "Verification failed", error: error.message });
    }
};

export const resendOtp = async (req, res) => {
    try {
        const result = resendSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.issues[0].message });
        }

        const { userId, type } = result.data;

        if (!userId || !['email', 'phone'].includes(type)) {
            return res.status(400).json({
                message: "Invalid request. Provide 'userId' and 'type' (email/phone)."
            });
        }

        const user = await UserModel.findById(userId).select("+emailOtp +phoneOtp +otpExpiry");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "Account is already fully verified." });
        }

        const newOtp = generateOTP();
        const newExpiry = new Date(Date.now() + 10 * 60 * 1000);

        if (type === 'email') {
            if (user.emailOtp === null) {
                return res.status(400).json({ message: "Email is already verified. You don't need to resend." });
            }

            user.emailOtp = newOtp;
            user.otpExpiry = newExpiry;

            await sendEmailOTP(user.email, newOtp);
        }

        else if (type === 'phone') {
            if (user.phoneOtp === null) {
                return res.status(400).json({ message: "Phone is already verified. You don't need to resend." });
            }

            user.phoneOtp = newOtp;
            user.otpExpiry = newExpiry;

            await sendPhoneOTP(user.phone, newOtp);
        }

        await user.save();

        return res.status(200).json({
            message: `New OTP sent to your ${type}.`,
            otpExpiry: newExpiry
        });

    } catch (error) {
        console.error("Resend Error:", error);
        return res.status(500).json({
            message: "Failed to resend OTP",
            error: error.message
        });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const validation = forgotSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.issues[0].message });
        }

        const { email } = validation.data;

        const user = await UserModel.findOne({ email }).select("+emailOtp +otpExpiry");
        if (!user) {
            return res.status(404).json({ message: "User with this email does not exist." });
        }

        if (!user.isVerified) {
            return res.status(403).json({ message: "Account not verified. Please verify registration first." });
        }

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); 
        user.emailOtp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();


        await sendEmailOTP(email, otp);

        return res.status(200).json({ message: "Password reset OTP sent to your email." });

    } catch (error) {
        return res.status(500).json({ message: "Something went wrong", error: error.message });
    }
};

export const resetPassword = async (req, res) => {
    try {

        const validation = resetSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.issues[0].message });
        }

        const { email, otp, newPassword } = validation.data;

        const user = await UserModel.findOne({ email }).select("+emailOtp +otpExpiry");
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.emailOtp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (user.otpExpiry < Date.now()) {
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);


        user.password = hashedPassword;
        user.emailOtp = null; 
        user.otpExpiry = null;
        await user.save();

        return res.status(200).json({ message: "Password has been reset successfully. You can now login." });

    } catch (error) {
        return res.status(500).json({ message: "Reset failed", error: error.message });
    }
};

export const updateUserProfile = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Prevent updating email, phone, password, and verification status
    delete updates.email;
    delete updates.phone;
    delete updates.password;
    delete updates.isVerified; 
    delete updates.emailOtp;
    delete updates.phoneOtp;
    delete updates.otpExpiry;

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user._id,
      updates,
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-password'); 

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error updating profile', error: error.message });
  }
};