import React, { useEffect, useState } from "react";
import './index.css'
import { getUserInfo } from "../../../apicalls/users";
import { message, Rate } from "antd";
import PageTitle from "../../../components/PageTitle";
import { useDispatch } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { addReview, getAllReviews } from "../../../apicalls/reviews";
import image from '../../../assets/person.png';

const AboutUs = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [userData, setUserData] = useState('');
    const [userRating, setUserRating] = useState('');
    const [userText, setUserText] = useState('');
    const [reviews, setReviews] = useState('');
    const dispatch = useDispatch();

    const getReviews = async () => {
        try {
            const response = await getAllReviews();
            if (response.success) {
                setReviews(response.data.reverse());
            } else {
                message.error(response.message);
            }
        } catch (error) {
            message.error(error.message);
        }
    }

    const getUserData = async () => {
        try {
            const response = await getUserInfo();
            if (response.success) {
                if (response.data.isAdmin) {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                    setUserData(response.data);
                    await getReviews();
                }
            } else {
                message.error(response.message);
            }
        } catch (error) {
            message.error(error.message);
        }
        dispatch(HideLoading());
    };

    useEffect(() => {
        if (localStorage.getItem("token")) {
            dispatch(ShowLoading());
            getUserData();
        }
    }, []);

    const handleRatingChange = (value) => {
        setUserRating(value);
    };

    const handleSubmit = async () => {
        if (userRating === '' || userRating === 0 || userText === '') {
            return;
        }
        try {
            const data = {
                rating: userRating,
                text: userText
            }
            const response = await addReview(data);
            if (response.success) {
                message.success(response.message);
                getReviews();
            } else {
                message.error(response.message);
            }
            dispatch(HideLoading());
        } catch (error) {
            message.error(error.message);
        }
    };

    const isUserInReviews = () => {
        if (reviews) {
            const userInReviews = reviews.find(review => review.user._id === userData._id);
            return !!userInReviews;
        }
        return false;
    };

    return (
        <div className="AboutUs">
            {!isAdmin &&
                <>
                    <PageTitle title="About Us" />
                    <div className="divider"></div>
                    <p className="info-para">
                        Welcome to our web application! Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
                        quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                        Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                        Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p>
                    {!isUserInReviews() &&
                        <>
                            <h1>Feedback</h1>
                            <p>
                                We strive to provide an exceptional user experience and value your feedback.<br />
                                Please take a moment to rate our web app:
                            </p>
                            <div><b>Rate Your Experience:</b></div>
                            <div className="rating">
                                <div>
                                    <Rate defaultValue={0} onChange={handleRatingChange} />
                                    <br />
                                    <textarea
                                        className="rating-text"
                                        placeholder="Share your thoughts..."
                                        rows={4}
                                        value={userText}
                                        onChange={(e) => setUserText(e.target.value)}
                                    />
                                </div>
                                <button onClick={handleSubmit}>Submit</button>
                            </div>
                        </>
                    }
                    <h1>Previous Reviews</h1>
                    {reviews ?
                        <div className="p-ratings">
                            {reviews.map((review, index) => (
                                <div key={index} className="p-rating-div">
                                    <div className="profile-row">
                                        <img className="profile" src={review.user.profileImage ? review.user.profileImage : image} alt="profile" onError={(e) => { e.target.src = image }} />
                                        <p>{review.user.name}</p>
                                    </div>
                                    <Rate defaultValue={review.rating} className="rate" disabled={true} />
                                    <br />
                                    <div className="text">{review.text}</div>
                                </div>
                            ))
                            }
                        </div>
                        :
                        <div>
                            No reviews yet.
                        </div>
                    }
                </>
            }
        </div>
    );
}

export default AboutUs;