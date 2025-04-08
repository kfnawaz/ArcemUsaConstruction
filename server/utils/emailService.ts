import nodemailer from "nodemailer";
import {
  Message,
  QuoteRequest,
  Subcontractor,
  Testimonial,
  Vendor,
} from "@shared/schema";

// Email configuration
let transporter: nodemailer.Transporter;

// Admin email address(es) where notifications should be sent
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@arcemusa.com";

// Sender email address
const SENDER_EMAIL = process.env.SENDER_EMAIL || "notifications@arcemusa.com";

/**
 * Initialize email transporter
 * This should be called when the application starts
 */
export async function initializeEmailService() {
  // Check if we're in a development environment - use ethereal for testing
  if (process.env.NODE_ENV !== "production") {
    // Create a test account on ethereal.email
    const testAccount = await nodemailer.createTestAccount();

    // Create a transporter using the test account
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log("Email service initialized in development mode");
    console.log(`Test email account: ${testAccount.user}`);
    console.log(`Test email password: ${testAccount.pass}`);
    console.log("View test emails at: https://ethereal.email");
  } else {
    // For production, use actual SMTP settings
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    console.log("Email service initialized in production mode");
  }

  // Verify connection configuration
  try {
    await transporter.verify();
    console.log("Email service ready to send messages");
    return true;
  } catch (error) {
    console.error("Error setting up email service:", error);
    return false;
  }
}

/**
 * Send an email
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string,
): Promise<boolean> {
  if (!transporter) {
    console.error("Email service not initialized");
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"ARCEMUSA Construction" <${SENDER_EMAIL}>`,
      to,
      subject,
      text: text || "",
      html,
    });

    console.log(`Email sent: ${info.messageId}`);

    // If using ethereal, log the URL where the email can be viewed
    if (process.env.NODE_ENV !== "production") {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

/**
 * Email Templates
 */

// Template for admin notification when a new message is received
export function createNewMessageNotificationEmail(message: Message): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2a5885;">New Message Received</h2>
      <p>A new message has been submitted through the website contact form.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px;">
        <p><strong>From:</strong> ${message.name}</p>
        <p><strong>Email:</strong> ${message.email}</p>
        <p><strong>Phone:</strong> ${message.phone || "Not provided"}</p>
        <p><strong>Service:</strong> ${message.service || "General Inquiry"}</p>
        <p><strong>Date:</strong> ${new Date(message.createdAt || new Date()).toLocaleString()}</p>
        <p><strong>Message:</strong></p>
        <div style="background-color: white; padding: 10px; border-radius: 5px;">
          ${message.message}
        </div>
      </div>
      
      <div style="margin-top: 20px;">
        <p>Please log in to the admin dashboard to respond to this message.</p>
        <a href="${process.env.WEBSITE_URL || "https://arcemusa.com"}/admin" 
           style="background-color: #2a5885; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Go to Admin Dashboard
        </a>
      </div>
      
      <div style="margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
        <p>This is an automated notification from your website. Please do not reply to this email.</p>
      </div>
    </div>
  `;
}

// Template for confirmation sent to the person who submitted a message
export function createMessageConfirmationEmail(message: Message): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2a5885;">Thank You for Contacting Us</h2>
      <p>Dear ${message.name},</p>
      <p>We have received your message and will get back to you as soon as possible.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Your message details:</strong></p>
        <p><strong>Service:</strong> ${message.service || "General Inquiry"}</p>
        <p><strong>Sent on:</strong> ${new Date(message.createdAt || new Date()).toLocaleString()}</p>
        <p><strong>Your message:</strong></p>
        <div style="background-color: white; padding: 10px; border-radius: 5px;">
          ${message.message}
        </div>
      </div>
      
      <p>If you have any additional questions or information to provide, please don't hesitate to contact us again.</p>
      
      <div style="margin-top: 20px;">
        <p>Best regards,</p>
        <p>The ARCEMUSA Construction Team</p>
        <p><a href="${process.env.WEBSITE_URL || "https://arcemusa.com"}" style="color: #2a5885;">arcemusa.com</a></p>
      </div>
      
      <div style="margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
        <p>This is an automated confirmation. Please do not reply to this email.</p>
      </div>
    </div>
  `;
}

