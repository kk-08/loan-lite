const AppError = require("../../../src/errors/AppError");
const RequestError = require("../../../src/errors/RequestError");
const UserMiddleware = require("../../../src/middlewares/User.middleware");
const UserModel = require("../../../src/models/User.model");
const httpStatusCodes = require("http-status-codes");

jest.mock("http-status-codes");
jest.mock("../../../src/errors/AppError");
jest.mock("../../../src/errors/RequestError");
jest.mock("../../../src/models/User.model");


describe("User middleware", () => {
    let req, res, next;
    const user = {
        email: `abcd@gmail.com`,
        password: `TeYtqrh6zDCWFw0IQARpFQEiCjmK7gtPigLRnyCIL/k=`,
        type: `admin`
    }
    const authHeader = `Basic ${Buffer.from(`${user.email}:${user.password}`).toString(`base64`)}`;

    beforeEach(() => {
        req = httpMock.createRequest(),
        res = httpMock.createResponse(),
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe("authenticate function", () => {
        test("Should throw AppError for invalid type passed", () => {
            let error;
            try {
                UserMiddleware.authenticate(`someInvalidType`);
            } catch (err) {
                error = err;
            }
            expect(error instanceof AppError).toBe(true);
        });

        test.each(dataProvider.UserMiddleware.authenticate())
            (`Should return request handler for "%s"`, (type) => {
                const handler = UserMiddleware.authenticate(type);
                
                expect(typeof handler === 'function').toBe(true);
        });

        test(`Should parse email from authorization header and fetch user from DB`, () => {
            req.get.mockReturnValueOnce(authHeader);
            UserModel.findOne.mockReturnValueOnce(user);

            const handler = UserMiddleware.authenticate(user.type);
            handler(req, res, next);
            
            expect(req.get).toBeCalledTimes(1);
            expect(req.get).toBeCalledWith(`authorization`);
            expect(UserModel.findOne).toBeCalledTimes(1);
            expect(UserModel.findOne).toBeCalledWith({ email: user.email });
        });

        test(`Should throw RequestError for password mismatch`, () => {
            req.get.mockReturnValueOnce(authHeader);
            UserModel.findOne.mockReturnValueOnce({
                password: `invalidPassword`, type: user.type 
            });
            
            const handler = UserMiddleware.authenticate(user.type);
            try {
                handler(req, res, next);
            } catch(error) {
                expect(error instanceof RequestError).toBe(true);
                expect(RequestError).toBeCalledTimes(1);
                expect(RequestError).toBeCalledWith(401);
            }
            
        });

        test(`Should throw RequestError for type mismatch`, () => {
            req.get.mockReturnValueOnce(authHeader);
            UserModel.findOne.mockReturnValueOnce({ 
                password: user.password, type: `customer` 
            });
            
            const handler = UserMiddleware.authenticate(user.type);
            try {
                handler(req, res, next);
            } catch(error) {
                expect(error instanceof RequestError).toBe(true);
                expect(RequestError).toBeCalledTimes(1);
                expect(RequestError).toBeCalledWith(403);
            }
            
        });
        
        test(`Should add user object to request`, () => {
            req.get.mockReturnValueOnce(authHeader);
            UserModel.findOne.mockReturnValueOnce(user);
            
            const handler = UserMiddleware.authenticate(user.type);
            handler(req, res, next);
            
            expect(req.user).toStrictEqual(user);
        });
    });
});