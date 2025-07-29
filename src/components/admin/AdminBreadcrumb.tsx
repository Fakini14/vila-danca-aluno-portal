import { useLocation } from 'react-router-dom';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { 
  Home,
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  Calendar,
  BarChart3,
  Settings
} from 'lucide-react';

const breadcrumbMap: Record<string, { label: string; icon?: any }> = {
  '/admin': { label: 'Admin', icon: Home },
  '/admin/dashboard': { label: 'Dashboard', icon: Home },
  '/admin/students': { label: 'Alunos', icon: Users },
  '/admin/teachers': { label: 'Professores', icon: GraduationCap },
  '/admin/classes': { label: 'Turmas', icon: BookOpen },
  '/admin/finance': { label: 'Financeiro', icon: DollarSign },
  '/admin/events': { label: 'Eventos', icon: Calendar },
  '/admin/reports': { label: 'Relatórios', icon: BarChart3 },
  '/admin/settings': { label: 'Configurações', icon: Settings },
};

export function AdminBreadcrumb() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const breadcrumbInfo = breadcrumbMap[path];
    
    if (!breadcrumbInfo) return null;
    
    const isLast = index === pathSegments.length - 1;
    const Icon = breadcrumbInfo.icon;
    
    return (
      <BreadcrumbItem key={path}>
        {isLast ? (
          <BreadcrumbPage className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4" />}
            {breadcrumbInfo.label}
          </BreadcrumbPage>
        ) : (
          <BreadcrumbLink href={path} className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4" />}
            {breadcrumbInfo.label}
          </BreadcrumbLink>
        )}
      </BreadcrumbItem>
    );
  }).filter(Boolean);

  if (breadcrumbItems.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <div key={index} className="flex items-center">
            {item}
            {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}