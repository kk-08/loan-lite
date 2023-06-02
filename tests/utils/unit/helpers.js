setHttpMockFactory();


/**
 * Creates a mock generator for `HTTP` request and response
 */
function setHttpMockFactory() {
    global.httpMock = {
        createRequest: mockHttpRequest,
        createResponse: mockHttpResponse
    };
}

/**
 * Mocks an HTTP `express` request
 * @param {*} body 
 * @param {*} query 
 * @param {*} headers 
 */
function mockHttpRequest(body = {}, query = {}, headers = {}) {
    const req = {
        baseUrl: "baseUrl",
        headers: headers,
        body: body,
        query: query,
        app: {},
        socket: {
            remoteAddress: undefined
        },
        connection: {
            socket: {}
        },
        logger: {
            info: jest.fn(),
            debug: jest.fn(),
            error: jest.fn(),
            trace: jest.fn()
        },
        ns: {
            id: 'mockId',
            startTime: 'mockStartTime',
            endTime: 'mockEndTime',
        },
        get: jest.fn()
    }
    return req;
}

/**
 * Mocks an HTTP `express` response
 */
function mockHttpResponse() {
    const res = {
        headersSent: false,
        write: jest.fn(),
        send: jest.fn(),
        header: jest.fn(),
        status: jest.fn(() => res),
        end: jest.fn(),
        json: jest.fn(),
        getHeaders: jest.fn()
    }

    return res;
}