// Template for admin notification when a new quote request is received
export function createQuoteRequestNotificationEmail(
  quoteRequest: QuoteRequest,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2a5885;">New Quote Request Received</h2>
      <p>A new quote request has been submitted through the website.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px;">
        <p><strong>From:</strong> ${quoteRequest.name}</p>
        <p><strong>Email:</strong> ${quoteRequest.email}</p>
        <p><strong>Phone:</strong> ${quoteRequest.phone || "Not provided"}</p>
        <p><strong>Project Type:</strong> ${quoteRequest.projectType || "Not specified"}</p>
        <p><strong>Budget:</strong> ${quoteRequest.budget || "Not specified"}</p>
        <p><strong>Timeline:</strong> ${quoteRequest.timeframe || "Not specified"}</p>
        <p><strong>Date:</strong> ${new Date(quoteRequest.createdAt || new Date()).toLocaleString()}</p>
        <p><strong>Project Details:</strong></p>
        <div style="background-color: white; padding: 10px; border-radius: 5px;">
          ${quoteRequest.description}
        </div>
      </div>
      
      <div style="margin-top: 20px;">
        <p>Please log in to the admin dashboard to review this quote request.</p>
        <a href="${process.env.WEBSITE_URL || "https://arcemusa.com"}/admin" 
           style="background-color: #2a5885; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Go to Admin Dashboard
        </a>
      </div>
      
      <div style="margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
        <p>This is an automated notification from your website. Please do not reply to this email.</p>
      </div>
    </div>
  `;
}

// Template for confirmation sent to the person who submitted a quote request
export function createQuoteRequestConfirmationEmail(
  quoteRequest: QuoteRequest,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2a5885;">Quote Request Received</h2>
      <p>Dear ${quoteRequest.name},</p>
      <p>Thank you for submitting a quote request for your construction project. We have received your information and will review it promptly.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Your request details:</strong></p>
        <p><strong>Name:</strong> ${quoteRequest.name}</p>
        <p><strong>Email:</strong> ${quoteRequest.email}</p>
        <p><strong>Phone:</strong> ${quoteRequest.phone || "Not provided"}</p>
        <p><strong>Company:</strong> ${quoteRequest.company || "Not provided"}</p>
        <p><strong>Project Type:</strong> ${quoteRequest.projectType || "Not specified"}</p>
        <p><strong>Project Size:</strong> ${quoteRequest.projectSize || "Not specified"}</p>
        <p><strong>Budget:</strong> ${quoteRequest.budget || "Not specified"}</p>
        <p><strong>Timeline:</strong> ${quoteRequest.timeframe || "Not specified"}</p>
        <p><strong>Submitted on:</strong> ${new Date(quoteRequest.createdAt || new Date()).toLocaleString()}</p>
        <p><strong>Reference ID:</strong> ${quoteRequest.id}</p>
        ${quoteRequest.attachments ? `<p><strong>Attachments:</strong> ${quoteRequest.attachments}</p>` : ""}
        <p><strong>Project Details:</strong></p>
        <div style="background-color: white; padding: 10px; border-radius: 5px;">
          ${quoteRequest.description}
        </div>
      </div>
      
      <p>Our team will contact you at ${quoteRequest.email} or ${quoteRequest.phone || "your provided email"} within 2 business days to discuss your project requirements in more detail.</p>
      
      <div style="margin-top: 20px;">
        <p>We look forward to the possibility of working on your project.</p>
        <p>Best regards,</p>
        <p>The ARCEMUSA Construction Team</p>
        <p><a href="${process.env.WEBSITE_URL || "https://arcemusa.com"}" style="color: #2a5885;">arcemusa.com</a></p>
      </div>
      
      <div style="margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
        <p>This is an automated confirmation. Please do not reply to this email.</p>
      </div>
    </div>
  `;
}

