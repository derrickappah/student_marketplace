# Student Marketplace

A modern web application built with React and Supabase that enables students to buy, sell, and trade items within their university community.

## Features

- User authentication and profiles
- Item listings with images and categories
- Real-time messaging between users
- Search and filter functionality
- Responsive design for all devices

## Tech Stack

- Frontend: React 18+
- Backend: Supabase (PostgreSQL, Auth, Storage, Real-time)
- UI: Material-UI
- Forms: React Hook Form
- Routing: React Router v6

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Git

## Setup Instructions

1. Clone the repository:
```bash
git clone [repository-url]
cd student-marketplace
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your Supabase credentials:
```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Project Structure

The project has been organized into a logical directory structure for better maintainability and navigation. For a complete guide to the project's organization, please see [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md).

Main directories:

```
/
├── src/              # Application source code
│   ├── components/   # Reusable UI components
│   ├── pages/        # Page components
│   ├── hooks/        # Custom React hooks
│   ├── contexts/     # React Context providers
│   ├── services/     # API and Supabase services
│   └── assets/       # Static assets
│
├── db/               # Database-related files
│   ├── migrations/   # Database migrations
│   ├── scripts/      # Database scripts
│   └── sql/          # SQL queries and fixes
│
├── scripts/          # Utility scripts
│   ├── batch/        # Batch scripts for various operations
│   ├── deployment/   # Deployment scripts
│   └── utilities/    # General utility scripts
│
└── docs/             # Documentation
    ├── project/      # Project planning and management
    ├── technical/    # Technical documentation
    └── migration/    # Migration guides
```

For easy navigation of the project structure, open `project-dashboard.html` in your browser.

## Database Schema

The application uses Supabase with the following main tables:
- users
- listings
- categories
- messages
- notifications

For detailed schema information, see the database documentation in the `docs/technical/database` directory.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 