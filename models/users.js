import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  email: {
    type: String,
    required: false,
    default: 'no-email@example.com',
    unique: false,
  },
  mobile_number: {
    type: String,
    unique: true,
  },
  address: String,
  profile_pic: String,
  otp: String,
  pan_number: {  
    type: String,
    required: false,  
  },
  role: {  
    type: String,
    enum: ['user', 'admin'],   
    default: 'user', 
  },
});

const User = mongoose.model('User_donation', userSchema);

export default User;
