const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  conversationId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    references: {
      model: 'conversations',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['user', 'assistant', 'system']]
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Order data, product info, detected intents, etc.'
  },
  tokens: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Token count for Claude API usage tracking'
  },
  responseTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Response time in milliseconds'
  },
  claudeModel: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Claude model version used'
  }
}, {
  tableName: 'messages',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['conversation_id'] },
    { fields: ['role'] },
    { fields: ['created_at'] }
  ]
});

// Define associations
Message.associate = (models) => {
  Message.belongsTo(models.Conversation, {
    foreignKey: 'conversationId',
    as: 'conversation'
  });
};

module.exports = Message;

