import React, { useState } from 'react';

const AIChat = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  
  // GraphQL API endpoint - 替换为您的Worker URL
  const API_URL = 'https://deepseek-zyk-workers.izyk-me.workers.dev/';
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const query = `
        query GenerateResponse($prompt: String!) {
          generateAIResponse(prompt: $prompt)
        }
      `;
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { prompt }
        })
      });
      
      const data = await response.json();
      
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }
      
      setResponse(data.data.generateAIResponse);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setResponse(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="ai-chat-container">
      <h2>AI Assistant</h2>
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask something..."
          rows={4}
          required
        />
        
        <button 
          type="submit" 
          disabled={loading || !prompt.trim()}
        >
          {loading ? 'Generating...' : 'Send'}
        </button>
      </form>
      
      {response && (
        <div className="response-container">
          <h3>Response:</h3>
          <div className="response-content">
            {response}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .ai-chat-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          margin-bottom: 16px;
          font-size: 16px;
        }
        
        button {
          background-color: #4285f4;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }
        
        button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .response-container {
          margin-top: 24px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 16px;
          background-color: #f9f9f9;
        }
        
        .response-content {
          white-space: pre-wrap;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

export default AIChat;