import { useState, useEffect } from 'react';
import { Stethoscope, Calendar, Pill, Hospital, User, Clock } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { getMedicalRequisitionsByEmployee } from '../lib/medicalRequisition';
import { formatDate } from '../lib/dateUtils';
import { useAuth } from '../contexts/AuthContext';

export const MedicalHistory = () => {
  const { user } = useAuth();
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedicalHistory();
  }, [user]);

  const loadMedicalHistory = async () => {
    if (!user?.employeeId) {
      console.log('No employeeId found for user:', user);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching medical history for employeeId:', user.employeeId);
      
      // Get user's name from displayName or email for fallback matching
      const employeeName = user.displayName || user.email?.split('@')[0] || '';
      console.log('Employee name for fallback:', employeeName);
      
      const history = await getMedicalRequisitionsByEmployee(user.employeeId, employeeName);
      console.log('Fetched medical history:', history);
      console.log('Number of requisitions:', history.length);
      
      setRequisitions(history);
    } catch (error) {
      console.error('Error loading medical history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      approved: 'Approved',
      in_progress: 'In Progress',
      completed: 'Completed',
      rejected: 'Rejected'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-secondary-600">Loading medical history...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 mb-2">Medical History</h1>
        <p className="text-secondary-600">Your medical consultation history</p>
      </div>

      {requisitions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Stethoscope className="w-16 h-16 mx-auto text-secondary-400 mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No Medical History</h3>
            <p className="text-secondary-600">You don't have any medical consultation records yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requisitions.map((req) => (
            <Card key={req.id}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Stethoscope className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary-900">{req.department}</h3>
                      <p className="text-sm text-secondary-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(req.date)}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
                    {getStatusLabel(req.status)}
                  </span>
                </div>

                {req.staff && req.staff.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-secondary-700 mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Staff Members
                    </h4>
                    <div className="bg-secondary-50 rounded-lg p-3 space-y-2">
                      {req.staff.map((staff: any, idx: number) => (
                        <div key={idx} className="text-sm">
                          <p className="font-medium text-secondary-900">{staff.name}</p>
                          <p className="text-secondary-600">{staff.designation}</p>
                          <p className="text-secondary-600">{staff.sickness}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {req.consultation && (
                  <div className="mb-4 bg-green-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-secondary-700 mb-3 flex items-center gap-2">
                      <Hospital className="w-4 h-4" />
                      Consultation Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-secondary-600">Hospital</p>
                        <p className="font-medium text-secondary-900">{req.consultation.hospital}</p>
                      </div>
                      <div>
                        <p className="text-secondary-600">Doctor</p>
                        <p className="font-medium text-secondary-900">{req.consultation.doctorName}</p>
                      </div>
                      <div>
                        <p className="text-secondary-600">Visit Time</p>
                        <p className="font-medium text-secondary-900 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(req.consultation.visitTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-secondary-600">Medicine Taken</p>
                        <p className="font-medium text-secondary-900">
                          {req.consultation.medicineTaken ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                    {req.consultation.doctorComments && (
                      <div className="mt-3">
                        <p className="text-secondary-600">Doctor Comments</p>
                        <p className="text-secondary-900">{req.consultation.doctorComments}</p>
                      </div>
                    )}
                    {req.consultation.medicineTaken && req.consultation.medicines && req.consultation.medicines.length > 0 && (
                      <div className="mt-3">
                        <h5 className="text-sm font-medium text-secondary-700 mb-2 flex items-center gap-2">
                          <Pill className="w-4 h-4" />
                          Medicines Prescribed
                        </h5>
                        <div className="space-y-2">
                          {req.consultation.medicines.map((med: any, idx: number) => (
                            <div key={idx} className="bg-white rounded p-2 text-sm">
                              <p className="font-medium text-secondary-900">{med.name}</p>
                              <p className="text-secondary-600">Tablets: {med.tablets} | Value: MVR {med.value.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {req.remarks && (
                  <div className="text-sm">
                    <p className="text-secondary-600">Remarks</p>
                    <p className="text-secondary-900">{req.remarks}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
