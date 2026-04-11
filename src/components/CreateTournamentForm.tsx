import React, { useEffect, useState } from 'react';
import { TournamentService } from '../services/tournament.service';
import paymentService from '../services/payment.service';
import adminService from '../services/admin.service';
import { Button } from './Button';
import { InputField, Select } from './InputField';
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
  const SPORT_OPTIONS = [
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

  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tournamentFee, setTournamentFee] = useState<number>(199);

  // Load current tournament creation fee from global pricing config
  useEffect(() => {
    const loadFee = async () => {
      try {
        const config = await adminService.getPricingConfig();
        if (config?.tournamentCreationFee) {
          setTournamentFee(config.tournamentCreationFee);
        }
      } catch (error) {
        // Fail silently and keep default fee
        console.error('Failed to load tournament fee config:', error);
      }
    };

    loadFee();
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sport: '',
    location: '',
    googleMapsUrl: '',
    maxTeams: 16,
    maxPlayersPerTeam: 11,
    entryFee: 0,
    currency: 'INR',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    bracketFormat: 'single_elimination' as const,
    image: '',
    paymentQrCode: '',
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
        name === 'maxTeams' || name === 'entryFee' || name === 'maxPlayersPerTeam'
          ? parseInt(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Prevent accidental double-submit from creating duplicate tournaments
    if (loading) return;

    // Read the latest values directly from the form to avoid
    // any issues where the datetime inputs only commit on blur.
    const formElement = e.currentTarget;
    const nativeFormData = new FormData(formElement);

    const name = (nativeFormData.get('name') as string) || '';
    const sport = (nativeFormData.get('sport') as string) || '';
    const location = (nativeFormData.get('location') as string) || '';
    const googleMapsUrl = (nativeFormData.get('googleMapsUrl') as string) || '';
    const registrationDeadlineStr =
      (nativeFormData.get('registrationDeadline') as string) || '';
    const startDateStr = (nativeFormData.get('startDate') as string) || '';
    const endDateStr = (nativeFormData.get('endDate') as string) || '';

    if (
      !name ||
      !sport ||
      !location ||
      !startDateStr ||
      !endDateStr ||
      !registrationDeadlineStr
    ) {
      toast.error('Please fill all required fields');
      return;
    }

    const startTime = new Date(startDateStr).getTime();
    const endTime = new Date(endDateStr).getTime();
    const regDeadline = new Date(registrationDeadlineStr).getTime();

    if (formData.maxTeams < 2 || formData.maxTeams > 128) {
      toast.error('Max teams must be between 2 and 128');
      return;
    }

    if (formData.maxPlayersPerTeam < 1 || formData.maxPlayersPerTeam > 25) {
      toast.error('Players per team must be between 1 and 25');
      return;
    }

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

    // Keep React state in sync with what the user actually submitted
    setFormData((prev) => ({
      ...prev,
      name,
      sport,
      location,
      googleMapsUrl,
      startDate: startDateStr,
      endDate: endDateStr,
      registrationDeadline: registrationDeadlineStr,
    }));

    const email = user.email;
    const phone = user.phone || '';

    if (!email) {
      toast.error('Your account does not have an email set');
      return;
    }

    setLoading(true);

    try {
      await paymentService.initiateTournamentCreationPayment(
        tournamentFee,
        email,
        phone,
        async () => {
          try {
            const tournamentId = await TournamentService.createTournament(
              {
                name,
                description: formData.description,
                sport,
                location,
                googleMapsUrl,
                maxTeams: formData.maxTeams,
                entryFee: formData.entryFee,
                currency: formData.currency,
                startDate: startTime,
                endDate: endTime,
                registrationDeadline: regDeadline,
                bracketFormat: formData.bracketFormat,
                maxPlayersPerTeam: formData.maxPlayersPerTeam,
                image: formData.image || '',
                paymentQrCode: formData.paymentQrCode || '',
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
            console.error('Error creating tournament after successful payment:', error);
            toast.error(
              'Payment succeeded, but tournament could not be created. Please contact support.'
            );
          } finally {
            setLoading(false);
          }
        },
        (errorMessage) => {
          console.error('Tournament creation payment failed:', errorMessage);
          toast.error(errorMessage || 'Payment failed. Tournament not created.');
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error initiating tournament creation payment:', error);
      toast.error('Could not start payment. Please try again.');
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
          <Select
            label="Sport *"
            name="sport"
            value={formData.sport}
            onChange={handleInputChange}
            options={SPORT_OPTIONS.map((sport) => ({ value: sport, label: sport }))}
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

        {/* Google Maps URL */}
        <InputField
          label="Google Maps URL"
          name="googleMapsUrl"
          value={formData.googleMapsUrl}
          onChange={handleInputChange}
          placeholder="e.g., https://maps.app.goo.gl/... or https://www.google.com/maps/place/..."
          helperText="Add a Google Maps link to help teams find the venue."
        />

        {/* Max Teams & Players per Team & Entry Fee Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Max Teams *"
            name="maxTeams"
            type="number"
            min={2}
            max={128}
            value={formData.maxTeams}
            onChange={handleInputChange}
            helperText="Total number of teams allowed in this tournament."
            required
          />

          <InputField
            label="Players per Team *"
            name="maxPlayersPerTeam"
            type="number"
            min={1}
            max={25}
            value={formData.maxPlayersPerTeam}
            onChange={handleInputChange}
            helperText="How many players each team can register (1-25)."
            required
          />

          <InputField
            label="Entry Fee"
            name="entryFee"
            type="text"
            inputMode="decimal"
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
            type="date"
            value={formData.registrationDeadline}
            onChange={handleInputChange}
            required
          />

          <InputField
            label="Start Date *"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleInputChange}
            required
          />

          <InputField
            label="End Date *"
            name="endDate"
            type="date"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment QR Code
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Upload your GPay/UPI QR code for teams to pay registration fees.
            </p>
            <ImageUploader
              folder="tournaments/qr"
              onSuccess={(url) => {
                setFormData((prev) => ({ ...prev, paymentQrCode: url }));
                toast.success('QR Code uploaded snippet');
              }}
              onError={(error) => toast.error(error)}
              disabled={loading}
            />
            {formData.paymentQrCode && (
              <a href={formData.paymentQrCode} target="_blank" rel="noopener noreferrer" className="text-primary text-xs mt-2 block underline">
                View Uploaded QR Code
              </a>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
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
        <div className="flex flex-col md:flex-row gap-4 pt-6">
          <Button
            type="submit"
            isLoading={loading}
            className="flex-1"
          >
            Pay ₹{tournamentFee} &amp; Create Tournament
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
