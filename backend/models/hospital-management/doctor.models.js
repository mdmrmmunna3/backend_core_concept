import mongoose from 'mongoose';

const hospitalHours = new mongoose.Schema({
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true,
    },
    hospitalHours: {
        type: Number,
        default: 0,
    },
});

const doctorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        qualification: {
            type: String,
            required: true,
        },
        experenceInYears: {
            type: Number,
            default: 0,
        },
        salary: {
            type: Number,
            required: true,
        },
        worksInHospitals: [hospitalHours],
    },
    { timestamps: true }
);

export const Doctor = mongoose.model('Doctor', doctorSchema);
