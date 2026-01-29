import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", required: true,
    },

    certificateId: {
        type: String,
        required: true,
        unique: true,
    },
    issuedAt: {
        type: Date,
        default: Date.now,
    }
});

export default mongoose.model("Certificate", certificateSchema);