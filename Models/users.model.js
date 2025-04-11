import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true,
    },
    age:{
        type: Number,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password : {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    role: {
        type: String,
        enum: ['Buyer', 'Seller'],
        default: 'Buyer',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const userModel = mongoose.model('User', userSchema);
export default userModel;

