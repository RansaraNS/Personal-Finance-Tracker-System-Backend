# Personal Finance Tracker API

This is a RESTful API for a Personal Finance Tracker that allows users to manage their accounts and income records. The API is built using Node.js, Express.js, and MongoDB.

## Table of Contents
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Running the Server](#running-the-server)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [Integration and Performance Tests](#integration-and-performance-tests)
- [Environment Variables](#environment-variables)

## Setup Instructions

### Prerequisites
Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v14+ recommended)
- [MongoDB](https://www.mongodb.com/) (local or cloud instance)
- [Nodemon](https://www.npmjs.com/package/nodemon) (for development)

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the root directory and configure it as follows:
     ```env
     PORT=2139
     MONGO_URI=<your-mongodb-connection-string>
     EXCHANGE_RATE_API_KEY=<your-api-key>
     DEFAULT_CURRENCY=LKR
     ```

## API Documentation
The API endpoints and usage details can be found in the Postman documentation:
[Personal Finance Tracker API Documentation](https://documenter.getpostman.com/view/36468384/2sAYk7TQBh)

## Running the Server
To start the development server with live reload:
```bash
nodemon server.js
```
For a production build, use:
```bash
node server.js
```

## Testing

### Unit Tests
Run unit tests using:
```bash
npm test
```

### Integration and Performance Tests
For integration and performance tests, ensure the following setup:
- A test database separate from production
- Mock API responses where necessary
- Load testing using tools like Postman or k6

To run integration tests:
```bash
npm run test:integration
```

To run performance tests:
```bash
npm run test:performance
```

## Environment Variables
Ensure all required environment variables are set up properly in the `.env` file for smooth operation and testing.

