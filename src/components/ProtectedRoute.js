import { message } from "antd";
import React, { useEffect, useState, useRef } from "react";
import Flag from "../assets/tanzania-flag.png";
import { getUserInfo } from "../apicalls/users";
import { useDispatch, useSelector } from "react-redux";
import { SetUser } from "../redux/usersSlice.js";
import { useNavigate, useLocation } from "react-router-dom";
import { HideLoading, ShowLoading } from "../redux/loaderSlice";
import { checkPaymentStatus } from "../apicalls/payment.js";
import "./ProtectedRoute.css";
import { SetSubscription } from "../redux/subscriptionSlice.js";
import { setPaymentVerificationNeeded } from "../redux/paymentSlice.js";

function ProtectedRoute({ children }) {
  const { user } = useSelector((state) => state.user);
  const [menu, setMenu] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPaymentPending, setIsPaymentPending] = useState(false);
  const intervalRef = useRef(null);
  const { subscriptionData } = useSelector((state) => state.subscription);
  const { paymentVerificationNeeded } = useSelector((state) => state.payment);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const activeRoute = location.pathname;

  const userMenu = [
    {
      title: "Quiz",
      paths: ["/user/quiz", "/user/write-exam"],
      icon: <i className="ri-pencil-line"></i>,
      onClick: () => navigate("/user/quiz"),
    },

    {
      title: "Reports",
      paths: ["/user/reports"],
      icon: <i className="ri-bar-chart-line"></i>,
      onClick: () => navigate("/user/reports"),
    },
    {
      title: "Ranking",
      paths: ["/user/ranking"],
      icon: <i className="ri-trophy-line"></i>,
      onClick: () => navigate("/user/ranking"),
    },
    {
      title: "Study Material",
      paths: ["/user/study-material"],
      icon: <i className="ri-book-open-line"></i>,
      onClick: () => navigate("/user/study-material"),
    },
    {
      title: "About Us",
      paths: ["/user/about-us"],
      icon: <i className="ri-information-line"></i>,
      onClick: () => navigate("/user/about-us"),
    },
    {
      title: "Ask AI",
      paths: ["/user/chat"],
      icon: <i className="ri-chat-smile-2-line"></i>,
      onClick: () => navigate("/user/chat"),
    },
    {
      title: "Plans",
      paths: ["/user/plans"],
      icon: <i className="ri-calendar-check-line"></i>,
      onClick: () => navigate("/user/plans"),
    },
    {
      title: "Forum",
      paths: ["/forum"],
      icon: <i className="ri-discuss-line"></i>,
      onClick: () => navigate("/forum"),
    },
    {
      title: "Profile",
      paths: ["/profile"],
      icon: <i className="ri-user-line"></i>,
      onClick: () => navigate("/profile"),
    },
    {
      title: "Logout",
      paths: ["/logout"],
      icon: <i className="ri-logout-box-line"></i>,
      onClick: () => {
        localStorage.removeItem("token");
        navigate("/login");
      },
    },
  ];

  const adminMenu = [
    {
      title: "Users",
      paths: ["/admin/users", "/admin/users/add"],
      icon: <i className="ri-file-list-line"></i>,
      onClick: () => navigate("/admin/users"),
    },
    {
      title: "Exams",
      paths: ["/admin/exams", "/admin/exams/add"],
      icon: <i className="ri-file-list-line"></i>,
      onClick: () => navigate("/admin/exams"),
    },
    {
      title: "Reports",
      paths: ["/admin/reports"],
      icon: <i className="ri-bar-chart-line"></i>,
      onClick: () => navigate("/admin/reports"),
    },
    {
      title: "Forum",
      paths: ["/forum"],
      icon: <i className="ri-discuss-line"></i>,
      onClick: () => navigate("/forum"),
    },
    {
      title: "Profile",
      paths: ["/profile"],
      icon: <i className="ri-user-line"></i>,
      onClick: () => navigate("/profile"),
    },
    {
      title: "Logout",
      paths: ["/logout"],
      icon: <i className="ri-logout-box-line"></i>,
      onClick: () => {
        localStorage.removeItem("token");
        navigate("/login");
      },
    },
  ];

  const getUserData = async () => {
    try {
      const response = await getUserInfo();
      if (response.success) {
        dispatch(SetUser(response.data));
        if (response.data.isAdmin) {
          setMenu(adminMenu);
        } else {
          setMenu(userMenu);
        }
      } else {
        message.error(response.message);
        navigate("/login");
      }
    } catch (error) {
      navigate("/login");
      message.error(error.message);
    }
  };

  useEffect(() => {
    // Function to handle resizing
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setCollapsed(window.innerWidth < 768);
    };

    // Add resize event listener
    window.addEventListener("resize", handleResize);

    if (window.innerWidth < 768) {
      setIsMobile(true);
      setCollapsed(true);
    }

    // Check for token and navigate
    if (localStorage.getItem("token")) {
      getUserData();
    } else {
      navigate("/login");
    }

    // Cleanup the event listener when the component is unmounted
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const getIsActiveOrNot = (paths) => {
    if (paths.includes(activeRoute)) {
      return true;
    } else {
      if (
        activeRoute.includes("/admin/exams/edit") &&
        paths.includes("/admin/exams")
      ) {
        return true;
      }
      if (
        activeRoute.includes("/user/write-exam") &&
        paths.includes("/user/write-exam")
      ) {
        return true;
      }
    }
    return false;
  };

  useEffect(() => {
    if (isPaymentPending && !['/plans', '/profile'].includes(activeRoute)) {
      navigate('/user/plans');
    }
  }, [isPaymentPending, activeRoute, navigate]);

  const verifyPaymentStatus = async () => {
    try {
      const data = await checkPaymentStatus();
      console.log("Payment Status:", data);
      if (data?.error || data?.paymentStatus !== 'paid') {
        if (subscriptionData !== null) {
          dispatch(SetSubscription(null));
        }
        setIsPaymentPending(true);
      }
      else {
        setIsPaymentPending(false);
        dispatch(SetSubscription(data));
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    } catch (error) {
      console.log("Error checking payment status:", error);
      dispatch(SetSubscription(null));
      setIsPaymentPending(true);
    }
  };

  useEffect(() => {
    if (user?.paymentRequired && !user?.isAdmin) {
      console.log("Effect Runing 2222222...");

      if (paymentVerificationNeeded) {
        console.log('Inside timer in effect 2....');
        intervalRef.current = setInterval(() => {
          console.log('Timer in action...');
          verifyPaymentStatus();
        }, 15000);
        dispatch(setPaymentVerificationNeeded(false));
      }
    }
  }, [paymentVerificationNeeded]);

  useEffect(() => {
    if (user?.paymentRequired && !user?.isAdmin) {
      console.log("Effect Runing...");
      verifyPaymentStatus();
    }
  }, [user, activeRoute]);


  const getButtonClass = (title) => {
    // Exclude "Plans" and "Profile" buttons from the "button-disabled" class
    if (!user.paymentRequired || title === "Plans" || title === "Profile" || title === "Logout") {
      return ""; // No class applied
    }

    return subscriptionData?.paymentStatus !== "paid" && user?.paymentRequired
      ? "button-disabled"
      : "";
  };


  return (
    <div className="layout flex gap-1 h-100">
      <div className={`sidebar ${isMobile ? "mobile-sidebar" : ""}`}>
        <div className="menu">
          {menu.map((item, index) => {
            return (
              <div
                className={`menu-item ${getIsActiveOrNot(item.paths) ? "active-menu-item" : ""
                  }
                  ${getButtonClass(item.title)}
                  `}
                key={index}
                onClick={item.onClick}
              >
                {item.icon}
                {!collapsed && <span>{item.title}</span>}
              </div>
            );
          })}
        </div>
      </div>
      <div
        className={`body flex flex-col h-screen ${collapsed
          ? isMobile
            ? "mobile-collapsed-body"
            : "collapsed-body"
          : "no-collapse-body"
          }`}
      >
        <div className="header flex justify-between">
          {!collapsed && (
            <i
              className="ri-close-line"
              onClick={() => setCollapsed(true)}
            ></i>
          )}
          {collapsed && !isMobile && (
            <i
              className="ri-menu-line"
              onClick={() => setCollapsed(false)}
            ></i>
          )}
          <div className="flex items-center gap-1">
            <div
              className={`text-white ${isMobile ? "text-xs" : "text-2xl"}`}
            >
              BRAINWAVE
            </div>
            <img
              src={Flag}
              alt="tanzania-flag"
              style={{ width: "30px", height: "30px" }}
            />
          </div>
          <div>
            <div className="flex gap-1 items-center">
              <h1
                className={`text-white ${isMobile ? "text-xs" : "text-md"}`}
              >
                {user?.name}
              </h1>
            </div>
            {!isMobile && (
              <span>Role : {user?.isAdmin ? "Admin" : "User"}</span>
            )}
          </div>
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

export default ProtectedRoute;
