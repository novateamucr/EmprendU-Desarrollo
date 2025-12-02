import { useState } from 'react';
import type { Rol } from '../domain/profile/types';
import { Modal } from './Modal';

interface RoleSelectorProps {
  value: Rol;
  onChange: (role: Rol) => void;
  onRoleChangeWarning?: (fromRole: Rol, toRole: Rol) => void;
  suppressWarnings?: boolean; // When true, no modals/warnings are shown
  showAdminOption?: boolean;  // When true, show the Administrator toggle button
}

export function RoleSelector({ value, onChange, onRoleChangeWarning, suppressWarnings = false, showAdminOption = false }: RoleSelectorProps) {
  const [showEmprendedorModal, setShowEmprendedorModal] = useState(false);
  const [showCompradorModal, setShowCompradorModal] = useState(false);

  const handleRoleChange = (newRole: Rol) => {
    if (suppressWarnings) {
      onChange(newRole);
      return;
    }

    // Verificar si necesita mostrar advertencia para cambio emprendedor -> comprador
    if (value === 'emprendedor' && newRole === 'comprador' && onRoleChangeWarning) {
      onRoleChangeWarning(value, newRole);
      return;
    }
    
    // Mostrar modal de confirmación para cualquier cambio de rol
    if (newRole === 'emprendedor' && value !== 'emprendedor') {
      setShowEmprendedorModal(true);
    } else if (newRole === 'comprador' && value !== 'comprador') {
      setShowCompradorModal(true);
    } else {
      onChange(newRole);
    }
  };

  const confirmEmprendedor = () => {
    onChange('emprendedor');
    setShowEmprendedorModal(false);
  };

  const confirmComprador = () => {
    onChange('comprador');
    setShowCompradorModal(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex bg-background rounded-full p-1 w-fit dark:bg-backgroundDark">
        <button
          type="button"
          onClick={() => handleRoleChange('comprador')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
            value === 'comprador'
              ? 'bg-white text-primary shadow-sm'
              : 'text-secondary hover:text-primary'
          }`}
        >
          Comprador
        </button>
        <button
          type="button"
          onClick={() => handleRoleChange('emprendedor')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
            value === 'emprendedor'
              ? 'bg-white text-primary shadow-sm dark:bg-brandDark'
              : 'text-secondary hover:text-primary'
          }`}
        >
          Emprendedor
        </button>
        {showAdminOption && (
          <button
            type="button"
            onClick={() => handleRoleChange('administrador')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              value === 'administrador'
                ? 'bg-white text-primary shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            Administrador
          </button>
        )}
      </div>

      {/* Modal de confirmación para Emprendedor */}
      <Modal
        isOpen={showEmprendedorModal}
        onClose={() => setShowEmprendedorModal(false)}
        title="Cambio de rol a Emprendedor"
        variant="confirm"
      >
        <div className="space-y-4 text-sm text-secondary dark:text-secondaryDark">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-900/10 dark:border-green-700">
            <p className="font-medium text-green-800 mb-2 dark:text-green-200">
              ✓ Confirmación: Cambio a Emprendedor
            </p>
            <p className="text-green-700 dark:text-green-200">
              Al cambiar a emprendedor, podrá crear y gestionar sus propios emprendimientos, 
              participar en ferias virtuales y conectar directamente con compradores.
            </p>
          </div>
          
          <p className="dark:text-secondaryDark">
            <strong>Recuerde:</strong> Podrá seguir comprando productos de otros emprendedores. 
            Su condición de emprendedor será visible para otros usuarios.
          </p>
          
          <p className="text-xs text-gray-500 dark:text-secondaryDark">
            Puede cambiar de rol en cualquier momento desde su perfil.
          </p>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowEmprendedorModal(false)}
              className="px-4 py-2 bg-gray-200 text-secondary rounded-lg font-medium hover:bg-gray-300 transition-colors dark:bg-cardDark dark:text-secondaryDark dark:hover:bg-cardDark"
            >
              Cancelar
            </button>
            <button
              onClick={confirmEmprendedor}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors dark:bg-green-500"
            >
              Confirmar cambio
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmación para Comprador */}
      <Modal
        isOpen={showCompradorModal}
        onClose={() => setShowCompradorModal(false)}
        title="Cambio de rol a Comprador"
        variant="confirm"
      >
        <div className="space-y-4 text-sm text-secondary dark:text-secondaryDark">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/10 dark:border-blue-700">
            <p className="font-medium text-blue-800 mb-2 dark:text-blue-200">
              ✓ Confirmación: Cambio a Comprador
            </p>
            <p className="text-blue-700 dark:text-blue-200">
              Al cambiar a comprador, podrá explorar y comprar productos de emprendedores, 
              participar en ferias virtuales y conectar con vendedores.
            </p>
          </div>
          
          <p className="dark:text-secondaryDark">
            <strong>Recuerde:</strong> Podrá cambiar a emprendedor en cualquier momento 
            si desea vender sus propios productos.
          </p>
          
          <p className="text-xs text-gray-500 dark:text-secondaryDark">
            Puede cambiar de rol en cualquier momento desde su perfil.
          </p>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowCompradorModal(false)}
              className="px-4 py-2 bg-gray-200 text-secondary rounded-lg font-medium hover:bg-gray-300 transition-colors dark:bg-cardDark dark:text-secondaryDark dark:hover:bg-cardDark"
            >
              Cancelar
            </button>
            <button
              onClick={confirmComprador}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors dark:bg-blue-500"
            >
              Confirmar cambio
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
