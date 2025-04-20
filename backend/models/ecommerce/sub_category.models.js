import mongoose from 'mongoose';

const subCategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

export const SubCategory = mongoose.model('SubCategory', subCategorySchema);
