const bcrypt = require('bcryptjs');
const db = require('../config/db');

class UserModel {
  static async create({ name, email, password, role = 'user' }) {
    const store = db.getStore();
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name,
      email,
      password: hashedPassword,
      role,
      subscription: 'free',
      createdAt: new Date()
    };
    store.users.push(user);
    return user;
  }

  static async findByEmail(email) {
    const store = db.getStore();
    return store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  static async findById(id) {
    const store = db.getStore();
    return store.users.find(u => u.id === id);
  }

  static async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }
}

module.exports = UserModel;
