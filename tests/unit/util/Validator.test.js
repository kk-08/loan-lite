const Validator = require("../../../src/utils/Validator");
const AppError = require("../../../src/errors/AppError");
const RequestError = require("../../../src/errors/RequestError");
const validator = require("validator").default;


jest.mock("../../../src/errors/AppError");
jest.mock("../../../src/errors/RequestError");


describe("Validator utility", () => {
    let req, res, next, logger;

    beforeEach(() => {
        req = httpMock.createRequest();
        res = httpMock.createResponse();
        next = jest.fn();
        jest.clearAllMocks();
    });

    test("Should throw AppError if requiredKeys empty or not an array", () => {
        const spec1 = { query: { requiredKeys: [] } };
        const spec2 = { query: { requiredKeys: "" } };

        let error;
        try {
            Validator.getSpecValidator(spec2)(req, res, next);
        } catch (err) {
            error = err;
        }

        expect(error instanceof AppError).toBe(true);
        expect(AppError).toBeCalledWith(expect.stringMatching(/^requiredkeys passed.+is not valid!$/i));
    });

    test("Should throw error if optionalKeys is specified and not an array", () => {
        const spec1 = { query: { optionalKeys: {} } }
        const spec2 = { query: { optionalKeys: "" } };

        let error1, error2;
        try {
            Validator.getSpecValidator(spec1)(req, res, next);
        } catch (error) {
            error1 = error;
        }

        try {
            Validator.getSpecValidator(spec2)(req, res, next);
        } catch (error) {
            error2 = error;
        }

        expect(error1 instanceof AppError).toBe(true);
        expect(error2 instanceof AppError).toBe(true);
        expect(AppError).toBeCalledTimes(2);
        expect(AppError).nthCalledWith(1, expect.stringMatching(/^optionalkeys passed .+ is not valid!$/i));
        expect(AppError).nthCalledWith(2, expect.stringMatching(/^optionalkeys passed .+ is not valid!$/i));
    });

    test("Should call next if expected validations are satisfied", () => {
        const spec = {
            query: {
                requiredKeys: ["someKey"],
                validations: {
                    someKey: { type: "string", maxLength: 10, minLength: 5 }
                }
            }
        };
        req.query = { someKey: "ABCDEFGHI" };
        Validator.getSpecValidator(spec)(req, res, next);

        expect(next).toBeCalledTimes(1);
        expect(next).toBeCalledWith();
    });

    test("Should throw RequestError response if expected validations failed", () => {
        const spec = {
            body: {
                requiredKeys: ["someKey"],
                validations: { someKey: { type: "string", minLength: 1 } }
            }
        };
        try {
            Validator.getSpecValidator(spec)(req, res, next);
        } catch(error) {
            expect(error instanceof RequestError).toBe(true)
            expect(RequestError).toBeCalledWith(400, expect.stringMatching(/^request validation.+failed:.*/i));
        }

        expect(next).not.toBeCalled();
    });

    test("Should validate optionalKeys if specified", () => {
        const spec = {
            params: {
                requiredKeys: ["keyR"],
                optionalKeys: ["keyO1"],
                validations: { 
                    keyR: { type: "string" }, 
                    keyO1: { type: "decimal" }
                }
            }
        };
        req.params = { keyR: "abcd", keyO1: "invalid" };
        validator.isDecimal.mockReturnValueOnce(false);

        let error;
        try {
            Validator.getSpecValidator(spec)(req, res, next);
        } catch (err) {
            error = err;
        }

        expect(validator.isDecimal).toBeCalledTimes(1);
        expect(error instanceof RequestError).toBe(true);
        expect(RequestError).toBeCalledWith(400, expect.stringMatching(/^request validation.+failed:.*/i));
    });

    test("Should throw AppError for invalid validation type", () => {
        const spec = {
            query: { 
                requiredKeys: ["someKey"],
                validations: { someKey: { type: "invalid" } }
            }
        };

        let error;
        try {
            req.query = { someKey: "abcd" };
            Validator.getSpecValidator(spec)(req, res, next);
        } catch (err) {
            error = err;
        }

        expect(error instanceof AppError).toBe(true);
        expect(AppError).toBeCalledTimes(1);
        expect(AppError).toBeCalledWith(`Invalid type: invalid specified for "someKey"`);
    });

    test("Should allow for map validations", () => {
        const spec = {
            body: {
                requiredKeys: ["key1"],
                validations: {
                    key1: { type: "map", spec: {
                        requiredKeys: ["nestedKey1", "nestedKey2"],
                        validations: { nestedKey1: { type: "string" }, nestedKey2: { type: "string" } }
                    }}
                }
            }
        };
        req.body = { key1: { nestedKey1: "abcdefgh", nestedKey2: 1234 } };

        try {
            Validator.getSpecValidator(spec)(req, res, next);
        } catch(error) {
            expect(error instanceof RequestError).toBe(true)
            expect(RequestError).toBeCalledWith(400, expect.stringMatching(/.*key1.+nestedKey2.*/i));
        }
    });

    test("Should allow for custom function validations and return success/error basis function return value", () => {
        const mockFn1 = jest.fn(() => true), mockFn2 = jest.fn(() => false);
        const spec = {
            query: {
                requiredKeys: ["key1", "key2"],
                validations: {
                    key1: { type: "func", func: mockFn1 },
                    key2: { type: "func", func: mockFn2 },
                }
            }
        };
        req.query = { key1: `value1`, key2: `value2` };

        try {
            Validator.getSpecValidator(spec)(req, res, next);
        } catch(error) {
            expect(error instanceof RequestError).toBe(true);
            expect(RequestError).toBeCalledWith(400, expect.stringMatching(/.*key2.*/i));
        }

        expect(mockFn1).toBeCalledTimes(1);
        expect(mockFn1).toBeCalledWith(`value1`);
        expect(mockFn2).toBeCalledTimes(1);
        expect(mockFn2).toBeCalledWith(`value2`);
    });

    test.each(dataProvider.Validator.stringFailure())
        ("Should throw RequestError for string validation failure for: %s", (value) => {
            const spec = {
                query: {
                    requiredKeys: ["key"],
                    validations: { key: { type: "string" } }
                }
            };
            req.query = { key: value };
           
            let error;
            try {
                Validator.getSpecValidator(spec)(req, res, next);
            } catch (err) {
                error = err;
            }

            expect(error instanceof RequestError).toBe(true);
            expect(RequestError).toBeCalledTimes(1);
            expect(RequestError).toBeCalledWith(400, expect.stringMatching(/^request validation.+failed:.*/i));
        });

    test(`Should throw RequestError for type validation failure`, () => {
        const spec = {
            query: {
                requiredKeys: [`dec`, `num`],
                validations: { 
                    dec: { type: "decimal" },
                    num: { type: "wholeNumber" } 
                }
            }
        };
        req.query = { dec: `invalidDecimal`, num: `invalidNumber` };
        validator.isDecimal.mockReturnValueOnce(false).mockReturnValueOnce(true);
        validator.isNumeric.mockReturnValueOnce(false);

        const specValidator = Validator.getSpecValidator(spec);

        try { 
            specValidator(req, res, next);
        } catch (error) {
            expect(error instanceof RequestError).toBe(true);
            expect(RequestError).toBeCalledTimes(1);
            expect(RequestError).lastCalledWith(400, expect.stringMatching(/.*expected type.*/i));
        }

        try { 
            specValidator(req, res, next);
        } catch (error) {
            expect(error instanceof RequestError).toBe(true);
            expect(RequestError).toBeCalledTimes(2);
            expect(RequestError).lastCalledWith(400, expect.stringMatching(/.*expected type.*/i));
        }
    });
    
    test.each(dataProvider.Validator.constraintFailure())
        (`Should fail request for constraint failure for value "%s" with spec validator: "%o"`, (value, specValidation, validatorFunc) => {
            const spec = {
                body: {
                    requiredKeys: ["key"],
                    validations: { key: specValidation }
                }
            };
            req.body = { key: value };
            validator[validatorFunc].mockReturnValueOnce(true);

            let error;
            try {
                Validator.getSpecValidator(spec)(req, res, next);
            } catch (err) {
                error = err;
            }


            expect(validator[validatorFunc]).toBeCalledTimes(1);
            expect(error instanceof RequestError).toBe(true);
            expect(RequestError).toBeCalledTimes(1);
            expect(RequestError).toBeCalledWith(400, expect.stringMatching(/.*expected constraint.*/i));
        });
});