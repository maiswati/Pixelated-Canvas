import dotenv from 'dotenv';
dotenv.config();
import User from '../Models/users.model.js';
import mongoose from 'mongoose';
import paintingModel from './../Models/painting.model.js';
import auctionModel from '../Models/auction.model.js';

export const paintingUpload = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category, width, height, upiid, fixedPrice, startingPrice, bidIncrement, file } = req.body;
        console.log(file);

        if (!file) return res.status(400).json({ message: "Painting file has not been uploaded." });
        if (!title || !description || !category || !width || !height || !upiid) return res.status(400).json({ message: "All fields are required." });
        if (category === 'Sale' && !fixedPrice) return res.status(400).json({ message: "Fixed price is required." });
        if (category === 'Auction' && (!startingPrice || !bidIncrement)) return res.status(400).json({ message: "Starting price or Bid Increment is required." });

        const sellerOfPainting = await User.findById(id);
        if (!sellerOfPainting) return res.status(404).json({ message: "Seller has not registered." });

        const newPainting = new paintingModel({
            title,
            description,
            category,
            dimension: { width: Number(width), height: Number(height) },
            upiid,
            file,
            fixedPrice: category === 'Sale' ? Number(fixedPrice) : null,
            startingPrice: category === 'Auction' ? Number(startingPrice) : null,
            bidIncrement: category === 'Auction' ? Number(bidIncrement) : null,
            sellerID: id,
            buyerID: null,
        });

        const savedPainting = await newPainting.save();

        let savedAuctionPainting = null;

        if (category === 'Auction') {
            const auctionPainting = new auctionModel({
                painting: savedPainting._id,
                increment: savedPainting.bidIncrement,
                startPrice: savedPainting.startingPrice,
                sellerId: savedPainting.sellerID,
            });
            savedAuctionPainting = await auctionPainting.save();
        }

        return res.status(200).json({ message: "Painting uploaded successfully.", savedPainting, savedAuctionPainting });

    } catch (error) {
        console.error("Actual error:", error);
        return res.status(500).json({ message: "Internal Server Error." });
    }
};



export const getIndividualPaintingData = async (req, res) => {
    try {
        const { id } = req.params;
        
        const individualPaintingData = await paintingModel.findById(id);

        if (!individualPaintingData) {
            return res.status(404).json({ message: "Painting not found." });
        }

        const paintingObjectId = new mongoose.Types.ObjectId(id);
        if (individualPaintingData.category === "Auction") {
            const auctionData = await auctionModel.findOne({ painting: paintingObjectId });

            if (!auctionData) {
                return res.status(404).json({
                    message: `No auction found for painting with ID: ${id}`
                });
            }

            return res.status(200).json({
                message: "Fetched Data successfully.",
                updatedPaintingData : individualPaintingData,
                auctionData: auctionData
            });
        } else {
            return res.status(200).json({
                message: "Painting Data Fetched Successfully.",
                updatedPaintingData: individualPaintingData
            });
        }
    } catch (error) {
        console.error("Error fetching painting data:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};




