import React from "react";
import { AppProvider, useApp } from "./state/AppContext.jsx";
import AppLayout from "./components/AppLayout.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import ThemePage from "./pages/ThemePage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import SavedPage from "./pages/SavedPage.jsx";
import PlaceDetailPage from "./pages/PlaceDetailPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import { supportsRoute } from "./routing/routes.js";
function AppRoutes() {
  const { route, lang } = useApp();
  const pages = {
    search: SearchPage,
    theme: ThemePage,
    about: AboutPage,
    saved: SavedPage,
    detail: PlaceDetailPage,
    "not-found": NotFoundPage,
  };
  const Page = pages[route.page] || NotFoundPage;
  return (
    <AppLayout>
      {supportsRoute(route, lang) && (
        <Page key={route.page === "saved" ? lang : undefined} />
      )}
    </AppLayout>
  );
}
export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
