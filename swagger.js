const swaggerAutogen = require('swagger-autogen')()

const outputFile = './swagger_output.json'
const endpointsFiles = [ './dbTest2.js']

swaggerAutogen(outputFile, endpointsFiles)