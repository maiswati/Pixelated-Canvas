import dotenv from 'dotenv';
dotenv.config();
import User from '.././Models/users.model.js';
import paintingModel from '../Models/painting.model.js';
import bcrypt from 'bcryptjs'; 
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY;
const API = process.env.API;
export const registerUser = async(req,res)=>{
    try
    {
        console.log(req.body);
        const {name, age, email, password, username, role} = req.body;
        if(!name || !age || !email || !password || !username || !role) 
        {
            return res.status(400).json({message: "All fields are required."});
        }
        const userExists = await User.findOne({email});
        if(userExists)
        {
            return res.status(409).json({message: "User already exists."});
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User(
            {
                name,
                age: Number(age),
                email,
                password: hashedPassword,
                username,
                role
            }
        );
        const savedUser = await newUser.save();
        return res.status(201).json({message: "Signup successful", user: savedUser});
    } 
    catch(error)
    {
        console.error("Error saving user:", error);
        return res.status(500).json({message: "Internal Server Error", error: error.message});
    }
}

export const login = async(req,res)=>{
    try
    {
        console.log(req.body);
        const {username, password} = req.body;
        if(!username || !password)
        {
            return res.status(400).json({message: "All fields are required."});
        }
        const userRegistered = await User.findOne({username});
        if(!userRegistered)
        {
            return res.status(404).json({message: "User not found. Please get registered yourself. Thank you."});
        }
        const isMatch = await bcrypt.compare(password, userRegistered.password);
        if(!isMatch)
        {
            return res.status(401).json({message: "Invalid Password."});
        }
        const token = jwt.sign({id: userRegistered._id, email: userRegistered.email, role: userRegistered.role}, SECRET_KEY, {expiresIn: "1h"});
        return res.status(200).json({message: "Login Successful.", token: token, user:userRegistered});
    }
    catch(error)
    {
        return res.status(500).json({message: "Internal Server Error.", error:error});
    }
}

export const buildUserProfile = async(req,res)=>{
    try{
        const {id} = req.params;
        const user = await User.findById(id);
        if(!user) {
            return res.status(400).json({message: "User not Registered."});
        }
        if(user.role === "Seller") {
            const paintingsData = await paintingModel.find({sellerID: id});
            console.log(paintingsData.file);
            res.status(200).json({user,paintingsData});
        } else if(user.role === "Buyer") {
            const paintingsData = await paintingModel.find({buyerID: id});
            console.log(paintingsData.file);
            res.status(200).json({user,paintingsData});
        }
    } catch(error) {
        return res.status(500).json({message: "Internal Server error."});
    }
}


