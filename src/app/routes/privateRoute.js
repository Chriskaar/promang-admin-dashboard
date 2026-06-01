import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

function PrivateRoute({ children }) {
  const loading = useSelector((state) => state.session.loading);
  const accessToken = useSelector((state) => state.session.accessToken);
  const currentUser = useSelector((state) => state.session.currentUser);
  const location = useLocation();
  const fromLocation = location.state?.from;
  const previousLocation = fromLocation
    ? fromLocation
    : { pathname: "/login" };

  if (accessToken && currentUser) {
    return children;
  } else if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  } else if (!accessToken && !loading) {
    return (
      <Navigate to={previousLocation} state={{ from: location }} replace />
    );
  } else {
    return <p>Something went wrong</p>;
  }
}

export default PrivateRoute;


