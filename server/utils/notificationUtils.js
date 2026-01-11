import Notification from '../models/Notification.js';
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
       
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

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

const clearAllNotifications = async (userId) => {
  try {
    const result = await Notification.deleteMany({ recipient: userId });
    return result;
  } catch (error) {
    console.error('Error clearing notifications:', error);
    throw error;
  }
};

export {
  createNotification,
  markNotificationsAsRead,
  getUserNotifications,
  clearAllNotifications
};
