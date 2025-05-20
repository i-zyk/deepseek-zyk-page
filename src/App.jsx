import React from 'react';
import './App.css';
import AIChat from './components/AIChat';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Chat Application</h1>
      </header>
      <main>
        <AIChat />
      </main>
      <footer>
        <p>Powered by DeepSeek AI & Cloudflare Workers</p>
      </footer>
    </div>
  );
}

export default App;