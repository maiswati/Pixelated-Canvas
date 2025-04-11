import mongoose from 'mongoose';

const paymentScreenshotSchema = new mongoose.Schema({
    paymentScreenshotImage: {
        type: String,
        required: true,
        trim: true,
    },
    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        default: null,
    },
    paintingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Painting",
        required: true,
        default: null,
    }
});

const screenshotModel = mongoose.model("Screenshot", paymentScreenshotSchema);
export default screenshotModel;