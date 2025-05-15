const jwt = require('jsonwebtoken');
const User = require("../models/users");

const auth = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        
        if (!token) {
            return res.redirect("/login");
        }

        const decoded = jwt.verify(token, 'shhh'); // Use the same secret as in your login route
        const user = await User.findOne({ _id: decoded.userid });

        if (!user) {
            res.clearCookie('token');
            return res.redirect("/login");
        }

        req.token = token;
        req.user = user;
        res.locals.user = user; // Make user available in all views
        
        // Set layout based on user role
        if (user.role === 'admin') {
            req.app.set('layout', 'backendviews/layout');
        } else {
            req.app.set('layout', false); // No layout for regular users
        }

        next();
    } catch (error) {
        res.clearCookie('token');
        res.redirect("/login");
    }
};

module.exports = auth; 