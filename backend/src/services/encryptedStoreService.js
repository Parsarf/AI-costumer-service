const prisma = require('../lib/prisma');
const { encryptAccessToken, decryptAccessToken } = require('../utils/encryption');
const logger = require('../utils/logger');

/**
 * Service for handling encrypted store operations
 */
class EncryptedStoreService {
  
  /**
   * Create or update shop with encrypted access token
   */
  static async upsertShop(shopData) {
    try {
      const { shop, accessToken, ...otherData } = shopData;
      
      // Encrypt access token
      const encryptedToken = encryptAccessToken(accessToken);
      
      const shopRecord = await prisma.shop.upsert({
        where: { shop },
        update: {
          ...otherData,
          accessToken: encryptedToken,
          updatedAt: new Date()
        },
        create: {
          shop,
          accessToken: encryptedToken,
          ...otherData
        }
      });

      logger.info('Shop upserted with encrypted token', { shop });
      return shopRecord;
      
    } catch (error) {
      logger.error('Error upserting shop:', error);
      throw error;
    }
  }

  /**
   * Get shop with decrypted access token
   */
  static async getShop(shop) {
    try {
      const shopRecord = await prisma.shop.findUnique({
        where: { shop }
      });

      if (!shopRecord) {
        return null;
      }

      // Decrypt access token
      const decryptedToken = decryptAccessToken(shopRecord.accessToken);
      
      return {
        ...shopRecord,
        accessToken: decryptedToken
      };
      
    } catch (error) {
      logger.error('Error getting shop:', error);
      throw error;
    }
  }

  /**
   * Update shop access token
   */
  static async updateAccessToken(shop, newAccessToken) {
    try {
      const encryptedToken = encryptAccessToken(newAccessToken);
      
      const updatedShop = await prisma.shop.update({
        where: { shop },
        data: {
          accessToken: encryptedToken,
          updatedAt: new Date()
        }
      });

      logger.info('Shop access token updated', { shop });
      return updatedShop;
      
    } catch (error) {
      logger.error('Error updating access token:', error);
      throw error;
    }
  }

  /**
   * Get all shops with decrypted access tokens (for admin purposes)
   */
  static async getAllShops() {
    try {
      const shops = await prisma.shop.findMany({
        where: { isActive: true }
      });

      // Decrypt access tokens
      return shops.map(shop => ({
        ...shop,
        accessToken: decryptAccessToken(shop.accessToken)
      }));
      
    } catch (error) {
      logger.error('Error getting all shops:', error);
      throw error;
    }
  }

  /**
   * Verify shop access token is valid
   */
  static async verifyAccessToken(shop) {
    try {
      const shopRecord = await this.getShop(shop);
      
      if (!shopRecord) {
        return { valid: false, error: 'Shop not found' };
      }

      if (!shopRecord.accessToken) {
        return { valid: false, error: 'No access token found' };
      }

      // Basic validation - token should be a string and not empty
      if (typeof shopRecord.accessToken !== 'string' || shopRecord.accessToken.length === 0) {
        return { valid: false, error: 'Invalid access token format' };
      }

      return { valid: true, shop: shopRecord };
      
    } catch (error) {
      logger.error('Error verifying access token:', error);
      return { valid: false, error: 'Token verification failed' };
    }
  }

  /**
   * Migrate existing unencrypted tokens to encrypted format
   * This should be run once during deployment
   */
  static async migrateToEncryption() {
    try {
      logger.info('Starting encryption migration...');
      
      const shops = await prisma.shop.findMany({
        where: { isActive: true }
      });

      let migrated = 0;
      let errors = 0;

      for (const shop of shops) {
        try {
          // Check if token is already encrypted
          if (shop.accessToken.includes(':')) {
            logger.info('Token already encrypted, skipping', { shop: shop.shop });
            continue;
          }

          // Encrypt the token
          const encryptedToken = encryptAccessToken(shop.accessToken);
          
          await prisma.shop.update({
            where: { id: shop.id },
            data: { accessToken: encryptedToken }
          });

          migrated++;
          logger.info('Token migrated successfully', { shop: shop.shop });
          
        } catch (error) {
          errors++;
          logger.error('Error migrating shop token:', { 
            shop: shop.shop, 
            error: error.message 
          });
        }
      }

      logger.info('Encryption migration completed', { 
        total: shops.length, 
        migrated, 
        errors 
      });

      return { total: shops.length, migrated, errors };
      
    } catch (error) {
      logger.error('Error during encryption migration:', error);
      throw error;
    }
  }
}

module.exports = EncryptedStoreService;
