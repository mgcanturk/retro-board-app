import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 dark:bg-gray-900 text-white py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <p className="text-sm text-gray-300 dark:text-gray-400">
              © {currentYear} Retro Board. Tüm hakları saklıdır.
            </p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-sm text-gray-300 dark:text-gray-400">
              Geliştirici: 
              <a 
                href="https://github.com/mgcanturk" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 ml-1 transition-colors duration-200"
              >
                mgcanturk
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 