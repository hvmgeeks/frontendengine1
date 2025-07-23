import React from 'react';
import './FastLoader.css';

const FastLoader = ({ message = "Loading...", size = "small" }) => {
  return (
    <div className={`fast-loader ${size}`}>
      <div className="fast-spinner">
        <div className="spinner-dot"></div>
        <div className="spinner-dot"></div>
        <div className="spinner-dot"></div>
      </div>
      <span className="loader-text">{message}</span>
    </div>
  );
};

export default FastLoader;
