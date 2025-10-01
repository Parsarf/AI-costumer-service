const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.STRING(255),
    primaryKey: true,
    defaultValue: () => `conv_${Date.now()}_${uuidv4().split('-')[0]}`
  },
  shopId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  customerEmail: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  customerName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  customerId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Shopify customer ID'
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'escalated', 'resolved', 'closed']]
    }
  },
  escalated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  escalationReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional context like order numbers, product IDs, etc.'
  },
  messageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sessionId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Browser session identifier'
  }
}, {
  tableName: 'conversations',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['shop_id'] },
    { fields: ['status'] },
    { fields: ['escalated'] },
    { fields: ['customer_email'] },
    { fields: ['created_at'] },
    { fields: ['last_message_at'] }
  ]
});

// Define associations
Conversation.associate = (models) => {
  Conversation.belongsTo(models.Store, {
    foreignKey: 'shopId',
    as: 'store'
  });
  Conversation.hasMany(models.Message, {
    foreignKey: 'conversationId',
    as: 'messages'
  });
};

// Instance methods
Conversation.prototype.escalate = async function(reason) {
  this.escalated = true;
  this.status = 'escalated';
  this.escalationReason = reason;
  await this.save();
};

Conversation.prototype.resolve = async function() {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  await this.save();
};

Conversation.prototype.incrementMessageCount = async function() {
  this.messageCount += 1;
  this.lastMessageAt = new Date();
  await this.save();
};

module.exports = Conversation;

