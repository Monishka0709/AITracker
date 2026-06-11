import 'dotenv/config';
import cors from 'cors'
import { notFound, errorHandlers } from './middleware/errorHandler.js';
import express from 'express'
import { connectDB } from './config/db.js';
import authRouter from './routes/auth.js';
import habitRouter from './routes/habits.js';
import logRouter from './routes/logs.js';
import aiRouter from './routes/ai.js';

const app = express();




const allowedOrigins = (process.env.CLIENT_URL || "").split(",").map((s) => s.trim()).filter(Boolean)



const corsOptions = {
    origin(origin,cb) {
        if(!origin) return cb(null, true)
            
        if(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return cb(null,true)
        }

        if(allowedOrigins.includes(origin)) return cb(null, true)
            return cb(new Error(`Origin ${origin} not allowed by cors`))


    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}


app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json({limit:"1mb"}));

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString()})
})

app.use('/api/auth', authRouter)
app.use('/api/habits', habitRouter);
app.use('/api/logs', logRouter);
app.use('/api/ai', aiRouter);

app.use(notFound)
app.use(errorHandlers) 


const PORT = process.env.PORT || 8000;

connectDB().then(() => {
    app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)})
})

app.get('/', (req, res) => {
    res.send('Hello World!');
});