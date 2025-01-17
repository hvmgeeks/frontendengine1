import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import "./WaitingModal.css";

Modal.setAppElement("#root"); // Ensure accessibility for screen readers

const WaitingModal = ({ isOpen, onClose }) => {
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            className="waiting-modal-content"
            overlayClassName="waiting-modal-overlay"
        >
            <div className="waiting-modal-header">
                <h2>Please confirm the payment</h2>
            </div>
            <div className="waiting-modal-timer">
                <svg
                    fill="#253864"
                    version="1.1"
                    id="Layer_1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    width="64px"
                    height="64px"
                    stroke="#253864"
                >
                    <g>
                        <path d="M437.019,74.981C388.668,26.629,324.38,0,256,0S123.332,26.629,74.981,74.981C26.629,123.332,0,187.62,0,256 s26.629,132.668,74.981,181.019C123.332,485.371,187.62,512,256,512c64.518,0,126.15-24.077,173.541-67.796l-10.312-11.178 c-44.574,41.12-102.544,63.766-163.229,63.766c-64.317,0-124.786-25.046-170.266-70.527 C40.254,380.786,15.208,320.317,15.208,256S40.254,131.214,85.734,85.735C131.214,40.254,191.683,15.208,256,15.208 s124.786,25.046,170.266,70.527c45.48,45.479,70.526,105.948,70.526,170.265c0,60.594-22.587,118.498-63.599,163.045 l11.188,10.301C487.986,381.983,512,320.421,512,256C512,187.62,485.371,123.332,437.019,74.981z"></path>
                        <path d="M282.819,263.604h63.415v-15.208h-63.415c-1.619-5.701-5.007-10.662-9.536-14.25l35.913-86.701l-14.049-5.82 l-35.908,86.688c-1.064-0.124-2.142-0.194-3.238-0.194c-15.374,0-27.881,12.508-27.881,27.881s12.507,27.881,27.881,27.881 C268.737,283.881,279.499,275.292,282.819,263.604z M243.327,256c0-6.989,5.685-12.673,12.673-12.673 c6.989,0,12.673,5.685,12.673,12.673c0,6.989-5.685,12.673-12.673,12.673C249.011,268.673,243.327,262.989,243.327,256z"></path>
                        <path d="M451.168,256c0-107.616-87.552-195.168-195.168-195.168S60.832,148.384,60.832,256S148.384,451.168,256,451.168 S451.168,363.616,451.168,256z M76.04,256c0-99.231,80.73-179.96,179.96-179.96S435.96,156.769,435.96,256 S355.231,435.96,256,435.96S76.04,355.231,76.04,256z"></path>
                    </g>
                </svg>
            </div>

            <p className="waiting-modal-footer">
                Ensure that your payment is confirmed before the timer runs out.
            </p>
        </Modal>
    );
};

export default WaitingModal;
