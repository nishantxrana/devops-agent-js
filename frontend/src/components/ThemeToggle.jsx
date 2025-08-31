import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme, setLightTheme, setDarkTheme, setSystemTheme, isDark } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);

  const themeOptions = [
    { key: 'light', label: 'Light', icon: Sun },
    { key: 'dark', label: 'Dark', icon: Moon },
    { key: 'system', label: 'System', icon: Monitor }
  ];

  const handleThemeSelect = (themeKey) => {
    switch (themeKey) {
      case 'light':
        setLightTheme();
        break;
      case 'dark':
        setDarkTheme();
        break;
      case 'system':
        setSystemTheme();
        break;
    }
    setIsOpen(false);
  };

  const currentThemeOption = themeOptions.find(option => option.key === theme) || themeOptions[0];
  const CurrentIcon = currentThemeOption.icon;

  return (
    <div className={`relative ${className}`}>
      {/* Simple toggle button */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-700"
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        <div className="relative w-5 h-5">
          <Sun className={`absolute inset-0 transition-all duration-300 ${
            isDark ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'
          }`} />
          <Moon className={`absolute inset-0 transition-all duration-300 ${
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
          }`} />
        </div>
      </button>

      {/* Advanced dropdown (optional, can be used later) */}
      {false && (
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <CurrentIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{currentThemeOption.label}</span>
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              {themeOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.key}
                    onClick={() => handleThemeSelect(option.key)}
                    className={`w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      theme === option.key 
                        ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;