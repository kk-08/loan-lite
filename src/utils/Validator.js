const validator = require("validator").default;
const AppError = require("../errors/AppError");
const RequestError = require("../errors/RequestError");
const Helper = require("./Helper");


/**
 * @typedef KeyValidation
 * @property {string} type
 * @property {number=} minValue
 * @property {number=} maxValue
 * @property {number=} minLength
 * @property {number=} maxLength
 */

class Validator {
    /**
     * Supported request components for validation
     */
    static REQUEST_COMPONENTS = [`query`, `body`, `headers`, `params`];

    static #TYPE_VALIDATORS = {
        //map: Provides an object validator with individual validations for each key
        //func: Provides a function validator with custom function validation
        string: { isValid: (val) => { return (typeof val === "string") }, constraints: ["minLength", "maxLength"] },
        decimal: { isValid: validator.isDecimal, constraints: ["minValue", "maxValue"] },
        wholeNumber: { isValid: (val) => validator.isNumeric(val, { no_symbols: true }), constraints: ["minValue", "maxValue"] },
    };

    static #CONSTRAINT_VALIDATORS = {
        minLength: (val, limit) => (val.length >= limit),
        maxLength: (val, limit) => (val.length <= limit),
        minValue: (val, limit) => (Number(val) >= limit),
        maxValue: (val, limit) => (Number(val) <= limit),
    }

    /**
     * Generates and returns a RequestHandler for spec validation
     * @param {{ query?: Object, body?: Object, header?: Object, params?: Object }} specs 
     * @returns 
     */
    static getSpecValidator(specs) {
        return (req, res, next) => {
            let validationErrors = []
    
            for (const key of Validator.REQUEST_COMPONENTS) {
                if (!specs[key]) continue;
    
                const errors = Validator.#validateData(specs[key], req[key]);
                validationErrors.push(...errors);
            }
    
            if (validationErrors.length > 0) {
                throw new RequestError(400, `Request validation(s) failed:\n${validationErrors.join(`\n`)}`)
            }
            next();
        }
    }

    /**
     * Validates `data` against the `spec` passed
     * @param {{ requiredKeys?: string[], optionalKeys?: string[], validations: Object.<string, KeyValidation> }} spec
     * @param {Object} data 
     * @returns {string[]} validationError
     */
    static #validateData(spec, data) {
        spec = Validator.#validateSpec(spec);

        let validationErrors = [];
        //Validate mandatory fields
        for (const key of spec.requiredKeys) {
            if (!spec.validations[key]) throw new AppError(`Validation not specified for key: ${key}`);
    
            Validator.#validateAndPushError(key, data, spec, validationErrors);
        }
        //Validate non-mandatory fields
        for (const key of spec.optionalKeys) {
            if (!spec.validations[key]) throw new Error(`Validation not specified for key: ${key}`);
            if (!data.hasOwnProperty(key)) continue;

            Validator.#validateAndPushError(key, data, spec, validationErrors);
        }
    
        return validationErrors;
    }

    static #validateSpec(spec) {
        let temp = {...spec};
    
        //Mandatory fields array
        if (!Helper.isSet(spec.requiredKeys)) {
            temp.requiredKeys = [];
        } else if (!Helper.is(spec.requiredKeys, 'array') || !spec.requiredKeys.length) {
            throw new AppError(`requiredKeys passed "${spec.requiredKeys}" is not valid!`);
        }
    
        //Non-mandatory fields array
        if (!Helper.isSet(spec.optionalKeys)) {
            temp.optionalKeys = [];
        } else if (!Helper.is(spec.optionalKeys, 'array') || !spec.optionalKeys.length) {
            throw new AppError(`optionalKeys passed "${spec.optionalKeys}" is not valid!`); 
        }
    
        return temp;
    }

    static #validateAndPushError(key, data, spec, validationErrors) {
        const validationError = Validator.#validateField(key, data[key], spec.validations[key]);
        if (validationError) validationErrors.push(validationError);
    }

    /**
     * Validates the `key`'s value against the `specValidations` passed
     * @param {string} key 
     * @param {string} value 
     * @param {{type: string, maxLength?: number, minLength?: number }} validation 
     * @param {boolean} isMandatory - defaults to `true`
     * @returns {string|undefined} errorMessage
     */
    static #validateField(key, value, validation) {
        const normalizedValue = Validator.#normalizeData(validation.type, value);
        if (!normalizedValue) return`Invalid "${key}". Expected type validation(s) failed as value is empty or undefined`;
        
        let error;
        switch (validation.type) {
            case `map`:
                const validationErrors = Validator.#validateData(validation.spec, value);
                if (validationErrors.length) error = `Invalid "${key}". Errors: ${validationErrors.join(", ")}`;
                return error;
            case `func`:
                if (!validation.func(value)) error = `Invalid "${key}". Expected type validation(s) failed`;
                return error;
            case `string`:
            case `decimal`:
            case `wholeNumber`:
                return Validator.#validateBasicType(key, normalizedValue, validation);
            default:
                throw new AppError(`Invalid type: ${validation.type} specified for "${key}"`);
        }
    }

    static #validateBasicType(key, value, validation) {
        const typeValidator = Validator.#TYPE_VALIDATORS[validation.type];
    
        if (!typeValidator.isValid(value)) {
            return `Invalid "${key}". Expected type: ${validation.type}`;
        }
        
        if (typeValidator.constraints) {
            for (const constraint of typeValidator.constraints) {
                if (!validation[constraint]) continue;

                const limit = validation[constraint];
                const constraintValidator = Validator.#CONSTRAINT_VALIDATORS[constraint];
                if (constraintValidator && !constraintValidator(value, limit)) {
                    return `Invalid "${key}". Expected constraint ${constraint} failed`;
                }
            }
        }
    }

    /**
     * Returns normalized `data` basis the `type` passed
     * Used validator module requires string values
     * @param {string} type 
     * @param {*} data 
     * @returns {string|undefined} value
     */
    static #normalizeData(type, data) {
        if (Helper.isSet(data)) {
            switch (type) {
                case `string`:
                case `func`:
                case `map`:
                case `array`:
                    return data;
                default:
                    return data.toString();
            }
        }
    }
}



module.exports = Validator;