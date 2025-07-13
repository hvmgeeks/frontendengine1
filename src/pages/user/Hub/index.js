import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { message } from 'antd';
import { useLanguage } from '../../../contexts/LanguageContext';
import './Hub.css';
import {
  FaHome,
  FaQuestionCircle,
  FaBook,
  FaChartLine,
  FaUser,
  FaComments,
  FaCreditCard,
  FaInfoCircle,
  FaGraduationCap,
  FaTrophy,
  FaStar,
  FaRocket,
  FaRobot,
  FaSignOutAlt,
  FaVideo
} from 'react-icons/fa';

const Hub = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const { t, isKiswahili } = useLanguage();
  const [currentQuote, setCurrentQuote] = useState(0);




  // Inspiring quotes that rotate
  const inspiringQuotes = isKiswahili ? [
    "Elimu ni silaha yenye nguvu zaidi ambayo unaweza kuitumia kubadilisha ulimwengu.",
    "Jambo zuri kuhusu kujifunza ni kwamba hakuna mtu anayeweza kuliondoa kwako.",
    "Mafanikio si ya mwisho, kushindwa si kwa kufa: ni ujasiri wa kuendelea ndio muhimu.",
    "Njia pekee ya kufanya kazi kubwa ni kupenda unachofanya.",
    "Amini unaweza na umefika nusu ya njia.",
    "Kikomo chako—ni mawazo yako tu.",
    "Mambo makuu hayatoki katika mazingira ya starehe.",
    "Ota. Tamani. Fanya.",
    "Mafanikio hayakutafuti tu. Lazima uende ukayatafute.",
    "Kadiri unavyofanya kazi kwa bidii kwa kitu, ndivyo utakavyojisikia vizuri zaidi utakapokifikia."
  ] : [
    "Education is the most powerful weapon which you can use to change the world.",
    "The beautiful thing about learning is that no one can take it away from you.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The only way to do great work is to love what you do.",
    "Believe you can and you're halfway there.",
    "Your limitation—it's only your imagination.",
    "Great things never come from comfort zones.",
    "Dream it. Wish it. Do it.",
    "Success doesn't just find you. You have to go out and get it.",
    "The harder you work for something, the greater you'll feel when you achieve it."
  ];

  // Rotate quotes every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % inspiringQuotes.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [inspiringQuotes.length]);

  // Logout function
  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Show success message
    message.success('Logged out successfully!');

    // Navigate to home page
    navigate('/');
  };



  const navigationItems = [
    {
      title: isKiswahili ? 'Fanya Mtihani' : 'Take Quiz',
      description: isKiswahili ? 'Jaribu maarifa yako' : 'Test your knowledge',
      icon: FaQuestionCircle,
      path: '/user/quiz',
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'from-blue-600 to-blue-700'
    },
    {
      title: isKiswahili ? 'Vifaa vya Kusoma' : 'Study Materials',
      description: isKiswahili ? 'Vitabu, maelezo na karatasi' : 'Books, notes & papers',
      icon: FaBook,
      path: '/user/study-material',
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'from-purple-600 to-purple-700'
    },
    {
      title: isKiswahili ? 'Masomo ya Video' : 'Video Lessons',
      description: isKiswahili ? 'Tazama video za kielimu' : 'Watch educational videos',
      icon: FaVideo,
      path: '/user/video-lessons',
      color: 'from-red-500 to-red-600',
      hoverColor: 'from-red-600 to-red-700'
    },
    {
      title: isKiswahili ? 'Ripoti' : 'Reports',
      description: isKiswahili ? 'Fuatilia maendeleo yako' : 'Track your progress',
      icon: FaChartLine,
      path: '/user/reports',
      color: 'from-green-500 to-green-600',
      hoverColor: 'from-green-600 to-green-700'
    },
    {
      title: isKiswahili ? 'Orodha ya Ushindi' : 'Ranking',
      description: isKiswahili ? 'Ona nafasi yako' : 'See your position',
      icon: FaTrophy,
      path: '/user/ranking',
      color: 'from-yellow-500 to-yellow-600',
      hoverColor: 'from-yellow-600 to-yellow-700'
    },
    {
      title: isKiswahili ? 'Ujuzi' : 'Skills',
      description: isKiswahili ? 'Ongeza ujuzi wako' : 'Enhance your skills',
      icon: FaStar,
      path: '/user/skills',
      color: 'from-yellow-500 to-yellow-600',
      hoverColor: 'from-yellow-600 to-yellow-700'
    },
    {
      title: isKiswahili ? 'Wasifu' : 'Profile',
      description: isKiswahili ? 'Simamia akaunti yako' : 'Manage your account',
      icon: FaUser,
      path: '/profile',
      color: 'from-indigo-500 to-indigo-600',
      hoverColor: 'from-indigo-600 to-indigo-700'
    },
    {
      title: 'Forum',
      description: 'Connect with peers',
      icon: FaComments,
      path: '/forum',
      color: 'from-pink-500 to-pink-600',
      hoverColor: 'from-pink-600 to-pink-700'
    }
  ];

  return (
    <div className="hub-container">
      <div className="hub-content">


        <div className="hub-header">
          <h1 className="hub-welcome">
            {isKiswahili ? 'Karibu' : 'Welcome'}, {user?.firstName || user?.name || (isKiswahili ? 'Mwanafunzi' : 'Student')}
          </h1>
          <p className="hub-subtitle">
            {isKiswahili ? 'Chagua njia yako ya kujifunza hapa chini' : 'Choose your learning path below'}
          </p>

          <div className="hub-quote">
            <FaStar style={{ color: '#f59e0b', marginRight: '0.5rem' }} />
            "{inspiringQuotes[currentQuote]}"
            <FaStar style={{ color: '#f59e0b', marginLeft: '0.5rem' }} />
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
              - BrainWave Team
            </div>
          </div>
        </div>





        <div className="hub-grid-container">
          <div className="hub-grid">
            {navigationItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`hub-card hover:${item.hoverColor} ${item.color}`}
                  onClick={() => navigate(item.path)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(item.path);
                    }
                  }}
                  style={{
                    cursor: 'pointer',
                    touchAction: 'manipulation', // Improves touch responsiveness
                  }}
                >


                  <div className="hub-card-icon">
                    <IconComponent />
                  </div>

                  <h3 className="hub-card-title">
                    {item.title}
                  </h3>

                  <p className="hub-card-description">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="hub-bottom-decoration"
          >
            <div className="decoration-content">
              <FaGraduationCap className="decoration-icon animate-bounce-gentle" />
              <span>Your learning journey starts here!</span>
              <FaRocket className="decoration-icon animate-bounce-gentle" />
            </div>
          </motion.div>
        </div>


      </div>
    </div>
  );
};

export default Hub;