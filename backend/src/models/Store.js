const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

const Store = sequelize.define('Store', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  shop: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: false,
    validate: {
      is: /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/
    }
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      // In production, decrypt this value
      return this.getDataValue('accessToken');
    },
    set(value) {
      // In production, encrypt this value
      this.setDataValue('accessToken', value);
    }
  },
  storeName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {
      welcomeMessage: "Hi! 👋 I'm here to help you with any questions about your order, returns, or our products. How can I assist you today?",
      returnPolicy: "We accept returns within 30 days of purchase. Items must be unworn and in original packaging.",
      shippingPolicy: "We ship within 1-2 business days. Domestic orders typically arrive in 3-5 business days.",
      supportEmail: "support@example.com",
      botPersonality: "friendly",
      escalationEmail: null,
      chatbotEnabled: true,
      theme: {
        primaryColor: "#4F46E5",
        position: "bottom-right"
      }
    }
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  subscriptionTier: {
    type: DataTypes.STRING(50),
    defaultValue: 'starter',
    validate: {
      isIn: [['starter', 'pro', 'scale', 'trial']]
    }
  },
  subscriptionStatus: {
    type: DataTypes.STRING(50),
    defaultValue: 'trial',
    validate: {
      isIn: [['trial', 'active', 'cancelled', 'expired']]
    }
  },
  chargeId: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  conversationCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  conversationLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 1000
  },
  installedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'stores',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['shop'] },
    { fields: ['active'] },
    { fields: ['subscription_tier'] }
  ]
});

// Instance methods
Store.prototype.canSendMessage = function() {
  return this.active && 
         this.subscriptionStatus === 'active' &&
         (this.subscriptionTier === 'scale' || this.conversationCount < this.conversationLimit);
};

Store.prototype.incrementConversationCount = async function() {
  this.conversationCount += 1;
  await this.save();
};

module.exports = Store;

