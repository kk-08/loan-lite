const CustomRouter = require("../../../src/core/CustomRouter");
const express = require("express");


describe("CustomRouter core", () => {
    let router;

    test("Should have static get method", () => {
        expect(typeof CustomRouter.get).toStrictEqual(`function`);
    });

    test("Should init express.Router on function call", () => {
        router = CustomRouter.get();

        expect(express.Router).toBeCalledTimes(1);
        expect(express.Router).toBeCalledWith(undefined);
    });

    test.each(dataProvider.CustomRouter.httpMethods())
        (`Should call express' router's "%s" method`, (verb) => {
            const path = `/some/path`, handler = jest.fn();
            router[verb](path, handler);

            expect(express._routerFunctions[verb]).toBeCalledTimes(1);
            expect(express._routerFunctions[verb]).toBeCalledWith(path, expect.any(Function));
        });

    test.each(dataProvider.CustomRouter.httpMethods())
        (`Should pass similar argument list to original handlers for "%s" method`, (verb, handlerCnt) => {
            const paths = [`/my/custom/path/1`, `/my/custom/path/2`];
            const handlers = [], matchers = [];
            for (let i=0; i<handlerCnt; i++) {
                handlers.push(jest.fn());
                matchers.push(expect.any(Function));
            }

            router[verb](paths, ...handlers);

            expect(express._routerFunctions[verb]).toBeCalledWith(paths, ...matchers);
        });

    test.each(dataProvider.CustomRouter.httpMethods())
        (`Should pass async errors in handler to next for "%s" method`, async (verb, handlerCnt) => {
            const req = jest.fn(), res = jest.fn(), next = jest.fn();
            const mockErrors = [ new Error(`handler1`), new Error(`handler2`), new Error(`handler3`) ];
            const data = {
                path: "some/path",
                withError: [
                    jest.fn(() => { throw mockErrors[0] }),
                    jest.fn(() => { throw mockErrors[1] }),
                    jest.fn(() => { throw mockErrors[2] }),
                ],
                withoutError: jest.fn(),
            };

            const oneHandlerArgs = router[verb](data.path, data.withError[0]);
            const twoHandlerArgs = router[verb](data.path, data.withoutError, data.withError[1]);
            const threeHandlerArgs = router[verb](data.path, data.withoutError, data.withoutError, data.withError[2]);

            await oneHandlerArgs[1](req, res, next);
            await twoHandlerArgs[1](req, res, next);
            await twoHandlerArgs[2](req, res, next);
            await threeHandlerArgs[1](req, res, next);
            await threeHandlerArgs[2](req, res, next);
            await threeHandlerArgs[3](req, res, next);

            expect(next).toBeCalledTimes(3);
            expect(next).nthCalledWith(1, mockErrors[0]);
            expect(next).nthCalledWith(2, mockErrors[1]);
            expect(next).nthCalledWith(3, mockErrors[2]);
        });
});