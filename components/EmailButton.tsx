import React from "react";
import "./EmailButton.css";

interface EmailButtonProps {
  onPress?: () => void;
  label?: string;
}

const EmailButton: React.FC<EmailButtonProps> = ({ onPress, label = "PRESS ME" }) => {
  return (
    <div className="email-button-wrap">
      <button 
        className="email-button" 
        type="button" 
        onClick={onPress}
        aria-label={label}
      >
        {label}
      </button>
    </div>
  );
};

export default EmailButton;
