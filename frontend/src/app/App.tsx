import { useState } from 'react';
import { FileText, MessageSquare, Search } from 'lucide-react';
import { ArticlesTab } from './components/ArticlesTab';
import { ChatbotTab } from './components/ChatbotTab';
import { SearchTab } from './components/SearchTab';
import logo from '../imports/Screenshot_2026-04-21_at_11.39.38 AM.png';

type TabType = 'articles' | 'chat' | 'search';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('articles');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-[#C9A961]/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <img src={logo} alt="iitel solutions" className="w-16 h-16 bg-transparent" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                iitel solutions
              </h1>
              <p className="text-sm text-gray-600">
                Global Policy Tracker - Real-time regulatory monitoring
              </p>
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'articles' && <ArticlesTab />}
        {activeTab === 'chat' && <ChatbotTab />}
        {activeTab === 'search' && <SearchTab />}
      </main>
    </div>
  );
}