import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LessonList from "./components/LessonList";
import LessonViewer from "./components/LessonViewer";
import LessonEditor from "./components/LessonEditor";
import Login from "./components/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root path */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* Member routes */}
        <Route path="/viewer" element={<LessonList />} />
        <Route path="/lesson" element={<LessonViewer />} />

        {/* Admin */}
        <Route path="/admin" element={<LessonEditor />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;