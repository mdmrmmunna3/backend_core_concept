import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        sub_category: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'SubCategory',
                required: true,
            },
        ],
    },
    { timestamps: true }
);

export const Category = mongoose.model('Category', categorySchema);
