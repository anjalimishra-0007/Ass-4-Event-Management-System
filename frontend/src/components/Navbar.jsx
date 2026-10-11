import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="brand">
          Eventify<span className="dot">.</span>
        </Link>

        <div className="nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            Explore Events
          </NavLink>
          {user && !isAdmin && (
            <NavLink
              to="/my-registrations"
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              My Registrations
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-item admin-badge-link ${isActive ? "active" : ""}`}
            >
              Admin Dashboard
            </NavLink>
          )}
        </div>

        <div className="nav-auth">
          {user ? (
            <div className="user-profile">
              <div className="user-avatar-chip">
                {getInitials(user.name)}
              </div>
              <span className="user-name">
                {user.name}
                <span className={`role-pill ${user.role}`}>
                  {user.role}
                </span>
              </span>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <NavLink
                to="/login"
                className={({ isActive }) => `login-link ${isActive ? "active" : ""}`}
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) => `register-btn ${isActive ? "active" : ""}`}
              >
                Register
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

