import React, { useState, useEffect, useRef } from "react";
import "./index.css";
import { Link } from "react-router-dom";
import { TbArrowBigRightLinesFilled } from "react-icons/tb";
import { AiOutlinePlus } from "react-icons/ai";
import { message, Rate } from "antd";
import { useDispatch } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { getAllReviews } from "../../../apicalls/reviews";
import Image1 from "../../../assets/collage-1.png";
import Image2 from "../../../assets/collage-2.png";
import { contactUs } from "../../../apicalls/users";

const Home = () => {
  const homeSectionRef = useRef(null);
  const aboutUsSectionRef = useRef(null);
  const reviewsSectionRef = useRef(null);
  const contactUsRef = useRef(null);
  const [reviews, setReviews] = useState([]); // Initialize as an array
  const dispatch = useDispatch();
  const [menuOpen, setMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");

  const getReviews = async () => {
    dispatch(ShowLoading());
    try {
      const response = await getAllReviews();
      if (response.success) {
        setReviews(response.data);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    }
    dispatch(HideLoading());
  };

  useEffect(() => {
    getReviews();
  }, []);

  const scrollToSection = (ref, offset = 30) => {
    if (ref && ref.current) {
      const sectionTop = ref.current.offsetTop;
      window.scrollTo({
        top: sectionTop - offset,
        behavior: "smooth"
      });
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
      // Assume contactUs returns the parsed JSON response
      const data = await contactUs(formData);

      if (data.success) {
        message.success("Message sent successfully!");
        setResponseMessage("Message sent successfully!");
        setFormData({ name: "", email: "", message: "" }); // Reset form
      } else {
        setResponseMessage(data.message || "Something went wrong.");
      }
    } catch (error) {
      setResponseMessage("Error sending message. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="Home">
      <nav className="nav">
        <div className="nav-body">
          <Link to="/" className="title">
            <div>
              <span className="colored-title">Brain</span>Wave
            </div>
          </Link>

          {/* Hamburger Icon */}
          <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            ☰
          </div>

          {/* Navigation Links */}
          <div className={`nav-links ${menuOpen ? "open" : ""}`}>
            <div
              onClick={() => {
                scrollToSection(homeSectionRef);
                setMenuOpen(false);
              }}
              className="link"
            >
              Home
            </div>
            <div
              onClick={() => {
                scrollToSection(aboutUsSectionRef);
                setMenuOpen(false);
              }}
              className="link"
            >
              About Us
            </div>
            <div
              onClick={() => {
                scrollToSection(reviewsSectionRef);
                setMenuOpen(false);
              }}
              className="link"
            >
              Reviews
            </div>
            <div
              onClick={() => {
                scrollToSection(contactUsRef);
                setMenuOpen(false);
              }}
              className="link"
            >
              Contact Us
            </div>
          </div>
        </div>
      </nav>
      <section ref={homeSectionRef} className="section-1">
        <div className="content-1">
          <div className="title">
            Fueling Bright Futures with <br />
            <span className="colored-title">
              <TbArrowBigRightLinesFilled />
              Education.
            </span>
          </div>
          <p className="para">
            Solutions and flexible online study, you can study anywhere through
            this platform.
          </p>
          <div className="btns-container">
            <Link to="/login" className="btn btn-1">
              Login
            </Link>
            <Link to="/register" className="btn btn-2">
              Sign up
            </Link>
          </div>
        </div>
        <div className="content-2">
          <img src={Image1} alt="Collage-1" className="collage" />
        </div>
      </section>
      <section className="section-2">
        <div className="flex-col">
          <div className="number">7K+</div>
          <div className="text">Success Stories</div>
        </div>
        <div className="flex-col">
          <AiOutlinePlus className="plus-icon" />
        </div>
        <div className="flex-col">
          <div className="number">300+</div>
          <div className="text">Expert Mentors</div>
        </div>
        <div className="flex-col">
          <AiOutlinePlus className="plus-icon" />
        </div>
        <div className="flex-col">
          <div className="number">15K+</div>
          <div className="text">Students Joined</div>
        </div>
        <div className="flex-col">
          <AiOutlinePlus className="plus-icon" />
        </div>
        <div className="flex-col">
          <div className="number">250+</div>
          <div className="text">Trendy Courses</div>
        </div>
      </section>
      <section ref={aboutUsSectionRef} className="section-3">
        <div className="content-1">
          <div className="title">Discover knowledge in limitless realms.</div>
          <p className="para">
            Education serves as the cornerstone of personal and societal
            development. It is a dynamic process that empowers individuals with
            the knowledge, skills, and critical thinking abilities essential for
            success.
          </p>
          <div className="btn-container">
            <Link to="/user/about-us" className="btn btn-1">
              Learn More
            </Link>
          </div>
        </div>
        <div className="content-2">
          <img src={Image2} alt="Collage-1" className="collage" />
        </div>
      </section>
      <section ref={reviewsSectionRef} className="section-4">
        <div className="content-1">
          <div className="title">
            Reviews from <br />
            some students
          </div>
        </div>
        <div className="content-2">
          {reviews.length !== 0 ? (
            reviews.map((review, index) => (
              <div key={index} className="review-card">
                <Rate defaultValue={review.rating} className="rate" disabled />
                <div className="text">"{review.text}"</div>
                <div className="seperator"></div>
                <div className="name">{review.user?.name}</div>
              </div>
            ))
          ) : (
            <div>No reviews yet.</div>
          )}
        </div>
      </section>

      <section ref={contactUsRef} className="contact-section section-4">
        <div className="content-1">
          <div className="title">Contact Us</div>
        </div>
        <div className="contact-container" style={{ marginTop: "40px" }}>
          <div className="contact-box">
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="contact-field">
                <label className="contact-label">Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  className="contact-input"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="contact-field">
                <label className="contact-label">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Your Email"
                  className="contact-input"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="contact-field">
                <label className="contact-label">Message</label>
                <textarea
                  name="message"
                  placeholder="Your Message"
                  className="contact-textarea"
                  style={{ width: "93.5%", padding: "10px" }}
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                className="contact-submit"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
              {responseMessage && (
                <p className="response-message">{responseMessage}</p>
              )}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
