import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TbBolt, 
  TbTrophy, 
  TbFlame, 
  TbTarget, 
  TbClock, 
  TbTrendingUp,
  TbStar,
  TbMedal,
  TbChevronDown,
  TbChevronUp
} from 'react-icons/tb';

const XPResultDisplay = ({ xpData, className = '' }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [animatedXP, setAnimatedXP] = useState(0);

  // Debug XP data (safely)
  if (process.env.NODE_ENV === 'development') {
    console.log('🎨 XPResultDisplay - XP Data received:', xpData);
  }

  useEffect(() => {
    if (xpData?.xpAwarded) {
      // Animate XP counter
      const duration = 2000;
      const steps = 60;
      const increment = xpData.xpAwarded / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= xpData.xpAwarded) {
          setAnimatedXP(xpData.xpAwarded);
          clearInterval(timer);
        } else {
          setAnimatedXP(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [xpData]);

  // Play level-up sound effect
  useEffect(() => {
    if (xpData?.levelUp) {
      const playLevelUpSound = () => {
        try {
          const audioContext = new window.AudioContext();

          // Create epic level-up sound sequence
          const createLevelUpSound = () => {
            // Triumphant ascending chord progression
            const chords = [
              [262, 330, 392], // C4, E4, G4
              [294, 370, 440], // D4, F#4, A4
              [330, 415, 494], // E4, G#4, B4
              [349, 440, 523]  // F4, A4, C5
            ];

            chords.forEach((chord, index) => {
              setTimeout(() => {
                chord.forEach((frequency) => {
                  const oscillator = audioContext.createOscillator();
                  const gainNode = audioContext.createGain();

                  oscillator.connect(gainNode);
                  gainNode.connect(audioContext.destination);

                  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
                  oscillator.type = 'triangle';

                  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                  gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.02);
                  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.6);

                  oscillator.start(audioContext.currentTime);
                  oscillator.stop(audioContext.currentTime + 0.6);
                });
              }, index * 200);
            });

            // Add sparkle effect at the end
            setTimeout(() => {
              [659, 784, 988, 1175].forEach((freq, i) => {
                setTimeout(() => {
                  const osc = audioContext.createOscillator();
                  const gain = audioContext.createGain();

                  osc.connect(gain);
                  gain.connect(audioContext.destination);

                  osc.frequency.setValueAtTime(freq, audioContext.currentTime);
                  osc.type = 'sine';

                  gain.gain.setValueAtTime(0, audioContext.currentTime);
                  gain.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
                  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);

                  osc.start(audioContext.currentTime);
                  osc.stop(audioContext.currentTime + 0.3);
                }, i * 100);
              });
            }, 800);
          };

          createLevelUpSound();
          console.log('🎵 Level Up sound played!');

        } catch (error) {
          console.log('Level-up audio not supported:', error);
        }
      };

      // Delay sound to sync with animation
      setTimeout(playLevelUpSound, 600);
    }
  }, [xpData?.levelUp]);

  if (!xpData) {
    return null;
  }

  const {
    xpAwarded = 0,
    xpBreakdown = {},
    levelUp = false,
    newLevel = 1,
    newTotalXP = 0,
    currentStreak = 0,
    achievements = []
  } = xpData;

  return (
    <div className={`bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border-2 border-purple-200 shadow-lg ${className}`}>
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes levelUpGlow {
          0% { box-shadow: 0 25px 50px -12px rgba(251, 191, 36, 0.5), 0 0 20px rgba(251, 191, 36, 0.3); }
          100% { box-shadow: 0 25px 50px -12px rgba(251, 191, 36, 0.8), 0 0 40px rgba(251, 191, 36, 0.6); }
        }
      `}</style>
      {/* Enhanced Level Up Notification */}
      <AnimatePresence>
        {levelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: -50, rotateY: -180 }}
            animate={{
              opacity: 1,
              scale: [0.3, 1.2, 1],
              y: 0,
              rotateY: 0,
              transition: {
                duration: 1.2,
                ease: "easeOut",
                scale: {
                  times: [0, 0.6, 1],
                  duration: 1.2
                }
              }
            }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="mb-6 p-6 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl text-white text-center shadow-2xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(45deg, #fbbf24, #f59e0b, #ea580c, #dc2626)',
              boxShadow: '0 25px 50px -12px rgba(251, 191, 36, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              animation: 'levelUpGlow 2s infinite alternate'
            }}
          >
            {/* Animated Background Effects */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
              animate={{
                x: ['-100%', '100%'],
                transition: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }
              }}
            />

            {/* Floating Particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full opacity-80"
                style={{
                  left: `${20 + i * 10}%`,
                  top: `${20 + (i % 3) * 20}%`
                }}
                animate={{
                  y: [-10, -30, -10],
                  opacity: [0.8, 0.3, 0.8],
                  scale: [1, 1.5, 1],
                  transition: {
                    duration: 2 + i * 0.2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              />
            ))}

            <motion.div
              className="relative z-10"
              animate={{
                scale: [1, 1.05, 1],
                transition: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            >
              <motion.div
                className="flex items-center justify-center mb-3"
                animate={{
                  rotateY: [0, 360],
                  transition: {
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }
                }}
              >
                <TbTrophy className="w-12 h-12 mr-3 drop-shadow-lg" />
                <motion.span
                  className="text-3xl font-black tracking-wider"
                  style={{
                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                    background: 'linear-gradient(45deg, #fff, #fbbf24)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                  animate={{
                    scale: [1, 1.1, 1],
                    transition: {
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                >
                  LEVEL UP!
                </motion.span>
              </motion.div>

              <motion.p
                className="text-xl font-bold"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { delay: 0.5, duration: 0.8 }
                }}
              >
                🎉 You reached Level {newLevel}! 🎉
              </motion.p>

              <motion.div
                className="mt-3 text-sm font-semibold opacity-90"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { delay: 1, duration: 0.8 }
                }}
              >
                Keep up the amazing work! 🚀
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main XP Display */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-3">
          <TbBolt className="w-8 h-8 text-purple-600 mr-2" />
          <h3 className="text-2xl font-bold text-gray-800">XP Earned</h3>
        </div>
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
          className="text-6xl font-bold text-purple-600 mb-2"
        >
          +{animatedXP}
        </motion.div>
        
        <p className="text-gray-600">
          Total XP: {newTotalXP.toLocaleString()} | Level {newLevel}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {currentStreak > 0 && (
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <TbFlame className="w-6 h-6 text-orange-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-800">{currentStreak}</div>
            <div className="text-sm text-gray-600">Streak</div>
          </div>
        )}
        
        {achievements.length > 0 && (
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <TbMedal className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-800">{achievements.length}</div>
            <div className="text-sm text-gray-600">New Badges</div>
          </div>
        )}
      </div>

      {/* XP Breakdown Toggle */}
      {Object.keys(xpBreakdown).length > 0 && (
        <div>
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <span className="font-medium text-gray-800">XP Breakdown</span>
            {showBreakdown ? (
              <TbChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <TbChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>

          <AnimatePresence>
            {showBreakdown && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 bg-white rounded-lg p-4 shadow-sm"
              >
                <div className="space-y-3">
                  {xpBreakdown.baseXP && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <TbTarget className="w-4 h-4 text-blue-500 mr-2" />
                        <span className="text-sm text-gray-700">Base XP</span>
                      </div>
                      <span className="font-medium text-gray-800">+{xpBreakdown.baseXP}</span>
                    </div>
                  )}
                  
                  {xpBreakdown.difficultyBonus > 0 && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <TbTrendingUp className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-sm text-gray-700">Difficulty Bonus</span>
                      </div>
                      <span className="font-medium text-green-600">+{xpBreakdown.difficultyBonus}</span>
                    </div>
                  )}
                  
                  {xpBreakdown.speedBonus > 0 && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <TbClock className="w-4 h-4 text-yellow-500 mr-2" />
                        <span className="text-sm text-gray-700">Speed Bonus</span>
                      </div>
                      <span className="font-medium text-yellow-600">+{xpBreakdown.speedBonus}</span>
                    </div>
                  )}
                  
                  {xpBreakdown.perfectScoreBonus > 0 && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <TbStar className="w-4 h-4 text-purple-500 mr-2" />
                        <span className="text-sm text-gray-700">Perfect Score</span>
                      </div>
                      <span className="font-medium text-purple-600">+{xpBreakdown.perfectScoreBonus}</span>
                    </div>
                  )}
                  
                  {xpBreakdown.streakBonus > 0 && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <TbFlame className="w-4 h-4 text-orange-500 mr-2" />
                        <span className="text-sm text-gray-700">Streak Bonus</span>
                      </div>
                      <span className="font-medium text-orange-600">+{xpBreakdown.streakBonus}</span>
                    </div>
                  )}
                  
                  {xpBreakdown.firstAttemptBonus > 0 && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <TbMedal className="w-4 h-4 text-indigo-500 mr-2" />
                        <span className="text-sm text-gray-700">First Attempt</span>
                      </div>
                      <span className="font-medium text-indigo-600">+{xpBreakdown.firstAttemptBonus}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Achievement Notifications */}
      {achievements.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
            <TbMedal className="w-5 h-5 mr-2 text-yellow-500" />
            New Achievements
          </h4>
          <div className="space-y-2">
            {achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
              >
                <TbTrophy className="w-6 h-6 text-yellow-500 mr-3" />
                <div>
                  <div className="font-medium text-gray-800">{String(achievement.name || 'Achievement')}</div>
                  <div className="text-sm text-gray-600">{String(achievement.description || 'Achievement unlocked!')}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default XPResultDisplay;
