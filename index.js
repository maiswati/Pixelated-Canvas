import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import userRoutes from './routes/user.routes.js';
import paintingRoutes from './routes/painting.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import allPaintingsRoute from './routes/allpainting.routes.js';
import auctionModel from './Models/auction.model.js';
import paintingModel from './Models/painting.model.js';

dotenv.config();
const MONGO_URL = process.env.MONGO_URL;
const API = process.env.API;
const PORT = process.env.PORT || 8000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: API,// frontend
        methods: ["GET", "POST"]
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: 'https://pixelated-canvas-frontend.vercel.app/',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }));
  
  
mongoose.connect(MONGO_URL)
    .then(() => {
        console.log("Successfully Connected to Database");
        server.listen(PORT , () => {
            console.log(`App is listening on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.log(err);
    });

app.use('/users', userRoutes);
app.use('/paintings', paintingRoutes);
app.use('/forgallery', allPaintingsRoute);
app.use('/payment', transactionRoutes);

const auctionTimers = {};
const endedAuctions = new Set();
const userSocketMap = {};

io.on("connection", (socket) => {
    console.log(`New Client Connected: ${socket.id}`);

    socket.on("joinAuction", async ({auctionId, userId}) => {
        try {
            const auction = await auctionModel.findById(auctionId);
            if (!auction) {
                console.log("Auction not found for: ", auctionId);
                return;
            }

            socket.join(auctionId);
            socket.join(userId);

            //save the mapping
            userSocketMap[userId] = socket.id;
            console.log(`Socket ${socket.id} joined the auction room: ${auctionId}`);

            if (!auctionTimers[auctionId]) {
                auctionTimers[auctionId] = {
                    timeLeft: 60,
                    interval: null,
                };

                // Start countdown
                auctionTimers[auctionId].interval = setInterval(async () => {
                    const updatedAuction = await auctionModel.findById(auctionId); // Fetch latest auction details
                    if (updatedAuction.status === true) {
                        // If auction already ended manually or elsewhere
                        io.in(auctionId).emit("auctionEnded", {
                            highestBidder: updatedAuction?.highestBidder || null,
                            currentHighest: updatedAuction?.currentHighest || 0,
                            auctionStatus: updatedAuction?.status
                        });
                        if (updatedAuction?.highestBidder) {
                            const highestBidderSocketId = userSocketMap[updatedAuction.highestBidder];
                            if (highestBidderSocketId) {
                                io.to(highestBidderSocketId).emit("auctionEndedConfirm", { proceedToCheckout: true });
                            } else {
                                console.log("Highest bidder socket not found or user disconnected.");
                            }
                        }
                        clearInterval(auctionTimers[auctionId].interval);
                        delete auctionTimers[auctionId];
                        return;
                    }
                    if (auctionTimers[auctionId].timeLeft <= 0) {
                        const refreshedAuction = await auctionModel.findById(auctionId);
                        if(!refreshedAuction.highestBidder) {
                            //No bids placed yet so reset the timer and don't end the auction
                            console.log(`Auction ${auctionId} timer ended but no bids yet. Extending auction time.`);
                            auctionTimers[auctionId].timeLeft = 60; //Reset timer.
                            io.to(auctionId).emit("updateTimer", {
                                timeLeft: auctionTimers[auctionId].timeLeft,
                                highestBidder: refreshedAuction.highestBidder,
                                currentHighest: refreshedAuction.currentHighest,
                                auctionStatus: refreshedAuction.status
                            });
                            return;
                        }
                        //safe to end the auction since at least one bid is placed.
                        clearInterval(auctionTimers[auctionId].interval);
                        endedAuctions.add(auctionId); // Mark the auction as ended
                        updatedAuction.status = true;

                        await updatedAuction.save();
                        const updatePainting = await paintingModel.findById(updatedAuction.painting);
                        updatePainting.buyerID = updatedAuction.highestBidder;
                        await updatePainting.save();
                        io.in(auctionId).emit("auctionEnded", {
                            highestBidder: updatedAuction?.highestBidder || null,
                            currentHighest: updatedAuction?.currentHighest || 0,
                            auctionStatus: updatedAuction?.status
                        });

                        // if(updatedAuction?.highestBidder) {
                        //     io.to(updatedAuction.highestBidder).emit("auctionEndedConfirm", {proceedToCheckout: true})
                        // }
                        if (updatedAuction?.highestBidder) {
                            const highestBidderSocketId = userSocketMap[updatedAuction.highestBidder];
                            if (highestBidderSocketId) {
                                io.to(highestBidderSocketId).emit("auctionEndedConfirm", { proceedToCheckout: true });
                            } else {
                                console.log("Highest bidder socket not found or user disconnected.");
                            }
                        }
                        console.log(`Auction ${auctionId} ended. Winner: ${updatedAuction?.highestBidder}`);
                        delete auctionTimers[auctionId]; // Remove the auction timer.
                    } else {
                        auctionTimers[auctionId].timeLeft -= 1;

                        io.to(auctionId).emit("updateTimer", {
                            timeLeft: auctionTimers[auctionId].timeLeft,
                            highestBidder: updatedAuction.highestBidder, // Use updated values
                            currentHighest: updatedAuction.currentHighest,
                            auctionStatus: updatedAuction.status
                        });
                    }
                }, 1000);
            }

            // Send initial auction details
            socket.emit("joinAuction", {
                timeLeft: auctionTimers[auctionId].timeLeft,
                highestBidder: auction.highestBidder,
                currentHighest: auction.currentHighest,
                auctionStatus: auction.status,
            });

        } catch (error) {
            console.log("Error in joining the auction room: ", auctionId, error);
        }
    });


    socket.on("placeBid", async ({ auctionId, userId, bidAmount }) => {
        try {
            const auction = await auctionModel.findById(auctionId);
            if (!auction) {
                console.log("Auction not found for: ", auctionId);
                return;
            }

            // Ensure the new bid is higher than the current highest + increment
            if (bidAmount <= auction.currentHighest || bidAmount < auction.currentHighest + auction.increment) {
                socket.emit("bidRejected", {
                    message: "Bid must be higher than current highest bid and greater than or equal to the increment value.",
                });
                return;
            }

            // Update auction details
            auction.highestBidder = userId;
            auction.currentHighest = bidAmount;
            await auction.save();

            console.log(`New bid placed in auction ${auctionId}: ₹${bidAmount} by ${userId}`);

            // Reset the auction timer to 60 seconds
            if (auctionTimers[auctionId]) {
                auctionTimers[auctionId].timeLeft = 60;
            }

            io.in(auctionId).emit("newBid", {
                highestBidder: userId,
                currentHighest: bidAmount,
                timeLeft: auctionTimers[auctionId].timeLeft,
            });

        } catch (error) {
            console.log("Error placing bid in auction: ", auctionId, error);
        }
    });


    socket.on("disconnect", () => {
        console.log(`Socket ${socket.id} disconnected.`);
    
        for (const [userId, sockId] of Object.entries(userSocketMap)) {
            if (sockId === socket.id) {
                console.log(`User ${userId} disconnected`);
                // Optionally: you can set a timeout to remove them later.
                // setTimeout(() => delete userSocketMap[userId], 300000); // remove after 5 minutes
                break;
            }
        }
    });
    

});