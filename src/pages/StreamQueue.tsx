import { useEffect, useState } from 'react';
import { Card, CardBody, Button, InputField } from '../components';
import { useUIStore } from '../store';
import streamRequestService, { StreamRequest } from '../services/stream-request.service';

export default function StreamQueue() {
  const [requests, setRequests] = useState<StreamRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [streamKey, setStreamKey] = useState<Record<string, string>>({});
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const showError = useUIStore((state) => state.showError);
  const showSuccess = useUIStore((state) => state.showSuccess);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const allRequests = await streamRequestService.getAllRequests();
      setRequests(allRequests);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load requests';
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    const key = streamKey[requestId];
    if (!key?.trim()) {
      showError('Stream key is required');
      return;
    }

    setActiveRequestId(requestId);
    try {
      await streamRequestService.approveRequest(requestId, key);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: 'approved', streamKey: key } : r
        )
      );
      showSuccess('Stream request approved');
      setStreamKey((prev) => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to approve';
      showError(errorMsg);
    } finally {
      setActiveRequestId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setActiveRequestId(requestId);
    try {
      await streamRequestService.rejectRequest(requestId, 'Rejected by super admin');
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      showSuccess('Stream request rejected');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to reject';
      showError(errorMsg);
    } finally {
      setActiveRequestId(null);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const approvedRequests = requests.filter((r) => r.status === 'approved');

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🔴 Stream Queue</h2>
        <p className="mt-1 text-sm text-gray-500">Approve or reject live streaming requests</p>
      </section>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading requests...</div>
      ) : (
        <>
          {pendingRequests.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending ({pendingRequests.length})</h3>
              {pendingRequests.map((req) => (
                <Card key={req.id} className="border border-gray-100 dark:border-gray-700 !bg-white dark:!bg-gray-800">
                  <CardBody>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{req.tournamentName}</h4>
                        <p className="text-sm text-gray-500">{req.userName}</p>
                      </div>
                      <InputField
                        label="Stream Key (RTMP)"
                        type="password"
                        value={streamKey[req.id] || ''}
                        onChange={(e) =>
                          setStreamKey((prev) => ({
                            ...prev,
                            [req.id]: e.target.value,
                          }))
                        }
                        placeholder="rtmp://a.rtmp.youtube.com/live2/..."
                        className="!bg-gray-50 dark:!bg-gray-900 border-gray-200 dark:border-gray-700"
                      />
                      <div className="flex gap-2 justify-end mt-2">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleReject(req.id)}
                          disabled={activeRequestId === req.id}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(req.id)}
                          disabled={activeRequestId === req.id}
                          className="shadow-sm"
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}

          {approvedRequests.length > 0 && (
            <div className="space-y-3 mt-8">
              <h3 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">Approved ({approvedRequests.length})</h3>
              {approvedRequests.map((req) => (
                <Card key={req.id} className="border border-emerald-100 dark:border-emerald-900/30 !bg-emerald-50/50 dark:!bg-emerald-900/10">
                  <CardBody>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{req.tournamentName}</h4>
                      <p className="text-sm text-gray-500">{req.userName}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-mono break-all py-1 px-2 bg-emerald-100/50 dark:bg-emerald-900/40 rounded-md inline-block">Key: {req.streamKey}</p>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}

          {requests.length === 0 && (
            <Card className="border border-gray-100 dark:border-gray-700 !bg-white dark:!bg-gray-800">
              <CardBody>
                <p className="text-gray-500 text-center py-8">No stream requests</p>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}