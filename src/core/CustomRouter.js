const express = require("express");


class CustomRouter {

    /**
     * Express router instance
     * @type {express.Router}
     */
    #router;

    static #METHODS = ['all', 'get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
    /**
     * Express router instance
     * @param {express.RouterOptions?} options
     */
    static get(options) {
        const router = express.Router(options);
        CustomRouter.#overrideRouterMethods(router);
        return router;
    }

    static #overrideRouterMethods(router) {
        for (let method of CustomRouter.#METHODS) {
            let originalRouterMatcher = router[method];
            router[method] = CustomRouter.#getCustomRouterMatcher(router, originalRouterMatcher);
        }
    }

    static #getCustomRouterMatcher(router, originalRouterMatcher) {
        return (path, ...handlers) => {
            const wrappedHandlers = CustomRouter.#getWrappedHandlers(handlers);
            return originalRouterMatcher.call(router, path, ...wrappedHandlers);
        };
    }

    /**
     * Wraps the request handlers passed and returns custom handlers
     * @param {express.RequestHandler[]} handler 
     * @returns 
     */
    static #getWrappedHandlers(handlers) {
        const wrappedHandlers = [];
        for (const handler of handlers) {
            wrappedHandlers.push(CustomRouter.#wrapHandler(handler))
        }
        return wrappedHandlers;
    }

    /**
     * Wraps a request handler in async block 
     * to ensure HTTP errors are passed to common error handler
     * @param {express.RequestHandler} handler 
     * @returns 
     */
    static #wrapHandler(handler) {
        return async (req, res, next) => {
            try {
                return await handler(req, res, next);
            } catch (error) {
                next(error);
            }
        };
    }
}

module.exports = CustomRouter;