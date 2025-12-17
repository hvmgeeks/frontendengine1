import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TbTrophy,
  TbMedal,
  TbClock,
  TbFlame,
  TbTarget,
  TbTrendingUp,
  TbChevronDown,
  TbChevronUp,
  TbStar,
  TbBolt
} from 'react-icons/tb';
import AchievementBadge, { AchievementNotification } from './AchievementBadge';
import { extractUserResultData, safeNumber } from '../../utils/quizDataUtils';

const EnhancedQuizResult = ({
  result,
  examData,
  onContinue,
  onRetry,
  className = ''
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showAchievements, setShowAchievements] = useState(true);

  // Extract safe result data to prevent object rendering errors
  const resultDataSafe = extractUserResultData(result);

  // Determine result status and styling
  const isPassed = resultDataSafe.verdict === 'Pass';
  const isExcellent = resultDataSafe.score >= 90;
  const isGood = resultDataSafe.score >= 80;

  const getResultStyling = () => {
    if (isExcellent) {
      return {
        gradient: 'from-yellow-400 via-yellow-500 to-yellow-600',
        bgGradient: 'from-yellow-50 to-orange-50',
        textColor: 'text-yellow-700',
        icon: TbTrophy
      };
    } else if (isGood) {
      return {
        gradient: 'from-blue-400 via-blue-500 to-blue-600',
        bgGradient: 'from-blue-50 to-indigo-50',
        textColor: 'text-blue-700',
        icon: TbMedal
      };
    } else if (isPassed) {
      return {
        gradient: 'from-green-400 via-green-500 to-green-600',
        bgGradient: 'from-green-50 to-emerald-50',
        textColor: 'text-green-700',
        icon: TbTarget
      };
    } else {
      return {
        gradient: 'from-red-400 via-red-500 to-red-600',
        bgGradient: 'from-red-50 to-pink-50',
        textColor: 'text-red-700',
        icon: TbTarget
      };
    }
  };

  const styling = getResultStyling();
  const ResultIcon = styling.icon;

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const scoreVariants = {
    hidden: { scale: 0 },
    visible: { 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 20,
        delay: 0.3
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`max-w-4xl mx-auto ${className}`}
    >
      {/* Achievement Notifications */}
      <AnimatePresence>
        {result.achievements && result.achievements.length > 0 && showAchievements && (
          <AchievementNotification
            achievement={result.achievements[0]}
            onClose={() => setShowAchievements(false)}
            autoClose={true}
            duration={5000}
          />
        )}
      </AnimatePresence>

      {/* Main Result Card */}
      <motion.div
        variants={itemVariants}
        className={`
          bg-gradient-to-br ${styling.bgGradient}
          rounded-2xl shadow-xl border border-white/20 p-8 mb-6
        `}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            variants={scoreVariants}
            className={`
              inline-flex items-center justify-center w-20 h-20 rounded-full
              bg-gradient-to-r ${styling.gradient} shadow-lg mb-4
            `}
          >
            <ResultIcon className="w-10 h-10 text-white" />
          </motion.div>
          
          <motion.h1
            variants={itemVariants}
            className={`font-bold ${styling.textColor} mb-2`}
            style={{
              fontSize: window.innerWidth <= 320 ? '32px' : window.innerWidth <= 375 ? '36px' : window.innerWidth <= 425 ? '40px' : window.innerWidth <= 768 ? '44px' : '48px'
            }}
          >
            {isPassed ? 'Congratulations!' : 'Keep Trying!'}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-gray-600"
            style={{
              fontSize: window.innerWidth <= 320 ? '16px' : window.innerWidth <= 768 ? '18px' : '20px'
            }}
          >
            {examData.name} - {examData.subject}
          </motion.p>
        </div>

        {/* Score Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div 
            variants={itemVariants}
            className="text-center"
          >
            <div className={`text-4xl font-bold ${styling.textColor} mb-2`}>
              {resultDataSafe.score}%
            </div>
            <div className="text-gray-600 font-medium">Final Score</div>
            {result.baseScore && result.baseScore !== resultDataSafe.score && (
              <div className="text-sm text-gray-500 mt-1">
                Base: {safeNumber(result.baseScore, 0)}% + {safeNumber(result.bonusPoints, 0)} bonus
              </div>
            )}
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="text-center"
          >
            <div className={`text-4xl font-bold ${styling.textColor} mb-2`}>
              {resultDataSafe.xpGained}
            </div>
            <div className="text-gray-600 font-medium">Points Earned</div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="text-center"
          >
            <div className={`text-4xl font-bold ${styling.textColor} mb-2`}>
              {resultDataSafe.correctAnswers}/{resultDataSafe.totalQuestions}
            </div>
            <div className="text-gray-600 font-medium">Correct Answers</div>
            {result.partialAnswers && Array.isArray(result.partialAnswers) && result.partialAnswers.length > 0 && (
              <div className="text-sm text-gray-500 mt-1">
                + {result.partialAnswers.length} partial credit
              </div>
            )}
          </motion.div>
        </div>

        {/* Enhanced Breakdown */}
        {result.breakdown && (
          <motion.div variants={itemVariants}>
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className={`
                w-full flex items-center justify-between p-4 rounded-lg
                bg-white/50 hover:bg-white/70 transition-colors duration-200
                ${styling.textColor} font-medium
              `}
            >
              <span>Score Breakdown</span>
              {showBreakdown ? <TbChevronUp /> : <TbChevronDown />}
            </button>

            <AnimatePresence>
              {showBreakdown && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-3"
                >
                  {result.breakdown.difficultyBonus > 0 && (
                    <div className="flex items-center justify-between p-3 bg-white/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <TbStar className="w-5 h-5 text-purple-600" />
                        <span>Difficulty Bonus</span>
                      </div>
                      <span className="font-semibold">+{result.breakdown.difficultyBonus}</span>
                    </div>
                  )}

                  {result.breakdown.timeBonus !== 0 && (
                    <div className="flex items-center justify-between p-3 bg-white/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <TbClock className="w-5 h-5 text-blue-600" />
                        <span>Time Bonus</span>
                      </div>
                      <span className={`font-semibold ${result.breakdown.timeBonus > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {result.breakdown.timeBonus > 0 ? '+' : ''}{result.breakdown.timeBonus}
                      </span>
                    </div>
                  )}

                  {result.breakdown.streakBonus > 0 && (
                    <div className="flex items-center justify-between p-3 bg-white/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <TbFlame className="w-5 h-5 text-orange-600" />
                        <span>Streak Bonus</span>
                      </div>
                      <span className="font-semibold text-green-600">+{result.breakdown.streakBonus}</span>
                    </div>
                  )}

                  {result.breakdown.consistencyBonus > 0 && (
                    <div className="flex items-center justify-between p-3 bg-white/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <TbTarget className="w-5 h-5 text-green-600" />
                        <span>Consistency Bonus</span>
                      </div>
                      <span className="font-semibold text-green-600">+{result.breakdown.consistencyBonus}</span>
                    </div>
                  )}

                  {result.breakdown.improvementBonus > 0 && (
                    <div className="flex items-center justify-between p-3 bg-white/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <TbTrendingUp className="w-5 h-5 text-indigo-600" />
                        <span>Improvement Bonus</span>
                      </div>
                      <span className="font-semibold text-green-600">+{result.breakdown.improvementBonus}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Achievements */}
        {result.achievements && result.achievements.length > 0 && (
          <motion.div 
            variants={itemVariants}
            className="mt-8 p-4 bg-white/30 rounded-lg"
          >
            <h3 className={`text-lg font-semibold ${styling.textColor} mb-4 flex items-center`}>
              <TbTrophy className="w-5 h-5 mr-2" />
              New Achievements
            </h3>
            <div className="flex flex-wrap gap-3">
              {result.achievements.map((achievement, index) => (
                <AchievementBadge
                  key={index}
                  achievement={achievement}
                  size="medium"
                  showDetails={true}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 mt-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onContinue}
            className={`
              flex-1 py-3 px-6 rounded-lg font-semibold text-white
              bg-gradient-to-r ${styling.gradient}
              hover:shadow-lg transition-shadow duration-200
            `}
          >
            Continue Learning
          </motion.button>

          {!isPassed && onRetry && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRetry}
              className="
                flex-1 py-3 px-6 rounded-lg font-semibold
                bg-gray-100 hover:bg-gray-200 text-gray-700
                transition-colors duration-200
              "
            >
              Try Again
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default EnhancedQuizResult;
