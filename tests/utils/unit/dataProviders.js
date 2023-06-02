global.dataProvider = {
    appProcessUtility: {
        handleExit: function () {
            return [
                ["SIGHUP"], ["SIGINT"], ["SIGTERM"]
            ];
        }
    },
    Helper: {
        isSet: function () {
            return [
                [false, null],
                [false, undefined],
                [true, ""],
                [true, {}],
                [true, []],
                [true, 0],
                [true, 1],
                [true, false]
            ];
        },
        is: function () {
            return [
                [true, false, 'boolean'],
                [false, false, 'number'],
                [false, false, 'string'],
                [false, false, 'object'],
                [false, false, 'undefined'],
                [false, false, 'function'],
                [true, undefined, 'undefined'],
                [true, [], 'array'],
                [true, [], 'object'],
                [false, {}, 'array'],
                [true, {}, 'object'],
                [true, null, 'object'],
                [true, function a() {}, 'function'],
            ];
        },
        round: function () {
            return [
                [1.2334, 1.23336, 4],
                [1.233, 1.23336, 3],
                [1.23, 1.23336, 2],
                [1.2, 1.23336, 1],
                [1.2565, 1.25646, 4],
                [1.256, 1.25646, 3],
                [1.26, 1.25646, 2],
                [1.3, 1.25646, 1],
            ];
        },
        getDateAfterWeeks: function () {
            return [
                [1],
                [2],
                [3],
                [4],
                [5],
                [6],
            ];
        }
    },
    AppMiddleware: {
        httpErrorHandler: function () {
            return [
                [400, 'Validation failed'],
                [401, 'You do not have access'],
                [403, 'Invalid credentials'],
                [429, 'Too many requests'],
            ];
        }
    },
    UserMiddleware: {
        authenticate: function () {
            return [
                ["customer"],
                ["admin"],
            ];
        },
    },
    CustomRouter: {
        httpMethods: function () {
            return [
                ["all", 1],
                ["get", 2],
                ["post", 3],
                ["put", 4],
                ["delete", 5],
                ["patch", 6],
                ["options", 7],
                ["head", 8]
            ];
        },
        allHttpMethods: function () {
            return [
                ["all"], ["asyncAll"], ["get"], ["asyncGet"], ["post"], ["asyncPost"], ["put"], ["asyncPut"], ["delete"], ["asyncDelete"], ["patch"], ["asyncPatch"], ["options"], ["asyncOptions"], ["head"], ["asyncHead"]
            ];
        }
    },
    Validator: {
        stringFailure: function() {
            return [
                [null] , 
                [undefined], 
                [{}], 
                [[]], 
                [function() {}]
            ];
        },
        constraintFailure: function () {
            return [
                [25.0001, { type: "decimal", minValue: 12, maxValue: 20 }, "isDecimal"],
                [10, { type: "wholeNumber", minValue: 12, maxValue: 20 }, "isNumeric"],
            ];
        }
    }
};