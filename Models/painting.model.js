import mongoose from 'mongoose';
const paintingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    category: {
        type: String,
        enum: ['Hold', 'Sale', 'Auction'],
        default: 'Hold',
    },
    dimension: {
        width: {
            type: Number,
            required: true,
        },
        height: {
            type: Number,
            required: true,
        },
    },
    file: {
        type: String,
        required: true,
        trim:  true,
        unique: true,
    },
    fixedPrice: {
        type: Number,
        required: function() {return this.category === 'Sale'},
    },
    startingPrice: {
        type: Number,
        required: function() {return this.category === 'Auction'},
    },
    bidIncrement: {
        type: Number,
        required: function() {return this.category === 'Auction'},
    },
    upiid: {
        type: String,
        required: true,
        trim: true,
    },
    sellerID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    buyerID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    }
})

const paintingModel = mongoose.model('Painting', paintingSchema);
export default paintingModel;

