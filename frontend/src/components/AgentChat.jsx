import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Settings, 
  RefreshCw, 
  Zap,
  Brain,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { apiService } from '../api/apiService';

const AgentChat = ({ isOpen, onToggle }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'agent',
      content: 'Hello! I\'m your intelligent DevOps agent. I can help you analyze builds, work items, pull requests, and provide proactive insights. How can I assist you today?',
      timestamp: new Date(),
      tools: []
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agenticEnabled, setAgenticEnabled] = useState(false);
  const [sessionId] = useState(`chat-${Date.now()}`);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkAgenticStatus();
  }, []);

  const checkAgenticStatus = async () => {
    try {
      const response = await apiService.request('/ai/agentic/status');
      setAgenticEnabled(response.agenticEnabled);
    } catch (error) {
      console.error('Error checking agentic status:', error);
    }
  };

  const enableAgenticMode = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.request('/ai/agentic/enable', {
        method: 'POST'
      });
      setAgenticEnabled(response.agenticEnabled);
      
      // Add system message about agentic mode
      const systemMessage = {
        id: Date.now(),
        type: 'system',
        content: 'Agentic mode enabled! I now have enhanced reasoning, memory, and context retention capabilities.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, systemMessage]);
    } catch (error) {
      console.error('Error enabling agentic mode:', error);
      const errorMessage = {
        id: Date.now(),
        type: 'system',
        content: 'Failed to enable agentic mode. Please check your AI configuration.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      let response;
      
      if (agenticEnabled) {
        // Use agentic API for enhanced responses
        response = await apiService.request('/ai/agentic/query', {
          method: 'POST',
          data: {
            query: inputMessage,
            sessionId,
            context: {
              chatHistory: messages.slice(-5) // Send last 5 messages for context
            }
          }
        });

        const agentMessage = {
          id: Date.now() + 1,
          type: 'agent',
          content: response.response,
          timestamp: new Date(),
          tools: response.toolsUsed || [],
          context: response.context
        };
        setMessages(prev => [...prev, agentMessage]);
      } else {
        // Fallback to basic AI response (you could integrate with existing AI endpoints)
        const agentMessage = {
          id: Date.now() + 1,
          type: 'agent',
          content: 'I\'m currently in basic mode. Enable agentic mode for enhanced capabilities with memory and reasoning.',
          timestamp: new Date(),
          tools: []
        };
        setMessages(prev => [...prev, agentMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'agent',
        content: 'I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp);
  };

  const getMessageIcon = (message) => {
    if (message.type === 'user') return <User className="h-4 w-4" />;
    if (message.type === 'system') {
      return message.isError ? 
        <AlertCircle className="h-4 w-4 text-red-500" /> : 
        <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return agenticEnabled ? <Brain className="h-4 w-4 text-purple-500" /> : <Bot className="h-4 w-4" />;
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 z-50"
        aria-label="Open AI Agent Chat"
      >
        {agenticEnabled ? <Brain className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        {agenticEnabled && (
          <div className="absolute -top-1 -right-1 bg-purple-400 rounded-full w-3 h-3 animate-pulse"></div>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {agenticEnabled ? <Brain className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
          <div>
            <h3 className="font-semibold">DevOps Agent</h3>
            <p className="text-xs opacity-90">
              {agenticEnabled ? 'Agentic Mode • Memory & Reasoning' : 'Basic Mode'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!agenticEnabled && (
            <button
              onClick={enableAgenticMode}
              disabled={isLoading}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
              title="Enable Agentic Mode"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            </button>
          )}
          <button
            onClick={onToggle}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.type === 'user' 
                ? 'bg-blue-500 text-white' 
                : message.type === 'system'
                ? 'bg-gray-100 dark:bg-gray-700'
                : agenticEnabled
                ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              {getMessageIcon(message)}
            </div>
            <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
              <div className={`rounded-2xl p-3 max-w-[85%] ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white ml-auto'
                  : message.isError
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.tools && message.tools.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {message.tools.map((tool, index) => (
                      <span key={index} className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs px-2 py-1 rounded-full">
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-3">
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-3 max-w-[85%]">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about builds, work items, or get insights..."
            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            rows="2"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="self-end p-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {agenticEnabled ? 'Enhanced AI with memory and reasoning' : 'Press Ctrl+Enter for new line, Enter to send'}
        </p>
      </div>
    </div>
  );
};

export default AgentChat;