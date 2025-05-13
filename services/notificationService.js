// services/notificationService.js

/**
 * Service to handle budget notifications
 */
class NotificationService {
  /**
   * Check if expense exceeds budget thresholds and generate notifications
   * @param {Object} category - The category with budget information
   * @param {Number} currentSpent - Current amount spent in this category
   * @param {Number} budgetAmount - Total budget amount
   * @param {Object} user - User object to send notification to
   * @returns {Array} - Array of notification objects
   */
  static checkBudgetThresholds(category, currentSpent, budgetAmount, user) {
    const notifications = [];
    const percentSpent = (currentSpent / budgetAmount) * 100;
    
    // Check if we've exceeded 80% threshold
    if (percentSpent >= 80 && percentSpent < 100) {
      notifications.push({
        type: 'warning',
        title: 'Budget Warning',
        message: `You've used ${percentSpent.toFixed(1)}% of your budget for ${category.name}`,
        user: user.id
      });
    }
    
    // Check if we've exceeded 100% threshold
    if (percentSpent >= 100) {
      notifications.push({
        type: 'alert',
        title: 'Budget Exceeded',
        message: `You've exceeded your budget for ${category.name} by ${(percentSpent - 100).toFixed(1)}%`,
        user: user.id
      });
    }
    
    return notifications;
  }
  
  /**
   * Send notifications to the user (this implementation just returns them)
   * @param {Array} notifications - Array of notification objects
   * @returns {Array} - The same notifications (in a real system, this would send them)
   */
  static sendNotifications(notifications) {
    // In a production system, you might:
    // - Store in database
    // - Push to a websocket connection
    // - Send email or push notification
    // - etc.
    
    // For now we'll just return them to be included in the API response
    return notifications;
  }
};

module.exports = NotificationService;