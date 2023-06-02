# Loan Lite App

A simple application with loan API created using **Express.js**.  

## Overview

Source files are located under `/src` folder which are in turn segregated into the following components:

| Component     |     Description     |                           Usage                            |
|---------------|---------------------|------------------------------------------------------------|
| **configs** | `Configuration files` | Used for configuration of application and its dependencies |
| **controllers** | `Controller modules` | Used for business logic powering the API |
| **core** | `Core Application modules` | Used for Application setup |
| **errors** | `Custom Error modules` | Used for easier error handling across application |
| **lib** | `Clients for dependencies` | Used for Logging/Database connections |
| **middlewares** | `Middleware modules` | Used for background operations such as request/response logging, validations, user authentication etc. |
| **models** | `DB Models` | Used for keeping models for correspoding collections/tables in DB |
| **routes** | `API Routes` | Used for keeping track of all API endpoints/routes |
| **utils** | `Utilities` | Used for generic utility methods/constants |

> NOTE: A sample config (`config.example.json`) is included listing all the expected fields

Unit test files are located under `/tests/unit` folder and are segregated following the same folder structure as the source files

### Versioning

The application follows [Semantic Versioning](http://semver.org/). For the current version, check the [package.json](./package.json).

## Getting started

### Prerequisites

Node (for application) and npm (for managing packages)
> NOTE: Tested for Node version 18.14.1 (LTS) and npm version 9.6.4
> Check versions using `node -v` and `npm -v` respectively

### Deployment

To deploy the application, simply run `/bin/bash deploy.sh`

> Internally, this runs the following steps:
> 1. Checks if node and npm are installed
>   - Prints the node and npm versions if installed
>   - Fails with exit code 1
> 2. Checks if the application exists
>   - Uses the same, if it does
>   - Copies the example file to create a new config, if it does not
> 3. Installs all the dependencies (`npm i`)
> 4. Starts the application (`npm start`)
 
<br>

## Logging

In its current state, application logs to the stdout (`console`). But the LoggerClient can easily be extended to log to files or other storage options using agents of choice.

All requests landing on the application and responses from the application (along with response time) are logged for tracking as well as aid debugging in case of any issues

The following parameters are logged for the client implemented:
| Param   | Description                                          |
| ------- | ---------------------------------------------------- |
| **id**  | ID associated with the logger instance used for tracking chain of events |
| **ts**  | Log timestamp in **yyyy-mm-dd HH:MM:ss** |
| **msg** | Log message/data passed |

<br>

## Database

For purposes of easy installation and deployment, an in memory NoSQL DB ([lokijs](https://techfort.github.io/LokiJS/)) has been used with file system as the persistence mechanism.

For scaling the application to staging or production environments, a new DB client (SQL, considering the use case) should be implemented and correspondingly the models must be extended to use the same client.

> NOTE: The file where the data is saved can be modified using configuration in `config.json`

## API Validations

All API validations have been segregated from business logic ensuring only correct and valid data lands on the controllers.

For specifying validations, JSON specs are added in `APISpecs` under routes and used on the required route using `Validator.getSpecValidator(<customAPISpec>)` which acts as a middleware for verifying all the required fields for presence, types and contraints and optional fields for types and contraints, if present.

Every request specification may have one or more of the following components mapped directly to the request components:

- query
- body
- headers
- params

Each component specification consists of some mandatory fields and some optional fields, all of which are listed below:

| Param            |      Description  |
| ---------------- | ------------------|
| **requiredKeys** | Array of mandatory keys for the request component |
| **optionalKeys** | Array of non-mandatory keys for the request component |
| **validations**  | JSON for the required validations in the following format: { *keyForValidation*: *validationObject* } |

<br>

Each **validationObject**, in turn, has an associated `type` and optional constraints which are evaluated against the value of the required field, with type indicating the data type and constraints specifying limits/bounds for the value.

<br>

## Unit Tests

To run unit tests, simply write `npm run test` or `npm run test:coverage` (with coverage report) in the CLI and Enter.

Key features:
1. Unit Tests are written using [Jest](https://jestjs.io/).
2. Apart from being segregated into modules following the source files structure, they are intuitively clubbed into test suites internally to identify boundaries easily in the coverage report making it easy to read
3. Tests can use data providers as well for running same case with multiple different inputs
4. Data providers and mock utilities have been kept separately from the actual tests under `tests/utils/unit`

<br>

## [Design decisions](./DESING_DECISIONS.md)
