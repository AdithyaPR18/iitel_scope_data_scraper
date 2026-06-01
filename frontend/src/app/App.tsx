import { useState } from 'react';
import { FileText, MessageSquare, Search, Globe, ShieldCheck, LogOut } from 'lucide-react';
import { ArticlesTab } from './components/ArticlesTab';
import { ChatbotTab } from './components/ChatbotTab';
import { SearchTab } from './components/SearchTab';
import { SourcesTab } from './components/SourcesTab';
import { ManagerTab } from './components/ManagerTab';
import { AuthPage } from './components/AuthPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import logo from '../imports/logo.png';

type TabType = 'articles' | 'chat' | 'search' | 'sources' | 'manager';

function AppContent() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('articles');
  const [articlesVersion, setArticlesVersion] = useState(0);
  const signalArticlesChanged = () => setArticlesVersion((v) => v + 1);

  if (!user) return <AuthPage />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-[#C9A961]/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <img src={logo} alt="iitel solutions" className="w-16 h-16 mix-blend-mode-multiply" style={{ mixBlendMode: 'multiply' }} />
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-gray-900">
                International Institute of Technology Education and Leadership
              </h1>
              <p className="text-sm text-gray-600">
                Global Policy Tracker - Real-time regulatory monitoring
              </p>
            </div>
            {/* User + logout */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 hidden sm:block">{user.email}</span>
              <button
                onClick={logout}
                title="Sign out"
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('articles')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                activeTab === 'articles'
                  ? 'border-[#C9A961] text-[#C9A961]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">Policy Articles</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                activeTab === 'chat'
                  ? 'border-[#C9A961] text-[#C9A961]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium">AI Assistant</span>
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                activeTab === 'search'
                  ? 'border-[#C9A961] text-[#C9A961]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Search className="w-5 h-5" />
              <span className="font-medium">Search</span>
            </button>

            <button
              onClick={() => setActiveTab('sources')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                activeTab === 'sources'
                  ? 'border-[#C9A961] text-[#C9A961]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Globe className="w-5 h-5" />
              <span className="font-medium">Sources</span>
            </button>

            {/* Manager-only tab */}
            {user.is_manager && (
              <button
                onClick={() => setActiveTab('manager')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                  activeTab === 'manager'
                    ? 'border-[#C9A961] text-[#C9A961]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
                <span className="font-medium">Manager</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content — all tabs stay mounted to preserve state across navigation */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className={activeTab !== 'articles' ? 'hidden' : ''}><ArticlesTab refreshKey={articlesVersion} /></div>
        <div className={activeTab !== 'chat' ? 'hidden' : ''}><ChatbotTab /></div>
        <div className={activeTab !== 'search' ? 'hidden' : ''}><SearchTab /></div>
        <div className={activeTab !== 'sources' ? 'hidden' : ''}><SourcesTab onArticlesChanged={signalArticlesChanged} /></div>
        {user.is_manager && (
          <div className={activeTab !== 'manager' ? 'hidden' : ''}><ManagerTab /></div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
