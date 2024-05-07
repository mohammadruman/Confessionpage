const mongoose = require('mongoose');
const connectDB = async()=>{

try {
    const conn = await mongoose.connect(process.env.MONGO_URL,{
        
    });
    console.log(`mongoDbConnected: ${conn.connection.host}`);
} catch (error) {
    console.log(`error , ${error.message}`);
    process.exit();
}
};
module.exports = connectDB;