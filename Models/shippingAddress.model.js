import mongoose from 'mongoose';
const shippingAddressSchema = new mongoose.Schema({
    phone: {
        type: Number,
        Required: true,
    },
    address1: {
        type: String,
        required: true,
    },
    address2: {
        type: String,
    },
    city: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    zip: {
        type: Number,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    }
});

const shippingAddressModel = mongoose.model('Address', shippingAddressSchema);
export default shippingAddressModel;