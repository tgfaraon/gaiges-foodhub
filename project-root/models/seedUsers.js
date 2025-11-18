const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User'); // adjust path

mongoose.connect(process.env.MONGO_URI);

async function seedUsers() {
  const users = [
    {
      firstName: 'Gaige',
      email: 'gfhadmin@gaigesfoodhub.com',
      passwordHash: await bcrypt.hash('securepassword', 10),
      role: 'admin'
    },
    {
      firstName: 'Chef Tyler',
      email: 'tgfaraon@gmail.com',
      passwordHash: await bcrypt.hash('chefpass', 10),
      role: 'member'
    },
    {
      firstName: 'Tyler',
      email: 'tyler@bbzlimo.com',
      passwordHash: await bcrypt.hash('memberpass', 10),
      role: 'member'
    }
  ];

  await User.insertMany(users);
  console.log('✅ Users seeded');
  mongoose.disconnect();
}

seedUsers();