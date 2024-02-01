import React from "react";
import './index.css';
import { Link } from "react-router-dom";
import { TbArrowBigRightLinesFilled } from "react-icons/tb";
import { AiOutlinePlus } from "react-icons/ai";
import Image1 from "../../../assets/collage-1.png";
import Image2 from "../../../assets/collage-2.png";

const Home = () => {
    return (
        <div className="Home">
            <section className="section-1">
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
                    <AiOutlinePlus className="plus-icon"/>
                </div>
                <div className="flex-col">
                    <div className="number">300+</div>
                    <div className="text">Expert Mentors</div>
                </div>
                <div className="flex-col">
                    <AiOutlinePlus className="plus-icon"/>
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
            <section className="section-3">
                <div className="content-1">
                    <div className="title">Discover knowledge in limitless realms.</div>
                    <p className="para">Education serve as the cornerstone of personal and societal development. It is a dynamic process that empowers individuals with knowledge, skills, and critical thinking abilities essential.</p>
                    <div className="btn-container">
                        <Link className="btn btn-1">Learn More</Link>
                    </div>
                </div>
                <div className="content-2">
                    <img src={Image2} alt="Collage-1" className="collage" />
                </div>
            </section>
        </div>
    )
};

export default Home;