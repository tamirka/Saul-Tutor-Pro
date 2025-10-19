import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const BrainCircuitIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 13.5c1.5-1.5 3.5-1.5 5 0m-10 0c-1.5-1.5-1.5-3.5 0-5s3.5-1.5 5 0" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v3m0-9v3m-4.5 4.5h3m3 0h3" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="7.5" cy="10.5" r="1.5" fill="currentColor" />
    <circle cx="16.5" cy="10.5" r="1.5" fill="currentColor" />
    <circle cx="12" cy="7.5" r="1.5" fill="currentColor" />
    <circle cx="12" cy="16.5" r="1.5" fill="currentColor" />
  </svg>
);

export default BrainCircuitIcon;