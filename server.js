// server.js
// USE: "npm run devStart" to start the server

// Import express, mongoose, and userRoutes
const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes'); // Import userRoutes
require('dotenv').config(); // To use environment variables from .env file
const { MongoClient, ServerApiVersion } = require("mongodb"); // For testing MongoDB connection
const expressSwaggerGenerator = require('express-swagger-generator'); // For Swagger documentation



// Create an express app
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.static('public'));

// Connect to MongoDB using the connection string from environment variables
mongoose.connect(process.env.MONGO_URI, {
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Use userRoutes for any requests that start with '/api/users'
app.use('/api/users', userRoutes);


// Initialize Swagger
const expressSwagger = expressSwaggerGenerator(app);

// Set Swagger options
let options = 
{
    swaggerDefinition: 
    {
        info: 
        {
            description: 'This is a sample server',
            title: 'Swagger',
            version: '1.0.0',
        },
        host: 'localhost:3000',
        basePath: '/',
    },
    basedir: __dirname, //app absolute path
    files: ['./routes/*.js'], //Path to the API handle folder
    route: 
    {
        url: '/api-docs',
        docs: '/api-docs.json' //swagger file route
    }
}
// Initialize swagger-jsdoc -> returns validated swagger spec in json format
expressSwagger(options)

// Test MongoDB connection
async function testMongoDBConnection() 
{
    try 
    {
        // Create a new MongoClient
        const client = new MongoClient(process.env.MONGO_URI, 
            {
            serverApi: 
            {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
        });

        // Connect to the MongoDB cluster
        await client.connect();

        // pinging the mongodb atlas cluser with newly created client
        await client.db("admin").command({ ping: 1 });

        // Log a message to the console if the connection is successful
        console.log("Pinged MongoDB Atlas. Successfully connected!");

        // Close the connection
        await client.close();

        // if cant connect to the cluster, catch the error
    } catch (error) {
        console.error("Error connecting to MongoDB Atlas:", error);
    }
}
// Call the testMongoDBConnection function in order to test the connection
testMongoDBConnection();

// Start the server on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => 
{
    console.log(`Server running on http://localhost:${PORT}`);
});

