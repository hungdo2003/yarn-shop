const Spinner = ({ size = 'md' }) => {
  const s = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }[size];
  return (
    <div className="flex justify-center items-center p-8">
      <div className={`${s} border-4 border-primary/20 border-t-primary rounded-full animate-spin`} />
    </div>
  );
};

export default Spinner;
