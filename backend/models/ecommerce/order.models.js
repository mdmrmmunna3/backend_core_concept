import mongoose from 'mongoose';

const orderItemsSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
    },
    name: {
        type: String,
        required: true,
    },
    item_quantity: {
        type: Number,
        default: 0,
    },
});

const orderSchema = new mongoose.Schema(
    {
        orderPrice: {
            type: Number,
            required: true,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        orderItems: [orderItemsSchema],
        address: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['PENDING', 'CANCELLED', 'DELIVERED'],
            default: 'PENDING',
        },
    },
    { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
