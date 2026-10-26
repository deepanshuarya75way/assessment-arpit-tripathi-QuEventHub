import mongoose from "mongoose";



export const connectDB = async () => {
    try {

        const mongoURL = process.env.URL;
        if (!URL) {
            throw new Error('Database URL not found in environment variables. Please check your .env file.');
        }

        const isAtlas = mongoURL.startsWith('mongodb+srv://');

        const options = {
            serverSelectionTimeoutMS: 10000
        }

        if(process.env.MONGODB_TLS === 'true'){
            options.tls = true;
        }

        if(process.env.NODE_ENV === 'production' && 
            !isAtlas && process.env.MONGODB_TLS !== 'true'
        ){
            throw new Error(
                'MONGODB_TLS=true is required'
            )
        }
        await mongoose.connect(mongoURL);
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Database connection failed:", error.message);
        throw error; // Re-throw to let the caller handle it
    }
}