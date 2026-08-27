const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Authentication: check if user is logged in
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      // Log Role concisely as requested
      console.log(`[AUTH] Role: ${user.role}`);

      req.user = user;
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Authorization: check if user has the correct role(s)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Not authorized, user not found" });
    }
    const userRole = req.user.role ? req.user.role.toString().trim().toLowerCase() : "";
    const authorizedRoles = roles.map(r => r.toString().trim().toLowerCase());

    if (!authorizedRoles.includes(userRole)) {
      // Role error logged here
      return res
        .status(403)
        .json({ message: `You do not have permission to access this route. Your role: "${req.user.role}", Required roles: ${JSON.stringify(roles)}` });
    }
    next();
  };
};

module.exports = { protect, authorize };
