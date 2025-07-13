import React, { startTransition, useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { TbTrophy, TbCheck, TbX, TbHome, TbStar, TbBrain, TbChartBar } from 'react-icons/tb';
import { chatWithChatGPTToExplainAns } from '../../../apicalls/chat';
import { useLanguage } from '../../../contexts/LanguageContext';
import ContentRenderer from '../../../components/ContentRenderer';

const QuizResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { user } = useSelector((state) => state.user);
  const { isKiswahili } = useLanguage();
  // Get result data from navigation state first
  const resultData = location.state || {
    percentage: 0,
    correctAnswers: 0,
    totalQuestions: 0,
    timeTaken: 0,
    resultDetails: [],
    xpData: null,
    quizName: 'Quiz',
    quizSubject: 'General',
    passingPercentage: 60,
    verdict: 'Fail'
  };

  const {
    percentage,
    correctAnswers,
    totalQuestions,
    timeTaken,
    xpData,
    quizName,
    quizSubject,
    passingPercentage,
    verdict,
    resultDetails
  } = resultData;
  const isPassed = verdict === 'Pass' || percentage >= (passingPercentage || 60);

  // Debug XP data
  console.log('🎯 QuizResult - XP Data received:', xpData);
  console.log('🎯 QuizResult - Full result data:', resultData);

  const [confetti, setConfetti] = useState([]);
  const [explanations, setExplanations] = useState({});
  const [loadingExplanations, setLoadingExplanations] = useState({});
  const [isFlashing, setIsFlashing] = useState(false);

  // Play sound and trigger animations when component loads
  useEffect(() => {

    // Play enhanced sound effects and trigger flash animation
    const playSound = () => {
      // Trigger premium flash animation
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 3200); // Flash for 3.2 seconds (2 cycles of 0.8s each)

      try {
        if (isPassed) {
          // Success sound with clapping
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();

          // Create a success melody
          const playTone = (frequency, startTime, duration, type = 'sine') => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(frequency, startTime);
            oscillator.type = type;

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
          };

          // Create clapping sound effect
          const createClap = (startTime) => {
            const noise = audioContext.createBufferSource();
            const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.1, audioContext.sampleRate);
            const data = buffer.getChannelData(0);

            // Generate white noise for clap
            for (let i = 0; i < data.length; i++) {
              data[i] = Math.random() * 2 - 1;
            }

            noise.buffer = buffer;

            const filter = audioContext.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(1000, startTime);

            const gainNode = audioContext.createGain();
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

            noise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioContext.destination);

            noise.start(startTime);
            noise.stop(startTime + 0.1);
          };

          const now = audioContext.currentTime;

          // Play success melody: C-E-G-C (major chord progression)
          playTone(523.25, now, 0.2); // C5
          playTone(659.25, now + 0.1, 0.2); // E5
          playTone(783.99, now + 0.2, 0.2); // G5
          playTone(1046.5, now + 0.3, 0.4); // C6

          // Add clapping sounds
          createClap(now + 0.5);
          createClap(now + 0.7);
          createClap(now + 0.9);
          createClap(now + 1.1);

        } else {
          // Fail sound - create a gentle, encouraging tone
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();

          const playTone = (frequency, startTime, duration) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(frequency, startTime);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.08, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
          };

          // Play gentle fail tone: A-F (not harsh, encouraging)
          const now = audioContext.currentTime;
          playTone(440, now, 0.3); // A4
          playTone(349.23, now + 0.2, 0.4); // F4
        }
      } catch (error) {
        console.log('Audio not supported');
      }
    };

    // Generate premium animations based on pass/fail
    if (isPassed) {
      // Premium confetti explosion
      const premiumConfetti = [];

      // Main confetti burst (200 pieces)
      for (let i = 0; i < 200; i++) {
        const colors = [
          '#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1',
          '#96CEB4', '#FF69B4', '#32CD32', '#FF4500', '#9370DB',
          '#00CED1', '#FF1493', '#00FF7F', '#FF8C00', '#DA70D6'
        ];

        premiumConfetti.push({
          id: `confetti_${i}`,
          left: 20 + Math.random() * 60, // More centered
          delay: Math.random() * 2,
          duration: 4 + Math.random() * 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          shape: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)],
          size: 3 + Math.random() * 6,
          type: 'confetti',
          randomX: (Math.random() - 0.5) * 200 // For burst effect
        });
      }

      // Premium sparkles (50 pieces)
      for (let i = 0; i < 50; i++) {
        premiumConfetti.push({
          id: `sparkle_${i}`,
          left: Math.random() * 100,
          delay: Math.random() * 3,
          duration: 2 + Math.random() * 2,
          color: ['#FFD700', '#FFFFFF', '#FFF700', '#FFFF00'][Math.floor(Math.random() * 4)],
          size: 1 + Math.random() * 3,
          type: 'sparkle'
        });
      }

      // Burst confetti (100 pieces from center)
      for (let i = 0; i < 100; i++) {
        premiumConfetti.push({
          id: `burst_${i}`,
          left: 45 + Math.random() * 10, // Center burst
          delay: Math.random() * 0.5,
          duration: 3 + Math.random() * 2,
          color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#FF69B4'][Math.floor(Math.random() * 4)],
          shape: 'circle',
          size: 2 + Math.random() * 4,
          type: 'burst',
          randomX: (Math.random() - 0.5) * 300
        });
      }

      setConfetti(premiumConfetti);

      // Remove all animations after 10 seconds
      setTimeout(() => setConfetti([]), 10000);
    } else {
      // Premium motivational elements
      const motivationalElements = [];
      const motivationalEmojis = ['💪', '🌟', '📚', '🎯', '🚀', '💡', '⭐', '✨', '🔥', '💎'];

      for (let i = 0; i < 30; i++) {
        motivationalElements.push({
          id: `motivate_${i}`,
          left: Math.random() * 100,
          delay: Math.random() * 4,
          duration: 5 + Math.random() * 3,
          emoji: motivationalEmojis[Math.floor(Math.random() * motivationalEmojis.length)],
          isMotivational: true,
          size: 2 + Math.random() * 2
        });
      }
      setConfetti(motivationalElements);

      // Remove motivational elements after 8 seconds
      setTimeout(() => setConfetti([]), 8000);
    }

    playSound();
  }, [isPassed]);



  // Function to fetch explanation
  const fetchExplanation = async (questionIndex, detail) => {
    const questionKey = `question_${questionIndex}`;

    // Don't fetch if already loading or already have explanation
    if (loadingExplanations[questionKey] || explanations[questionKey]) {
      return;
    }

    try {
      setLoadingExplanations(prev => ({ ...prev, [questionKey]: true }));

      const response = await chatWithChatGPTToExplainAns({
        question: detail.questionText || detail.questionName,
        expectedAnswer: detail.correctAnswer,
        userAnswer: detail.userAnswer,
        imageUrl: detail.questionImage || detail.image || detail.imageUrl || null,
        language: isKiswahili ? 'kiswahili' : 'english'
      });

      if (response.success) {
        setExplanations(prev => ({
          ...prev,
          [questionKey]: response.explanation
        }));
      } else {
        console.error('Failed to fetch explanation:', response.error);
        setExplanations(prev => ({
          ...prev,
          [questionKey]: 'Sorry, we could not generate an explanation at this time. Please try again later.'
        }));
      }
    } catch (error) {
      console.error('Error fetching explanation:', error);
      setExplanations(prev => ({
        ...prev,
        [questionKey]: 'Sorry, we could not generate an explanation at this time. Please try again later.'
      }));
    } finally {
      setLoadingExplanations(prev => ({ ...prev, [questionKey]: false }));
    }
  };



  const handleBackToQuizzes = () => {
    console.log('🏠 Navigating to quiz listing...');
    startTransition(() => {
      navigate('/user/quiz');
    });
  };

  const handleRetakeQuiz = () => {
    console.log('🔄 Retaking quiz with ID:', id);
    if (id) {
      startTransition(() => {
        navigate(`/quiz/${id}/play`);
      });
    } else {
      console.log('❌ No quiz ID available, going to quiz listing');
      startTransition(() => {
        navigate('/user/quiz');
      });
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden ${
      isPassed
        ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100'
        : 'bg-gradient-to-br from-red-50 via-pink-50 to-orange-100'
    } ${isFlashing ? (isPassed ? 'flash-green' : 'flash-red') : ''}`}
    style={{
      padding: window.innerWidth <= 768 ? '8px' : window.innerWidth <= 1024 ? '16px' : '24px'
    }}>

      {/* Premium Confetti System */}
      {confetti.map((piece) => {
        if (piece.isMotivational) {
          return (
            <div
              key={piece.id}
              className="absolute opacity-90"
              style={{
                left: `${piece.left}%`,
                top: `${20 + Math.random() * 60}%`,
                fontSize: `${piece.size || 2}rem`,
                animation: `heart-beat ${piece.duration}s ease-in-out ${piece.delay}s infinite`,
                zIndex: 100
              }}
            >
              {piece.emoji}
            </div>
          );
        }

        if (piece.type === 'sparkle') {
          return (
            <div
              key={piece.id}
              className="absolute"
              style={{
                left: `${piece.left}%`,
                width: `${piece.size}px`,
                height: `${piece.size}px`,
                background: `radial-gradient(circle, ${piece.color}, transparent)`,
                borderRadius: '50%',
                animation: `premium-sparkle ${piece.duration}s ease-in-out ${piece.delay}s infinite`,
                top: `${Math.random() * 100}%`,
                boxShadow: `0 0 ${piece.size * 2}px ${piece.color}`,
                zIndex: 100
              }}
            />
          );
        }

        if (piece.type === 'burst') {
          return (
            <div
              key={piece.id}
              className="absolute opacity-90"
              style={{
                left: `${piece.left}%`,
                width: `${piece.size}px`,
                height: `${piece.size}px`,
                backgroundColor: piece.color,
                borderRadius: piece.shape === 'circle' ? '50%' : piece.shape === 'triangle' ? '0' : '0%',
                clipPath: piece.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
                animation: `confetti-burst ${piece.duration}s ease-out ${piece.delay}s forwards`,
                top: '40%',
                '--random-x': `${piece.randomX}px`,
                boxShadow: `0 0 ${piece.size}px ${piece.color}40`,
                zIndex: 100
              }}
            />
          );
        }

        // Regular premium confetti
        return (
          <div
            key={piece.id}
            className="absolute opacity-90"
            style={{
              left: `${piece.left}%`,
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              backgroundColor: piece.color,
              borderRadius: piece.shape === 'circle' ? '50%' : piece.shape === 'triangle' ? '0' : '0%',
              clipPath: piece.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
              animation: `confetti-fall ${piece.duration}s ease-out ${piece.delay}s forwards`,
              top: '-20px',
              boxShadow: `0 0 ${piece.size}px ${piece.color}60`,
              border: `1px solid ${piece.color}`,
              background: `linear-gradient(45deg, ${piece.color}, ${piece.color}80)`,
              zIndex: 100
            }}
          />
        );
      })}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(0px) rotate(36deg) scale(1);
          }
          100% {
            transform: translateY(100vh) rotate(1080deg) scale(0.3);
            opacity: 0;
          }
        }

        @keyframes confetti-burst {
          0% {
            transform: translateY(-10px) translateX(0px) rotate(0deg) scale(0);
            opacity: 0;
          }
          15% {
            transform: translateY(-50px) translateX(var(--random-x)) rotate(180deg) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(calc(var(--random-x) * 2)) rotate(1440deg) scale(0);
            opacity: 0;
          }
        }

        @keyframes premium-sparkle {
          0%, 100% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.5) rotate(180deg);
            opacity: 1;
          }
        }



        @keyframes heart-beat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }

        @keyframes text-bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0) scale(1); }
          40% { transform: translateY(-20px) scale(1.1); }
          60% { transform: translateY(-10px) scale(1.05); }
        }

        @keyframes text-glow {
          0%, 100% {
            text-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor;
            transform: scale(1);
          }
          50% {
            text-shadow: 0 0 20px currentColor, 0 0 40px currentColor, 0 0 60px currentColor;
            transform: scale(1.05);
          }
        }

        @keyframes rainbow-text {
          0% {
            color: #FF6B6B;
            text-shadow: 0 0 20px #FF6B6B, 0 0 40px #FF6B6B;
          }
          16% {
            color: #FFD93D;
            text-shadow: 0 0 20px #FFD93D, 0 0 40px #FFD93D;
          }
          33% {
            color: #6BCF7F;
            text-shadow: 0 0 20px #6BCF7F, 0 0 40px #6BCF7F;
          }
          50% {
            color: #4D96FF;
            text-shadow: 0 0 20px #4D96FF, 0 0 40px #4D96FF;
          }
          66% {
            color: #9B59B6;
            text-shadow: 0 0 20px #9B59B6, 0 0 40px #9B59B6;
          }
          83% {
            color: #FF69B4;
            text-shadow: 0 0 20px #FF69B4, 0 0 40px #FF69B4;
          }
          100% {
            color: #FF6B6B;
            text-shadow: 0 0 20px #FF6B6B, 0 0 40px #FF6B6B;
          }
        }

        @keyframes shake-celebrate {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10% { transform: translateX(-5px) rotate(-1deg); }
          20% { transform: translateX(5px) rotate(1deg); }
          30% { transform: translateX(-5px) rotate(-1deg); }
          40% { transform: translateX(5px) rotate(1deg); }
          50% { transform: translateX(-3px) rotate(-0.5deg); }
          60% { transform: translateX(3px) rotate(0.5deg); }
          70% { transform: translateX(-2px) rotate(-0.5deg); }
          80% { transform: translateX(2px) rotate(0.5deg); }
          90% { transform: translateX(-1px) rotate(0deg); }
        }

        @keyframes zoom-in-out {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        .animate-text-bounce {
          animation: text-bounce 2s ease-in-out infinite;
        }

        .animate-text-glow {
          animation: text-glow 2s ease-in-out infinite;
        }

        .animate-rainbow {
          animation: rainbow-text 3s linear infinite;
        }

        .animate-shake-celebrate {
          animation: shake-celebrate 1s ease-in-out infinite;
        }

        .animate-zoom {
          animation: zoom-in-out 2s ease-in-out infinite;
        }

        @keyframes elegant-scale {
          0%, 100% {
            transform: scale(1) rotateY(0deg);
            text-shadow: 0 0 20px currentColor;
          }
          50% {
            transform: scale(1.1) rotateY(5deg);
            text-shadow: 0 0 40px currentColor, 0 0 60px currentColor;
          }
        }

        @keyframes premium-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.9;
          }
        }

        @keyframes smooth-glow {
          0%, 100% {
            text-shadow: 0 0 15px currentColor, 0 0 30px currentColor, 0 0 45px currentColor;
            filter: brightness(1) saturate(1.2);
          }
          50% {
            text-shadow: 0 0 40px currentColor, 0 0 60px currentColor, 0 0 80px currentColor, 0 0 100px currentColor;
            filter: brightness(1.3) saturate(1.5);
          }
        }

        @keyframes rainbow-glow {
          0% {
            color: #FF6B6B;
            text-shadow: 0 0 20px #FF6B6B, 0 0 40px #FF6B6B, 0 0 60px #FF6B6B;
            filter: brightness(1.2) saturate(1.3);
          }
          16% {
            color: #FFD93D;
            text-shadow: 0 0 20px #FFD93D, 0 0 40px #FFD93D, 0 0 60px #FFD93D;
            filter: brightness(1.2) saturate(1.3);
          }
          33% {
            color: #6BCF7F;
            text-shadow: 0 0 20px #6BCF7F, 0 0 40px #6BCF7F, 0 0 60px #6BCF7F;
            filter: brightness(1.2) saturate(1.3);
          }
          50% {
            color: #4D96FF;
            text-shadow: 0 0 20px #4D96FF, 0 0 40px #4D96FF, 0 0 60px #4D96FF;
            filter: brightness(1.2) saturate(1.3);
          }
          66% {
            color: #9B59B6;
            text-shadow: 0 0 20px #9B59B6, 0 0 40px #9B59B6, 0 0 60px #9B59B6;
            filter: brightness(1.2) saturate(1.3);
          }
          83% {
            color: #FF69B4;
            text-shadow: 0 0 20px #FF69B4, 0 0 40px #FF69B4, 0 0 60px #FF69B4;
            filter: brightness(1.2) saturate(1.3);
          }
          100% {
            color: #FF6B6B;
            text-shadow: 0 0 20px #FF6B6B, 0 0 40px #FF6B6B, 0 0 60px #FF6B6B;
            filter: brightness(1.2) saturate(1.3);
          }
        }

        @keyframes celebration-bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0) scale(1);
          }
          40% {
            transform: translateY(-15px) scale(1.05);
          }
          60% {
            transform: translateY(-8px) scale(1.02);
          }
        }

        .animate-elegant {
          animation: elegant-scale 3s ease-in-out infinite;
        }

        .animate-premium-pulse {
          animation: premium-pulse 2s ease-in-out infinite;
        }

        .animate-smooth-glow {
          animation: smooth-glow 2.5s ease-in-out infinite;
        }

        .animate-celebration {
          animation: celebration-bounce 2s ease-in-out infinite;
        }

        .animate-rainbow {
          animation: rainbow-text 3s linear infinite;
        }

        .animate-rainbow-glow {
          animation: rainbow-glow 3s linear infinite;
        }

        @keyframes red-glow {
          0%, 100% {
            color: #EF4444;
            text-shadow: 0 0 20px #EF4444, 0 0 40px #EF4444, 0 0 60px #EF4444;
            filter: brightness(1.2) saturate(1.3);
          }
          25% {
            color: #DC2626;
            text-shadow: 0 0 25px #DC2626, 0 0 50px #DC2626, 0 0 75px #DC2626;
            filter: brightness(1.3) saturate(1.4);
          }
          50% {
            color: #B91C1C;
            text-shadow: 0 0 30px #B91C1C, 0 0 60px #B91C1C, 0 0 90px #B91C1C;
            filter: brightness(1.4) saturate(1.5);
          }
          75% {
            color: #DC2626;
            text-shadow: 0 0 25px #DC2626, 0 0 50px #DC2626, 0 0 75px #DC2626;
            filter: brightness(1.3) saturate(1.4);
          }
        }

        .animate-red-glow {
          animation: red-glow 2.5s ease-in-out infinite;
        }

        @keyframes premium-green-flash {
          0% {
            background: linear-gradient(45deg, transparent, transparent);
            box-shadow: none;
          }
          25% {
            background: linear-gradient(45deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1));
            box-shadow: inset 0 0 100px rgba(34, 197, 94, 0.2);
          }
          50% {
            background: linear-gradient(45deg, rgba(34, 197, 94, 0.4), rgba(16, 185, 129, 0.4));
            box-shadow: inset 0 0 200px rgba(34, 197, 94, 0.5), 0 0 50px rgba(34, 197, 94, 0.3);
          }
          75% {
            background: linear-gradient(45deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2));
            box-shadow: inset 0 0 150px rgba(34, 197, 94, 0.3);
          }
          100% {
            background: linear-gradient(45deg, transparent, transparent);
            box-shadow: none;
          }
        }

        @keyframes premium-red-flash {
          0% {
            background: linear-gradient(45deg, transparent, transparent);
            box-shadow: none;
          }
          25% {
            background: linear-gradient(45deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 127, 0.1));
            box-shadow: inset 0 0 100px rgba(239, 68, 68, 0.2);
          }
          50% {
            background: linear-gradient(45deg, rgba(239, 68, 68, 0.4), rgba(220, 38, 127, 0.4));
            box-shadow: inset 0 0 200px rgba(239, 68, 68, 0.5), 0 0 50px rgba(239, 68, 68, 0.3);
          }
          75% {
            background: linear-gradient(45deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 127, 0.2));
            box-shadow: inset 0 0 150px rgba(239, 68, 68, 0.3);
          }
          100% {
            background: linear-gradient(45deg, transparent, transparent);
            box-shadow: none;
          }
        }

        .flash-green {
          animation: premium-green-flash 0.8s ease-in-out 2;
        }

        .flash-red {
          animation: premium-red-flash 0.8s ease-in-out 2;
        }
      `}</style>

      {/* Premium Overlay Effect */}
      {isFlashing && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: isPassed
              ? 'radial-gradient(circle at center, rgba(34, 197, 94, 0.3) 0%, rgba(16, 185, 129, 0.2) 50%, transparent 100%)'
              : 'radial-gradient(circle at center, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 127, 0.2) 50%, transparent 100%)',
            animation: isPassed ? 'premium-green-flash 0.8s ease-in-out infinite' : 'premium-red-flash 0.8s ease-in-out infinite',
            zIndex: 5
          }}
        />
      )}

      <div className={`bg-white rounded-2xl shadow-2xl border-2 w-full relative ${
        isPassed ? 'border-green-400 shadow-green-200' : 'border-red-400 shadow-red-200'
      } ${isFlashing ? 'shadow-3xl' : ''}`}
      style={{
        background: isFlashing
          ? (isPassed
              ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(34, 197, 94, 0.05))'
              : 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(239, 68, 68, 0.05))')
          : 'white',
        boxShadow: isFlashing
          ? (isPassed
              ? '0 25px 50px rgba(34, 197, 94, 0.3), 0 0 100px rgba(34, 197, 94, 0.2)'
              : '0 25px 50px rgba(239, 68, 68, 0.3), 0 0 100px rgba(239, 68, 68, 0.2)')
          : '0 25px 50px rgba(0,0,0,0.15)',
        zIndex: 10,
        padding: window.innerWidth <= 768 ? '16px' : window.innerWidth <= 1024 ? '24px' : '32px',
        maxWidth: window.innerWidth <= 768 ? '100%' : window.innerWidth <= 1024 ? '90%' : '800px'
      }}>
        {/* Header */}
        <div
          className="text-center"
          style={{ marginBottom: window.innerWidth <= 768 ? '16px' : '32px' }}
        >
          <div
            className={`inline-flex items-center justify-center rounded-full mb-4 relative ${
              isPassed ? 'bg-gradient-to-br from-green-100 to-emerald-100' : 'bg-gradient-to-br from-red-100 to-pink-100'
            }`}
            style={{
              width: window.innerWidth <= 768 ? '60px' : '96px',
              height: window.innerWidth <= 768 ? '60px' : '96px'
            }}
          >
            <TbTrophy
              className={`${isPassed ? 'text-yellow-500' : 'text-gray-500'}`}
              style={{
                width: window.innerWidth <= 768 ? '30px' : '48px',
                height: window.innerWidth <= 768 ? '30px' : '48px'
              }}
            />
          </div>

          <h1
            className={`font-bold mb-4 ${
              isPassed
                ? 'text-green-600 animate-elegant animate-smooth-glow'
                : 'animate-premium-pulse animate-red-glow'
            }`}
            style={{
              fontSize: window.innerWidth <= 768 ? '24px' : window.innerWidth <= 1024 ? '36px' : '48px'
            }}
          >
            {isPassed ? (
              <span
                className="flex items-center justify-center"
                style={{ gap: window.innerWidth <= 768 ? '8px' : '16px', flexWrap: 'wrap' }}
              >
                <span
                  className="animate-celebration"
                  style={{ fontSize: window.innerWidth <= 768 ? '32px' : '56px' }}
                >🎉</span>
                <span className="animate-rainbow-glow animate-elegant">Congratulations!</span>
                <span
                  className="animate-celebration"
                  style={{ fontSize: window.innerWidth <= 768 ? '32px' : '56px' }}
                >🎉</span>
              </span>
            ) : (
              <span
                className="flex items-center justify-center"
                style={{ gap: window.innerWidth <= 768 ? '8px' : '16px', flexWrap: 'wrap' }}
              >
                <span
                  className="animate-premium-pulse"
                  style={{ fontSize: window.innerWidth <= 768 ? '32px' : '56px' }}
                >💪</span>
                <span className="animate-red-glow animate-elegant">Keep Going!</span>
                <span
                  className="animate-premium-pulse"
                  style={{ fontSize: window.innerWidth <= 768 ? '32px' : '56px' }}
                >💪</span>
              </span>
            )}
          </h1>

          <div className={`text-3xl font-bold mb-4 ${
            isPassed
              ? 'animate-celebration animate-rainbow-glow'
              : 'animate-premium-pulse animate-red-glow'
          }`}>
            {isPassed ? (
              <span className="animate-elegant animate-rainbow-glow">✨ You Passed! ✨</span>
            ) : (
              <span className="animate-red-glow animate-elegant">🌟 You Can Do It! 🌟</span>
            )}
          </div>

          <p className="text-gray-600 mt-2 text-lg">
            📚 {quizName} - {quizSubject}
          </p>
        </div>

        {/* Score Display */}
        <div className="text-center mb-8">
          <div className={`inline-block px-8 py-4 rounded-2xl ${
            isPassed ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
          }`}>
            <div className={`text-5xl font-bold mb-2 ${
              isPassed ? 'text-green-600' : 'text-red-600'
            }`}>
              {percentage}%
            </div>
            <div className="text-gray-600">
              Your Score
            </div>
          </div>
        </div>



        {/* Horizontal Compact Results */}
        <div
          className="flex gap-2 mb-2 justify-center items-center"
          style={{ flexWrap: 'wrap' }}
        >
          {/* Correct and Wrong - Horizontal */}
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '4px 8px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <span style={{ fontSize: '10px' }}>✅</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#16a34a' }}>{correctAnswers}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <span style={{ fontSize: '10px' }}>❌</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#dc2626' }}>{totalQuestions - correctAnswers}</span>
            </div>
          </div>

          {/* Score */}
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '4px 8px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px'
            }}
          >
            <span style={{ fontSize: '10px' }}>📊</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: isPassed ? '#16a34a' : '#dc2626' }}>{percentage}%</span>
          </div>

          {/* Time - Only if available */}
          {timeTaken && timeTaken > 0 && (
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '4px 8px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px'
              }}
            >
              <span style={{ fontSize: '10px' }}>⏱️</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#2563eb' }}>
                {Math.floor(timeTaken / 60)}:{(timeTaken % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        {/* Streamlined XP Section */}
        {xpData && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 mb-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <TbStar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-purple-600 font-bold text-xl">+{xpData.xpAwarded || 0} XP</div>
                  <div className="text-sm text-gray-600">Earned</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-indigo-600">
                  {((user?.totalXP || 0) + (xpData.xpAwarded || 0)).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total XP • Level {user?.currentLevel || 1}</div>
              </div>
            </div>
          </div>
        )}

        {/* Streamlined XP Section (for users without XP data) */}
        {!xpData && user && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 mb-6 border border-indigo-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
                  <TbStar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Your Progress</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-indigo-600">
                  {(user.totalXP || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total XP • Level {user.currentLevel || 1}</div>
              </div>
            </div>
          </div>
        )}

        {/* Learning Summary Section */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 mb-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <TbBrain className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">📚 Learning Summary</h3>
          </div>

          {/* Simplified Learning Summary - Only Question Review */}
        </div>

        {/* Detailed Question Breakdown */}
        {resultDetails && resultDetails.length > 0 && (
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 mb-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <TbChartBar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">📋 Question by Question Review</h3>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {resultDetails.map((detail, index) => {
                // Debug: Log question data to see what's available
                console.log(`Question ${index + 1} data:`, detail);
                return (
                <div
                  key={detail.questionId || index}
                  className={`rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl ${
                    detail.isCorrect
                      ? 'bg-gradient-to-r from-green-100 to-emerald-100 shadow-lg shadow-green-300'
                      : 'bg-gradient-to-r from-red-100 to-pink-100 shadow-lg shadow-red-300'
                  }`}
                  style={{
                    border: detail.isCorrect
                      ? '4px solid #16a34a' // Green border for correct answers
                      : '4px solid #dc2626', // Red border for wrong answers
                    boxShadow: detail.isCorrect
                      ? '0 10px 25px rgba(34, 197, 94, 0.4), 0 0 0 2px rgba(34, 197, 94, 0.2)'
                      : '0 10px 25px rgba(239, 68, 68, 0.4), 0 0 0 2px rgba(239, 68, 68, 0.2)'
                  }}
                >
                  {/* Question Header */}
                  <div className={`p-4 ${
                    detail.isCorrect
                      ? 'bg-green-300 border-b-4 border-green-500'
                      : 'bg-red-300 border-b-4 border-red-500'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        detail.isCorrect
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-red-500 text-white shadow-lg'
                      }`}>
                        {detail.isCorrect ? <TbCheck className="w-5 h-5" /> : <TbX className="w-5 h-5" />}
                      </div>

                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg">
                          Question {index + 1}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            detail.isCorrect
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}>
                            {detail.isCorrect ? '✅ CORRECT' : '❌ WRONG'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="p-4">
                    <div className="mb-4">
                      <p className="text-gray-700 bg-white p-3 rounded-lg border">
                        {detail.questionText || detail.questionName}
                      </p>
                    </div>

                    {/* Show Image for image questions or any question with an image */}
                    {(detail.questionType === 'image' || detail.questionImage || detail.image || detail.imageUrl) && (detail.questionImage || detail.image || detail.imageUrl) && (
                      <div className="mb-4">
                        <div className={`p-3 rounded-lg border-2 ${
                          detail.isCorrect
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-gray-700">📷 Question Image:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              detail.isCorrect
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                            }`}>
                              {detail.isCorrect ? '✅ CORRECT' : '❌ WRONG'}
                            </span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border">
                            <img
                              src={detail.questionImage || detail.image || detail.imageUrl}
                              alt="Question Image"
                              className="max-w-full h-auto rounded-lg shadow-sm mx-auto block"
                              style={{ maxHeight: '300px' }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                            <div
                              className="text-center text-gray-500 text-sm p-4 bg-gray-100 rounded-lg"
                              style={{ display: 'none' }}
                            >
                              📷 Image could not be loaded
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Enhanced Answer Section with Color Indicators */}
                    <div className="space-y-3">
                      <div
                        className={`p-4 rounded-lg ${
                          detail.isCorrect
                            ? 'bg-green-50'
                            : 'bg-red-50'
                        }`}
                        style={{
                          border: detail.isCorrect
                            ? '3px solid #16a34a' // Green border for correct answers
                            : '3px solid #dc2626'  // Red border for wrong answers
                        }}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            detail.isCorrect ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                            {detail.isCorrect ? (
                              <TbCheck className="w-4 h-4 text-white" />
                            ) : (
                              <TbX className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <span className="font-semibold text-gray-700">Your Answer:</span>
                        </div>
                        <div className={`p-3 rounded-lg font-bold text-lg ${
                          detail.isCorrect
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {detail.userAnswer || 'No answer provided'}
                        </div>
                      </div>

                      {!detail.isCorrect && (
                        <div className="bg-green-50 p-4 rounded-lg border-4 border-green-500">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                              <TbCheck className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold text-gray-700">Correct Answer:</span>
                          </div>
                          <div className="bg-green-100 p-3 rounded-lg border-2 border-green-400 font-bold text-lg text-green-700">
                            {detail.correctAnswer}
                          </div>
                        </div>
                      )}

                      {/* Explanation Button for Wrong Answers */}
                      {!detail.isCorrect && (
                        <div className="mt-3">
                          <button
                            className={`w-full font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                              loadingExplanations[`question_${index}`]
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                            }`}
                            onClick={() => fetchExplanation(index, detail)}
                            disabled={loadingExplanations[`question_${index}`]}
                          >
                            {loadingExplanations[`question_${index}`] ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Getting Explanation...
                              </>
                            ) : (
                              <>
                                <TbBrain className="w-5 h-5" />
                                Get Explanation
                              </>
                            )}
                          </button>

                          {/* Explanation Display with Math Support */}
                          {explanations[`question_${index}`] && (
                            <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-3">
                                <TbBrain className="w-5 h-5 text-blue-600" />
                                <h6 className="font-bold text-blue-800">💡 Explanation:</h6>
                              </div>
                              <div className="text-blue-700 leading-relaxed">
                                <ContentRenderer text={explanations[`question_${index}`]} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>


          </div>
        )}

        {/* Actions */}
        <div
          className="flex gap-4"
          style={{
            flexDirection: window.innerWidth <= 768 ? 'column' : 'row'
          }}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              console.log('🔥 More Quizzes button clicked!');
              handleBackToQuizzes();
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium cursor-pointer"
            style={{
              padding: window.innerWidth <= 768 ? '12px 16px' : '12px 24px',
              fontSize: window.innerWidth <= 768 ? '14px' : '16px'
            }}
            type="button"
          >
            <TbHome
              style={{
                width: window.innerWidth <= 768 ? '16px' : '20px',
                height: window.innerWidth <= 768 ? '16px' : '20px'
              }}
            />
            More Quizzes
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              console.log('🔥 Retake Quiz button clicked!');
              handleRetakeQuiz();
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all font-medium cursor-pointer"
            style={{
              padding: window.innerWidth <= 768 ? '12px 16px' : '12px 24px',
              fontSize: window.innerWidth <= 768 ? '14px' : '16px'
            }}
            type="button"
          >
            <TbTrophy
              style={{
                width: window.innerWidth <= 768 ? '16px' : '20px',
                height: window.innerWidth <= 768 ? '16px' : '20px'
              }}
            />
            Retake Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResult;
