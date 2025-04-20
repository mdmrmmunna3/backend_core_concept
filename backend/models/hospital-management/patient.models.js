import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        diagonstedWith: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        age: {
            type: String,
            required: true,
        },
        bloodGrop: {
            type: String,
            required: true,
        },
        gender: [
            {
                type: String,
                enum: ['M', 'F', 'O'],
                required: true,
            },
        ],
        admitted: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hospital',
        },
    },
    { timestamps: true }
);

export const Patient = mongoose.model('Patient', patientSchema);
