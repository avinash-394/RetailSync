import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Inventory } from './pages/Inventory';
import { Suppliers } from './pages/Suppliers';
import { Purchases } from './pages/Purchases';
import { Sales } from './pages/Sales';
import { Optimization } from './pages/Optimization';
import { Reports } from './pages/Reports';
import { Users } from './pages/Users';

function MainApp() {
  const { isAuthenticated } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard onSelectTab={setCurrentTab} />;
      case 'products':
        return <Products />;
      case 'inventory':
        return <Inventory />;
      case 'suppliers':
        return <Suppliers onSelectTab={setCurrentTab} />;
      case 'purchases':
        return <Purchases />;
      case 'sales':
        return <Sales />;
      case 'optimization':
        return <Optimization onSelectTab={setCurrentTab} />;
      case 'reports':
        return <Reports />;
      case 'users':
        return <Users />;
      default:
        return <Dashboard onSelectTab={setCurrentTab} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />
      <div className="main-layout">
        <Navbar onSelectTab={setCurrentTab} />
        <main className="page-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
