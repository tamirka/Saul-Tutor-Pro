
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const MicrophoneIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM11 5a1 1 0 0 1 2 0v6a1 1 0 0 1-2 0V5z"></path>
    <path d="M12 14a5 5 0 0 0-5 5v1a1 1 0 0 0 2 0v-1a3 3 0 0 1 6 0v1a1 1 0 0 0 2 0v-1a5 5 0 0 0-5-5z"></path>
  </svg>
);

export default MicrophoneIcon;
