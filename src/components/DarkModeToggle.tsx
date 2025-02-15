import React, { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";

const DarkModeToggle: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  useEffect(() => {
    const darkMode = localStorage.getItem("darkMode") !== "false";
    setDarkMode(darkMode);
    document.documentElement.setAttribute("data-bs-theme", darkMode ? "dark" : "light");
  }, []);

  const toggleMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.setAttribute("data-bs-theme", newMode ? "dark" : "light");
    localStorage.setItem("darkMode", newMode.toString());
  };
  return (
    <Button variant={darkMode ? "light" : "dark"} onClick={toggleMode}>
      {darkMode ? "Light Mode" : "Dark Mode"}
    </Button>
  );
};

export default DarkModeToggle;
