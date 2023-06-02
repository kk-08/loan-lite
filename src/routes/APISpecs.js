const loanIdValidation = {
    loanId: { type: `wholeNumber`, minValue: 1 }
}

const amountValidation = {
    amount: { type: `decimal`, minValue: 1.0 },
}

const userIdInParams = {
    params: {
        requiredKeys: [`userId`],
        validations: {
            userId: { type: `wholeNumber`, minValue: 1 },
        }
    },
};

const authInHeaders = {
    headers: {
        requiredKeys: [`authorization`],
        validations: {
            authorization: { type: `string`, minLength: 7 },
        }
    },
}

module.exports = {
    admins: {
        base: {
            ...authInHeaders,
            ...userIdInParams,
        },
        loans: {
            get: {
                query: {
                    optionalKeys: [`loanId`],
                    validations: {
                        loanId: { type: `wholeNumber`, minValue: 1 },
                    }
                }
            },
            approve: {
                body: {
                    requiredKeys: [`loanIds`],
                    validations: { ...loanIdValidation }
                }
            }
        }
    },
    customers: {
        base: {
            ...authInHeaders,
            ...userIdInParams,
        },
        loans: {
            create: {
                body: {
                    requiredKeys: [`referenceId`, `amount`, `terms`],
                    validations: {
                        referenceId: { type: `string`, minLength: 3 },
                        terms: { type: `wholeNumber`, minValue: 1 },
                        ...amountValidation,
                    }
                }
            },
            get: {
                query: {
                    optionalKeys: [`loanId`],
                    validations: {
                        loanId: { type: `wholeNumber`, minValue: 1 },
                    }
                }
            },
            pay: {
                params: {
                    requiredKeys: [`loanId`],
                    validations: { ...loanIdValidation },
                },
                body: {
                    requiredKeys: [`amount`],
                    validations: { ...amountValidation },
                }
            },
        }
    }
}