const base = {
    all: jest.fn((...args) => args),
    get: jest.fn((...args) => args),
    post: jest.fn((...args) => args),
    put: jest.fn((...args) => args),
    delete: jest.fn((...args) => args),
    patch: jest.fn((...args) => args),
    options: jest.fn((...args) => args),
    head: jest.fn((...args) => args),
}

const mockFunctions = {
    all: base.all,
    get: base.get,
    post: base.post,
    put: base.put,
    delete: base.delete,
    patch: base.patch,
    options: base.options,
    head: base.head,
}

module.exports = {
    Router: jest.fn(() => mockFunctions),
    _routerFunctions: base
}