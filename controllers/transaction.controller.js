import dotenv from 'dotenv';
dotenv.config();
import Razorpay from "razorpay";
import paintingModel from "../Models/painting.model";
import auctionModel from "../Models/auction.model";
import crypto from 'crypto';
import userModel from "../Models/users.model";
import paintingModel from './../Models/painting.model';
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (req, res) => {
    try {
        const {winner} = req.body;
        const {paymentId} = req.params;
        let amount;
        const user = await userModel.findById(winner);
        if(!user) {
            return res.status(400).json({message: "Did not found user."});
        }
        const painting = await paintingModel.findById(paymentId);
        if(!painting) {
            return res.status(400).json({message: "Painting does not found."});
        }
        if(painting.category === "Sale") {
            amount = painting.fixedPrice;
        } else if(painting.category === "Auction") {
            const auction = await auctionModel.findOne({painting:paymentId});
            if(!auction) {
                return res.status(400).json({message: "Auction not found."});
            }
            amount = auction.currentHighest;
        }

        const options = {
            amount: amount * 100, // Razorpay accepts amount in paise
            currency: "INR",
            receipt: `receipt_order_${Math.random() * 1000}`,
        };

        const order = await razorpayInstance.orders.create(options);
        console.log(order);
        res.status(200).json({order, user});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create order" });
    }
};


export const paymentVerification = async(req,res)=> {
    try{
        const {razorpay_order_id, razorpay_payment_id, razorpay_signature, paintingId, buyerId} = req.body;
        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        console.log("Expected Signature: ",expectedSignature);

        if(expectedSignature === razorpay_signature) {
            const painting = await paintingModel.findById(paintingId);
            painting.buyerID = buyerId;
            await painting.save();
            return res.status(200).json({success: true, message: "Payment verified successfully."})
        } else {
            return res.status(400).json({success: false, message: "Invalid signature, payment failed."})
        }
    } catch(error) {
        console.error("Error verifying payment:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}



export const postShippingAddress = async(req,res)=>{
    const {paintingId, buyerId} = req.params;
    console.log("buyerId",buyerId);
    console.log("paintingId", paintingId);
    try{
        console.log("req body",req.body);
        const {phone, address1, address2, city, state, zip, country} = req.body;
        if(!phone|| !address1 || !city || !state || !zip || !country) {
            return res.status(400).json({message: "All fields are required."});
        }
        const user = await userModel.findById(buyerId);
        console.log(user);
        if(!user) {
            return res.status(400).json({message: "User is not the winner."});
        }
        const paintingData = await paintingModel.findById(paintingId);
        console.log(paintingData);
        if(paintingData.category === "Sale") {
            const newAddress = new shippingAddressModel({
                phone: Number(phone),
                address1,
                address2,
                city,
                state,
                zip: Number(zip),
                country,
                userId: user._id
            })
            const savedAddress = await newAddress.save();
            return res.status(201).json({message: "Address Data Saved Successfully.", savedAddress: savedAddress}); 
        } else {
          if(paintingData?.buyerID?.toString() === buyerId ) {
            const newAddress = new shippingAddressModel({
                phone: Number(phone),
                address1,
                address2,
                city,
                state,
                zip: Number(zip),
                country,
                userId: user._id,
            });
            const savedAddress = await newAddress.save();
            return res.status(201).json({message: "Address Data Saved Successfully.", savedAddress: savedAddress});
        } else {
            return res.status(400).json({message: "Mismatch happened. "});
        }
     }
    }catch(error) {
        return res.status(500).json({message: "Error Posting Shipping Data."});
    }
}