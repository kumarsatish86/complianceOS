@echo off
echo DATABASE_URL=postgresql://postgres:Admin1234@localhost:5432/cos?schema=public > .env.local
echo NEXTAUTH_URL=http://localhost:3000 >> .env.local
echo NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production >> .env.local
echo Environment file created successfully!
type .env.local
