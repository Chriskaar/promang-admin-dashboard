import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

function PublicOnlyRoute({ children }) {
  const accessToken = useSelector((state) => state.session.accessToken);
  const currentUser = useSelector((state) => state.session.currentUser);

  if (accessToken && currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default PublicOnlyRoute;


