import { Outlet } from 'react-router-dom';

export default function EntrepreneurManager() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1 pt-6 3xl:pt-8 4xl:pt-10" style={{ minHeight: 'calc(100vh - 1.5rem)' }}>
        <div className="w-full h-full overflow-auto p-6 3xl:p-8 4xl:p-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
