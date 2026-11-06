import React from "react";
import ItineraryAddDialog from "./ItineraryAddDialog.jsx";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import FloatingActions from "./FloatingActions.jsx";
import { useApp } from "../state/AppContext.jsx";
export default function AppLayout({ children }) {
  const { lang, theme, path, navigate, changeTheme, changeLanguage } = useApp();
  return (
    <div className="saera">
      <Header
        lang={lang}
        theme={theme}
        path={path}
        onNavigate={navigate}
        onTheme={changeTheme}
        onLanguage={changeLanguage}
      />
      <main className="page-shell">{children}</main>
      <Footer />
      <FloatingActions />
      <ItineraryAddDialog />
    </div>
  );
}
