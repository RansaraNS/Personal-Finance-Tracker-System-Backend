const mongoose = require('mongoose');

const connectDB = async () => {
    //handle potential connetion erros.
    try {
        //esteblished a connection to mongoDB using environment variables.
        const conn = await mongoose.connect(process.env.MONGO_URI);
        
        //conn.connection.host provide the hostname of the connected server.
        console.log(`MongoDB Connected`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        //ensure that the application stops if the db connection falls.
        process.exit(1);
    }
};

module.exports = connectDB;