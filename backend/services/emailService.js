const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
};

// Send budget alert email
const sendBudgetAlert = async (user, budget, alertType, spendingPercentage) => {
    try {
        if (!user.notificationPreferences?.email) {
            return;
        }

        const transporter = createTransporter();

        const subject = alertType === 'critical'
            ? '🚨 Budget Limit Reached!'
            : '⚠️ Budget Warning Alert';

        const message = alertType === 'critical'
            ? `You have reached ${spendingPercentage.toFixed(1)}% of your ${budget.period.toLowerCase()} budget limit of ₹${budget.totalLimit}.`
            : `You have used ${spendingPercentage.toFixed(1)}% of your ${budget.period.toLowerCase()} budget limit of ₹${budget.totalLimit}.`;

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${alertType === 'critical' ? '#dc2626' : '#f59e0b'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .stats { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .stat-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .progress-bar { background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden; margin: 15px 0; }
          .progress-fill { background: ${alertType === 'critical' ? '#dc2626' : '#f59e0b'}; height: 100%; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${subject}</h1>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>${message}</p>
            
            <div class="stats">
              <h3>Budget Overview</h3>
              <div class="stat-row">
                <span>Budget Limit:</span>
                <strong>₹${budget.totalLimit.toFixed(2)}</strong>
              </div>
              <div class="stat-row">
                <span>Current Spending:</span>
                <strong>₹${budget.currentSpending.toFixed(2)}</strong>
              </div>
              <div class="stat-row">
                <span>Remaining:</span>
                <strong>₹${(budget.totalLimit - budget.currentSpending).toFixed(2)}</strong>
              </div>
              
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(spendingPercentage, 100)}%"></div>
              </div>
              <p style="text-align: center; margin: 0;"><strong>${spendingPercentage.toFixed(1)}%</strong> of budget used</p>
            </div>
            
            <p>${alertType === 'critical'
                ? 'Consider reviewing your expenses to avoid overspending.'
                : 'Keep track of your spending to stay within budget.'}</p>
            
            <p>Best regards,<br>Expense Manager Team</p>
          </div>
          <div class="footer">
            <p>This is an automated alert from your Expense Manager.</p>
          </div>
        </div>
      </body>
      </html>
    `;

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject,
            html,
        });

        console.log(`✅ Budget alert email sent to ${user.email}`);
    } catch (error) {
        console.error('Error sending budget alert email:', error);
    }
};

// Send subscription renewal reminder
const sendSubscriptionReminder = async (user, subscription, daysUntilRenewal) => {
    try {
        if (!user.notificationPreferences?.email) {
            return;
        }

        const transporter = createTransporter();

        const subject = `🔔 Subscription Renewal Reminder: ${subscription.serviceName}`;

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .subscription-card { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #3b82f6; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Subscription Renewal Reminder</h1>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>Your subscription to <strong>${subscription.serviceName}</strong> will renew in <strong>${daysUntilRenewal} day${daysUntilRenewal !== 1 ? 's' : ''}</strong>.</p>
            
            <div class="subscription-card">
              <h3>${subscription.serviceName}</h3>
              <div class="detail-row">
                <span>Cost:</span>
                <strong>₹${subscription.cost.toFixed(2)}</strong>
              </div>
              <div class="detail-row">
                <span>Billing Cycle:</span>
                <strong>${subscription.billingCycle}</strong>
              </div>
              <div class="detail-row">
                <span>Next Billing Date:</span>
                <strong>${new Date(subscription.nextBillingDate).toLocaleDateString()}</strong>
              </div>
              <div class="detail-row">
                <span>Category:</span>
                <strong>${subscription.category}</strong>
              </div>
            </div>
            
            <p>Make sure you have sufficient funds in your account for the automatic renewal.</p>
            
            <p>Best regards,<br>Expense Manager Team</p>
          </div>
          <div class="footer">
            <p>This is an automated reminder from your Expense Manager.</p>
          </div>
        </div>
      </body>
      </html>
    `;

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject,
            html,
        });

        console.log(`✅ Subscription reminder email sent to ${user.email}`);
    } catch (error) {
        console.error('Error sending subscription reminder email:', error);
    }
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
    try {
        const transporter = createTransporter();

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .features { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .feature { margin: 10px 0; padding-left: 25px; position: relative; }
          .feature:before { content: "✓"; position: absolute; left: 0; color: #10b981; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Expense Manager! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>Thank you for signing up! We're excited to help you take control of your finances.</p>
            
            <div class="features">
              <h3>What you can do:</h3>
              <div class="feature">Track your daily expenses with detailed categorization</div>
              <div class="feature">Manage all your subscriptions in one place</div>
              <div class="feature">Set monthly budgets and receive smart alerts</div>
              <div class="feature">Visualize your spending with beautiful charts</div>
              <div class="feature">Export your data to CSV for analysis</div>
              <div class="feature">Get timely reminders for subscription renewals</div>
            </div>
            
            <p>Start by adding your first expense or subscription to see the magic happen!</p>
            
            <p>Best regards,<br>Expense Manager Team</p>
          </div>
          <div class="footer">
            <p>Need help? Contact us anytime!</p>
          </div>
        </div>
      </body>
      </html>
    `;

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: 'Welcome to Expense Manager! 🎉',
            html,
        });

        console.log(`✅ Welcome email sent to ${user.email}`);
    } catch (error) {
        console.error('Error sending welcome email:', error);
    }
};

module.exports = {
    sendBudgetAlert,
    sendSubscriptionReminder,
    sendWelcomeEmail,
};
