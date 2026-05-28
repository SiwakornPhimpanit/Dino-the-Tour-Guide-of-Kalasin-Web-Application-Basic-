import { Route, Routes } from "react-router-dom";
import { AdminLayout } from "./components/AdminLayout";
import { Navbar } from "./components/Navbar";
import { RequireAdmin } from "./components/RequireAdmin";
import { RequireAuth } from "./components/RequireAuth";
import { RequireMember } from "./components/RequireMember";
import { AdminCategoriesPage } from "./pages/AdminCategoriesPage";
import { AdminKnowledgePage } from "./pages/AdminKnowledgePage";
import { AdminPlaceFormPage } from "./pages/AdminPlaceFormPage";
import { AdminPlacesPage } from "./pages/AdminPlacesPage";
import { AssistantChatPage } from "./pages/AssistantChatPage";
import { ContactPage } from "./pages/ContactPage";
import { TravelGuidePage } from "./pages/TravelGuidePage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RegisterPage } from "./pages/RegisterPage";
import { UserLoginPage } from "./pages/UserLoginPage";
import { PlaceDetailPage } from "./pages/PlaceDetailPage";
import { PlacesListPage } from "./pages/PlacesListPage";
import { PlacesMapPage } from "./pages/PlacesMapPage";

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="mainShell">
        <Routes>
          <Route path="/" element={<TravelGuidePage />} />
          <Route path="/places" element={<PlacesListPage />} />
          <Route path="/map" element={<PlacesMapPage />} />
          <Route path="/places/:id" element={<PlaceDetailPage />} />
          <Route
            path="/assistant"
            element={
              <RequireMember>
                <AssistantChatPage />
              </RequireMember>
            }
          />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<UserLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<AdminPlacesPage />} />
            <Route path="new" element={<AdminPlaceFormPage mode="create" />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="knowledge" element={<AdminKnowledgePage />} />
            <Route path="edit/:id" element={<AdminPlaceFormPage mode="edit" />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}
