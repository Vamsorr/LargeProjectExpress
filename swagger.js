// Purpose: Generate swagger documentation for the API.
const swaggerAutogen = require('swagger-autogen')()

// Define the output file and the endpoints files
const outputFile = './swagger_output.json'
const endpointsFiles = [ './dbTest2.js']

// Generate the swagger documentation
swaggerAutogen(outputFile, endpointsFiles)