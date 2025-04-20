import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: [true, 'Password must be required!'],
            unique: true,
        },
    },
    { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
// const trythis = await User.create({username: 'test'});

// console.log(trythis.createdAt);
// console.log(trythis.updatedAt);
