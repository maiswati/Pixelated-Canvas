import mongoose from 'mongoose';

const auctionSchema = new mongoose.Schema({
    painting: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Painting',
        required: true,
    },
    increment: {
        type: Number,
        required: true,
    },
    currentHighest: {
        type: Number
    },
    startPrice: {
        type: Number,
        required: true,
    },
    startDateTime: {
        type: Date,
    },
    endDateTime: {
        type: Date,
    },
    status: {
        type: Boolean,
        required: true,
        default: false
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    highestBidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' 
    }
});

const auctionModel = mongoose.model('Auction', auctionSchema);
export default auctionModel;