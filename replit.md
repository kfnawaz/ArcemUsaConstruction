# ARCEM Construction Platform

## Overview
A sophisticated construction management platform that leverages cutting-edge technologies to streamline project workflows and enhance professional collaboration through advanced content management capabilities. The platform includes comprehensive monitoring and analytics through secure API endpoints.

## Recent Changes
- **July 4, 2025**: Added comprehensive system metrics API endpoint with real-time monitoring data
- **July 4, 2025**: Implemented API key authentication and rate limiting for external monitoring applications
- **July 4, 2025**: Fixed deprecated Lucide React icon imports in Footer and SocialMediaSettings components

## Project Architecture

### Stack
- **Frontend**: React with TypeScript, Tailwind CSS, Wouter for routing
- **Backend**: Express.js with PostgreSQL database, Drizzle ORM
- **Authentication**: Passport.js with local strategy
- **File Management**: UploadThing integration for advanced file uploads
- **Email**: Nodemailer with SMTP configuration
- **Rate Limiting**: Express rate limiting for API protection

### Key Features
- Dynamic file categorization and intelligent content organization
- Blog management with rich text editing and image uploads
- Project portfolio with gallery management
- Quote request system with file attachments
- Team member management
- Social media settings management
- Comprehensive system monitoring API

## System Metrics API

### Endpoint
`GET /api/system/metrics`

### Authentication
- **API Key**: Include in header as `X-API-Key: <your-api-key>`
- **Bearer Token**: Include in header as `Authorization: Bearer <your-api-key>`
- **Default API Key**: `sk-arcem-metrics-2025-secure-key-9f8e7d6c5b4a3210`

### Rate Limiting
- **Limit**: 20 requests per 15 minutes per IP address
- **Response Headers**: Include rate limit information

### Response Structure
The API returns comprehensive monitoring data across 11 categories:

1. **Application Metadata**
   - Product name, version, license type
   - Customer ID, instance ID, timezone, region

2. **System Health**
   - Status (healthy/degraded/down)
   - Uptime in seconds
   - CPU, memory, disk usage percentages

3. **User Analytics**
   - Total users, active users (7/30 days)
   - New users in last 30 days
   - User login summary with activity data

4. **Feature Usage Tracking**
   - Usage counts for key features
   - Integration status

5. **Entity Statistics**
   - Database entity counts (projects, testimonials, services, etc.)
   - Custom entity counts

6. **Storage Metrics**
   - Total allocated, used, and free storage (MB)
   - Monthly data ingested/egressed

7. **Performance Metrics**
   - Average response time, error rates
   - 4xx/5xx error counts, peak RPS

8. **Security & Audit Events**
   - Failed login attempts, password resets
   - Account lockouts, last admin action

9. **License & Billing**
   - License expiry, usage tier
   - Overage flags, SLA uptime

10. **Alerts & Issues**
    - Open issues count, critical alerts
    - Last incident timestamp

11. **Custom Metadata**
    - Tenant type, tags, admin notes

### Example Usage

```bash
# Using X-API-Key header
curl -H "X-API-Key: sk-arcem-metrics-2025-secure-key-9f8e7d6c5b4a3210" \
     https://your-domain.com/api/system/metrics

# Using Bearer token
curl -H "Authorization: Bearer sk-arcem-metrics-2025-secure-key-9f8e7d6c5b4a3210" \
     https://your-domain.com/api/system/metrics
```

### Error Responses

**401 Unauthorized**
```json
{
  "error": "Unauthorized",
  "message": "Valid API key required"
}
```

**429 Too Many Requests**
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Maximum 20 requests per 15 minutes."
}
```

## User Preferences
- Maintain consistent UI patterns across admin and public sections
- Use UploadThing for all file upload operations
- Implement proper type safety throughout the application
- Follow React hooks order consistency to prevent runtime errors
- Use current Lucide React icon naming with "Icon" suffix

## Database Guidelines
- Use Drizzle ORM for all database operations
- Run `npm run db:push` for schema changes
- Never use destructive SQL statements without explicit user request
- Use proper foreign key relationships and cascade deletes where appropriate

## Email System
- Uses Ethereal Email for development testing
- Production ready with SMTP configuration
- Comprehensive notification system for form submissions
- Admin notifications and user confirmations

## Development Notes
- Icons should use current Lucide React naming (e.g., FacebookIcon, not Facebook)
- Social media settings managed through site_settings table
- All file uploads should use UploadThing infrastructure
- System metrics provide real database counts and simulated performance data