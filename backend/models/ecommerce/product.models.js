import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        brand: {
            type: String,
            required: true,
        },
        productPrice: {
            type: Number,
            required: true,
            default: 0,
        },
        stock: {
            type: Number,
            default: 0,
        },
        varients: [
            {
                color: {
                    type: String,
                    enum: ['White', 'Blue', 'Black'],
                },
            },
        ],
        productImg: {
            type: String,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

export const Product = mongoose.model('Product', subCategorySchema);
