import React from "react";
import Button from "react-bootstrap/Button";

interface DarkModeToggleProps {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ darkMode, setDarkMode }) => {
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
