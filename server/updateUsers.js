const { mongoose } = require("mongoose");
const User = require("./models/user");
const dotenv = require('dotenv').config();

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URL)
    .then(async () => {
        console.log("Connected to MongoDB");

        const result = await User.updateMany(
            { isVerified: { $exists: false } },
            { $set: { isVerified: true } }
        );

        console.log(`Updated ${result.modifiedCount} users`);
        mongoose.disconnect();
    }).catch(err => console.log(err));
