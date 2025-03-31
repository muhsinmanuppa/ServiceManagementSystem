import Notification from '../models/Notification.js';

/**
 * Create a notification
 * @param {Object} notificationData - The notification data
 * @param {string} notificationData.recipient - Recipient user ID
 * @param {string} notificationData.type - Type of notification
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.content - Notification content
 * @param {Object} notificationData.relatedItem - Related item information
 * @returns {Promise<Object>} - The created notification
 */
const createNotification = async (notificationData) => {
  try {
    const { recipient, type, title, content, relatedItem } = notificationData;
    
    const notification = new Notification({
      recipient,
      type,
      title,
      content,
      relatedItem,
      createdAt: new Date()
    });
    
    await notification.save();
    
    // Emit socket event here if socket integration is set up
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Mark notifications as read
 * @param {string} userId - User ID
 * @param {string[]} notificationIds - Array of notification IDs to mark as read
 * @returns {Promise<Object>} - Update result
 */
const markNotificationsAsRead = async (userId, notificationIds) => {
  try {
    const result = await Notification.updateMany(
      { 
        _id: { $in: notificationIds },
        recipient: userId,
        read: false
      },
      { $set: { read: true, readAt: new Date() } }
    );
    
    return result;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw error;
  }
};

/**
 * Get user notifications
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of notifications to return
 * @param {boolean} options.unreadOnly - If true, return only unread notifications
 * @returns {Promise<Array>} - Array of notification objects
 */
const getUserNotifications = async (userId, options = {}) => {
  try {
    const { limit = 20, unreadOnly = false } = options;
    
    const query = { recipient: userId };
    if (unreadOnly) {
      query.read = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
    
    return notifications;
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

/**
 * Clear all user notifications
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Delete result
 */
const clearAllNotifications = async (userId) => {
  try {
    const result = await Notification.deleteMany({ recipient: userId });
    return result;
  } catch (error) {
    console.error('Error clearing notifications:', error);
    throw error;
  }
};

// Single export statement at the end
export {
  createNotification,
  markNotificationsAsRead,
  getUserNotifications,
  clearAllNotifications
};
