"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function requireRole(role) {
    return (req, res, next) => {
        const authReq = req;
        const authUser = authReq.user;
        if (!authUser) {
            return res.status(401).json({
                message: "you are not auth user!",
            });
        }
        if (authUser.role !== role) {
            return res.status(403).json({
                message: "you do not have the correct role to access this.",
            });
        }
        next();
    };
}
exports.default = requireRole;
