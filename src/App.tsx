import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';

import { Web3Provider } from './contexts/Web3Context';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import MarketplacePage from './pages/MarketplacePage';
import PatentSearchPage from './pages/PatentSearchPage';
import NFTDetailPage from './pages/NFTDetailPage';
import UserProfilePage from './pages/UserProfilePage';
import CreateListingPage from './pages/CreateListingPage';


function App() {
  return (
    <ThemeProvider>
      <Web3Provider>
        <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
              <Header />
              <main className="pt-16">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/marketplace" element={<MarketplacePage />} />
                  <Route path="/search" element={<PatentSearchPage />} />
                  <Route path="/nft/:id" element={<NFTDetailPage />} />
                  <Route path="/profile/:address" element={<UserProfilePage />} />
                  <Route path="/create-listing/:id" element={<CreateListingPage />} />

                </Routes>
              </main>
              <Footer />
              <Toaster 
                position="bottom-right"
                toastOptions={{
                  duration: 4000,
                  className: 'dark:bg-gray-800 dark:text-white',
                }}
              />
            </div>
        </Router>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App;