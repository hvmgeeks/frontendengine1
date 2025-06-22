import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./announcement-modal.css";
import { getAnnouncements } from "../../apicalls/announcements";

const STORAGE_KEY = "announce_closed_date_v1";

function getTodayDateString() {
    const today = new Date();
    return today.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export default function AnnouncementModal() {
    const [open, setOpen] = useState(false);
    const [announcements, setAnnouncements] = useState([]);

    useEffect(() => {
        const lastClosedDate = localStorage.getItem(STORAGE_KEY);
        const today = getTodayDateString();
        if (lastClosedDate !== today) {
            setOpen(true);
        }

        // Fetch announcements
        const fetchData = async () => {
            const res = await getAnnouncements();
            if (res.success !== false) {
                setAnnouncements(res);
            }
        };
        fetchData();
    }, []);

    const handleClose = () => {
        localStorage.setItem(STORAGE_KEY, getTodayDateString());
        setOpen(false);
    };

    if (!open || announcements.length === 0) return null;

    return (
        <div className="announce-backdrop">
            <div className="announce-box">
                <button className="announce-close" onClick={handleClose}>
                    &times;
                </button>

                <Swiper
                    modules={[Navigation, Pagination]}
                    navigation
                    pagination={{ clickable: true }}
                >
                    {announcements.map(({ heading, description }, i) => (
                        <SwiperSlide className="px-6" key={i}>
                            <h2 className="announce-title">{heading}</h2>
                            <p className="announce-body">{description}</p>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
}
