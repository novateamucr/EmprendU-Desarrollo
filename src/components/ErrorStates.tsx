interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-border p-4 bg-white shadow-sm">
      <p className="text-red-600 font-medium">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="mt-2 px-4 py-2 rounded-lg border border-border hover:bg-brand/10 hover:text-brand transition-colors focus-brand"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

export function ErrorMustLogin({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="max-w-md mx-auto text-center bg-white rounded-xl border border-border p-8 shadow-lg">
        <div className="w-16 h-16 mx-auto mb-4 bg-brand/10 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-primary mb-2">Debes iniciar sesión</h3>
        <p className="text-secondary mb-6">Para ver tu perfil necesitas iniciar sesión en tu cuenta.</p>
        <button 
          onClick={onLogin} 
          className="px-6 py-3 rounded-lg bg-brand text-white hover:bg-brandDark transition-colors font-medium focus-brand"
        >
          Iniciar sesión
        </button>
      </div>
    </div>
  );
}

export function ErrorSessionExpired({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="max-w-md mx-auto text-center bg-white rounded-xl border border-border p-8 shadow-lg">
        <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-primary mb-2">Tu sesión venció</h3>
        <p className="text-secondary mb-6">Por seguridad, necesitas volver a iniciar sesión para continuar.</p>
        <button 
          onClick={onLogin} 
          className="px-6 py-3 rounded-lg bg-brand text-white hover:bg-brandDark transition-colors font-medium focus-brand"
        >
          Iniciar sesión
        </button>
      </div>
    </div>
  );
}

export function ErrorSystem({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="max-w-md mx-auto text-center bg-white rounded-xl border border-border p-8 shadow-lg">
        <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-primary mb-2">Error del sistema</h3>
        <p className="text-secondary mb-6">Estamos trabajando para resolverlo. Puedes intentar de nuevo.</p>
        <button 
          onClick={onRetry} 
          className="px-6 py-3 rounded-lg border border-border text-primary hover:bg-brand/10 hover:text-brand transition-colors font-medium focus-brand"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

export function ErrorDB({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="max-w-md mx-auto text-center bg-white rounded-xl border border-border p-8 shadow-lg">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-primary mb-2">Problemas de conexión</h3>
        <p className="text-secondary mb-6">Tenemos problemas temporales con la base de datos. Intenta de nuevo en un momento.</p>
        <button 
          onClick={onRetry} 
          className="px-6 py-3 rounded-lg border border-border text-primary hover:bg-brand/10 hover:text-brand transition-colors font-medium focus-brand"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
