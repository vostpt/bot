const { token: validToken } = require('../../../config/rest');

const validateToken = (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.sendStatus(401);
  }

  const token = authorization.split('Bearer ')[1];

  if (!token || token !== validToken) {
    return res.sendStatus(403);
  }

  return next();
};

module.exports = validateToken;
