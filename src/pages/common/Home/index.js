import React, { useState, useEffect, useRef } from "react";
import './index.css';
import { Link } from "react-router-dom";
import { TbArrowBigRightLinesFilled } from "react-icons/tb";
import { AiOutlinePlus } from "react-icons/ai";
import { message, Rate } from "antd";
import { useDispatch } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { getAllReviews } from "../../../apicalls/reviews";
import Image1 from "../../../assets/collage-1.png";
import Image2 from "../../../assets/collage-2.png";

const Home = () => {
    const homeSectionRef = useRef(null);
    const aboutUsSectionRef = useRef(null);
    const reviewsSectionRef = useRef(null);
    const [reviews, setReviews] = useState('');
    const dispatch = useDispatch();

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
    }

    useEffect(() => {
        getReviews();
    }, []);

    const scrollToSection = (ref) => {
        if (ref && ref.current) {
            ref.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="Home">
            <nav className="nav">
                <div className="nav-body">
                    <Link to='/' className="title"><div><span className="colored-title">Pluto</span>nium</div></Link>
                    <div className="nav-links">
                        <div onClick={() => scrollToSection(homeSectionRef)} className="link">Home</div>
                        <div onClick={() => scrollToSection(aboutUsSectionRef)} className="link">About Us</div>
                        <div onClick={() => scrollToSection(reviewsSectionRef)} className="link">Reviews</div>
                    </div>
                </div>
            </nav>
            <section ref={homeSectionRef} className="section-1">
                <div className="content-1">
                    <div className="title">Fueling Bright Futures with <br /><span className="colored-title"><TbArrowBigRightLinesFilled />Education.</span></div>
                    <p className="para">Solutions and flexible online study, you can study anywhere through this platform.</p>
                    <div className="btns-container">
                        <Link to='/login' className="btn btn-1">Login</Link>
                        <Link to='/register' className="btn btn-2">Sign up</Link>
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
                    <p className="para">Education serve as the cornerstone of personal and societal development. It is a dynamic process that empowers individuals with knowledge, skills, and critical thinking abilities essential.</p>
                    <div className="btn-container">
                        <Link to='/user/about-us' className="btn btn-1">Learn More</Link>
                    </div>
                </div>
                <div className="content-2">
                    <img src={Image2} alt="Collage-1" className="collage" />
                </div>
            </section>
            <section ref={reviewsSectionRef} className="section-4">
                <div className="content-1">
                    <div className="title">Reviews from <br />some students</div>
                </div>
                <div className="content-2">
                    {reviews.length !== 0 ?
                        reviews.map((review, index) => (
                            <div key={index} className="review-card">
                                <Rate defaultValue={review.rating} className="rate" disabled={true} />
                                <div className="text">"{review.text}"</div>
                                <div className="seperator"></div>
                                <div className="name">{review.user.name}</div>
                            </div>
                        ))
                        :
                        <div>No reviews yet.</div>
                    }
                </div>
            </section>
        </div>
    )
};

export default Home;