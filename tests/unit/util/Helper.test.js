jest.mock("fs");
const ip = require("ip");
const uuid = require("uuid");
const dateFormat = require("dateformat");


describe("Helper utility", () => {
    let Helper;

    test("Should load device IP on app load", () => {
        Helper = require("../../../src/utils/Helper");

        expect(ip.address).toBeCalledTimes(1);
        expect(ip.address).toBeCalledWith();
    });

    test("Should export expected functions", () => {
        expect(typeof Helper.is).toStrictEqual(`function`);
        expect(typeof Helper.isSet).toStrictEqual(`function`);
        expect(typeof Helper.getServerIp).toStrictEqual(`function`);
        expect(typeof Helper.getUuid).toStrictEqual(`function`);
        expect(typeof Helper.round).toStrictEqual(`function`);
        expect(typeof Helper.getDateAfterWeeks).toStrictEqual(`function`);
    });

    describe("is function", () => {
        test.each(dataProvider.Helper.is())
            (`Should return "%s" for is(%s, '%s')`, (expectedResult, value, type) => {
                const result = Helper.is(value, type);

                expect(result).toStrictEqual(expectedResult);
            });
    });


    describe("isSet function", () => {
        test.each(dataProvider.Helper.isSet())
            (`Should return "%s" for isSet(%s)`, (expectedResult, value) => {
                const result = Helper.isSet(value);

                expect(result).toStrictEqual(expectedResult);
            });
    });

    describe("getServerIp function", () => {
        test("Should not call ip.adress again", () => {
            Helper.getServerIp();
            Helper.getServerIp();

            expect(ip.address).not.toBeCalled();
        });
    });

    describe("getUuid function", () => {
        test("Should call UUID v4 method", () => {
            Helper.getUuid();

            expect(uuid.v4).toBeCalledTimes(1);
        });
    });

    describe("round function", () => {
        test.each(dataProvider.Helper.round())
            (`Should return "%s" for round(%s, %s)`, (expectedResult, value, decimalPlaces) => {
                const result = Helper.round(value, decimalPlaces);

                expect(result).toStrictEqual(expectedResult);
            });
    });

    describe("getDateAfterWeeks function", () => {
        test.each(dataProvider.Helper.getDateAfterWeeks())
            (`Should return correct date for getDateAfterWeeks(%s)`, (numWeeks) => {
                const result = Helper.getDateAfterWeeks(numWeeks);

                const currentDate = new Date();
                const dayDiff = Math.round((result.getTime()-currentDate.getTime())/(24*3600*1000));
                expect(dayDiff/7).toStrictEqual(numWeeks);
            });
    });
});