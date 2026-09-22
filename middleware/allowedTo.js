module.exports = (...roles) => {
    const normalizedRoles = roles.map(r => r.toUpperCase());
    return (req, res, next) => {
        const userRole = (req.currentUser?.role || '').toUpperCase();
        if (userRole === 'OWNER' || normalizedRoles.includes(userRole) || (normalizedRoles.includes('MANEGER') && userRole === 'MANAGER') || (normalizedRoles.includes('MANAGER') && userRole === 'MANEGER')) {
            return next();
        }
        return res.status(403).json({ message: 'This role is not authorized' });
    };
};