import { useState, useEffect, useRef } from 'react';
import { Users, Building2, ChevronDown, ChevronRight, ArrowDown, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { getAllWorkLocations } from '../lib/workLocation';
import { getEmployees } from '../lib/employees';
import type { WorkLocation } from '../types';

interface OrgNode {
  id: string;
  name: string;
  employeeId: string;
  designation: string;
  photo?: string;
  children: OrgNode[];
}

const OrgTreeNode = ({ node, level = 0 }: { node: OrgNode; level?: number }) => {
  const [expanded, setExpanded] = useState(level < 2);

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div
        className={`relative bg-white border-2 border-primary-200 rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow cursor-pointer min-w-[200px] ${
          level === 0 ? 'bg-gradient-to-br from-primary-50 to-primary-100 border-primary-400' : ''
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col items-center gap-2">
          {node.photo ? (
            <img
              src={node.photo}
              alt={node.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-primary-300"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center border-2 border-primary-300">
              <Users className="w-8 h-8 text-primary-600" />
            </div>
          )}
          <div className="text-center">
            <p className="font-semibold text-secondary-900 text-sm">{node.name}</p>
            <p className="text-xs text-secondary-600">{node.employeeId}</p>
            <p className="text-xs font-medium text-primary-600 mt-1">{node.designation}</p>
          </div>
          {node.children.length > 0 && (
            <div className="mt-2">
              {expanded ? (
                <ChevronDown className="w-4 h-4 text-primary-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-primary-600" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Vertical Line */}
      {expanded && node.children.length > 0 && (
        <div className="relative flex flex-col items-center">
          <div className="w-0.5 h-8 bg-primary-300"></div>
          
          {/* Horizontal Line */}
          <div className="relative flex items-center justify-center">
            <div className={`w-full h-0.5 bg-primary-300 ${
              node.children.length > 1 ? 'absolute top-0' : ''
            }`} style={{ 
              width: node.children.length > 1 ? '100%' : '0px',
              left: node.children.length > 1 ? '-50%' : '0'
            }}></div>
            
            {/* Children */}
            <div className="flex gap-8 pt-4">
              {node.children.map((child) => (
                <div key={child.id} className="flex flex-col items-center">
                  {/* Vertical line from horizontal to child */}
                  <div className="w-0.5 h-4 bg-primary-300"></div>
                  <OrgTreeNode node={child} level={level + 1} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const OrganizationChart = () => {
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.3, Math.min(2, prev + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const loadData = async () => {
    try {
      const [locationsData, employeesData] = await Promise.all([
        getAllWorkLocations(),
        getEmployees()
      ]);
      setWorkLocations(locationsData);
      setEmployees(employeesData);
      if (locationsData.length > 0) {
        setSelectedLocation(locationsData[0].id!);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildOrgTree = (): OrgNode[] => {
    const location = workLocations.find(loc => loc.id === selectedLocation);
    if (!location) return [];

    const locationEmployees = employees.filter(emp => 
      location.assignedStaff?.includes(emp.id)
    );

    // Define hierarchy levels based on designation
    const hierarchyLevels = [
      ['Manager', 'Director', 'CEO', 'General Manager', 'Managing Director'],
      ['Supervisor', 'Team Lead', 'Foreman', 'Assistant Manager'],
      ['Engineer', 'Technician', 'Specialist', 'Officer'],
      ['Worker', 'Labourer', 'Helper', 'Assistant']
    ];

    // Group employees by hierarchy level
    const levelGroups: Record<number, any[]> = {};
    hierarchyLevels.forEach((_, index) => {
      levelGroups[index] = [];
    });

    // Track unassigned employees
    const unassignedEmployees: any[] = [];

    locationEmployees.forEach(emp => {
      const designation = emp.designation?.toLowerCase() || '';
      let level = 3; // Default to lowest level
      let matched = false;
      
      for (let i = 0; i < hierarchyLevels.length; i++) {
        if (hierarchyLevels[i].some(title => designation.includes(title.toLowerCase()))) {
          level = i;
          matched = true;
          break;
        }
      }
      
      if (matched) {
        levelGroups[level].push(emp);
      } else {
        unassignedEmployees.push(emp);
      }
    });

    // Add unassigned employees to level 3 (workers)
    levelGroups[3].push(...unassignedEmployees);

    // Build tree structure
    const nodes: OrgNode[] = levelGroups[0].map(emp => ({
      id: emp.id,
      name: emp.fullName,
      employeeId: emp.employeeId,
      designation: emp.designation,
      photo: emp.photo,
      children: []
    }));

    // If no managers, use supervisors as top level
    if (nodes.length === 0 && levelGroups[1].length > 0) {
      nodes.push(...levelGroups[1].map(emp => ({
        id: emp.id,
        name: emp.fullName,
        employeeId: emp.employeeId,
        designation: emp.designation,
        photo: emp.photo,
        children: []
      })));
    }

    // If still no nodes, use level 2 as top level
    if (nodes.length === 0 && levelGroups[2].length > 0) {
      nodes.push(...levelGroups[2].map(emp => ({
        id: emp.id,
        name: emp.fullName,
        employeeId: emp.employeeId,
        designation: emp.designation,
        photo: emp.photo,
        children: []
      })));
    }

    // If still no nodes, use level 3 as top level
    if (nodes.length === 0 && levelGroups[3].length > 0) {
      nodes.push(...levelGroups[3].map(emp => ({
        id: emp.id,
        name: emp.fullName,
        employeeId: emp.employeeId,
        designation: emp.designation,
        photo: emp.photo,
        children: []
      })));
    }

    // Add level 1 employees as children of level 0
    nodes.forEach((node, index) => {
      const level1Employees = levelGroups[1].slice(
        Math.floor(index * levelGroups[1].length / nodes.length),
        Math.floor((index + 1) * levelGroups[1].length / nodes.length)
      );
      node.children = level1Employees.map(emp => ({
        id: emp.id,
        name: emp.fullName,
        employeeId: emp.employeeId,
        designation: emp.designation,
        photo: emp.photo,
        children: []
      }));
    });

    // Add level 2 employees as children of level 1
    nodes.forEach(node => {
      node.children.forEach((child, childIndex) => {
        const level2Employees = levelGroups[2].slice(
          Math.floor(childIndex * levelGroups[2].length / node.children.length),
          Math.floor((childIndex + 1) * levelGroups[2].length / node.children.length)
        );
        child.children = level2Employees.map(emp => ({
          id: emp.id,
          name: emp.fullName,
          employeeId: emp.employeeId,
          designation: emp.designation,
          photo: emp.photo,
          children: []
        }));
      });
    });

    // Add level 3 employees as children of level 2
    nodes.forEach(node => {
      node.children.forEach(child => {
        child.children.forEach((grandchild, gcIndex) => {
          const level3Employees = levelGroups[3].slice(
            Math.floor(gcIndex * levelGroups[3].length / child.children.length),
            Math.floor((gcIndex + 1) * levelGroups[3].length / child.children.length)
          );
          grandchild.children = level3Employees.map(emp => ({
            id: emp.id,
            name: emp.fullName,
            employeeId: emp.employeeId,
            designation: emp.designation,
            photo: emp.photo,
            children: []
          }));
        });
      });
    });

    // If there are still unassigned employees at level 3 that weren't added, add them to the last node
    const totalAssigned = nodes.reduce((count, node) => {
      return count + node.children.reduce((childCount, child) => {
        return childCount + child.children.reduce((gcCount, gc) => {
          return gcCount + gc.children.length;
        }, 0);
      }, 0);
    }, 0);

    if (totalAssigned < levelGroups[3].length && nodes.length > 0) {
      const remaining = levelGroups[3].slice(totalAssigned);
      // Add to the last available node at the deepest level
      let lastNode = nodes[nodes.length - 1];
      while (lastNode.children.length > 0) {
        lastNode = lastNode.children[lastNode.children.length - 1];
      }
      lastNode.children = remaining.map(emp => ({
        id: emp.id,
        name: emp.fullName,
        employeeId: emp.employeeId,
        designation: emp.designation,
        photo: emp.photo,
        children: []
      }));
    }

    return nodes;
  };

  const orgTree = buildOrgTree();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-secondary-600">Loading organization chart...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">Organization Chart</h1>
          <p className="text-secondary-600 mt-1">Hierarchical view of organizational structure</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {workLocations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Building2 className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-secondary-600">Work Locations</p>
                <p className="text-2xl font-bold text-secondary-900">{workLocations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-secondary-600">Total Employees</p>
                <p className="text-2xl font-bold text-secondary-900">{employees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ArrowDown className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-secondary-600">Hierarchy Levels</p>
                <p className="text-2xl font-bold text-secondary-900">4</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organization Tree */}
      <Card>
        <CardContent className="p-4">
          {/* Zoom Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="text-sm text-secondary-600">
              Zoom: {Math.round(scale * 100)}%
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setScale(1)}>
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setScale(s => Math.min(2, s + 0.1))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Canvas */}
          <div
            ref={containerRef}
            className="relative overflow-hidden bg-secondary-50 rounded-lg border border-secondary-200"
            style={{ height: '600px' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <div
              className="absolute origin-top-left cursor-grab active:cursor-grabbing"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
              }}
            >
              <div className="flex gap-8 p-8 min-w-max">
                {orgTree.length > 0 ? (
                  <div className="flex gap-8">
                    {orgTree.map(node => (
                      <OrgTreeNode key={node.id} node={node} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-secondary-600">
                    No employees found for this location
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-secondary-500 mt-2">
            Tip: Drag to pan, scroll to zoom
          </p>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-secondary-700 mb-3">Hierarchy Levels</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary-100 border-2 border-primary-400 rounded"></div>
              <span className="text-sm text-secondary-600">Level 1: Management (Manager, Director, CEO)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border-2 border-primary-200 rounded"></div>
              <span className="text-sm text-secondary-600">Level 2: Supervisors (Team Lead, Foreman)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border-2 border-primary-200 rounded"></div>
              <span className="text-sm text-secondary-600">Level 3: Specialists (Engineer, Technician)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border-2 border-primary-200 rounded"></div>
              <span className="text-sm text-secondary-600">Level 4: Workers (Labourer, Helper)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
