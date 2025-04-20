import mongoose from 'mongoose';

const medicalReportSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
        },
        visit: {
            deparment: {
                type: String,
            },
            doctor: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Doctor',
            },
        },
        vitals: {
            height_cm: {
                type: Number,
            },
            weight_kg: {
                type: Number,
            },
            blood_presure: {
                type: String,
            },
            heart_rate_bpm: {
                type: Number,
            },
            temperature_c: {
                type: Number,
            },
            respiratory_rate: {
                type: Number,
            },
        },

        symptoms: [{ type: String }],
        diagnosis: {
            description: {
                type: String,
            },
        },
        tests_ordered: [
            {
                test_name: {
                    type: String,
                    required: true,
                },
                status: {
                    type: String,
                    enum: ['Pending', 'Cancelled', 'Completed'],
                    default: 'Pending',
                },
                result: {
                    type: String,
                    required: true,
                },
            },
        ],
        prescriptions: [
            {
                medication: {
                    type: String,
                },
                dosage: {
                    type: String,
                    required: true,
                },
                frequency: {
                    type: String,
                    required: true,
                },
                duration: {
                    type: String,
                    required: true,
                },
            },
        ],
        follow_up: {
            recommended: {
                type: Boolean,
            },
            date: {
                type: Date,
            },
            notes: {
                type: String,
            },
        },
    },
    { timestamps: true }
);

export const MedicalReport = mongoose.model(
    'MedicalReport',
    medicalReportSchema
);
