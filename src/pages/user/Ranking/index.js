import React, { useEffect, useState } from "react";
import './index.css'
import { getAllReportsForRanking } from "../../../apicalls/reports";
import { getUserInfo } from "../../../apicalls/users";
import { message } from "antd";
import PageTitle from "../../../components/PageTitle";
import { useDispatch } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import image from '../../../assets/person.png';
import { IoPersonCircleOutline } from "react-icons/io5";
import { FaTrophy } from "react-icons/fa6";

const Ranking = () => {
    const [rankingData, setRankingData] = useState('');
    const [userRanking, setUserRanking] = useState('');
    const [userData, setUserData] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const dispatch = useDispatch();

    const fetchReports = async () => {
        try {
            const response = await getAllReportsForRanking();
            if (response.success) {
                setRankingData(response.data);
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
                    await fetchReports();
                    dispatch(HideLoading());
                }
            } else {
                message.error(response.message);
            }
        } catch (error) {
            message.error(error.message);
        }
    };

    useEffect(() => {
        if (window.innerWidth < 700) {
            setIsMobile(true);
        }
        else {
            setIsMobile(false);
        }
        if (localStorage.getItem("token")) {
            dispatch(ShowLoading());
            getUserData();
        }
    }, []);

    const getUserStats = () => {
        const Ranking = rankingData
            .map((user, index) => ({
                user,
                ranking: index + 1,
            }))
            .filter((item) => item.user.userId.includes(userData._id));
        setUserRanking(Ranking);
    }

    useEffect(() => {
        if (rankingData) {
            getUserStats();
        }
    }, [rankingData]);

    // Helper function to format user ID for mobile devices
    const formatMobileUserId = (userId) => {
        const prefix = userId.slice(0, 4);
        const suffix = userId.slice(-4);
        return `${prefix}.....${suffix}`;
    };

    return (
        <div className="Ranking">
            {!isAdmin &&
                <>
                    <PageTitle title="Ranking" />
                    <div className="divider"></div>
                    {rankingData ?
                        <fieldset className="leaderboard">
                            <legend className="legend"><FaTrophy className="trophy" />LEADERBOARD</legend>
                            <div className="data">
                                {rankingData.map((user, index) => (
                                    <div key={index} className="row">
                                        <div className={`position ${(index === 0 || index === 1 || index === 2) ? 'medal' : 'number'}`}>{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}</div>
                                        <div>
                                            {user.userPhoto ?
                                                <img className="profile" src={user.userPhoto ? user.userPhoto : image} alt="profile" onError={(e) => { e.target.src = image }} />
                                                :
                                                <IoPersonCircleOutline className="profile-icon" />
                                            }
                                        </div>
                                        <div className="flex">
                                            <div className="name">{user.userName}</div>
                                            <div className="school">{user.userSchool ? user.userSchool : 'Not Enrolled'}</div>
                                            <div className="class">{user.userClass ? user.userClass : 'Not Enrolled'}</div>
                                            <div className="score">{user.score}</div>
                                        </div>
                                    </div>
                                ))
                                }

                            </div>
                        </fieldset>
                        :
                        <div>No Ranking yet.</div>
                    }
                </>
            }
        </div>
    );
}

export default Ranking;