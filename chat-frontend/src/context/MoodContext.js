import React, { createContext, useContext, useState } from 'react';

const MoodContext = createContext();

export const useMood = () => useContext(MoodContext);

export const MoodProvider = ({ children }) => {
  const [currentMood, setCurrentMood] = useState('neutral');
  const [moodHistory, setMoodHistory] = useState([]);

  const analyzeMood = (message) => {
    const happyWords = ['happy', 'joy', 'excited', '😊', '😄', '🎉', 'awesome', 'great', 'love'];
    const sadWords = ['sad', 'cry', 'upset', '😢', '😭', 'terrible', 'awful', 'hate'];
    const angryWords = ['angry', 'mad', 'furious', '😠', '😡', 'stupid', 'idiot'];
    const gameWords = ['game', 'play', 'dice', 'coin', 'fun', '🎲', '🎮'];
    
    const text = message.toLowerCase();
    
    if (happyWords.some(word => text.includes(word))) return 'happy';
    if (sadWords.some(word => text.includes(word))) return 'sad';
    if (angryWords.some(word => text.includes(word))) return 'angry';
    if (gameWords.some(word => text.includes(word))) return 'playful';
    
    return 'neutral';
  };

  const updateMood = (message) => {
    const mood = analyzeMood(message);
    setMoodHistory(prev => [...prev.slice(-10), mood]);
    
    const recentMoods = moodHistory.slice(-5);
    const moodCounts = recentMoods.reduce((acc, m) => {
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {});
    
    if (Object.keys(moodCounts).length > 0) {
      const dominantMood = Object.keys(moodCounts).reduce((a, b) => 
        moodCounts[a] > moodCounts[b] ? a : b
      );
      setCurrentMood(dominantMood);
    }
  };

  const getMoodTheme = () => {
    const themes = {
      happy: {
        background: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)',
        primary: '#fdcb6e',
        secondary: '#e17055',
        particles: '🌟✨🎉'
      },
      sad: {
        background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
        primary: '#74b9ff',
        secondary: '#0984e3',
        particles: '💧🌧️☁️'
      },
      angry: {
        background: 'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)',
        primary: '#fd79a8',
        secondary: '#e84393',
        particles: '⚡🔥💥'
      },
      playful: {
        background: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
        primary: '#a29bfe',
        secondary: '#6c5ce7',
        particles: '🎮🎲🎯'
      },
      neutral: {
        background: 'linear-gradient(135deg, #ddd6fe 0%, #c7d2fe 100%)',
        primary: '#8b5cf6',
        secondary: '#7c3aed',
        particles: '💬📱💭'
      }
    };
    
    return themes[currentMood] || themes.neutral;
  };

  return (
    <MoodContext.Provider value={{
      currentMood,
      updateMood,
      getMoodTheme,
      moodHistory
    }}>
      {children}
    </MoodContext.Provider>
  );
};