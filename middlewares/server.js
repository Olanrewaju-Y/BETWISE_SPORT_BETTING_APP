const jwt = require("jsonwebtoken")



const validateEmailFormat = () => {

    

}




// --- Conceptual Authentication Middleware (add this or similar to your server.js) ---
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.status(401).json({ message: "No token provided." });

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(403).json({ message: "User not found for token." });
        }
        req.user = user; // Attach user to request object (req.user.id, req.user.role, etc.)
        next();
    } catch (err) {
        console.error("Token verification error:", err.message);
        return res.status(403).json({ message: "Invalid or expired token." });
    }
};




module.exports = {
    validateEmailFormat,
    authenticateToken
}