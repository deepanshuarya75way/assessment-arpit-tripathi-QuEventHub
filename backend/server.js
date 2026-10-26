import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet'
import { connectDB } from './database/db.js';
import authRoute from './routes/authRoutes.js';
import eventRoute from './routes/eventRoutes.js';
import userRoute from './routes/userRoutes.js';
import contactRoute from './routes/contactRoutes.js';
import clubRoute from './routes/clubRoutes.js';
import adminRoute from './routes/adminRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - allow common development ports
const allowedOrigins = (
    process.env.FRONTEND_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

if(process.env.TRUST_PROXY === '1'){
    app.set('trust proxy', 1);
}

app.disable('x-powered-by');

app.use((req, res, next)=>{
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');

    if(req.secure){
        res.setHeader(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains'  
        )
    }
    next();
})
 
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
     return callback(null, true);
    }  
   
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));



app.use(express.json({limit: '1mb'}));

app.use(helmet({
    contentSecurityPolicy:{
        directives:{
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'none'"]
        }
    }
}))

app.use('/api/auth', authRoute);  
app.use('/api/events', eventRoute);
app.use('/api/user', userRoute);
app.use('/api/contact', contactRoute);
app.use('/api/clubs', clubRoute);
app.use('/api/admin', adminRoute);

app.use((error, req, res, next) => {
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'Image must be 2 MB or smaller.' });
    }
    if (error.message === 'Only image files are allowed.') {
        return res.status(400).json({ message: error.message });
    }
    next(error);
});
app.use(errorHandler);

// Connect to database first, then start server
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server is running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();


// import dotenv from 'dotenv';
// // 1. MUST be called synchronously at the very top.
// dotenv.config(); 

// import express from 'express';
// import cors from 'cors';
// import connectDB from './database/db.js';
// import userRoutes from './routes/userRoutes.js';
// import eventRoutes from './routes/eventRoutes.js';
// import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// // --- Database Connection ---
// connectDB(); // Now, MONGO_URI should be defined when this runs

// const app = express();

// // --- Middleware ---
// app.use(cors());
// app.use(express.json()); // Allows parsing JSON body
// app.use(express.urlencoded({ extended: true })); // Allows parsing form data

// // --- Routes ---
// app.get('/', (req, res) => {
//     res.send('API is running...');
// });

// app.use('/api/users', userRoutes);
// app.use('/api/events', eventRoutes);

// // --- Error Handling Middleware ---
// app.use(notFound);
// app.use(errorHandler);

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });