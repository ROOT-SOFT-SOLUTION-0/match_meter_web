import React, { useState } from 'react';
import { TournamentService } from '../services/tournament.service';
import { Button } from './Button';
import { InputField } from './InputField';
import { Card } from './Card';
import { ImageUploader } from './ImageUploader';
import { useAuth } from '../hooks';
import toast from 'react-hot-toast';

interface CreateTournamentFormProps {
  onSuccess?: (tournamentId: string) => void;
  onClose?: () => void;
}

export const CreateTournamentForm: React.FC<CreateTournamentFormProps> = ({
  onSuccess,
  onClose,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sport: '',
    location: '',
    maxTeams: 16,
    entryFee: 0,
    currency: 'INR',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    bracketFormat: 'single_elimination' as const,
    image: '',
    highlightVideoUrl: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'maxTeams' || name === 'entryFee'
          ? parseInt(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.sport ||
      !formData.location ||
      !formData.startDate ||
      !formData.endDate ||
      !formData.registrationDeadline
    ) {
      toast.error('Please fill all required fields');
      return;
    }

    const startTime = new Date(formData.startDate).getTime();
    const endTime = new Date(formData.endDate).getTime();
    const regDeadline = new Date(formData.registrationDeadline).getTime();

    if (regDeadline > startTime) {
      toast.error('Registration deadline must be before tournament start');
      return;
    }

    if (startTime >= endTime) {
      toast.error('Start date must be before end date');
      return;
    }

    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const tournamentId = await TournamentService.createTournament(
        {
          name: formData.name,
          description: formData.description,
          sport: formData.sport,
          location: formData.location,
          maxTeams: formData.maxTeams,
          entryFee: formData.entryFee,
          currency: formData.currency,
          startDate: startTime,
          endDate: endTime,
          registrationDeadline: regDeadline,
          bracketFormat: formData.bracketFormat,
          image: formData.image || '',
          highlightVideoUrl: formData.highlightVideoUrl || '',
          rules: '',
          schedule: '',
        },
        user.uid
      );

      toast.success('Tournament created successfully!');
      onSuccess?.(tournamentId);
      onClose?.();
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast.error('Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Create Tournament</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tournament Name */}
        <InputField
          label="Tournament Name *"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="e.g., Spring Football Championship"
          required
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Tournament details and rules"
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm focus:ring-1 focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
            rows={3}
          />
        </div>

        {/* Sport & Location Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Sport *"
            name="sport"
            value={formData.sport}
            onChange={handleInputChange}
            placeholder="e.g., Football, Cricket"
            required
          />
          <InputField
            label="Location *"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="e.g., Mumbai, India"
            required
          />
        </div>

        {/* Max Teams & Entry Fee Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Teams *
            </label>
            <select
              name="maxTeams"
              value={formData.maxTeams}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm focus:ring-1 focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
            >
              <option value={8}>8 Teams</option>
              <option value={16}>16 Teams</option>
              <option value={32}>32 Teams</option>
              <option value={64}>64 Teams</option>
              <option value={128}>128 Teams</option>
            </select>
          </div>

          <InputField
            label="Entry Fee"
            name="entryFee"
            type="number"
            value={formData.entryFee}
            onChange={handleInputChange}
            placeholder="0"
          />
        </div>

        {/* Bracket Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bracket Format *
          </label>
          <select
            name="bracketFormat"
            value={formData.bracketFormat}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm focus:ring-1 focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
          >
            <option value="single_elimination">Single Elimination</option>
            <option value="double_elimination">Double Elimination</option>
          </select>
        </div>

        {/* Dates Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Registration Deadline *"
            name="registrationDeadline"
            type="datetime-local"
            value={formData.registrationDeadline}
            onChange={handleInputChange}
            required
          />

          <InputField
            label="Start Date *"
            name="startDate"
            type="datetime-local"
            value={formData.startDate}
            onChange={handleInputChange}
            required
          />

          <InputField
            label="End Date *"
            name="endDate"
            type="datetime-local"
            value={formData.endDate}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Media */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cover image
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Optional banner for this tournament. Shown in feeds and detail pages.
            </p>
            <ImageUploader
              folder="tournaments"
              onSuccess={(url) => {
                setFormData((prev) => ({ ...prev, image: url }));
                toast.success('Cover image uploaded');
              }}
              onError={(error) => toast.error(error)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <InputField
              label="Highlight video URL"
              name="highlightVideoUrl"
              value={formData.highlightVideoUrl}
              onChange={handleInputChange}
              placeholder="YouTube Shorts or Google Drive link (optional)"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Paste a public YouTube or Drive link. We will embed this clip in the player feed.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-6">
          <Button
            type="submit"
            isLoading={loading}
            className="flex-1"
          >
            Create Tournament
          </Button>
          {onClose && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
};
