import React from 'react';
import {
  InfoOutlined,
  WarningAmberOutlined,
  DeleteOutline,
  CheckCircleOutline,
  HelpOutline,
  ErrorOutline,
  SettingsOutlined,
} from '@mui/icons-material';

export type PopupVariant =
  | 'info'
  | 'warning'
  | 'danger'
  | 'success'
  | 'confirm'
  | 'help'
  | 'error'
  | 'edit';

interface PopupHeaderProps {
  title: string;
  subtitle?: string;
  variant?: PopupVariant;
}

const variantMap: Record<PopupVariant, { Icon: React.ElementType; className: string }> = {
  info: { Icon: InfoOutlined, className: 'text-blue-600 bg-blue-50' },
  help: { Icon: HelpOutline, className: 'text-indigo-600 bg-indigo-50' },
  warning: { Icon: WarningAmberOutlined, className: 'text-amber-600 bg-amber-50' },
  // Confirm ahora usa ícono de pregunta
  confirm: { Icon: HelpOutline, className: 'text-amber-600 bg-amber-50' },
  danger: { Icon: DeleteOutline, className: 'text-red-600 bg-red-50' },
  error: { Icon: ErrorOutline, className: 'text-red-600 bg-red-50' },
  success: { Icon: CheckCircleOutline, className: 'text-green-600 bg-green-50' },
  edit: { Icon: SettingsOutlined, className: 'text-gray-700 bg-gray-100' },
};

export function PopupHeader({ title, subtitle, variant = 'info' }: PopupHeaderProps) {
  const { Icon, className } = variantMap[variant];
  return (
    <div className="mb-4">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${className}`}>
          <Icon sx={{ fontSize: 18 }} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
    </div>
  );
}

export default PopupHeader;
