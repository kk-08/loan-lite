const httpStatusCodes = require("http-status-codes");
const AppError = require("../errors/AppError");
const RequestError = require("../errors/RequestError");
const Constants = require("../utils/Constants");
const UserModel = require("../models/User.model");


class User {
    static #AUTH_HEADER = 'authorization';

    static authenticate(type) {
        if (!Object.values(Constants.USERS.TYPE).includes(type)) throw new AppError(`User type ${type} does not exist!`);

        return function authenticateUser(req, res, next) {
            const authorization = req.get(User.#AUTH_HEADER);
            const { email, passHash } = User.#validateBasicAuthAndGetUserPass(authorization);
            const user = UserModel.findOne({ email });
            if (user?.password === passHash) {
                if (user.type === type) {
                    req.user = user;
                } else {
                    throw new RequestError(httpStatusCodes.StatusCodes.FORBIDDEN);
                }
            } else {
                throw new RequestError(httpStatusCodes.StatusCodes.UNAUTHORIZED);
            }
            next();
        }
    }

    static #validateBasicAuthAndGetUserPass(authHeader) {
        const [identifier, creds] = authHeader.split(' ');
        if (identifier === 'Basic' && creds) {
            const [email, passHash] = Buffer.from(creds, 'base64')
                .toString()
                .split(':');
            if (email && passHash) {
                return { email, passHash };
            }
        }
        throw new RequestError(httpStatusCodes.StatusCodes.UNAUTHORIZED);
    }
}

module.exports = User;