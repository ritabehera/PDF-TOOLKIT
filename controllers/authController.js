const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');
const HistoryModel = require('../models/History');
const { FavoriteModel } = require('../models/Favorite');
const config = require('../config/default');

class AuthController {
  static async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Please provide name, email, and password.' });
      }

      const existing = await UserModel.findByEmail(email);
      if (existing) return res.status(400).json({ error: 'User with this email already exists.' });

      const user = await UserModel.create({ name, email, password });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        config.jwtSecret,
        { expiresIn: config.jwtExpire }
      );

      res.status(201).json({
        success: true,
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, subscription: user.subscription }
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Please provide email and password.' });

      const user = await UserModel.findByEmail(email);
      if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

      const isMatch = await UserModel.comparePassword(password, user.password);
      if (!isMatch) return res.status(401).json({ error: 'Invalid credentials.' });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        config.jwtSecret,
        { expiresIn: config.jwtExpire }
      );

      res.json({
        success: true,
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, subscription: user.subscription }
      });
    } catch (err) {
      next(err);
    }
  }

  static async profile(req, res, next) {
    try {
      const userId = req.user.id;
      const history = await HistoryModel.getRecent(userId, 10);
      const favorites = await FavoriteModel.getFavorites(userId);

      res.json({
        user: req.user,
        history,
        favorites
      });
    } catch (err) {
      next(err);
    }
  }

  static async toggleFavorite(req, res, next) {
    try {
      const userId = req.user ? req.user.id : 'guest';
      const { toolId } = req.body;
      const result = await FavoriteModel.toggle(userId, toolId);
      res.json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