// Template for admin notification when a new testimonial is submitted
export function createTestimonialNotificationEmail(
  testimonial: Testimonial,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2a5885;">New Testimonial Submitted</h2>
      <p>A new testimonial has been submitted through the website and is awaiting approval.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px;">
        <p><strong>From:</strong> ${testimonial.name}</p>
        <p><strong>Position:</strong> ${testimonial.position || "Not provided"}</p>
        <p><strong>Company:</strong> ${testimonial.company || "Not provided"}</p>
        <p><strong>Email:</strong> ${testimonial.email || "Not provided"}</p>
        <p><strong>Rating:</strong> ${testimonial.rating || "Not provided"} / 5</p>
        <p><strong>Date:</strong> ${new Date(testimonial.createdAt || new Date()).toLocaleString()}</p>
        <p><strong>Testimonial:</strong></p>
        <div style="background-color: white; padding: 10px; border-radius: 5px;">
          ${testimonial.content}
        </div>
      </div>
      
      <div style="margin-top: 20px;">
        <p>Please log in to the admin dashboard to review and approve this testimonial.</p>
        <a href="${process.env.WEBSITE_URL || "https://arcemusa.com"}/admin/testimonials" 
           style="background-color: #2a5885; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Review Testimonial
        </a>
      </div>
      
      <div style="margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
        <p>This is an automated notification from your website. Please do not reply to this email.</p>
      </div>
    </div>
  `;
}

// Template for confirmation sent to the person who submitted a testimonial
export function createTestimonialConfirmationEmail(
  testimonial: Testimonial,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2a5885;">Thank You for Your Testimonial</h2>
      <p>Dear ${testimonial.name},</p>
      <p>Thank you for taking the time to share your experience with ARCEMUSA Construction. We greatly appreciate your feedback!</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Your testimonial details:</strong></p>
        <p><strong>Name:</strong> ${testimonial.name}</p>
        <p><strong>Position:</strong> ${testimonial.position || "Not provided"}</p>
        <p><strong>Company:</strong> ${testimonial.company || "Not provided"}</p>
        <p><strong>Email:</strong> ${testimonial.email || "Not provided"}</p>
        <p><strong>Rating:</strong> ${testimonial.rating || "Not provided"} / 5</p>
        <p><strong>Submitted on:</strong> ${new Date(testimonial.createdAt || new Date()).toLocaleString()}</p>
        <p><strong>Reference ID:</strong> ${testimonial.id}</p>
        <p><strong>Your testimonial:</strong></p>
        <div style="background-color: white; padding: 10px; border-radius: 5px; font-style: italic;">
          "${testimonial.content}"
        </div>
      </div>
      
      <p>Your testimonial will be reviewed by our team and, once approved, will be displayed on our website.</p>
      
      <p>We value your business and look forward to serving you again in the future.</p>
      
      <div style="margin-top: 20px;">
        <p>Best regards,</p>
        <p>The ARCEMUSA Construction Team</p>
        <p><a href="${process.env.WEBSITE_URL || "https://arcemusa.com"}" style="color: #2a5885;">arcemusa.com</a></p>
      </div>
      
      <div style="margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
        <p>This is an automated confirmation. Please do not reply to this email.</p>
      </div>
    </div>
  `;
}

// Template for admin notification when a new subcontractor application is submitted
export function createSubcontractorApplicationNotificationEmail(
  subcontractor: Subcontractor,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2a5885;">New Subcontractor Application</h2>
      <p>A new subcontractor has applied to work with ARCEMUSA Construction.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px;">
        <p><strong>Company Name:</strong> ${subcontractor.companyName}</p>
        <p><strong>Contact Person:</strong> ${subcontractor.contactName}</p>
        <p><strong>Email:</strong> ${subcontractor.email}</p>
        <p><strong>Phone:</strong> ${subcontractor.phone || "Not provided"}</p>
        <p><strong>Services:</strong> ${Array.isArray(subcontractor.serviceTypes) ? subcontractor.serviceTypes.join(", ") : "Not provided"}</p>
        <p><strong>Years in Business:</strong> ${subcontractor.yearsInBusiness || "Not provided"}</p>
        <p><strong>Licenses:</strong> ${subcontractor.licenses || "Not provided"}</p>
        <p><strong>Insurance:</strong> ${subcontractor.insurance ? "Yes" : "No"}</p>
        <p><strong>Date:</strong> ${new Date(subcontractor.createdAt || new Date()).toLocaleString()}</p>
        
        <p><strong>Additional Information:</strong></p>
        <div style="background-color: white; padding: 10px; border-radius: 5px;">
          ${subcontractor.notes || "None provided"}
        </div>
      </div>
      
      <div style="margin-top: 20px;">
        <p>Please log in to the admin dashboard to review this subcontractor application.</p>
        <a href="${process.env.WEBSITE_URL || "https://arcemusa.com"}/admin/subcontractors" 
           style="background-color: #2a5885; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Review Application
        </a>
      </div>
      
      <div style="margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
        <p>This is an automated notification from your website. Please do not reply to this email.</p>
      </div>
    </div>
  `;
}

// Template for confirmation sent to the subcontractor who applied
export function createSubcontractorApplicationConfirmationEmail(
  subcontractor: Subcontractor,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2a5885;">Subcontractor Application Received</h2>
      <p>Dear ${subcontractor.contactName},</p>
      <p>Thank you for your interest in working with ARCEMUSA Construction as a subcontractor. We have received your application and will review it shortly.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Application details:</strong></p>
        <p><strong>Contact Name:</strong> ${subcontractor.contactName}</p>
        <p><strong>Company Name:</strong> ${subcontractor.companyName}</p>
        <p><strong>Email:</strong> ${subcontractor.email}</p>
        <p><strong>Phone:</strong> ${subcontractor.phone || "Not provided"}</p>
        <p><strong>Services:</strong> ${Array.isArray(subcontractor.serviceTypes) ? subcontractor.serviceTypes.join(", ") : "Not provided"}</p>
        <p><strong>Years in Business:</strong> ${subcontractor.yearsInBusiness || "Not provided"}</p>
        <p><strong>Licenses:</strong> ${subcontractor.licenses || "Not provided"}</p>
        <p><strong>Insurance:</strong> ${subcontractor.insurance ? "Yes" : "No"}</p>
        <p><strong>Submitted on:</strong> ${new Date(subcontractor.createdAt || new Date()).toLocaleString()}</p>
        <p><strong>Reference ID:</strong> ${subcontractor.id}</p>
        <p><strong>Additional Information:</strong></p>
        <div style="background-color: white; padding: 10px; border-radius: 5px;">
          ${subcontractor.notes || "None provided"}
        </div>
      </div>
      
      <p>Our team will review your qualifications and contact you within 5-7 business days regarding the next steps. We prioritize subcontractors who demonstrate quality workmanship, reliability, and proper licensing and insurance.</p>
      
      <p>If you have any questions or need to provide additional information, please contact our subcontractor relations team at <a href="mailto:subcontractors@arcemusa.com" style="color: #2a5885;">subcontractors@arcemusa.com</a>.</p>
      
      <div style="margin-top: 20px;">
        <p>We appreciate your interest in partnering with us.</p>
        <p>Best regards,</p>
        <p>The ARCEMUSA Construction Team</p>
        <p><a href="${process.env.WEBSITE_URL || "https://arcemusa.com"}" style="color: #2a5885;">arcemusa.com</a></p>
      </div>
      
      <div style="margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
        <p>This is an automated confirmation. Please do not reply to this email.</p>
      </div>
    </div>
  `;
}

