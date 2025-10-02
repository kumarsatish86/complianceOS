# complianceOS - Compliance Management Platform

A comprehensive SaaS platform for organizations to manage compliance across their organization, products, and infrastructure security from a single dashboard.

## Features

### 🔐 Authentication & Authorization
- **Multi-level Role Management**: Platform-level and organization-level roles
- **Dynamic Role Configuration**: Organizations can create custom departments and roles
- **Secure Authentication**: NextAuth.js with JWT tokens
- **Password Security**: Bcrypt hashing for password protection

### 🏢 Organization Management
- **Multi-tenant Architecture**: Complete data isolation between organizations
- **Custom Department Structure**: Organizations can create their own departments
- **Flexible Role System**: Configurable roles with custom permissions
- **User Management**: Assign users to departments and roles

### 🛡️ Compliance Management
- **Compliance Tracking**: Monitor compliance across different frameworks
- **Audit Trails**: Complete audit logging for compliance requirements
- **Document Management**: Store and manage compliance documents
- **Reporting**: Generate compliance reports and analytics

### 🔧 Infrastructure Security
- **Security Monitoring**: Track infrastructure security compliance
- **Vulnerability Management**: Manage security vulnerabilities
- **Security Reporting**: Generate security compliance reports

### 💰 Financial Management
- **Budget Management**: Track compliance-related budgets
- **Financial Reporting**: Generate financial compliance reports
- **Cost Analysis**: Analyze compliance costs

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **UI Components**: Radix UI, Lucide React
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd complianceos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update the `.env.local` file with your database credentials:
   ```env
   DATABASE_URL="postgresql://postgres:Admin1234@localhost:5432/cos?schema=public"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"
   ```

4. **Set up the database**
   ```bash
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

### Core Tables
- `users` - User accounts across all levels
- `organizations` - Client organizations
- `platform_roles` - Fixed platform-level roles
- `organization_users` - User-organization relationships
- `departments` - Custom departments per organization
- `organization_roles` - Custom roles per organization
- `organization_permissions` - Custom permissions per organization

### Role Hierarchy

#### Platform Level (Fixed)
- **Super Admin**: Full platform access
- **Platform Admin**: Platform operations
- **Platform Developer**: Development access
- **Platform Support**: Customer support

#### Organization Level (Configurable)
- **Org Admin**: Full organization control
- **Custom Roles**: Organizations can create their own roles
- **Custom Departments**: Organizations can create their own departments
- **Custom Permissions**: Granular permission control

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signout` - User sign out

### Organizations
- `GET /api/organizations` - List user's organizations
- `POST /api/organizations` - Create new organization
- `PUT /api/organizations/[id]` - Update organization
- `DELETE /api/organizations/[id]` - Delete organization

## Development

### Project Structure
```
src/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Platform dashboard
│   ├── organizations/     # Organization management
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── providers/        # Context providers
├── lib/                  # Utility functions
│   ├── auth.ts          # NextAuth configuration
│   ├── prisma.ts        # Prisma client
│   └── utils.ts         # Utility functions
└── types/               # TypeScript type definitions
```

### Database Commands
```bash
# Generate Prisma client
npx prisma generate

# Push schema changes to database
npx prisma db push

# Open Prisma Studio
npx prisma studio

# Reset database
npx prisma db push --force-reset
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.