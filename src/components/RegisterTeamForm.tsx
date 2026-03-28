import React, { useState } from 'react';
import firestoreService from '../services/firestore.service';
import { Button } from './Button';
import { InputField } from './InputField';
import { Tournament, TeamRegistration } from '../types/models';
import toast from 'react-hot-toast';
import authService from '../services/auth.service';

interface RegisterTeamFormProps {
    tournament: Tournament;
    onSuccess?: (registrationId: string) => void;
    onClose?: () => void;
}

export const RegisterTeamForm: React.FC<RegisterTeamFormProps> = ({
    tournament,
    onSuccess,
    onClose,
}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        teamName: '',
        captainName: '',
        captainEmail: '',
        captainPhone: '',
        players: [''],
        customFields: {} as Record<string, string>,
    });

    const [linkedPlayers, setLinkedPlayers] = useState<
        { userId: string; name: string; phone?: string }[]
    >([]);

    const [phoneSearch, setPhoneSearch] = useState('');
    const [phoneSearchResult, setPhoneSearchResult] = useState<
        { userId: string; name: string; phone?: string } | null
    >(null);
    const [phoneSearching, setPhoneSearching] = useState(false);

    // Parse custom fields configuration
    const customFieldsConfig = React.useMemo(() => {
        try {
            return tournament.registrationFormConfig
                ? JSON.parse(tournament.registrationFormConfig)
                : [];
        } catch (e) {
            console.error('Failed to parse registration form configuration:', e);
            return [];
        }
    }, [tournament.registrationFormConfig]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.teamName || !formData.captainName || !formData.captainEmail || !formData.captainPhone) {
            toast.error('Please fill all required fields');
            return;
        }

        // Validate custom fields
        for (const field of customFieldsConfig) {
            if (field.required && !formData.customFields[field.name]) {
                toast.error(`${field.name} is required`);
                return;
            }
        }

        setLoading(true);
        try {
            const registrationData: Partial<TeamRegistration> = {
                tournamentId: tournament.id,
                teamName: formData.teamName,
                captain: formData.captainName,
                captainEmail: formData.captainEmail,
                captainPhone: formData.captainPhone,
                players: formData.players.filter(p => p.trim() !== ''),
                totalMembers: formData.players.filter(p => p.trim() !== '').length,
                status: 'pending',
                paymentStatus: 'pending',
                registeredAt: Date.now(),
                notes: JSON.stringify(formData.customFields),
                playersInfo: linkedPlayers.length
                    ? linkedPlayers.map((p) => ({
                        userId: p.userId,
                        name: p.name,
                        phone: p.phone,
                    }))
                    : undefined,
            };

            const registrationId = await firestoreService.registerTeam(
                tournament.id,
                registrationData
            );

            toast.success('Registration submitted! Please proceed to payment.');
            onSuccess?.(registrationId);
        } catch (error) {
            console.error('Error registering team:', error);
            toast.error('Failed to register team');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCustomFieldChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            customFields: { ...prev.customFields, [name]: value }
        }));
    };

    const handlePlayerChange = (index: number, value: string) => {
        const newPlayers = [...formData.players];
        newPlayers[index] = value;
        setFormData(prev => ({ ...prev, players: newPlayers }));
    };

    const addPlayer = () => {
        setFormData(prev => ({ ...prev, players: [...prev.players, ''] }));
    };

    const removePlayer = (index: number) => {
        if (formData.players.length <= 1) return;
        const newPlayers = formData.players.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, players: newPlayers }));
    };

    const handlePhoneSearch = async () => {
        if (!phoneSearch.trim()) {
            toast.error('Enter a phone number to search');
            return;
        }

        setPhoneSearching(true);
        setPhoneSearchResult(null);
        try {
            const user = await authService.findUserByPhone(phoneSearch.trim());
            if (!user) {
                toast.error('No player found with this phone number');
                return;
            }

            setPhoneSearchResult({
                userId: user.uid,
                name: user.displayName || user.email || 'Player',
                phone: user.phone,
            });
        } catch (error) {
            console.error('Phone search failed:', error);
            toast.error('Failed to search player');
        } finally {
            setPhoneSearching(false);
        }
    };

    const handleAddLinkedPlayer = () => {
        if (!phoneSearchResult) return;

        if (linkedPlayers.some((p) => p.userId === phoneSearchResult.userId)) {
            toast.error('Player already added');
            return;
        }

        setLinkedPlayers((prev) => [...prev, phoneSearchResult]);
        setFormData((prev) => ({
            ...prev,
            players: [...prev.players, phoneSearchResult.name],
        }));
        setPhoneSearch('');
        setPhoneSearchResult(null);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Register for {tournament.name}</h2>
                {onClose && (
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        ✕
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                        label="Team Name *"
                        name="teamName"
                        value={formData.teamName}
                        onChange={handleInputChange}
                        required
                    />
                    <InputField
                        label="Captain Name *"
                        name="captainName"
                        value={formData.captainName}
                        onChange={handleInputChange}
                        required
                    />
                    <InputField
                        label="Captain Email *"
                        name="captainEmail"
                        type="email"
                        value={formData.captainEmail}
                        onChange={handleInputChange}
                        required
                    />
                    <InputField
                        label="Captain Phone *"
                        name="captainPhone"
                        type="tel"
                        value={formData.captainPhone}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                {/* Custom Fields */}
                {customFieldsConfig.length > 0 && (
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="font-semibold text-gray-700">Tournament Specific Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {customFieldsConfig.map((field: any) => (
                                <InputField
                                    key={field.name}
                                    label={`${field.name}${field.required ? ' *' : ''}`}
                                    name={field.name}
                                    type={field.type || 'text'}
                                    value={formData.customFields[field.name] || ''}
                                    onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                                    placeholder={field.placeholder || ''}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Player List */}
                <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-700">Player List</h3>
                        <button
                            type="button"
                            onClick={addPlayer}
                            className="text-sm text-primary hover:underline font-medium"
                        >
                            + Add Player
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {formData.players.map((player, index) => (
                            <div key={index} className="flex gap-2">
                                <InputField
                                    label={`Player ${index + 1}`}
                                    value={player}
                                    onChange={(e) => handlePlayerChange(index, e.target.value)}
                                    className="flex-1"
                                />
                                <button
                                    type="button"
                                    onClick={() => removePlayer(index)}
                                    className="mt-8 text-red-500 hover:text-red-700"
                                    disabled={formData.players.length <= 1}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-700">Add existing players</h3>
                        <p className="text-xs text-gray-400">Search by phone number</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <InputField
                            label="Player phone"
                            value={phoneSearch}
                            onChange={(e) => setPhoneSearch(e.target.value)}
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            onClick={handlePhoneSearch}
                            isLoading={phoneSearching}
                            className="mt-6 sm:mt-5 whitespace-nowrap"
                        >
                            Search
                        </Button>
                    </div>
                    {phoneSearchResult && (
                        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                            <div>
                                <p className="font-semibold">{phoneSearchResult.name}</p>
                                {phoneSearchResult.phone && (
                                    <p className="text-[11px]">{phoneSearchResult.phone}</p>
                                )}
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleAddLinkedPlayer}
                            >
                                Add to team
                            </Button>
                        </div>
                    )}

                    {linkedPlayers.length > 0 && (
                        <div className="text-xs text-gray-500">
                            Linked players: {linkedPlayers.map((p) => p.name).join(', ')}
                        </div>
                    )}
                </div>

                <div className="pt-6">
                    <Button
                        type="submit"
                        isLoading={loading}
                        className="w-full h-12 text-lg shadow-lg"
                    >
                        Submit Registration
                    </Button>
                    <p className="text-center text-xs text-gray-400 mt-3 italic">
                        Entry Fee: ₹{tournament.entryFee} {tournament.currency}
                    </p>
                </div>
            </form>
        </div>
    );
};
