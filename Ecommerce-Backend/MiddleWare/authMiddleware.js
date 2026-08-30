
var jwt = require("jsonwebtoken");

var authMiddleware = async (req, res, next) => {
    try {

        var authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "No token found"
            });
        }

        var token = authHeader.split(" ")[1];
        var decoded = jwt.verify(token, process.env.JWT_TOKEN);
        req.user = decoded;

        next();

    } catch (error) {

        console.log("JWT ERROR:", error.message);

        return res.status(401).json({
            message: "Invalid or malformed token"
        });
    }
};

module.exports = authMiddleware;