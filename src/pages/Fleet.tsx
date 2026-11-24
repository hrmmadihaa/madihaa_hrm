import { Link } from 'react-router-dom';
import { Card, CardHeader } from '../components/ui/Card';
import { FileText, CreditCard, Truck } from 'lucide-react';

export const Fleet = () => {
  const fleetSections = [
    {
      title: 'Airport Pass',
      description: 'Manage airport pass information for drivers and labour',
      icon: FileText,
      link: '/fleet/airport-pass',
      color: 'bg-blue-50 text-blue-600',
      count: 16
    },
    {
      title: 'License',
      description: 'Track driver license information and expiry dates',
      icon: CreditCard,
      link: '/fleet/license',
      color: 'bg-green-50 text-green-600',
      count: 16
    },
    {
      title: 'Vehicle',
      description: 'Manage vehicle fleet, insurance and road tax',
      icon: Truck,
      link: '/fleet/vehicle',
      color: 'bg-purple-50 text-purple-600',
      count: 18
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">Fleet Management</h1>
          <p className="text-secondary-600 mt-1">Manage airport passes, licenses, and vehicles</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fleetSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.title} to={section.link}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${section.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-secondary-600">
                      {section.count} records
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-900">{section.title}</h3>
                  <p className="text-sm text-secondary-600 mt-1">{section.description}</p>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
