import React, { useState, useRef } from "react";
import "./index.css";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TbArrowBigRightLinesFilled,
  TbBrain,
  TbBook,
  TbTrophy,
  TbUsers,
  TbSchool,
  TbUserPlus,
  TbStar,
  TbLogin
} from "react-icons/tb";
import { message } from "antd";
import { useSelector } from "react-redux";
import Image1 from "../../../assets/collage-1.png";
import { contactUs } from "../../../apicalls/users";
import NotificationBell from "../../../components/common/NotificationBell";
import ProfilePicture from "../../../components/common/ProfilePicture";
import AnimatedCounter from "../../../components/AnimatedCounter";


const Home = () => {
  const reviewsSectionRef = useRef(null);
  const contactUsRef = useRef(null);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const { user } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const scrollToSection = (ref, offset = 80) => {
    if (ref?.current) {
      const sectionTop = ref.current.offsetTop;
      window.scrollTo({ top: sectionTop - offset, behavior: "smooth" });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponseMessage("");
    try {
      const data = await contactUs(formData);
      if (data.success) {
        message.success("Message sent successfully!");
        setResponseMessage("Message sent successfully!");
        setFormData({ name: "", email: "", message: "" });
      } else {
        setResponseMessage(data.message || "Something went wrong.");
      }
    } catch (error) {
      setResponseMessage("Error sending message. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="Home relative min-h-screen overflow-hidden">
      {/* Modern Responsive Header - Same as ProtectedRoute */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="nav-modern bg-gradient-to-r from-white/98 via-blue-50/95 to-white/98 backdrop-blur-xl border-b border-blue-100/50 sticky top-0 z-30 shadow-lg shadow-blue-100/20"
      >
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-18 lg:h-20">
            {/* Left section - Reviews */}
            <div className="flex items-center space-x-2">
              <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
                <button onClick={() => scrollToSection(reviewsSectionRef)} className="nav-item text-sm md:text-base">Reviews</button>
              </div>
            </div>

            {/* Center Section - Tanzania Flag + Brainwave Title + Logo */}
            <div className="flex-1 flex justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative group flex items-center space-x-3"
              >
                {/* Tanzania Flag - Using actual flag image */}
                <div
                  className="rounded-md overflow-hidden border-2 border-gray-300 shadow-lg relative"
                  style={{
                    width: '32px',
                    height: '24px'
                  }}
                >
                  <img
                    src="https://flagcdn.com/w40/tz.png"
                    alt="Tanzania Flag"
                    className="w-full h-full object-cover"
                    style={{ objectFit: 'cover' }}
                    onError={(e) => {
                      // Fallback to another flag source if first fails
                      e.target.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Flag_of_Tanzania.svg/32px-Flag_of_Tanzania.svg.png";
                      e.target.onerror = () => {
                        // Final fallback - hide image and show text
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div class="w-full h-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">TZ</div>';
                      };
                    }}
                  />
                </div>

                {/* Amazing Animated Brainwave Text */}
                <div className="relative brainwave-container">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight relative z-10 select-none"
                      style={{
                        fontFamily: "'Inter', 'SF Pro Display', 'Helvetica Neue', sans-serif",
                        letterSpacing: '-0.02em'
                      }}>
                    {/* Brain - with amazing effects */}
                    <motion.span
                      className="relative inline-block"
                      initial={{ opacity: 0, x: -30, scale: 0.8 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        scale: 1,
                        textShadow: [
                          "0 0 10px rgba(59, 130, 246, 0.5)",
                          "0 0 20px rgba(59, 130, 246, 0.8)",
                          "0 0 10px rgba(59, 130, 246, 0.5)"
                        ]
                      }}
                      transition={{
                        duration: 1,
                        delay: 0.3,
                        textShadow: {
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }
                      }}
                      whileHover={{
                        scale: 1.1,
                        rotate: [0, -2, 2, 0],
                        transition: { duration: 0.3 }
                      }}
                      style={{
                        color: '#1f2937',
                        fontWeight: '900',
                        textShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                      }}
                    >
                      Brain

                      {/* Electric spark */}
                      <motion.div
                        className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0.5, 1.2, 0.5],
                          backgroundColor: ['#3b82f6', '#60a5fa', '#3b82f6']
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: 2
                        }}
                        style={{
                          backgroundColor: '#3b82f6',
                          boxShadow: '0 0 10px #3b82f6'
                        }}
                      />
                    </motion.span>

                    {/* Wave - with flowing effects (no space) */}
                    <motion.span
                      className="relative inline-block"
                      initial={{ opacity: 0, x: 30, scale: 0.8 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        scale: 1,
                        y: [0, -2, 0, 2, 0],
                        textShadow: [
                          "0 0 10px rgba(16, 185, 129, 0.5)",
                          "0 0 20px rgba(16, 185, 129, 0.8)",
                          "0 0 10px rgba(16, 185, 129, 0.5)"
                        ]
                      }}
                      transition={{
                        duration: 1,
                        delay: 0.5,
                        y: {
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        },
                        textShadow: {
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }
                      }}
                      whileHover={{
                        scale: 1.1,
                        rotate: [0, 2, -2, 0],
                        transition: { duration: 0.3 }
                      }}
                      style={{
                        color: '#059669',
                        fontWeight: '900',
                        textShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
                      }}
                    >
                      wave

                      {/* Wave particle */}
                      <motion.div
                        className="absolute top-0 left-0 w-1.5 h-1.5 rounded-full"
                        animate={{
                          opacity: [0, 1, 0],
                          x: [0, 40, 80],
                          y: [0, -5, 0, 5, 0],
                          backgroundColor: ['#10b981', '#34d399', '#10b981']
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: 1
                        }}
                        style={{
                          backgroundColor: '#10b981',
                          boxShadow: '0 0 8px #10b981'
                        }}
                      />
                    </motion.span>
                  </h1>

                  {/* Glowing underline effect */}
                  <motion.div
                    className="absolute -bottom-1 left-0 h-1 rounded-full"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{
                      width: '100%',
                      opacity: 1,
                      boxShadow: [
                        '0 0 10px rgba(16, 185, 129, 0.5)',
                        '0 0 20px rgba(59, 130, 246, 0.8)',
                        '0 0 10px rgba(16, 185, 129, 0.5)'
                      ]
                    }}
                    transition={{
                      duration: 1.5,
                      delay: 1.2,
                      boxShadow: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                    style={{
                      background: 'linear-gradient(90deg, #3b82f6, #10b981, #3b82f6)',
                      boxShadow: '0 0 15px rgba(16, 185, 129, 0.6)'
                    }}
                  />
                </div>

                {/* Official Logo - Small like profile */}
                <div
                  className="rounded-full overflow-hidden border-2 border-white/20 relative"
                  style={{
                    background: '#f0f0f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    width: '32px',
                    height: '32px'
                  }}
                >
                  <img
                    src="/favicon.png"
                    alt="Brainwave Logo"
                    className="w-full h-full object-cover"
                    style={{ objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div
                    className="w-full h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold"
                    style={{
                      display: 'none',
                      fontSize: '12px'
                    }}
                  >
                    🧠
                  </div>
                </div>

                {/* Modern Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-gray-900/5 to-blue-500/5 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700 -z-10 scale-110"></div>
              </motion.div>
            </div>

            {/* Right Section - Contact Us + Notifications + User Profile */}
            <div className="flex items-center justify-end space-x-2 sm:space-x-3">
              {/* Contact Us Button */}
              <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
                <button onClick={() => scrollToSection(contactUsRef)} className="nav-item text-sm md:text-base">Contact Us</button>
              </div>

              {/* Notification Bell */}
              {user && !user?.isAdmin && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <NotificationBell />
                </motion.div>
              )}

              {/* User Profile Section */}
              {user && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex items-center space-x-2 group"
                >
                  {/* Profile Picture with Online Status */}
                  <ProfilePicture
                    user={user}
                    size="sm"
                    showOnlineStatus={true}
                    style={{
                      width: '32px',
                      height: '32px'
                    }}
                  />

                  {/* User Name and Class */}
                  <div className="hidden sm:block text-right">
                    <div className="text-xs md:text-sm font-medium text-gray-700 group-hover:text-green-600 transition-colors duration-300">
                      {user?.name || 'User'}
                    </div>
                    <div className="text-xs text-gray-500 group-hover:text-green-500 transition-colors duration-300">
                      {user?.level === 'primary' ? `Class ${user?.class}` : user?.class}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* PROFESSIONAL HERO SECTION */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233b82f6' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-center">


            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-7 text-center lg:text-left order-2 lg:order-1"
            >
              {/* Premium Animated Study Smarter Text */}
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 1.2,
                  delay: 0.2,
                  type: "spring",
                  stiffness: 100,
                  damping: 15
                }}
                className="relative mb-2 sm:mb-3 md:mb-4"
              >
                {/* Premium Background Effects */}
                <motion.div
                  className="absolute inset-0 -m-8 rounded-3xl"
                  animate={{
                    background: [
                      'radial-gradient(ellipse 120% 80% at 50% 50%, rgba(59, 130, 246, 0.03), rgba(16, 185, 129, 0.02), transparent)',
                      'radial-gradient(ellipse 120% 80% at 60% 40%, rgba(139, 92, 246, 0.04), rgba(59, 130, 246, 0.03), transparent)',
                      'radial-gradient(ellipse 120% 80% at 40% 60%, rgba(16, 185, 129, 0.03), rgba(139, 92, 246, 0.02), transparent)',
                      'radial-gradient(ellipse 120% 80% at 50% 50%, rgba(59, 130, 246, 0.03), rgba(16, 185, 129, 0.02), transparent)'
                    ]
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />

                {/* Floating Particles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    style={{
                      background: i % 2 === 0 ? '#3b82f6' : '#10b981',
                      left: `${20 + i * 15}%`,
                      top: `${10 + i * 10}%`
                    }}
                    animate={{
                      y: [0, -20, 0],
                      x: [0, 10, -10, 0],
                      opacity: [0.3, 1, 0.3],
                      scale: [0.5, 1.2, 0.5]
                    }}
                    transition={{
                      duration: 4 + i * 0.5,
                      repeat: Infinity,
                      delay: i * 0.8,
                      ease: "easeInOut"
                    }}
                  />
                ))}

                <motion.h1
                  className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-center lg:text-left relative px-2 sm:px-4 md:px-6 lg:px-0"
                  style={{
                    fontFamily: "'Inter', 'SF Pro Display', 'Helvetica Neue', sans-serif",
                    letterSpacing: '-0.02em',
                    lineHeight: '1.1'
                  }}
                >
                  {/* Study - with premium effects */}
                  <motion.span
                    className="relative inline-block mr-4"
                    initial={{ opacity: 0, x: -80, scale: 0.7, rotateY: -45 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      scale: 1,
                      rotateY: 0,
                      textShadow: [
                        "0 0 30px rgba(59, 130, 246, 0.6)",
                        "0 0 60px rgba(59, 130, 246, 0.9)",
                        "0 0 30px rgba(59, 130, 246, 0.6)"
                      ]
                    }}
                    transition={{
                      duration: 1.8,
                      delay: 0.4,
                      type: "spring",
                      stiffness: 80,
                      damping: 12,
                      textShadow: {
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                    whileHover={{
                      scale: 1.15,
                      rotate: [0, -2, 2, 0],
                      y: [-5, 0],
                      transition: {
                        duration: 0.6,
                        type: "spring",
                        stiffness: 300
                      }
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontWeight: '900',
                      textShadow: '0 0 30px rgba(59, 130, 246, 0.6)',
                      filter: 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.3))'
                    }}
                  >
                    Study

                    {/* Premium floating elements around Study */}
                    <motion.div
                      className="absolute -top-3 -right-3 w-4 h-4 rounded-full"
                      animate={{
                        scale: [0.6, 1.4, 0.6],
                        opacity: [0.4, 1, 0.4],
                        rotate: [0, 360],
                        background: [
                          'linear-gradient(45deg, #3b82f6, #1d4ed8)',
                          'linear-gradient(45deg, #8b5cf6, #7c3aed)',
                          'linear-gradient(45deg, #3b82f6, #1d4ed8)'
                        ]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: 1,
                        ease: "easeInOut"
                      }}
                      style={{
                        background: 'linear-gradient(45deg, #3b82f6, #1d4ed8)',
                        boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)'
                      }}
                    />

                    <motion.div
                      className="absolute -bottom-2 -left-2 w-3 h-3 rounded-full"
                      animate={{
                        scale: [0.8, 1.6, 0.8],
                        opacity: [0.5, 1, 0.5],
                        x: [0, 8, 0],
                        y: [0, -6, 0],
                        rotate: [0, -180, -360]
                      }}
                      transition={{
                        duration: 3.5,
                        repeat: Infinity,
                        delay: 0.7,
                        ease: "easeInOut"
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
                        boxShadow: '0 0 15px rgba(96, 165, 250, 0.9)'
                      }}
                    />

                    {/* Premium light streak effect */}
                    <motion.div
                      className="absolute inset-0 rounded-lg"
                      animate={{
                        background: [
                          'linear-gradient(90deg, transparent, rgba(255,255,255,0.0), transparent)',
                          'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                          'linear-gradient(90deg, transparent, rgba(255,255,255,0.0), transparent)'
                        ]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: 2,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.span>

                  {/* Smarter - with premium flowing effects */}
                  <motion.span
                    className="relative inline-block"
                    initial={{ opacity: 0, x: 80, scale: 0.7, rotateY: 45 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      scale: 1,
                      rotateY: 0,
                      y: [0, -4, 0, 4, 0],
                      textShadow: [
                        "0 0 30px rgba(16, 185, 129, 0.6)",
                        "0 0 60px rgba(16, 185, 129, 0.9)",
                        "0 0 30px rgba(16, 185, 129, 0.6)"
                      ]
                    }}
                    transition={{
                      duration: 1.8,
                      delay: 0.8,
                      type: "spring",
                      stiffness: 80,
                      damping: 12,
                      y: {
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      },
                      textShadow: {
                        duration: 4.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                    whileHover={{
                      scale: 1.15,
                      rotate: [0, 2, -2, 0],
                      y: [-8, 0],
                      transition: {
                        duration: 0.6,
                        type: "spring",
                        stiffness: 300
                      }
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #065f46 0%, #059669 30%, #10b981 60%, #34d399 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontWeight: '900',
                      textShadow: '0 0 30px rgba(16, 185, 129, 0.6)',
                      filter: 'drop-shadow(0 4px 8px rgba(16, 185, 129, 0.3))'
                    }}
                  >
                    Smarter

                    {/* Premium animated orbital line around Smarter */}
                    <motion.div
                      className="absolute top-0 left-0 w-3 h-3 rounded-full"
                      animate={{
                        opacity: [0, 1, 0.8, 1, 0],
                        x: [0, 120, 240, 360, 240, 120, 0],
                        y: [0, -15, 0, 15, 30, 15, 0],
                        scale: [0.5, 1.2, 0.8, 1.5, 0.5],
                        background: [
                          'linear-gradient(45deg, #10b981, #34d399)',
                          'linear-gradient(45deg, #34d399, #6ee7b7)',
                          'linear-gradient(45deg, #6ee7b7, #10b981)',
                          'linear-gradient(45deg, #10b981, #34d399)'
                        ]
                      }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        delay: 2.5,
                        ease: "easeInOut"
                      }}
                      style={{
                        background: 'linear-gradient(45deg, #10b981, #34d399)',
                        boxShadow: '0 0 20px rgba(16, 185, 129, 0.8)'
                      }}
                    />

                    {/* Premium trailing particles */}
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 rounded-full"
                        animate={{
                          opacity: [0, 0.8, 0],
                          x: [0, 80 + i * 20, 160 + i * 40, 240 + i * 20, 160 + i * 40, 80 + i * 20, 0],
                          y: [0, -8 - i * 2, 0, 8 + i * 2, 16 + i * 4, 8 + i * 2, 0],
                          scale: [0.3, 1, 0.6, 1.2, 0.3]
                        }}
                        transition={{
                          duration: 6,
                          repeat: Infinity,
                          delay: 3 + i * 0.3,
                          ease: "easeInOut"
                        }}
                        style={{
                          background: `linear-gradient(45deg, #34d399, #6ee7b7)`,
                          boxShadow: '0 0 10px rgba(52, 211, 153, 0.6)'
                        }}
                      />
                    ))}

                    {/* Premium light sweep effect */}
                    <motion.div
                      className="absolute inset-0 rounded-lg"
                      animate={{
                        background: [
                          'linear-gradient(90deg, transparent, rgba(255,255,255,0.0), transparent)',
                          'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                          'linear-gradient(90deg, transparent, rgba(255,255,255,0.0), transparent)'
                        ]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: 3.5,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.span>
                </motion.h1>

                {/* Glowing underline effect */}
                <motion.div
                  className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 h-2 rounded-full"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{
                    width: '80%',
                    opacity: 1,
                    boxShadow: [
                      '0 0 20px rgba(16, 185, 129, 0.5)',
                      '0 0 40px rgba(59, 130, 246, 0.8)',
                      '0 0 20px rgba(16, 185, 129, 0.5)'
                    ]
                  }}
                  transition={{
                    duration: 2,
                    delay: 1.5,
                    boxShadow: {
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                  style={{
                    background: 'linear-gradient(90deg, #3b82f6, #10b981, #8b5cf6, #3b82f6)',
                    boxShadow: '0 0 30px rgba(16, 185, 129, 0.6)'
                  }}
                >
                  {/* Moving light effect inside underline */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{
                      background: [
                        'linear-gradient(90deg, transparent, rgba(255,255,255,0.0), transparent)',
                        'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                        'linear-gradient(90deg, transparent, rgba(255,255,255,0.0), transparent)'
                      ],
                      x: ['-100%', '100%']
                    }}
                    transition={{
                      background: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      },
                      x: {
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 2
                      }
                    }}
                  />
                </motion.div>

                {/* Premium orbiting elements around the text */}
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute top-1/2 left-1/2 rounded-full"
                    style={{
                      width: `${16 + i * 4}px`,
                      height: `${16 + i * 4}px`,
                      background: i % 2 === 0
                        ? 'linear-gradient(45deg, #3b82f6, #8b5cf6)'
                        : 'linear-gradient(45deg, #10b981, #34d399)',
                      boxShadow: i % 2 === 0
                        ? '0 0 20px rgba(59, 130, 246, 0.8)'
                        : '0 0 20px rgba(16, 185, 129, 0.8)',
                      transform: 'translate(-50%, -50%)'
                    }}
                    animate={{
                      rotate: i % 2 === 0 ? 360 : -360,
                      x: [
                        0,
                        Math.cos((i * Math.PI) / 2) * (120 + i * 20),
                        0,
                        -Math.cos((i * Math.PI) / 2) * (120 + i * 20),
                        0
                      ],
                      y: [
                        0,
                        -Math.sin((i * Math.PI) / 2) * (60 + i * 15),
                        -(120 + i * 20),
                        -Math.sin((i * Math.PI) / 2) * (60 + i * 15),
                        0
                      ],
                      opacity: [0.4, 1, 0.6, 1, 0.4],
                      scale: [0.8, 1.2, 1, 1.3, 0.8]
                    }}
                    transition={{
                      duration: 10 + i * 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.5
                    }}
                  />
                ))}

                {/* Premium floating sparkles */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={`sparkle-${i}`}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      background: `linear-gradient(45deg, ${
                        ['#fbbf24', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#34d399', '#ef4444', '#f97316'][i]
                      }, #ffffff)`,
                      left: `${10 + i * 12}%`,
                      top: `${15 + (i % 3) * 25}%`,
                      boxShadow: `0 0 10px ${
                        ['#fbbf24', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#34d399', '#ef4444', '#f97316'][i]
                      }`
                    }}
                    animate={{
                      y: [0, -30, 0],
                      x: [0, Math.sin(i) * 20, 0],
                      opacity: [0, 1, 0],
                      scale: [0.3, 1, 0.3],
                      rotate: [0, 180, 360]
                    }}
                    transition={{
                      duration: 3 + i * 0.3,
                      repeat: Infinity,
                      delay: i * 0.4,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </motion.div>

              {/* Highlighted Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="relative inline-flex items-center px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-full text-xs xs:text-sm sm:text-sm font-bold mb-4 xs:mb-5 sm:mb-6 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
                  boxShadow: '0 8px 25px rgba(255, 215, 0, 0.4), 0 0 20px rgba(255, 215, 0, 0.3)',
                  border: '2px solid #FFD700'
                }}
              >
                {/* Animated background shimmer */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{
                    x: ['-100%', '100%']
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />

                <TbSchool className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 mr-1.5 xs:mr-2 text-orange-800 relative z-10" />
                <span className="text-orange-900 relative z-10 font-black">
                  #1 Educational Platform in Tanzania
                </span>

                {/* Glowing border effect */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(255, 215, 0, 0.5)',
                      '0 0 40px rgba(255, 215, 0, 0.8)',
                      '0 0 20px rgba(255, 215, 0, 0.5)'
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-full sm:max-w-2xl mx-auto lg:mx-0 px-2 sm:px-4 lg:px-0"
              >
                Discover limitless learning opportunities with our comprehensive
                online study platform. Study anywhere, anytime, and achieve your
                academic goals with confidence.
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="flex flex-col xs:flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5 items-center justify-center lg:justify-start w-full px-2 sm:px-4 lg:px-0"
              >
                {!user ? (
                  <React.Fragment>


                    {/* Register and Login Buttons - Super Responsive */}
                    <div className="flex flex-col xs:flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                      <Link to="/register" className="w-full sm:w-auto">
                        <motion.button
                          className="w-full sm:w-auto px-3 xs:px-4 sm:px-6 md:px-8 py-2.5 xs:py-3 sm:py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 min-h-[44px]"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <TbUserPlus className="w-3 h-3 xs:w-4 xs:h-4 sm:w-4 sm:h-4" />
                            <span className="text-xs xs:text-sm sm:text-sm">Register Now</span>
                          </div>
                        </motion.button>
                      </Link>

                      <Link to="/login" className="w-full sm:w-auto">
                        <motion.button
                          className="w-full sm:w-auto px-3 xs:px-4 sm:px-6 md:px-8 py-2.5 xs:py-3 sm:py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 min-h-[44px]"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <TbLogin className="w-3 h-3 xs:w-4 xs:h-4 sm:w-4 sm:h-4" />
                            <span className="text-xs xs:text-sm sm:text-sm">Login</span>
                          </div>
                        </motion.button>
                      </Link>
                    </div>
                  </React.Fragment>
                ) : (
                  <Link to="/user/hub" className="w-full sm:w-auto">
                    <motion.button
                      className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <TbArrowBigRightLinesFilled className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-sm sm:text-base">Go to Hub</span>
                      </div>
                    </motion.button>
                  </Link>
                )}
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="grid grid-cols-4 gap-1 sm:gap-2 md:gap-3 pt-3 sm:pt-4"
              >
                <div className="text-center">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">
                    <AnimatedCounter end="10K+" duration={3000} delay={500} />
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600">
                    <AnimatedCounter end="500+" duration={3500} delay={700} />
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Courses</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
                    <AnimatedCounter end="95%" duration={4000} delay={900} />
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600">
                    <AnimatedCounter end="50K+" duration={4500} delay={1100} />
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Study Materials</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Content - Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative mt-6 xs:mt-8 sm:mt-10 lg:mt-0 order-1 lg:order-2 px-3 sm:px-4 lg:px-0"
            >
              <div className="relative">
                {/* Main Image */}
                <div className="relative z-10 bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8">
                  <img
                    src={Image1}
                    alt="Students Learning"
                    className="w-full h-auto rounded-xl sm:rounded-2xl"
                    loading="lazy"
                  />
                </div>

                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-3 sm:-top-6 -right-3 sm:-right-6 bg-blue-500 text-white p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl shadow-lg z-20"
                >
                  <TbTrophy className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                </motion.div>

                <motion.div
                  animate={{ y: [10, -10, 10] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -bottom-3 sm:-bottom-6 -left-3 sm:-left-6 bg-green-500 text-white p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl shadow-lg z-20"
                >
                  <TbBook className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                </motion.div>

                <motion.div
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute top-1/2 -left-4 sm:-left-6 md:-left-8 bg-purple-500 text-white p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg z-20"
                >
                  <TbBrain className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </motion.div>

                {/* Background Decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl sm:rounded-3xl transform rotate-3 sm:rotate-6 scale-105"></div>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Stats Section - PART OF HERO SECTION */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl mx-3 sm:mx-4 md:mx-6 lg:mx-8 mt-6 sm:mt-8 md:mt-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8"
            >
            {[
              { number: "15K+", text: "Active Students", icon: TbUsers, color: "from-blue-500 to-blue-600" },
              { number: "500+", text: "Expert Teachers", icon: TbSchool, color: "from-green-500 to-green-600" },
              { number: "1000+", text: "Video Lessons", icon: TbBook, color: "from-purple-500 to-purple-600" },
              { number: "98%", text: "Success Rate", icon: TbTrophy, color: "from-orange-500 to-orange-600" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-center group border border-gray-100"
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 rounded-full bg-gradient-to-r ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">{stat.number}</div>
                <div className="text-xs sm:text-xs md:text-sm lg:text-base text-gray-600 font-medium">{stat.text}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
        </div>
      </section>
      {/* Reviews Section */}
      <section ref={reviewsSectionRef} className="bg-gray-50 py-8 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-6 sm:mb-8 md:mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Students Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Hear from thousands of students who have transformed their learning journey with BrainWave
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[
              {
                name: "Amina Hassan",
                class: "Form 4",
                rating: 5,
                text: "BrainWave helped me improve my grades significantly. The interactive quizzes and study materials are amazing!",
                avatar: "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
                bgColor: "from-pink-400 to-purple-500"
              },
              {
                name: "John Mwalimu",
                class: "Class 7",
                rating: 5,
                text: "I love the AI-powered questions and the ranking system. It makes learning competitive and fun!",
                avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
                bgColor: "from-blue-400 to-indigo-500"
              },
              {
                name: "Fatuma Said",
                class: "Form 2",
                rating: 5,
                text: "The platform is so easy to use and the content is exactly what we need for our exams. Highly recommended!",
                avatar: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
                bgColor: "from-green-400 to-teal-500"
              }
            ].map((review, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 group overflow-hidden"
              >
                {/* Premium Background Gradient */}
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${review.bgColor}`}></div>

                {/* Floating Quote Icon */}
                <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                  </svg>
                </div>
                {/* Premium Star Rating */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(review.rating)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, rotate: -180 }}
                        whileInView={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <TbStar className="w-5 h-5 text-yellow-500 drop-shadow-sm" style={{ fill: '#FFD700', color: '#FFD700' }} />
                      </motion.div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-400 font-medium">Verified Review</div>
                </div>
                {/* Premium Review Text */}
                <p className="text-gray-700 mb-6 leading-relaxed font-medium relative">
                  <span className="text-2xl text-blue-200 absolute -top-2 -left-1">"</span>
                  <span className="relative z-10">{review.text}</span>
                  <span className="text-2xl text-blue-200 absolute -bottom-4 -right-1">"</span>
                </p>
                {/* Premium Profile Section */}
                <div className="flex items-center">
                  <div className="relative mr-4">
                    {/* Profile Picture with Premium Border */}
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-r ${review.bgColor} p-0.5`}>
                      <img
                        src={review.avatar}
                        alt={review.name}
                        className="w-full h-full rounded-full object-cover border-2 border-white"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      {/* Fallback initials */}
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center absolute top-0 left-0" style={{display: 'none'}}>
                        <span className="text-gray-600 font-semibold text-sm">
                          {review.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    </div>

                    {/* Online Status Indicator */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-gray-900 text-lg">{review.name}</h4>
                      {/* Verified Badge */}
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm font-medium text-gray-600">{review.class}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">Verified Student</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* Contact Section */}
      <section ref={contactUsRef} className="bg-white py-8 sm:py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-6 sm:mb-8 md:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get in Touch
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Have questions? We'd love to hear from you. Send us a message through the form below or contact us directly via WhatsApp at <strong>+255 655 285 549</strong>.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us how we can help you..."
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>

                {/* Call Now Button */}
                <motion.a
                  href="tel:+255765528549"
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                  <span>📞 Call Now</span>
                </motion.a>

                {/* WhatsApp Text Button */}
                <motion.a
                  href="https://wa.me/255765528549?text=Hello%20BrainWave%20Team!%20I%20need%20help%20with%20the%20educational%20platform.%20Can%20you%20assist%20me?"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  <span>💬 WhatsApp</span>
                </motion.a>
              </div>

              {responseMessage && (
                <div className={`p-4 rounded-lg ${responseMessage.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {responseMessage}
                </div>
              )}
            </form>
          </motion.div>
        </div>
      </section>

      {/* Professional Copyright Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          {/* Company Info */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <span className="text-2xl font-bold text-white">BRAIN</span>
              <span className="text-2xl font-bold text-green-400">WAVE</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-2xl mx-auto">
              Tanzania's premier educational platform empowering students to achieve academic excellence through innovative learning solutions.
            </p>
          </div>

          {/* Copyright Bar */}
          <div className="border-t border-gray-700 pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">© 2022</span>
                  <span className="text-lg font-bold text-white">Brainwave.zone</span>
                </div>
                <span className="text-sm text-blue-400 font-medium">Study Smarter</span>
                <span className="text-sm text-gray-400">Kigamboni - Dar es Salaam, Tanzania</span>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <span>Privacy Policy</span>
                <span>Terms of Service</span>
                <span>Support</span>
              </div>
            </div>

            <div className="mt-4 text-center text-xs text-gray-500">
              Empowering Tanzanian students since 2022 • All rights reserved
            </div>
          </div>
        </div>
      </footer>



      {/* Floating WhatsApp Button - Blue & White */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <motion.a
          href="https://wa.me/255655285549?text=Hello! I'm interested in BrainWave educational platform. Can you help me get started?"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-white"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* WhatsApp Icon */}
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
          </svg>

          {/* Pulse Animation - Blue */}
          <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></div>

          {/* Tooltip */}
          <div className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Chat with us on WhatsApp
            <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        </motion.a>
      </motion.div>
    </div>
  );
};

export default Home;
