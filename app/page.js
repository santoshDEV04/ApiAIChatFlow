"use client";

import { useState } from 'react'
import { Copy, Check, Send, Zap } from 'lucide-react'

export default function Home() {
  const [message, setMessage] = useState("")
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [streamResponse, setStreamResponse] = useState("")
  const [copiedRegular, setCopiedRegular] = useState(false)
  const [copiedStream, setCopiedStream] = useState(false)

  // Helper function to detect if content is code
  const isCode = (text) => {
    const codeIndicators = [
      'function', 'const', 'let', 'var', 'class', 'import', 'export',
      '{', '}', ';', 'console.log', 'return', 'if (', 'for (', 'while (',
      'async', 'await', 'try', 'catch', '===', '!==', '=>', 'useState',
      'useEffect', 'componentDidMount', 'render()', 'props', 'state',
      'public class', 'private', 'public', 'static', 'void main',
      'def ', 'print(', 'if __name__', 'import ', 'from ', 'class ',
      '<?php', '<?=', 'echo ', '$_', 'SELECT', 'FROM', 'WHERE', 'INSERT'
    ]

    const lowerText = text.toLowerCase()
    return codeIndicators.some(indicator => lowerText.includes(indicator.toLowerCase())) ||
           text.includes('```') ||
           text.split('\n').length > 3 && text.includes('  ') // Multi-line with indentation
  }

  // Copy to clipboard function
  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'regular') {
        setCopiedRegular(true)
        setTimeout(() => setCopiedRegular(false), 2000)
      } else {
        setCopiedStream(true)
        setTimeout(() => setCopiedStream(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  // Helper function to render content
  const renderContent = (content) => {
    if (!content) return null

    if (isCode(content)) {
      return (
        <div className="relative group">
          <pre className="bg-gray-950 text-green-400 p-6 rounded-xl overflow-x-auto text-sm font-mono whitespace-pre-wrap border border-gray-800 shadow-inner max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            <code>{content}</code>
          </pre>
        </div>
      )
    }

    return (
      <div className="bg-gray-900 p-6 rounded-xl text-gray-100 whitespace-pre-wrap max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 border border-gray-800">
        {content}
      </div>
    )
  }

  const handleChat = async () => {
    if (!message.trim()) return

    setLoading(true)
    setResponse("")
    setStreamResponse("")

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({message})
      })

      const data = await res.json()
      setResponse(data.response)

    } catch (error) {
      setResponse("Error: " + error.message)
    }

    setLoading(false)
  }

  const handleStreamChat = async () => {
    if (!message.trim()) return

    setStreaming(true)
    setStreamResponse("")
    setResponse("")

    try {
      const res = await fetch("/api/chat-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({message})
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.content) {
                setStreamResponse((prev) => (prev || "") + data.content)
              }
            } catch (parseError) {
              console.error("Parse error:", parseError)
            }
          }
        }
      }

    } catch (error) {
      setStreamResponse("Error: " + error.message);
    }

    setStreaming(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleChat()
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent mb-4">
            AI Response Flow
          </h1>
          <p className="text-gray-400 text-lg">Experience the future of AI conversation</p>
        </div>

        {/* Input Section */}
        <div className="bg-gray-900 rounded-2xl p-2 mb-2 border border-gray-800 shadow-2xl">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Enter your message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message here... (Ctrl+Enter to send)"
              rows={4}
              className="w-full p-1 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-white placeholder-gray-400 transition-all duration-200"
            />
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleChat}
              disabled={loading || streaming || !message.trim()}
              className={`flex items-center gap-2 px-3 py-3 rounded-xl font-semibold transition-all duration-200 ${
                loading || streaming || !message.trim()
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 hover:scale-105 shadow-lg hover:shadow-blue-500/25"
              }`}
            >
              <Send size={18} />
              {loading ? "Sending..." : "Send"}
            </button>

            <button
              onClick={handleStreamChat}
              disabled={loading || streaming || !message.trim()}
              className={`flex items-center gap-2 px-3 py-3 rounded-xl font-semibold transition-all duration-200 ${
                loading || streaming || !message.trim()
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600 hover:scale-105 shadow-lg hover:shadow-purple-500/25"
              }`}
            >
              <Zap size={18} />
              {streaming ? "Streaming..." : "Stream"}
            </button>
          </div>
        </div>

        {/* Responses Section */}
        <div className="space-y-6">
          {/* Regular Response */}
          {response && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Send size={18} />
                  Regular Response
                </h3>
                <button
                  onClick={() => copyToClipboard(response, 'regular')}
                  className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-all duration-200 text-white text-sm"
                >
                  {copiedRegular ? <Check size={16} /> : <Copy size={16} />}
                  {copiedRegular ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="p-6">
                {renderContent(response)}
              </div>
            </div>
          )}

          {/* Stream Response */}
          {streamResponse && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-4 flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Zap size={18} />
                  Stream Response
                  {streaming && (
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  )}
                </h3>
                <button
                  onClick={() => copyToClipboard(streamResponse, 'stream')}
                  className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-all duration-200 text-white text-sm"
                >
                  {copiedStream ? <Check size={16} /> : <Copy size={16} />}
                  {copiedStream ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="p-6">
                {renderContent(streamResponse)}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p>Built with Next.js, Tailwind CSS, and AI magic ✨</p>
        </div>
      </div>
    </div>
  );
}