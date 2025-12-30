const mongoose = require('mongoose');
const Lesson = require('../models/Lesson'); // adjust path if needed

async function run() {
  try {
    // connect to your DB (replace with your actual connection string)
    await mongoose.connect('mongodb://localhost:27017/yourdbname');

    // fetch lessons sorted by creation date
    const lessons = await Lesson.find().sort({ createdAt: 1 });

    // assign order values
    for (let i = 0; i < lessons.length; i++) {
      lessons[i].order = i + 1; // lesson 1 gets order=1, etc.
      await lessons[i].save();
      console.log(`Updated ${lessons[i].title} -> order ${i + 1}`);
    }

    console.log('✅ Lesson order updated successfully');
  } catch (err) {
    console.error('Error updating lesson order:', err);
  } finally {
    mongoose.disconnect();
  }
}

run();