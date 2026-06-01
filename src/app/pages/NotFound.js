import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-2 text-lg text-gray-600">Page not found</p>
        <Link
          to="/dashboard"
          className="mt-4 inline-block text-indigo-600 hover:text-indigo-500"
        >
          Go back to dashboard
        </Link>
      </div>
    </div>
  );
}

export default NotFound;


