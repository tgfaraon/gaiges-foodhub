const ENV = process.env.NODE_ENV || 'development';

const AI_CONFIG = {
  model: ENV === 'production' ? 'gpt-4' : 'gpt-3.5-turbo', // ✅ cheaper in dev
  temperature: 0,
};

module.exports = AI_CONFIG;