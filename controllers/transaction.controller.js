import dotenv from 'dotenv';
dotenv.config();
import userModel from '../Models/users.model.js';
import paintingModel from '../Models/painting.model.js';
import auctionModel from './../Models/auction.model.js';
import shippingAddressModel from '../Models/shippingAddress.model.js';
import screenshotModel from '../Models/paymentScreenshots.model.js';
import {spawn} from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const getTransactionData = async(req,res)=>{
    const {buyerId, paintingId} = req.params;
    try {
        const user = await userModel.findById(buyerId);
        if(!user) {
            return res.status(400).json({message: "User has not registered."});
        }
        const painting = await paintingModel.findById(paintingId);
        if(!painting) {
            return res.status(400).json({message: "Painting does not exist."});
        }
        if(painting.category === "Sale") {
                const updatedPainting = {
                    ...painting._doc,
                    file: `http://localhost:8000/files/${painting.file}`
                };
                return res.status(201).json({message: "Transaction data received.", user, updatedPainting});
        } else {
            if(paintingData?.buyerID?.toString() === buyerId) {
                const auction = await auctionModel.findOne({painting: paintingId});
                if(!auction) {
                    return res.status(400).json({message: "Auction data not found."});
                }
                const updatedPainting = {
                    ...painting._doc,
                    file: `http://localhost:8000/files/${painting.file}`
                };
                return res.status(201).json({message: "Data received.", user, updatedPainting, auction});
            }
        }
    } catch(error) {
        return res.status(500).json({message: "Error fetching Data"});
    }
}


export const postShippingAddress = async(req,res)=>{
    const {buyerId, paintingId} = req.params;
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


export const handleScreenshotSubmit = async (req, res) => {
  const { buyerId, paintingId } = req.params;

  try {
    console.log(req.file.filename);

    const user = await userModel.findById(buyerId);
    if (!user) {
      return res.status(400).json({ message: "User is not a winner." });
    }

    const painting = await paintingModel.findById(paintingId);
    if (!painting) {
      return res.status(400).json({ message: "Painting is empty." });
    }
    if(painting.category === "Auction") {
      if (painting?.buyerID?.toString() !== buyerId) {
        return res.status(403).json({ message: "Unauthorized access." });
      }
      const auction = await auctionModel.findOne({ painting: paintingId });
      if (!auction) {
        return res.status(404).json({ message: "Auction not found." });
      }
    }

    // Save the screenshot first
    const newScreenshot = new screenshotModel({
      paymentScreenshotImage: req.file.filename,
      buyerId: buyerId,
      paintingId: paintingId,
    });
    const savedScreenshot = await newScreenshot.save();
    let backendAmount;
    if(painting.category === "Auction") {
        backendAmount = auction.currentHighest;
    } else {
        backendAmount = painting.fixedPrice;
    }
    const backendUpiId = painting.upiid;
    const ocrServicePath = path.join(__dirname, '..', 'ocr_service.py');
    const imagePath = path.join(__dirname, '..', 'files', req.file.filename);  

    // Call the Python script
    const python = spawn('python', [ocrServicePath, imagePath]);

    let data = '';
    python.stdout.on('data', (chunk) => {
      data += chunk.toString();
    });

    python.stderr.on('data', (err) => {
      console.error(`Python Error: ${err}`);
    });

    python.on('close', (code) => {
      (async()=> {
      if (code !== 0) {
        return res.status(500).json({ message: "Python script failed." });
      }

      try {
        const { score, amount, upi_id } = JSON.parse(data);

        console.log(`Extracted -> Score: ${score}, Amount: ${amount}, UPI ID: ${upi_id}`);
        if (score >= 0.75) {
          // Match Amount and UPI ID
          if (parseFloat(amount) === parseFloat(backendAmount) && upi_id.trim() === backendUpiId.trim()) {
            if(painting.category==="Sale") {
              painting.buyerID = buyerId;
              await painting.save();
            }
            return res.status(200).json({ message: "Screenshot verified successfully.", screenshot: savedScreenshot });
          } else {
            return res.status(400).json({ message: "Amount or UPI ID mismatch.", extracted: { amount, upi_id } });
          }
        } else {
          return res.status(400).json({ message: "Screenshot not clear enough (low score).", score });
        }
      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to process OCR output." });
      }
    })();
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
