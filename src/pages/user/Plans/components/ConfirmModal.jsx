import React from "react";
import Modal from "react-modal";
import "./ConfirmationModal.css";

Modal.setAppElement("#root"); // Ensure accessibility for screen readers

const ConfirmModal = ({ isOpen, onClose, transaction }) => {
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            className="modal-content"
            overlayClassName="modal-overlay"
        >
            <div className="modal-header">
                <svg width="64px" height="64px" viewBox="-3.2 -3.2 38.40 38.40" xmlns="http://www.w3.org/2000/svg" fill="#10B981" stroke="#253864" transform="matrix(1, 0, 0, 1, 0, 0)"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" stroke="#CCCCCC" strokeWidth="0.064"></g><g id="SVGRepo_iconCarrier"><path d="m16 0c8.836556 0 16 7.163444 16 16s-7.163444 16-16 16-16-7.163444-16-16 7.163444-16 16-16zm5.7279221 11-7.0710679 7.0710678-4.2426406-4.2426407-1.4142136 1.4142136 5.6568542 5.6568542 8.4852814-8.4852813z" fill="#202327" fillRule="evenodd"></path></g></svg>
            </div>
            <h2 className="modal-title">Your transaction has been sent with success!</h2>
            <p className="modal-subtitle">Show details</p>
            <div className="modal-details">
                <div className="detail-item">
                    <span className="detail-label">TYPE</span>
                    <span className="detail-value">Sent</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">AMOUNT</span>
                    <span className="detail-value">{transaction.amount} {transaction.amount !== 'N/A' ? transaction.currency : ''}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">DESTINATION</span>
                    <span className="detail-value">{transaction.destination}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Note: </span>
                    <span className="detail-value">Regards from Henry Vitalis Mushi</span>
                </div>
            </div>
            <button className="modal-button" onClick={onClose}>OK</button>
        </Modal>
    );
};

export default ConfirmModal;