// Template for admin notification when a new vendor application is submitted
export function createVendorApplicationNotificationEmail(
  vendor: Vendor,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2a5885;">New Vendor Application</h2>
      <p>A new vendor has applied to work with ARCEMUSA Construction.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px;">
        <p><strong>Company Name:</strong> ${vendor.companyName}</p>
        <p><strong>Contact Person:</strong> ${vendor.contactName}</p>
        <p><strong>Email:</strong> ${vendor.email}</p>
        <p><strong>Phone:</strong> ${vendor.phone || "Not provided"}</p>
        <p><strong>Products/Services:</strong> ${Array.isArray(vendor.supplyTypes) ? vendor.supplyTypes.join(", ") : "Not provided"}</p>
        <p><strong>Website:</strong> ${vendor.website || "Not provided"}</p>
        <p><strong>Date:</strong> ${new Date(vendor.createdAt || new Date()).toLocaleString()}</p>
        
        <p><strong>Additional Information:</strong></p>
        <div style="background-color: white; padding: 10px; border-radius: 5px;">
          ${vendor.notes || "None provided"}
        </div>
      </div>
      
      <div style="margin-top: 20px;">
        <p>Please log in to the admin dashboard to review this vendor application.</p>
        <a href="${process.env.WEBSITE_URL || "https://arcemusa.com"}/admin/vendors" 
           style="background-color: #2a5885; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Review Application
        </a>
      </div>
      
      <div style="margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
        <p>This is an automated notification from your website. Please do not reply to this email.</p>
      </div>
    </div>
  `;
}

// Template for confirmation sent to the vendor who applied
export function createVendorApplicationConfirmationEmail(
  vendor: Vendor,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2a5885;">Vendor Application Received</h2>
      <p>Dear ${vendor.contactName},</p>
      <p>Thank you for your interest in becoming a vendor for ARCEMUSA Construction. We have received your application and will review it shortly.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Application details:</strong></p>
        <p><strong>Contact Name:</strong> ${vendor.contactName}</p>
        <p><strong>Company Name:</strong> ${vendor.companyName}</p>
        <p><strong>Email:</strong> ${vendor.email}</p>
        <p><strong>Phone:</strong> ${vendor.phone || "Not provided"}</p>
        <p><strong>Products/Services:</strong> ${Array.isArray(vendor.supplyTypes) ? vendor.supplyTypes.join(", ") : "Not provided"}</p>
        <p><strong>Website:</strong> ${vendor.website || "Not provided"}</p>
        <p><strong>Submitted on:</strong> ${new Date(vendor.createdAt || new Date()).toLocaleString()}</p>
        <p><strong>Reference ID:</strong> ${vendor.id}</p>
        <p><strong>Additional Information:</strong></p>
        <div style="background-color: white; padding: 10px; border-radius: 5px;">
          ${vendor.notes || "None provided"}
        </div>
      </div>
      
      <p>Our purchasing team will review your information and contact you within 3-5 business days to discuss potential collaboration opportunities.</p>
      
      <p>If you have any questions or need to provide additional information, please contact our procurement department at <a href="mailto:procurement@arcemusa.com" style="color: #2a5885;">procurement@arcemusa.com</a>.</p>
      
      <div style="margin-top: 20px;">
        <p>Thank you for your interest in working with us.</p>
        <p>Best regards,</p>
        <p>The ARCEMUSA Construction Team</p>
        <p><a href="${process.env.WEBSITE_URL || "https://arcemusa.com"}" style="color: #2a5885;">arcemusa.com</a></p>
      </div>
      
      <div style="margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
        <p>This is an automated confirmation. Please do not reply to this email.</p>
      </div>
    </div>
  `;
}

