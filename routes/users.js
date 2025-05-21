const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/pin")
  .then(() => console.log("MongoDB connection successful"))
  .catch(err => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1); // Exit on connection error
  });

// Define the User Schema
const userSchema = mongoose.Schema({
  username: String, // Automatically handled by passport-local-mongoose
  name : String ,
  email: String,
  password : String , 
  profileImage: String,
  contact: Number,
  boards: {
    type: Array,
    default: []
  },
  posts :[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref : "post"
    }
  ]
});

// Add passport-local-mongoose plugin
userSchema.plugin(plm);

// Export the User model
module.exports = mongoose.model("user", userSchema);
