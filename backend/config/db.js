import mongoose from "mongoose";

export const connectDB = async() => {
    try{
        const url = process.env.MONGO_URI;
        if(!url) throw new Error("Mongo uri not defined");

        const con = await mongoose.connect(url);

        console.log("MongoDB connected")
    }
    catch(err)
    {
        console.error("Database error: ", err.message);
        process.exit(1);
    }
}