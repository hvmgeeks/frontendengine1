import React, { useEffect, useState } from "react";
import './index.css'
import { getAllReportsForRanking } from "../../../apicalls/reports";
import { getUserInfo } from "../../../apicalls/users";
import { message } from "antd";
import PageTitle from "../../../components/PageTitle";
import { useDispatch } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";


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
            dispatch(HideLoading());
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
                    fetchReports();
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
        <div>
            {!isAdmin &&
                <>
                    <PageTitle title="Ranking" />
                    <div className="divider"></div>
                    {rankingData ?
                        <>
                            <div className="ranking-table-container">
                                <table className="ranking-table">
                                    <thead className="head">
                                        <tr className="head-row">
                                            <th>Position</th>
                                            <th>Name</th>
                                            <th>School</th>
                                            <th>Score</th>
                                        </tr>
                                    </thead>
                                    <tbody className="body">
                                        {rankingData.map((user, index) => (
                                            <tr key={index} className={`body-row ${user.userId === userData._id ? 'highlight-row' : 'no-highlight'}`}>
                                                <td>#{index + 1}</td>
                                                <td>{user.userName}</td>
                                                <td>{user.userSchool ? user.userSchool : 'Not Enrolled'}</td>
                                                <td>{user.score}</td>
                                            </tr>
                                        ))
                                        }
                                        {userRanking && userRanking.length > 0 ?
                                            <tr className={`fixed-row`}>
                                                <td>#{userRanking[0].ranking}</td>
                                                <td>{userRanking[0].user.userName}</td>
                                                <td>{userRanking[0].user.userSchool ? userRanking[0].user.userSchool : 'Not Enrolled'}</td>
                                                <td>{userRanking[0].user.score}</td>
                                            </tr>
                                            :
                                            <tr className={`fixed-row`}>
                                                <td>Unranked</td>
                                                <td>{userData.name}</td>
                                                <td>{userData.school ? userData.school : 'Not Enrolled'}</td>
                                                <td>0</td>
                                            </tr>

                                        }
                                    </tbody>
                                </table>
                            </div>
                            <div>
                                <table className="ranking-table">

                                    <tbody className="body">

                                    </tbody>
                                </table>
                            </div>
                        </>
                        :
                        <div>No Ranking yet.</div>
                    }
                </>
            }
        </div>
    );
}

export default Ranking;