import { FiStar } from 'react-icons/fi';

const StarRating = ({ rating, onRate, size = 20 }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(star => (
      <button
        key={star}
        type="button"
        onClick={() => onRate?.(star)}
        className={`${onRate ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
      >
        <FiStar
          size={size}
          className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
        />
      </button>
    ))}
  </div>
);

export default StarRating;
