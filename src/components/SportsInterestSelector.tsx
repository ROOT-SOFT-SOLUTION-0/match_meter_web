import React from 'react';

interface SportsInterestSelectorProps {
  selected: string[];
  onChange: (sports: string[]) => void;
  maxSelections?: number;
  disabled?: boolean;
}

const AVAILABLE_SPORTS = [
  'Cricket',
  'Football',
  'Basketball',
  'Volleyball',
  'Badminton',
  'Tennis',
  'Table Tennis',
  'Kabaddi',
  'Hockey',
  'Rugby',
  'Swimming',
  'Track & Field',
  'Boxing',
  'Wrestling',
  'Martial Arts',
  'Chess',
];

export const SportsInterestSelector: React.FC<SportsInterestSelectorProps> = ({
  selected,
  onChange,
  maxSelections = 3,
  disabled = false,
}) => {
  const handleToggleSport = (sport: string) => {
    if (disabled) return;

    if (selected.includes(sport)) {
      onChange(selected.filter((s) => s !== sport));
    } else if (selected.length < maxSelections) {
      onChange([...selected, sport]);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Sports Interests (Select up to {maxSelections})
      </label>

      {selected.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Selected: {selected.length}/{maxSelections}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {AVAILABLE_SPORTS.map((sport) => (
          <button
            key={sport}
            type="button"
            disabled={disabled}
            onClick={() => handleToggleSport(sport)}
            className={`px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium ${selected.includes(sport)
                ? 'border-green-600 bg-green-600 text-white'
                : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-green-500 dark:hover:border-green-500'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {sport}
          </button>
        ))}
      </div>

      {selected.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select at least one sport that interests you
        </p>
      )}
    </div>
  );
};
