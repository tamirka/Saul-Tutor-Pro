import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const BookOpenIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M13 12h7v5h-7v-5zm7-7h-2V3c0-.55-.45-1-1-1s-1 .45-1 1v2h-4V3c0-.55-.45-1-1-1s-1 .45-1 1v2H6c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 15H6V7h14v10z"/>
    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
  </svg>
);

export default BookOpenIcon;
