// server.js
// USE: "npm run devStart" to start the server

const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes'); // Import userRoutes
require('dotenv').config(); // To use environment variables from .env file
const { MongoClient, ServerApiVersion } = require("mongodb"); // For testing MongoDB connection
const expressSwaggerGenerator = require('express-swagger-generator'); // For Swagger documentation

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

// Connect to MongoDB using the connection string from environment variables
mongoose.connect(process.env.MONGO_URI, {
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Use userRoutes for any requests that start with '/api/users'
app.use('/api/users', userRoutes);

// Initialize Swagger
const expressSwagger = expressSwaggerGenerator(app);

// Set Swagger options
let options = {
    swaggerDefinition: {
        info: {
            description: 'This is a sample server',
            title: 'Swagger',
            version: '1.0.0',
        },
        host: 'localhost:3000',
        basePath: '/',
    },
    basedir: __dirname, //app absolute path
    files: ['./routes/*.js'], //Path to the API handle folder
    route: {
        url: '/api-docs',
        docs: '/api-docs.json' //swagger file route
    }
}
expressSwagger(options)

// Test MongoDB connection
async function testMongoDBConnection() 
{
    try {
        const client = new MongoClient(process.env.MONGO_URI, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
        });
        // Connect to MongoDB
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged MongoDB Atlas. Successfully connected!");
        await client.close();
    } catch (error) {
        console.error("Error connecting to MongoDB Atlas:", error);
    }
}
testMongoDBConnection();

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

