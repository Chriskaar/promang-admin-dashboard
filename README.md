# Promang Admin Dashboard

Admin dashboard for managing Promang customer companies and users.

## Features

- Authentication system similar to Promang Frontend
- Companies management (list all Promang customers)
- User management (view and add users to companies)
- Modern UI with Tailwind CSS
- Responsive design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory (same OAuth client as promang-frontend):
```
REACT_APP_BACKEND_URL=http://localhost:4000/api/v1
REACT_APP_CLIENT_ID=your_client_id
REACT_APP_CLIENT_SECRET=your_client_secret
```

The admin app runs on its own port (CRA default **3000**). The API runs separately — locally that is usually **http://localhost:4000**, with routes under `/api/v1` (e.g. `POST http://localhost:4000/api/v1/oauth/token`).

3. Start the development server:
```bash
npm start
```

## Project Structure

```
src/
├── app/
│   ├── api/              # API calls
│   ├── components/       # Reusable components
│   │   ├── authentication/
│   │   └── dashboard/
│   ├── pages/           # Page components
│   │   ├── authentication/
│   │   └── dashboard/
│   ├── routes/          # Route guards
│   ├── slices/          # Redux slices
│   └── store.js         # Redux store
├── App.js               # Main app component
└── index.js             # Entry point
```

## API Endpoints

The dashboard expects the following API endpoints:

- `POST /oauth/token` - Login
- `POST /oauth/revoke` - Logout
- `GET /users/me` - Get current user
- `GET /admin/companies` - List all companies
- `GET /admin/companies/:id` - Get company details
- `GET /admin/companies/:id/users` - Get company users
- `POST /admin/companies/:id/users` - Add user to company

## Technologies

- React 18
- React Router v6
- Redux Toolkit
- Tailwind CSS
- Formik & Yup (form validation)
- Axios (HTTP client)
- React Hot Toast (notifications)


