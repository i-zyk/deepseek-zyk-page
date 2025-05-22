import React, { useState, useEffect } from 'react';
import './AIChat.css';

function AIChat() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const [requestHistory, setRequestHistory] = useState([]);
  
  // 替换为您的Worker URL
  const API_URL = 'https://deepseek-zyk-workers.izyk-me.workers.dev/';
  
  // 从localStorage加载历史记录
  useEffect(() => {
    const savedHistory = localStorage.getItem('aiChatHistory');
    if (savedHistory) {
      try {
        setRequestHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    }
  }, []);
  
  // 保存历史记录到localStorage
  const saveToHistory = (entry) => {
    const newHistory = [entry, ...requestHistory.slice(0, 9)]; // 保留最近10条
    setRequestHistory(newHistory);
    localStorage.setItem('aiChatHistory', JSON.stringify(newHistory));
  };
  
  // 计算请求频率
  const getRecentRequestCount = () => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    return requestHistory.filter(entry => entry.timestamp > oneMinuteAgo).length;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError('请输入问题');
      return;
    }
    
    // 检查请求频率
    const recentRequests = getRecentRequestCount();
    if (recentRequests >= 10) {
      setError('请求过于频繁，请等待一分钟后再试');
      return;
    }
    
    setLoading(true);
    setError('');
    setResponse('');
    setRetryCount(0);
    
    const requestEntry = {
      id: Date.now(),
      timestamp: Date.now(),
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      status: 'pending'
    };
    
    try {
      console.log('发送请求到:', API_URL);
      
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          temperature: 0.7,
          max_tokens: 500
        })
      });
      
      const data = await res.json();
      console.log('响应状态:', res.status, data);
      
      if (res.ok && data.text) {
        setResponse(data.text);
        setRateLimitInfo(data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        } : null);
        
        // 保存成功记录
        saveToHistory({
          ...requestEntry,
          status: 'success',
          response: data.text.substring(0, 100) + (data.text.length > 100 ? '...' : '')
        });
      } else {
        throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err) {
      console.error('请求错误:', err);
      
      let errorMessage = err.message || '请求失败';
      let suggestions = [];
      
      // 根据错误类型提供不同的建议
      if (err.message.includes('速率限制') || err.message.includes('Too Many Requests') || err.message.includes('429')) {
        errorMessage = 'API请求频率过高，请稍后再试';
        suggestions = [
          '等待1-2分钟后重试',
          '减少请求频率',
          '考虑升级API计划以获得更高限额'
        ];
        setRetryCount(prev => prev + 1);
      } else if (err.message.includes('认证') || err.message.includes('Unauthorized') || err.message.includes('401')) {
        errorMessage = 'API认证失败，请检查配置';
        suggestions = ['联系管理员检查API密钥配置'];
      } else if (err.message.includes('权限') || err.message.includes('Forbidden') || err.message.includes('403')) {
        errorMessage = 'API权限不足或余额不足';
        suggestions = [
          '检查OpenAI账户余额',
          '确认API密钥有足够权限',
          '联系管理员处理账户问题'
        ];
      } else if (err.message.includes('网络') || err.message.includes('fetch')) {
        errorMessage = '网络连接问题';
        suggestions = [
          '检查网络连接',
          '稍后重试',
          '联系技术支持'
        ];
      }
      
      setError(errorMessage);
      
      // 保存错误记录
      saveToHistory({
        ...requestEntry,
        status: 'error',
        error: errorMessage
      });
      
      // 显示建议
      if (suggestions.length > 0) {
        setTimeout(() => {
          setError(prev => prev + '\n\n建议:\n' + suggestions.map(s => `• ${s}`).join('\n'));
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const clearHistory = () => {
    setRequestHistory([]);
    localStorage.removeItem('aiChatHistory');
  };
  
  return (
    <div className="improved-ai-chat">
      <div className="chat-header">
        <h2>AI助手</h2>
        <div className="status-info">
          <span className="request-count">
            最近1分钟请求: {getRecentRequestCount()}/10
          </span>
          {retryCount > 0 && (
            <span className="retry-count">重试次数: {retryCount}</span>
          )}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="chat-form">
        <div className="input-group">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="请输入您的问题..."
            rows={4}
            disabled={loading}
            required
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            disabled={loading || !prompt.trim() || getRecentRequestCount() >= 10}
            className="submit-button"
          >
            {loading ? '处理中...' : '发送'}
          </button>
          
          {getRecentRequestCount() >= 8 && (
            <span className="warning-text">
              接近请求限制，请放慢速度
            </span>
          )}
        </div>
      </form>
      
      {error && (
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <pre>{error}</pre>
          </div>
        </div>
      )}
      
      {response && (
        <div className="response-section">
          <h3>回答</h3>
          <div className="response-text">{response}</div>
          
          {rateLimitInfo && (
            <div className="usage-info">
              <small>
                Token使用: {rateLimitInfo.promptTokens} + {rateLimitInfo.completionTokens} = {rateLimitInfo.totalTokens}
              </small>
            </div>
          )}
        </div>
      )}
      
      {requestHistory.length > 0 && (
        <div className="history-section">
          <div className="history-header">
            <h3>请求历史 ({requestHistory.length})</h3>
            <button onClick={clearHistory} className="clear-button">清空历史</button>
          </div>
          
          <div className="history-list">
            {requestHistory.slice(0, 5).map(entry => (
              <div key={entry.id} className={`history-item ${entry.status}`}>
                <div className="history-meta">
                  <span className="timestamp">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`status ${entry.status}`}>
                    {entry.status === 'success' ? '✓' : entry.status === 'error' ? '✗' : '⏳'}
                  </span>
                </div>
                <div className="history-content">
                  <div className="prompt-preview">{entry.prompt}</div>
                  {entry.response && (
                    <div className="response-preview">{entry.response}</div>
                  )}
                  {entry.error && (
                    <div className="error-preview">{entry.error}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AIChat;