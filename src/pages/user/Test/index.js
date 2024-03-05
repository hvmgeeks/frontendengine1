import React, { useEffect, useState, Suspense } from "react";
import './index.css'
import { getUserInfo } from "../../../apicalls/users";

import { message } from "antd";
const Test = () => {
    const [userData, setUserData] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);


    useEffect(() => {
        const getUserData = async () => {
            try {
                const response = await getUserInfo();
                if (response.success) {
                    if (response.data.isAdmin) {
                        setIsAdmin(true);
                    } else {
                        setIsAdmin(false);
                        setUserData(response.data);
                    }
                } else {
                    message.error(response.message);
                }
            } catch (error) {
                message.error(error.message);
            }
        };
        if (localStorage.getItem("token")) {
            getUserData();
        }
    }, []);

    return (
        // <Suspense fallback={<div>Loading...</div>}>
        <div className="">
            <div>{userData.name}</div>
            <div>{userData.school}</div>
            <div>{userData.class}</div>
        </div>
        // </Suspense>
    );
}

export default Test;