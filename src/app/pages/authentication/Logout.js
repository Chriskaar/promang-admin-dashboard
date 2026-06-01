import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../../slices/session";

function Logout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const accessToken = useSelector((state) => state.session.accessToken);

  useEffect(() => {
    if (accessToken) {
      dispatch(logoutUser(accessToken)).then(() => {
        navigate("/login");
      });
    } else {
      navigate("/login");
    }
  }, [dispatch, navigate, accessToken]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Logging out...</p>
    </div>
  );
}

export default Logout;


