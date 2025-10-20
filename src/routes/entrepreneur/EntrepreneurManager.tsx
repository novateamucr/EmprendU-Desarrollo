import { Outlet } from 'react-router-dom';

export default function EntrepreneurManager() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1 pt-6" style={{ minHeight: 'calc(100vh - 1.5rem)' }}>
        <div className="w-full h-full overflow-auto p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
