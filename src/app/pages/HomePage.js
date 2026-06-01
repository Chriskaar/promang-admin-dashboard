import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export function HomePage() {
  const navigate = useNavigate();
  const accessToken = useSelector((state) => state.session.accessToken);
  const currentUser = useSelector((state) => state.session.currentUser);

  useEffect(() => {
    if (accessToken && currentUser) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  }, [accessToken, currentUser, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-500">Redirecting...</div>
    </div>
  );
}


