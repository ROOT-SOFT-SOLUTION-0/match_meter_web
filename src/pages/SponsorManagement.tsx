import { useEffect, useState } from 'react';
import { Card, CardBody, Button, InputField } from '../components';
import { useUIStore } from '../store';
import sponsorService, { Sponsor } from '../services/sponsor.service';

export default function SponsorManagement() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', website: '', description: '' });
  const showError = useUIStore((state) => state.showError);
  const showSuccess = useUIStore((state) => state.showSuccess);

  useEffect(() => {
    loadSponsors();
  }, []);

  const loadSponsors = async () => {
    try {
      setLoading(true);
      const data = await sponsorService.getAllSponsors();
      setSponsors(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load sponsors';
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSponsor = async () => {
    if (!formData.name.trim()) {
      showError('Sponsor name is required');
      return;
    }

    try {
      await sponsorService.createSponsor({
        name: formData.name,
        website: formData.website,
        description: formData.description,
      });
      showSuccess('Sponsor added successfully');
      setFormData({ name: '', website: '', description: '' });
      setShowForm(false);
      await loadSponsors();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add sponsor';
      showError(errorMsg);
    }
  };

  const handleDeleteSponsor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sponsor?')) return;

    try {
      await sponsorService.deleteSponsor(id);
      showSuccess('Sponsor deleted');
      setSponsors((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete sponsor';
      showError(errorMsg);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🤝 Sponsor Management</h2>
        <p className="mt-1 text-sm text-gray-500">Manage tournament sponsors</p>
      </section>

      <div className="flex justify-end">
        <Button
          onClick={() => setShowForm(!showForm)}
          className="shadow-sm"
        >
          {showForm ? 'Cancel' : '+ Add Sponsor'}
        </Button>
      </div>

      {showForm && (
        <Card className="border border-emerald-500/20 !bg-emerald-50/10 dark:!bg-emerald-900/5">
          <CardBody>
            <div className="space-y-4">
              <InputField
                label="Sponsor Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Nike, Adidas"
                className="!bg-white dark:!bg-gray-800"
              />
              <InputField
                label="Website (optional)"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
                className="!bg-white dark:!bg-gray-800"
              />
              <InputField
                label="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief sponsor details"
                className="!bg-white dark:!bg-gray-800"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSponsor}>
                  Add Sponsor
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading sponsors...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sponsors.map((sponsor) => (
            <Card key={sponsor.id} className="border border-gray-100 dark:border-gray-700 !bg-white dark:!bg-gray-800">
              <CardBody>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{sponsor.name}</h4>
                {sponsor.website && (
                  <p className="text-xs text-primary mb-2 break-all">{sponsor.website}</p>
                )}
                {sponsor.description && (
                  <p className="text-sm text-gray-500 mb-3">{sponsor.description}</p>
                )}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteSponsor(sponsor.id)}
                  className="w-full"
                >
                  Delete
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {!loading && sponsors.length === 0 && (
        <Card className="border border-gray-100 dark:border-gray-700 !bg-white dark:!bg-gray-800">
          <CardBody>
            <p className="text-gray-500 text-center py-4">No sponsors added yet.</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}