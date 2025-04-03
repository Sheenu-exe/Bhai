'use client'

import { useState, useEffect, useRef } from "react";
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import db from "@/libs/firebase";
import { 
  Flame, Star, ThumbsUp, MessageCircle, Trophy, 
  Clock, Zap, ArrowRight, Bookmark, MoreHorizontal
} from "lucide-react";
import confetti from 'canvas-confetti';

export default function BhaiKiAdvice() {
  const [problem, setProblem] = useState("");
  const [advices, setAdvices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState("latest");
  const [showEmoji, setShowEmoji] = useState(false);
  const confettiRef = useRef(null);

  useEffect(() => {
    const q = query(
      collection(db, "advices"), 
      orderBy(filter === "popular" ? "votes" : "timestamp", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAdvices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    return () => unsubscribe();
  }, [filter]);

  const triggerConfetti = () => {
    if (confettiRef.current) {
      confetti({
        particleCount: 50,
        spread: 60,
        colors: ['#000000', '#666666', '#888888'],
        origin: { y: 0.6 }
      });
    }
  };

  const generateAdvice = async () => {
    if (!problem.trim()) {
      setShowEmoji(true);
      setTimeout(() => setShowEmoji(false), 2000);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/generate-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to generate advice';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {}
        
        throw new Error(errorMessage);
      }

      let data;
      try {
        const responseText = await response.text();
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error("Invalid response format from server");
      }
      
      if (!data.advice) {
        throw new Error("Invalid response format: missing advice");
      }
      
      await addDoc(collection(db, "advices"), {
        problem,
        advice: data.advice,
        votes: 0,
        timestamp: new Date(),
        vibeLevel: Math.floor(Math.random() * 5) + 1,
      });
      
      setProblem("");
      setFilter("latest");
      setTimeout(() => triggerConfetti(), 500);
    } catch (error) {
      console.error("Error generating advice:", error);
      alert(`Bhai, system thoda busy hai. Phir se try karo! Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const vote = async (id, votes) => {
    const likedAdvices = JSON.parse(localStorage.getItem("likedAdvices")) || [];
    
    if (likedAdvices.includes(id)) {
      alert("Bhai, ek baar hi like kar sakta hai!");
      return;
    }
  
    const adviceRef = doc(db, "advices", id);
    await updateDoc(adviceRef, { votes: votes + 1 });
  
    // Store in localStorage
    localStorage.setItem("likedAdvices", JSON.stringify([...likedAdvices, id]));
  
    triggerConfetti();
  };
  

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-IN");
  };

  // Simple vibe indicators
  const vibeIndicators = [
    "Basic",
    "Good",
    "Great",
    "Excellent",
    "Legendary"
  ];

  return (
    <div className="min-h-screen bg-white text-black" ref={confettiRef}>
      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-2 tracking-tight">
            Bhai Ki Advice
          </h1>
          <div className="w-16 h-1 bg-black mx-auto mb-4" />
          <p className="text-lg text-gray-600 max-w-lg mx-auto">
            Straight-talking wisdom for your everyday problems
          </p>
        </motion.div>
        
        {/* Input Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-16"
        >
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <MessageCircle className="text-black" size={20} />
              <h2 className="text-xl font-semibold">Share your problem</h2>
            </div>
            
            <div className="mb-6 relative">
              <AnimatePresence>
                {showEmoji && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute -top-8 right-0 text-2xl"
                  >
                    🤔
                  </motion.div>
                )}
              </AnimatePresence>
              
              <textarea
                rows="3"
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="What's troubling you? Share your problem here..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800 text-base placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all resize-none"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generateAdvice}
                disabled={isLoading}
                className={`
                  flex items-center gap-2
                  bg-black text-white font-medium px-6 py-3 rounded-lg
                  transition-all duration-200
                  ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-800'}
                `}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <motion.div 
                        className="h-2 w-2 rounded-full bg-white"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div 
                        className="h-2 w-2 rounded-full bg-white"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div 
                        className="h-2 w-2 rounded-full bg-white"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                    <span>Thinking...</span>
                  </div>
                ) : (
                  <>
                    <span>Get Advice</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
        
        {/* Filter Tabs */}
        <motion.div 
          className="flex justify-center mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="inline-flex bg-gray-100 p-1 rounded-lg">
            <motion.button
              whileHover={{ backgroundColor: "#f3f4f6" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilter("latest")}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-all ${
                filter === "latest" 
                  ? "bg-white text-black shadow-sm" 
                  : "text-gray-600 hover:text-black"
              }`}
            >
              <Clock size={16} />
              <span>Latest</span>
            </motion.button>
            
            <motion.button
              whileHover={{ backgroundColor: "#f3f4f6" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilter("popular")}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-all ${
                filter === "popular" 
                  ? "bg-white text-black shadow-sm" 
                  : "text-gray-600 hover:text-black"
              }`}
            >
              <Trophy size={16} />
              <span>Popular</span>
            </motion.button>
          </div>
        </motion.div>
        
        {/* Advice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {advices.length > 0 ? (
              advices.map(({ id, problem, advice, votes, timestamp, vibeLevel = 1 }, index) => (
                <motion.div 
                  key={id} 
                  custom={index}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ 
                    duration: 0.3,
                    delay: Math.min(index * 0.05, 0.3)
                  }}
                  className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-black rounded-full"></div>
                      <h3 className="font-medium">Problem #{index + 1}</h3>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded-full">
                        {vibeIndicators[vibeLevel-1] || "Good"}
                      </span>
                      <span>{formatDate(timestamp)}</span>
                    </div>
                  </div>
                  
                  {/* Problem */}
                  <div className="p-4 bg-gray-50">
                    <p className="text-gray-700">{problem}</p>
                  </div>
                  
                  {/* Advice */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={16} className="text-black" />
                      <h3 className="font-semibold">Bhai's Advice</h3>
                    </div>
                    
                    <div className="bg-white border-l-2 border-black pl-4 py-1">
                      <p className="text-gray-800">{advice}</p>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between p-4 border-t border-gray-100">
                    <motion.button 
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => vote(id, votes)} 
                      className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-black font-medium px-4 py-2 rounded-full transition-all duration-200"
                    >
                      <ThumbsUp size={14} />
                      <span>{votes}</span>
                    </motion.button>
                    
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 rounded-full hover:bg-gray-100"
                      >
                        <Bookmark size={16} className="text-gray-500" />
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 rounded-full hover:bg-gray-100"
                      >
                        <MoreHorizontal size={16} className="text-gray-500" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="col-span-1 md:col-span-2 text-center py-20 px-8 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="text-4xl mb-4">🤔</div>
                <h3 className="text-xl font-semibold mb-2">
                  No advice yet
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Be the first to ask a question and get Bhai's wisdom
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}