const CallToActionButton = ({ text, disabled = false, speed = 5, className = '', onClick }) => {
  const animationDuration = `${speed}s`;

  return (
    <button
      className={`text-white  bg-clip-text inline-block ${disabled ? '' : 'animate-shine'} ${className} p-2 rounded-full border-2 border-white`}
      style={{
        backgroundImage: 'linear-gradient(120deg, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0) 60%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        animationDuration: animationDuration,
      }}
      onClick={onClick}
    >
      {text}
    </button>
  );
};

export default CallToActionButton;