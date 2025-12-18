import "./App.css";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import ErrorPage from "./pages/ErrorPage";
import DashboardPage from "./pages/DashboardPage";
import DownloadPage from "./pages/DownloadPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />}></Route>
          <Route path="/login" element={<LoginPage />}></Route>
          <Route path="/register" element={<RegisterPage />}></Route>
          <Route path="/dashboard" element={<DashboardPage />}></Route>
          <Route path="/download/:token" element={<DownloadPage />}></Route>
          <Route path="*" element={<ErrorPage />}></Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;

