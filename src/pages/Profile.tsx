import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks';
import { Card, CardHeader, CardBody, InputField, Button, SportsInterestSelector } from '../components';
import { useUIStore } from '../store';
import imageService from '../services/image.service';

interface ProfileFormData {
  displayName: string;
  email: string;
  phone: string;
  age: string;
  place: string;
  location: string;
  aadharNumber: string;
  dateOfBirth: string;
  sportsInterests: string[];
  profileImage: string; // base32
}

export default function Profile() {
  const { user, updateProfile, loading } = useAuth();
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: '',
    email: '',
    phone: '',
    age: '',
    place: '',
    location: '',
    aadharNumber: '',
    dateOfBirth: '',
    sportsInterests: [],
    profileImage: '',
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const location = useLocation();

  // Handle redirect from ProtectedRoute silently
  useEffect(() => {
    if (location.state?.from === 'redirect_incomplete') {
      // Clear state so it doesn't persist
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Initialize form data from user profile
  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        email: user.email || '',
        phone: user.phone || '',
        age: user.age?.toString() || '',
        place: user.place || '',
        location: user.location || '',
        aadharNumber: user.aadharNumber || '',
        dateOfBirth: user.dateOfBirth || '',
        sportsInterests: user.sportsInterests || [],
        profileImage: user.profileImage || '',
      });
      // Restore image preview
      if (user.profileImage) {
        try {
          // Check if it's base32 (old format) or base64 (new format)
          if (user.profileImage.includes('data:') || user.profileImage.length > 300) {
            setImagePreview(imageService.ensureDataUrl(user.profileImage));
          } else {
            console.log('Old profile image format detected');
            setImagePreview(null);
          }
        } catch (error) {
          console.error('Failed to restore image preview:', error);
          setImagePreview(null);
        }
      } else {
        setImagePreview(null);
      }
    }
  }, [user]);

  const getMissingFields = () => {
    const missing = [];
    if (!formData.displayName) missing.push('Full Name');
    if (!formData.phone) missing.push('Phone Number');
    if (!(formData.place || formData.location)) missing.push('Place/City');
    if (!formData.sportsInterests || formData.sportsInterests.length === 0) missing.push('Sports Interests');
    return missing;
  };

  const missingFields = getMissingFields();
  const isComplete = missingFields.length === 0;

  const calculateAge = (dob: string): string => {
    if (!dob) return '';
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 0 ? age.toString() : '';
    } catch (e) {
      return '';
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: name === 'age' ? (value ? parseInt(value) : '') : value
      };

      // Auto-calculate age if DOB changes
      if (name === 'dateOfBirth') {
        const calculatedAge = calculateAge(value);
        if (calculatedAge) {
          newData.age = calculatedAge;
        }
      }

      return newData;
    });
  };

  const handleSportsChange = (sports: string[]) => {
    setFormData((prev) => ({
      ...prev,
      sportsInterests: sports,
    }));
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);

      // Validate image
      const validation = imageService.validateImageFile(file, 5);
      if (!validation.valid) {
        showError(validation.error || 'Invalid image');
        return;
      }

      // Compress and convert to base64
      const compressedBase64 = await imageService.compressAndEncode(file);

      setFormData((prev) => ({
        ...prev,
        profileImage: compressedBase64,
      }));

      // Set preview directly from compressed version
      setImagePreview(compressedBase64);

      showSuccess('Image processed and ready to save!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Image processing failed';
      showError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.displayName.trim()) {
      showError('Name is required');
      return false;
    }
    if (formData.age && (parseInt(formData.age) < 5 || parseInt(formData.age) > 120)) {
      showError('Please enter a valid age');
      return false;
    }
    if (formData.aadharNumber && formData.aadharNumber.length !== 12) {
      showError('Aadhar number must be 12 digits');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      await updateProfile({
        displayName: formData.displayName,
        phone: formData.phone,
        age: formData.age ? parseInt(formData.age) : undefined,
        place: formData.place,
        location: formData.location,
        aadharNumber: formData.aadharNumber,
        dateOfBirth: formData.dateOfBirth,
        sportsInterests: formData.sportsInterests,
        profileImage: formData.profileImage,
      });
      showSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      showError('Failed to update profile');
      console.error('Profile update error:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to current user data
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        email: user.email || '',
        phone: user.phone || '',
        age: user.age?.toString() || '',
        place: user.place || '',
        location: user.location || '',
        aadharNumber: user.aadharNumber || '',
        dateOfBirth: user.dateOfBirth || '',
        sportsInterests: user.sportsInterests || [],
        profileImage: user.profileImage || '',
      });

      if (user.profileImage) {
        setImagePreview(imageService.ensureDataUrl(user.profileImage));
      } else {
        setImagePreview(null);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            ✏️ Edit Profile
          </Button>
        )}
      </div>

      {/* Profile Picture Card */}
      <Card>
        <CardHeader title="Profile Picture" icon="🖼️" />
        <CardBody className="space-y-4">
          <div className="flex flex-col items-center space-y-4">
            {/* Image Preview */}
            <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-4xl">👤</div>
              )}
            </div>

            {isEditing && (
              <div className="w-full max-w-sm">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                  Upload Profile Picture (Max 2MB)
                </label>
                <div className="relative inline-block w-full">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                    disabled={uploading}
                    className="hidden"
                    id="profile-image-input"
                  />
                  <label
                    htmlFor="profile-image-input"
                    className="block w-full px-4 py-2 text-center border-2 border-dashed border-primary rounded-lg cursor-pointer hover:bg-primary hover:bg-opacity-10 transition-colors dark:text-white"
                  >
                    {uploading ? 'Processing...' : '📁 Click to upload image'}
                  </label>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Basic Information Card */}
      <Card>
        <CardHeader title="Basic Information" icon="ℹ️" />
        <CardBody className="space-y-6">
          {!isComplete && (
            <div className="mb-2 p-4 bg-yellow-50 border border-yellow-200 rounded-xl dark:bg-yellow-900/20 dark:border-yellow-900/30 anim-pulse">
              <div className="flex gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <h3 className="text-sm font-bold text-yellow-800 dark:text-yellow-200">
                    Profile Action Required
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 font-medium">
                    To access tournaments and teams, please complete:
                  </p>
                  <ul className="list-disc list-inside mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    {missingFields.map(field => <li key={field}>{field}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {isEditing ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Full Name *"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                />
                <InputField
                  label="Email (Read-only)"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Age (Auto-calculated from DOB)"
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="Calculated from DOB"
                  disabled // User shouldn't change it manually if DOB is present
                />
                <InputField
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Date of Birth"
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                />
                <InputField
                  label="Aadhar Number"
                  name="aadharNumber"
                  value={formData.aadharNumber}
                  onChange={handleInputChange}
                  placeholder="12-digit Aadhar number"
                  maxLength={12}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Place"
                  name="place"
                  value={formData.place}
                  onChange={handleInputChange}
                  placeholder="Your place/city"
                />
                <InputField
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Detailed location/address"
                />
              </div>

              <div className="space-y-4 border-t pt-4 dark:border-gray-700">
                <SportsInterestSelector
                  selected={formData.sportsInterests}
                  onChange={handleSportsChange}
                  maxSelections={3}
                />
              </div>

              <div className="flex gap-3 border-t pt-4 dark:border-gray-700">
                <Button
                  onClick={handleSave}
                  isLoading={loading}
                  className="btn-uiverse !bg-transparent !shadow-none !p-0 !text-black dark:!text-black"
                >
                  ✓ Save Changes
                </Button>

                <Button onClick={handleCancel} variant="outline">
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Full Name</label>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {formData.displayName || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Email</label>
                  <p className="text-base text-gray-900 dark:text-white">{formData.email || '-'}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Age</label>
                  <p className="text-base text-gray-900 dark:text-white">
                    {formData.age ? `${formData.age} years` : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Phone</label>
                  <p className="text-base text-gray-900 dark:text-white">{formData.phone || '-'}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Date of Birth</label>
                  <p className="text-base text-gray-900 dark:text-white">{formData.dateOfBirth || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Aadhar Number</label>
                  <p className="text-base text-gray-900 dark:text-white">
                    {formData.aadharNumber ? formData.aadharNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3') : '-'}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Place</label>
                  <p className="text-base text-gray-900 dark:text-white">{formData.place || '-'}</p>
                </div>
                <div className="sm:col-span-2 lg:col-span-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">Location</label>
                  <p className="text-base text-gray-900 dark:text-white">{formData.location || '-'}</p>
                </div>
              </div>

              {/* Sports Interests Display */}
              <div className="border-t pt-4 dark:border-gray-700">
                <label className="text-sm text-gray-600 dark:text-gray-400">Sports Interests</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.sportsInterests && formData.sportsInterests.length > 0 ? (
                    formData.sportsInterests.map((sport) => (
                      <span
                        key={sport}
                        className="px-3 py-1 bg-primary bg-opacity-10 dark:bg-opacity-20 text-primary border border-primary dark:border-opacity-30 rounded-full text-sm font-medium"
                      >
                        {sport}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No sports selected</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Account Info Card */}
      <Card>
        <CardHeader title="Account Information" icon="🔐" />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Role</label>
              <p className="text-lg font-semibold text-primary capitalize">{user?.role}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Member Since</label>
              <p className="text-lg text-gray-900 dark:text-white">
                {new Date(user?.createdAt || 0).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