// Wrapper functions for sending specific types of emails
export async function sendNewMessageNotifications(
  message: Message,
): Promise<{ adminNotified: boolean; senderNotified: boolean }> {
  // Send notification to admin
  const adminEmailContent = createNewMessageNotificationEmail(message);
  const adminNotified = await sendEmail(
    ADMIN_EMAIL,
    `New Message from ${message.name}`,
    adminEmailContent,
  );

  // Send confirmation to sender if they provided an email
  let senderNotified = false;
  if (message.email) {
    const confirmationEmailContent = createMessageConfirmationEmail(message);
    senderNotified = await sendEmail(
      message.email,
      "Thank You for Contacting ARCEMUSA Construction",
      confirmationEmailContent,
    );
  }

  return { adminNotified, senderNotified };
}

export async function sendQuoteRequestNotifications(
  quoteRequest: QuoteRequest,
): Promise<{ adminNotified: boolean; requesterNotified: boolean }> {
  // Send notification to admin
  const adminEmailContent = createQuoteRequestNotificationEmail(quoteRequest);
  const adminNotified = await sendEmail(
    ADMIN_EMAIL,
    "New Quote Request Received",
    adminEmailContent,
  );

  // Send confirmation to requester
  const confirmationEmailContent =
    createQuoteRequestConfirmationEmail(quoteRequest);
  const requesterNotified = await sendEmail(
    quoteRequest.email,
    "Your Quote Request Has Been Received",
    confirmationEmailContent,
  );

  return { adminNotified, requesterNotified };
}

export async function sendTestimonialNotifications(
  testimonial: Testimonial,
): Promise<{ adminNotified: boolean; submitterNotified: boolean }> {
  // Send notification to admin
  const adminEmailContent = createTestimonialNotificationEmail(testimonial);
  const adminNotified = await sendEmail(
    ADMIN_EMAIL,
    "New Testimonial Submitted",
    adminEmailContent,
  );

  // Send confirmation to submitter if they provided an email
  let submitterNotified = false;
  if (testimonial.email) {
    const confirmationEmailContent =
      createTestimonialConfirmationEmail(testimonial);
    submitterNotified = await sendEmail(
      testimonial.email,
      "Thank You for Your Testimonial",
      confirmationEmailContent,
    );
  }

  return { adminNotified, submitterNotified };
}

export async function sendSubcontractorApplicationNotifications(
  subcontractor: Subcontractor,
): Promise<{ adminNotified: boolean; applicantNotified: boolean }> {
  // Send notification to admin
  const adminEmailContent =
    createSubcontractorApplicationNotificationEmail(subcontractor);
  const adminNotified = await sendEmail(
    ADMIN_EMAIL,
    "New Subcontractor Application",
    adminEmailContent,
  );

  // Send confirmation to applicant
  const confirmationEmailContent =
    createSubcontractorApplicationConfirmationEmail(subcontractor);
  const applicantNotified = await sendEmail(
    subcontractor.email,
    "Your Subcontractor Application Has Been Received",
    confirmationEmailContent,
  );

  return { adminNotified, applicantNotified };
}

export async function sendVendorApplicationNotifications(
  vendor: Vendor,
): Promise<{ adminNotified: boolean; applicantNotified: boolean }> {
  // Send notification to admin
  const adminEmailContent = createVendorApplicationNotificationEmail(vendor);
  const adminNotified = await sendEmail(
    ADMIN_EMAIL,
    "New Vendor Application",
    adminEmailContent,
  );

  // Send confirmation to applicant
  const confirmationEmailContent =
    createVendorApplicationConfirmationEmail(vendor);
  const applicantNotified = await sendEmail(
    vendor.email,
    "Your Vendor Application Has Been Received",
    confirmationEmailContent,
  );

  return { adminNotified, applicantNotified };
}
