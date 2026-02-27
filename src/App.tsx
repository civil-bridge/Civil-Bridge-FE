import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import RoomPage from './pages/RoomPage';
import MyRoomPage from './pages/MyRoomPage';
import { useAuthStore } from './store/authStore';

const App = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <Routes>
        <Route path="/" element={isAuthenticated ? <MainPage /> : <Navigate to="/login" replace />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="/myroom" element={<MyRoomPage />} />
      </Routes>
    </Router>
  );
};

export default App;
