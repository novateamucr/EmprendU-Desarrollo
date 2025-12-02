import { useState } from 'react';
import { Rol } from '../types/user';
import { Modal } from './Modal';

interface RoleSelectorProps {
  value: Rol;
  onChange: (role: Rol) => void;
  onRoleChangeWarning?: (fromRole: Rol, toRole: Rol) => void;
}

export function RoleSelector({ value, onChange, onRoleChangeWarning }: RoleSelectorProps) {
  const [showEmprendedorModal, setShowEmprendedorModal] = useState(false);
  const [showCompradorModal, setShowCompradorModal] = useState(false);

  const handleRoleChange = (newRole: Rol) => {
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
      <div className="flex bg-background dark:bg-cardDark rounded-full p-1 w-fit">
        <button
          type="button"
          onClick={() => handleRoleChange('comprador')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
            value === 'comprador'
              ? 'bg-white text-primary shadow-sm dark:bg-white dark:text-primary'
              : 'text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          Comprador
        </button>
        <button
          type="button"
          onClick={() => handleRoleChange('emprendedor')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
            value === 'emprendedor'
              ? 'bg-white text-primary shadow-sm dark:bg-white dark:text-primary'
              : 'text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          Emprendedor
        </button>
      </div>

      {/* Modal de confirmación para Emprendedor */}
      <Modal
        isOpen={showEmprendedorModal}
        onClose={() => setShowEmprendedorModal(false)}
        title="Cambio de rol a Emprendedor"
        variant="confirm"
      >
        <div className="space-y-4 text-sm text-secondary dark:text-gray-300">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-900/20 dark:border-green-700">
            <p className="font-medium text-green-800 mb-2 dark:text-green-300">
              ✓ Confirmación: Cambio a Emprendedor
            </p>
            <p className="text-green-700 dark:text-green-200">
              Al cambiar a emprendedor, podrá crear y gestionar sus propios emprendimientos, 
              participar en ferias virtuales y conectar directamente con compradores.
            </p>
          </div>
          
          <p>
            <strong>Recuerde:</strong> Podrá seguir comprando productos de otros emprendedores. 
            Su condición de emprendedor será visible para otros usuarios.
          </p>
          
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Puede cambiar de rol en cualquier momento desde su perfil.
          </p>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowEmprendedorModal(false)}
              className="px-4 py-2 bg-gray-200 text-secondary rounded-lg font-medium hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={confirmEmprendedor}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors dark:bg-green-600 dark:hover:bg-green-700"
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
        <div className="space-y-4 text-sm text-secondary dark:text-gray-300">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/20 dark:border-blue-700">
            <p className="font-medium text-blue-800 mb-2 dark:text-blue-300">
              ✓ Confirmación: Cambio a Comprador
            </p>
            <p className="text-blue-700 dark:text-blue-200">
              Al cambiar a comprador, podrá explorar y comprar productos de emprendedores, 
              participar en ferias virtuales y conectar con vendedores.
            </p>
          </div>
          
          <p>
            <strong>Recuerde:</strong> Podrá cambiar a emprendedor en cualquier momento 
            si desea vender sus propios productos.
          </p>
          
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Puede cambiar de rol en cualquier momento desde su perfil.
          </p>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowCompradorModal(false)}
              className="px-4 py-2 bg-gray-200 text-secondary rounded-lg font-medium hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={confirmComprador}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              Confirmar cambio
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
