-- Create email_templates table for dynamic email template management
CREATE TABLE IF NOT EXISTS email_templates (
    id BIGSERIAL PRIMARY KEY,
    template_key VARCHAR(50) NOT NULL UNIQUE,
    template_name VARCHAR(100) NOT NULL,
    subject TEXT NOT NULL,
    body_html LONGTEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on template_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_templates_template_key ON email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON email_templates(is_active);

-- Insert default email templates
INSERT INTO email_templates (template_key, template_name, subject, body_html, is_active, created_at, updated_at) VALUES
(
    'ORDER_CONFIRMED',
    'Order Confirmation',
    'Order Confirmed – {{orderId}}',
    '<html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; border: 1px solid #ddd; }
            .footer { font-size: 12px; color: #666; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Order Confirmed!</h1>
            </div>
            <div class="content">
                <p>Dear {{customerName}},</p>
                <p>Thank you for shopping with {{companyName}}! Your order has been confirmed.</p>
                <p><strong>Order Details:</strong></p>
                <ul>
                    <li>Order ID: {{orderId}}</li>
                    <li>Order Date: {{orderDate}}</li>
                    <li>Status: {{orderStatus}}</li>
                    <li>Total Amount: {{totalAmount}}</li>
                </ul>
                <p>We will process your order and send you a tracking update soon.</p>
                <p>If you have any questions, please contact us at {{supportEmail}}</p>
                <p>Best regards,<br>{{companyName}} Team</p>
            </div>
            <div class="footer">
                <p>This is an automated email. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'ORDER_PROCESSING',
    'Order Processing',
    'Your Order is Being Processed – {{orderId}}',
    '<html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #17a2b8; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; border: 1px solid #ddd; }
            .footer { font-size: 12px; color: #666; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Order is Processing</h1>
            </div>
            <div class="content">
                <p>Dear {{customerName}},</p>
                <p>Your order {{orderId}} is now being processed and will be shipped soon.</p>
                <p><strong>Order Summary:</strong></p>
                <ul>
                    <li>Order ID: {{orderId}}</li>
                    <li>Order Date: {{orderDate}}</li>
                    <li>Total Amount: {{totalAmount}}</li>
                </ul>
                <p>You will receive a shipping notification as soon as your order is dispatched.</p>
                <p>Thank you for your patience!</p>
                <p>Best regards,<br>{{companyName}} Team</p>
            </div>
            <div class="footer">
                <p>This is an automated email. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'ORDER_SHIPPED',
    'Order Shipped',
    'Your Order is On The Way – {{orderId}}',
    '<html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; border: 1px solid #ddd; }
            .footer { font-size: 12px; color: #666; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Order Shipped!</h1>
            </div>
            <div class="content">
                <p>Dear {{customerName}},</p>
                <p>Great news! Your order {{orderId}} has been shipped and is on its way to you.</p>
                <p><strong>Shipping Information:</strong></p>
                <ul>
                    <li>Order ID: {{orderId}}</li>
                    <li>Tracking ID: {{trackingId}}</li>
                    <li>Shipping To: {{shippingAddress}}</li>
                </ul>
                <p>You can track your package using the tracking ID above.</p>
                <p>Expected delivery is within 5-7 business days.</p>
                <p>Best regards,<br>{{companyName}} Team</p>
            </div>
            <div class="footer">
                <p>This is an automated email. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'ORDER_DELIVERED',
    'Order Delivered',
    'Your Order Has Been Delivered – {{orderId}}',
    '<html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #20c997; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; border: 1px solid #ddd; }
            .footer { font-size: 12px; color: #666; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Order Delivered!</h1>
            </div>
            <div class="content">
                <p>Dear {{customerName}},</p>
                <p>Excellent! Your order {{orderId}} has been successfully delivered.</p>
                <p><strong>Order Details:</strong></p>
                <ul>
                    <li>Order ID: {{orderId}}</li>
                    <li>Delivered To: {{shippingAddress}}</li>
                    <li>Order Date: {{orderDate}}</li>
                </ul>
                <p>Thank you for shopping with {{companyName}}! We hope you enjoy your purchase.</p>
                <p>If you have any issues with your order, please contact us at {{supportEmail}}</p>
                <p>Best regards,<br>{{companyName}} Team</p>
            </div>
            <div class="footer">
                <p>This is an automated email. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'ORDER_CANCELLED',
    'Order Cancelled',
    'Your Order Has Been Cancelled – {{orderId}}',
    '<html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; border: 1px solid #ddd; }
            .footer { font-size: 12px; color: #666; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Order Cancelled</h1>
            </div>
            <div class="content">
                <p>Dear {{customerName}},</p>
                <p>Your order {{orderId}} has been cancelled.</p>
                <p><strong>Order Details:</strong></p>
                <ul>
                    <li>Order ID: {{orderId}}</li>
                    <li>Order Date: {{orderDate}}</li>
                    <li>Cancelled Amount: {{totalAmount}}</li>
                </ul>
                <p>If you have any questions about this cancellation, please contact us at {{supportEmail}}</p>
                <p>We appreciate your business and hope to serve you again soon!</p>
                <p>Best regards,<br>{{companyName}} Team</p>
            </div>
            <div class="footer">
                <p>This is an automated email. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'RETURN_REQUESTED',
    'Return Requested',
    'Return Request Received – {{orderId}}',
    '<html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #ffc107; color: #333; padding: 20px; text-align: center; }
            .content { padding: 20px; border: 1px solid #ddd; }
            .footer { font-size: 12px; color: #666; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Return Request Received</h1>
            </div>
            <div class="content">
                <p>Dear {{customerName}},</p>
                <p>Thank you for initiating a return request for your order {{orderId}}.</p>
                <p><strong>Return Details:</strong></p>
                <ul>
                    <li>Order ID: {{orderId}}</li>
                    <li>Return Amount: {{totalAmount}}</li>
                </ul>
                <p>Our team will review your request and get back to you shortly with further instructions.</p>
                <p>If you have any questions, please contact us at {{supportEmail}}</p>
                <p>Thank you for your patience!</p>
                <p>Best regards,<br>{{companyName}} Team</p>
            </div>
            <div class="footer">
                <p>This is an automated email. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'REFUND_INITIATED',
    'Refund Initiated',
    'Refund Processing Started – {{orderId}}',
    '<html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; border: 1px solid #ddd; }
            .footer { font-size: 12px; color: #666; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Refund Initiated</h1>
            </div>
            <div class="content">
                <p>Dear {{customerName}},</p>
                <p>Your refund for order {{orderId}} has been initiated and is being processed.</p>
                <p><strong>Refund Details:</strong></p>
                <ul>
                    <li>Order ID: {{orderId}}</li>
                    <li>Refund Amount: {{totalAmount}}</li>
                </ul>
                <p>The refund will be credited to your original payment method within 5-7 business days.</p>
                <p>If you have any questions, please contact us at {{supportEmail}}</p>
                <p>Thank you for your understanding!</p>
                <p>Best regards,<br>{{companyName}} Team</p>
            </div>
            <div class="footer">
                <p>This is an automated email. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'REFUND_COMPLETED',
    'Refund Completed',
    'Your Refund Has Been Completed – {{orderId}}',
    '<html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; border: 1px solid #ddd; }
            .footer { font-size: 12px; color: #666; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Refund Completed!</h1>
            </div>
            <div class="content">
                <p>Dear {{customerName}},</p>
                <p>Great news! Your refund for order {{orderId}} has been successfully completed.</p>
                <p><strong>Refund Details:</strong></p>
                <ul>
                    <li>Order ID: {{orderId}}</li>
                    <li>Refund Amount: {{totalAmount}}</li>
                </ul>
                <p>The amount has been credited to your original payment method. Depending on your bank, it may take 1-3 business days to appear in your account.</p>
                <p>We appreciate your business and hope to serve you again soon!</p>
                <p>Best regards,<br>{{companyName}} Team</p>
            </div>
            <div class="footer">
                <p>This is an automated email. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (template_key) DO NOTHING;
