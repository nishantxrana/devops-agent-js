import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Loader, 
  AlertCircle,
  Sparkles,
  Brain,
  Clock,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { apiService } from '../api/apiService';

const AgentChat = ({ isOpen, onToggle, className = '' }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState(null);
  const [agentStatus, setAgentStatus] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load agent status on mount
  useEffect(() => {
    if (isOpen) {
      loadAgentStatus();
      // Focus input when chat opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const loadAgentStatus = async () => {
    try {
      const response = await apiService.getAgentStatus();
      setAgentStatus(response.status);
    } catch (error) {
      console.error('Failed to load agent status:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setError(null);
    setIsLoading(true);

    // Add user message to chat
    const newUserMessage = {
      id: Date.now(),
      type: 'human',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Send message to agent
      const response = await apiService.chatWithAgent({
        message: userMessage,
        conversationId,
        userId: 'default'
      });

      // Update conversation ID if new
      if (!conversationId) {
        setConversationId(response.conversationId);
      }

      // Add agent response to chat
      const agentMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.response,
        timestamp: response.timestamp
      };
      setMessages(prev => [...prev, agentMessage]);

    } catch (error) {
      console.error('Failed to send message:', error);
      setError(error.message || 'Failed to send message to agent');
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString()
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

  const getMessageIcon = (type) => {
    switch (type) {
      case 'human':
        return <User className="w-4 h-4" />;
      case 'ai':
        return <Bot className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getMessageBgColor = (type) => {
    switch (type) {
      case 'human':
        return 'bg-blue-500 text-white';
      case 'ai':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100';
      case 'error':
        return 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const suggestedQuestions = [
    "What's the current sprint status?",
    "Show me recent build failures",
    "Are there any overdue work items?",
    "Analyze recent pull requests",
    "Generate a sprint summary"
  ];

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 ${
        isMinimized ? 'w-80 h-12' : 'w-96 h-[600px]'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Brain className="w-5 h-5" />
              {agentStatus?.initialized && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></div>
              )}
            </div>
            <span className="font-semibold">DevOps Agent</span>
            {agentStatus?.initialized && (
              <Sparkles className="w-4 h-4 text-yellow-300" />
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onToggle}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[480px]">
              {/* Welcome Message */}
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 mx-auto text-blue-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Hello! I'm your DevOps Agent
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    I can help you analyze builds, manage work items, and provide insights about your DevOps processes.
                  </p>
                  
                  {/* Suggested Questions */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Try asking me:
                    </p>
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => setInputMessage(question)}
                        className="block w-full text-left px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        "{question}"
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((message) => (
                <div key={message.id} className="flex space-x-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'human' ? 'bg-blue-500 text-white' : 
                    message.type === 'ai' ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' :
                    'bg-red-500 text-white'
                  }`}>
                    {getMessageIcon(message.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className={`inline-block px-4 py-2 rounded-lg max-w-full ${getMessageBgColor(message.type)}`}>
                      <div className="whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="inline-block px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <div className="flex items-center space-x-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        <span className="text-gray-600 dark:text-gray-400">Agent is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              {error && (
                <div className="mb-3 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about your DevOps processes..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                >
                  {isLoading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Press Enter to send • Shift+Enter for new line
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AgentChat;