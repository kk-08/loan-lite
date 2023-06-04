# Decisions/Choices

During the implementation of the project, the following choices were made:

## Database

Only to keep the application lightweight with minimal dependencies and make it easy to deploy, an in-memory No SQL DB is used which flushes to persistence storage (filesystem) every n seconds (configurable).
> Reference: [lokijs](https://techfort.github.io/LokiJS/)
This removes any external dependencies for Database and eradicates the need for cache layer as well.

*However, under scenarios where dependencies are ensured, a relational database (such as MySQL) external to the application must be employed along with a common cache layer based on an external service like Redis or Memcached to improve app performance and reduce stress on persistence storage*
Some of the reasons for the above are:
1. The application deals with transactional data (loan creation, installment payment etc.) for which SQL databases are very well suited (especially because of SQL Transactions)
2. The data is well defined and structured and hence, could benefit from the fixed types and sized columns
3. Storage should be external to the application ensuring segregation of responsibilities
4. Both application and storage (DB and cache) should be highly available and should be able to scale independently and thus must have some load balancing

> NOTE: This is precisely the reason for building models for the collections. This is done so that they can be extended to use other DB client in the future without the need for modifications in the business logic

<br>

## Configuration Files

To keep application and dependency configuration segregated from the application logic, these fields are exposed in the config file and expected from the end user. This has the following advantages:
1. Allows for better control of the application deployment
2. Prevents the application logic from frequent updates
3. Helps in automating deployment process where the same configuration can be used across machines and can be segregated basis categories (e.g. Pre-production, Production, Staging)

> NOTE:
> 1. The main configuration file is ignored (refer `.gitignore`) to prevent credentials or values from local environments to be committed to the project
> 2. The config file is specifically kept as a `.json` file as it limits the type of inputs, and helps keep the data structured and thus, requires lesser validations for ensuring correct configurations

<br>

## Logging

A basic logger client is implemented using Javscript's `console` API to keep the application lean and with minimal external dependencies.
*A full-fledged application should, however, employ other logging mechanisms or extend it to add desired features such as time or size based rotation, and compression and backup of older logs*

Lines are logged as objects (JSON) with the following fields:
1. `id` - Helps keep track of the logging entity or the chain of events (e.g. processing done for a request, status logs from an external dependency client etc.)
2. `ts` (timestamp) - To identify the time of occurrence of an operation and aid debugging
3. `msg` (mesasge) - The stringified data to be logged

> NOTE: The keys have been minimized to save data in case log data is persisted

Additionally, all requests and responses are logged which not only help in tracking and monitoring the application's performance, but also aids debugging process reducing the TAT fto solve for issues.

<br>

## Error Handling

Two custom error classes have been defined under the `src/errors` module.
This allows for better control over validation failures and prevents the need for bubbling up (or propogating) errors and help break the program flow immediately.
<br>

1. `AppError`s are thrown for issues in the application setup, mostly at the time of application load, informing the user of the reasons for failure
2. `RequestError`s are thrown for issues encountered during processing of a request due to precondition or validation failures. To supplement this, the `httpErrorHandler` middleware is added to catch all these errors and ensure that the user is informed aptly.
3. The `httpErrorHandler` also takes care of any unhandled errors during the request processing sending a generic 500 error to the end user and logging the error for tracking and debugging the issue
4. Some errors might occur outside of the request journey and cause the application to go down. In order to prevent this, such errors in the application process are caught and logged instead of making the app to exit (refer `src/core/AppProcess`)

<br>

## Authentication

To serve for User authentication, Basic Auth is being used as of now. This is done to reduce the implementation effort and simplify the process of application development so that more time could be devoted to the business logic.
*It is advised to employ a more secure authentication logic such as JWT instead in case the application is to serve production traffic*
<br>

The authentication is done separate from the business logic in a dedicated middleware due to the following advantages:
1. Keeps business logic segregated from authentication (segregation of responsibilities) thus preventing unnecessary updates due to changes in authentication
2. All requests landing on the controller are ensured to be valid and authenticated which reduces the need for validations and improves readability

<br>

## Unit Tests

To write and run unit tests, Jest has been chosen as the underlying framework.
This is because of the following advantages that come with using it:
1. It is a one stop soltion for running tests, mocking and assertions
2. It has a large community support and excellent documentation making it easy to get solutions to peculiar use cases as well
3. It supports multiple formats for coverage reporting and can be extended to support custom formats as well

<br>

## Application Development Time Trade-offs

In order to keep the application development time minimal, it was decided to implement the following features in the next iteration of development.

<br>

### HATEOAS

The API developed follows all RESTful constraints except Hypermedia as the Engine of Application State and thus, satisfies upto Level 2 of the  Richardson Maturity Model. Development of this needs sufficient exploration time as out of the box solutions have limited features and a small usage community, and a good implementation, which would result in zero or less effort on each route definition, would require significant thought and adaptation efforts. 
Packages considered so far:
1. [express-hateoas-links](https://www.npmjs.com/package/express-hateoas-links)
2. [express-hateoas-yml](https://www.npmjs.com/package/express-hateoas-yml)

<br>

### Feature Tests

While the application code is thoroughly Unit Tested, feature/integration tests are not included as of now. This is due to the exploratory effort it required for having a sound and extensible implementation which was difficult to fit in the development time. The idea is to use [supertest](https://www.npmjs.com/package/supertest) along with assertions in [Jest](https://jestjs.io/) and test the API endpoints.

<br>

## Loan payments

<br>

### Less than installment

In case of payment less than the `installment's due amount`, the request would fail with a message indicating the same

<br>

### More than due

In case of payment more than the `total amount due for the loan`, the request would fail with a message indicating the same

<br>

### Advance

In case of payment more than the scheduled installment, the amount is recursively deducted from the installments left starting with the last one.
So, if there are 4 pending installments of 20$ each and the customer goes ahead and pays 50$, the following steps are taken:
1. The first installment would be marked as `paid` with the actual amount 50$.
2. The last installment would be marked as `advanced` with due amount reduced to 0$.
3. The second last installment's due amount would be reduced to 10$

<br>

### Late payment

In case of payment later than the scheduled installment date, a markup of 1% has been added. In this case, the loan amount stays the same but the installment amount increases and the installment status is marked as `late` payment