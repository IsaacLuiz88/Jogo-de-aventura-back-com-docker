/* 
Score: 13

Total Bricks Skipped: 53

Total Bombs Skipped: 21

Total Bombs Exploded: 5

Total Energy Captured: 3

Nickname: asdasd

*/

import mongoose from "mongoose";

const scoreSchema = mongoose.Schema({
    score: {type: Number},
    total_bricks: {type: Number},
    bombs_skipped: {type: Number},
    bombs_exploded: {type: Number},
    energy_captured: {type: Number},
    nickname: {type: String}
})

export const Score = mongoose.model('Score', scoreSchema)
