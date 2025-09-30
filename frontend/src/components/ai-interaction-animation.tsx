'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Calendar, 
  Clock
} from 'lucide-react';

const chatMessages = [
  {
    id: 1,
    type: 'user',
    message: "Hey, can you help me find a photography mentor who's available this week?",
    delay: 0
  },
  {
    id: 2,
    type: 'ai',
    message: "I'll search ProfileBase via MCP to find photography mentors for you.",
    delay: 1500
  },
  {
    id: 3,
    type: 'ai',
    message: "Searching profiles...",
    icon: Sparkles,
    spinning: true,
    delay: 3000
  },
  {
    id: 4,
    type: 'ai',
    message: "Found perfect match! Alex Smith - Photography Expert",
    profile: {
      name: "Alex Smith",
      title: "Photography Expert",
      avatar: "AS"
    },
    delay: 5000
  },
  {
    id: 5,
    type: 'ai',
    message: "Checking Alex's calendar availability...",
    icon: Clock,
    spinning: true,
    delay: 7000
  },
  {
    id: 6,
    type: 'ai',
    message: "Great! Alex is available tomorrow 2-3 PM. Shall I schedule the meeting?",
    delay: 8500
  },
  {
    id: 7,
    type: 'user',
    message: "Yes, please schedule it!",
    delay: 10000
  },
  {
    id: 8,
    type: 'ai',
    message: "✅ Meeting scheduled for tomorrow 2-3 PM\n📧 Calendar invites sent\n💬 Chat room created",
    icon: Calendar,
    delay: 11500
  },
  {
    id: 9,
    type: 'user',
    message: "Perfect! Thank you for setting that up.",
    delay: 13500
  }
];

export default function AIInteractionAnimation() {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    
    chatMessages.forEach((message) => {
      const timeout = setTimeout(() => {
        setVisibleMessages(prev => [...prev, message.id]);
      }, message.delay);
      timeouts.push(timeout);
    });

    // Reset animation after all messages are shown
    const resetTimeout = setTimeout(() => {
      setVisibleMessages([]);
    }, 15000);
    timeouts.push(resetTimeout);

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          AI Agent + MCP Integration
        </h3>
        <p className="text-gray-600 text-sm">
          Watch how AI agents discover profiles and schedule meetings via MCP
        </p>
      </div>

      {/* Chat Container */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 min-h-[500px]">
        <div className="space-y-4">
          <AnimatePresence>
            {chatMessages.map((message) => {
              const isVisible = visibleMessages.includes(message.id);
              if (!isVisible) return null;

              const Icon = message.icon;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.type === 'user' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-3 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-gray-100 text-gray-800 rounded-bl-md'
                        : 'bg-orange-500 text-white rounded-br-md'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {Icon && (
                        <Icon 
                          className={`w-4 h-4 ${message.spinning ? 'animate-spin' : ''}`} 
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-line">
                          {message.message}
                        </p>
                        {message.profile && (
                          <div className="mt-2 bg-white/20 rounded-lg p-2 flex items-center space-x-2">
                            <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {message.profile.avatar}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-medium">{message.profile.name}</p>
                              <p className="text-xs opacity-90">{message.profile.title}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Typing Indicator */}
        {visibleMessages.length > 0 && visibleMessages.length < chatMessages.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-end mt-4"
          >
            <div className="bg-orange-500 text-white px-4 py-3 rounded-2xl rounded-br-md">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="text-center mt-6">
        <p className="text-sm text-gray-500">
          🎉 Complete MCP workflow - from discovery to scheduled meeting!
        </p>
      </div>
    </div>
  );
}