const AppMiddleware = require("../../../src/middlewares/App.middleware");
const LoggerClient = require("../../../src/lib/logger/LoggerClient");
const Helper = require("../../../src/utils/Helper");
const createHttpError = require("http-errors");
const httpStatusCodes = require("http-status-codes");


jest.mock("http-errors");
jest.mock("http-status-codes");
jest.mock("../../../src/lib/logger/LoggerClient");
jest.spyOn(Helper, `getUuid`);


describe("App middleware", () => {
    let req, res, next;

    beforeEach(() => {
        req = httpMock.createRequest(),
        res = httpMock.createResponse(),
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe("addRequestMetadata function", () => {
        test("Should call next function", () => {
            AppMiddleware.addRequestMetadata(req, res, next);
            
            expect(next).toBeCalledTimes(1);
        });

        test("Should add data to request object", () => {
            AppMiddleware.addRequestMetadata(req, res, next);

            expect(req).toHaveProperty('ns');
            expect(req.ns).toHaveProperty('id');
            expect(Helper.getUuid).toBeCalledTimes(1);
            expect(req.ns).toHaveProperty('startTime');
            expect(req.ns).toHaveProperty('endTime');

            expect(req).toHaveProperty('logger');
            expect(LoggerClient).toBeCalledTimes(1);
        });
    });

    describe("logRequestBody function", () => {
        test("Should call next function", () => {
            AppMiddleware.requestLogger(req, res, next);

            expect(next).toBeCalledTimes(1);
        });

        test("Should log request data", () => {
            req.method = `METHOD`;
            req.originalUrl = `someUrl`;
            req.headers = { header1: `value`, header2: `value2` };
            const re = new RegExp(`${req.method}.+request.+ip.+(body.+)?(query.+)?header.+${JSON.stringify(req.headers)}` + 
            `.+endpoint.+${req.originalUrl}`, `i`);

            AppMiddleware.requestLogger(req, res, next);


            expect(req.logger.info).toHaveBeenCalledTimes(1);
            expect(req.logger.info).toBeCalledWith(expect.stringMatching(re));
        });

        test("Should log request body and query when received", () => {
            const reqWithBody = { ...req, body: `someData` };
            const reqWithQuery = { ...req, query: `someQuery` };

            AppMiddleware.requestLogger(reqWithBody, res, next);
            AppMiddleware.requestLogger(reqWithQuery, res, next);

            expect(req.logger.info).nthCalledWith(1, expect.stringMatching(/request.+ip.+body.+header.+endpoint/i))
            expect(req.logger.info).nthCalledWith(2, expect.stringMatching(/request.+ip.+query.+header.+endpoint/i))
        });
    });

    describe("logResponseBody function", () => {
        test("Should call next function", () => {
            AppMiddleware.responseLogger(req, res, next);

            expect(next).toBeCalledTimes(1);
        });

        test("Should log response data only on res.end", () => {
            AppMiddleware.responseLogger(req, res, next);

            res.write(Buffer.from(`write1`));
            res.write(Buffer.from(`write2`));
            res.end();
            expect(req.logger.info).lastCalledWith(expect.stringMatching(/.*response.+body.+write1write2.+header.*/i));
        });

        test("Should add res.end data, if present, along with res.write to response log", () => {
            AppMiddleware.responseLogger(req, res, next);

            res.write(Buffer.from(`write1`));
            res.write(Buffer.from(`write2`));
            res.end(Buffer.from(`end`));
            expect(req.logger.info).lastCalledWith(expect.stringMatching(/.*response.+body.+write1write2end.+header.*/i));
        });

        test("Should log latency data on res.end", () => {
            req.ns.startTime = 1;
            req.ns.endTime = 11;
            const re = new RegExp(`.+in ${req.ns.endTime-req.ns.startTime} ms$`, `i`);

            AppMiddleware.responseLogger(req, res, next);
            res.end(Buffer.from("testResponse"));

            expect(req.logger.info).toBeCalledTimes(1);
            expect(req.logger.info).toBeCalledWith(expect.stringMatching(re));
        });

        test("Should log error for error in logging response on res.end", () => {
            AppMiddleware.responseLogger(req, res, next);
            //Causes error in writing to data stream
            res.end("someRandomData");

            expect(req.logger.error).toBeCalledWith(expect.stringMatching(/.*error.+log.+response.*/i));
        });
    });

    describe("notFoundHandler function", () => {
        test("Should call createHttpError with 404", () => {
            AppMiddleware.notFoundHandler(req, res, next);

            expect(createHttpError).toBeCalledTimes(1);
            expect(createHttpError).toBeCalledWith(404);
        });

        test("Should call next with error generated from createHttpError", () => {
            const httpError = { status: 404 };
            createHttpError.mockReturnValueOnce(httpError);

            AppMiddleware.notFoundHandler(req, res, next);

            expect(next).toBeCalledTimes(1);
            expect(next).toBeCalledWith(httpError);
        });
    });

    describe("httpErrorHandler function", () => {
        test("Should call next function for no error or response already sent", () => {
            const sentResponse = { ...res };
            sentResponse.headersSent = true;
            const httpError = { status: 400 };

            AppMiddleware.httpErrorHandler(undefined, req, res, next);
            AppMiddleware.httpErrorHandler(httpError, req, sentResponse, next);

            expect(next).toBeCalledTimes(2);
            expect(next).lastCalledWith(httpError);
        });

        test.each(dataProvider.AppMiddleware.httpErrorHandler())
            (`Should send response with received status code and message for error - { status: "%s", message: "%s" }`, (status, message) => {
                const error = { status, message };
                AppMiddleware.httpErrorHandler(error, req, res, next);

                expect(next).not.toBeCalled();
                expect(res.status).toBeCalledTimes(1);
                expect(res.status).toBeCalledWith(status);
                expect(res.send).toBeCalledTimes(1);
                expect(res.send).toBeCalledWith(message);
        });

        test("Should generate message using httpStatusCodes for generic error and send status 500", () => {
            const error = { message: `Some error occurred in App`};
            const generatedMsg = `Message for status code 500`;
            httpStatusCodes.getReasonPhrase.mockReturnValueOnce(generatedMsg);
            AppMiddleware.httpErrorHandler(error, req, res, next);

            expect(res.status).toBeCalledWith(500);
            expect(httpStatusCodes.getReasonPhrase).toBeCalledTimes(1);
            expect(httpStatusCodes.getReasonPhrase).toBeCalledWith(500);
            expect(res.send).toBeCalledWith(generatedMsg);
        });

        test("Should log error stack trace for generic errors", () => {
            const error = { message: `Some error occurred in App`, stack: `Stack trace`};
            AppMiddleware.httpErrorHandler(error, req, res, next);

            expect(req.logger.error).toBeCalledTimes(1);
            expect(req.logger.error).toBeCalledWith(error.stack);
        });
    });
});