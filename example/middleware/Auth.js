module.exports = {
    ensureAuth: function (req, res, next) {
        // Check whether there's an `access_token` in the request
        if (!req.query.access_token){ 
            return res.status(401).json({ code: 401, status: 'error', message: 'You are not authorized' });
        }else{
            next();
        }
    }
}