
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { userApi } from '../services/userService';
import { entrepreneurshipApi } from '../services/entrepreneurshipService';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

type User = { id: number; name: string; username: string; email: string; created_at?: string };
type Entrepreneurship = { id: number; name: string; created_at: string };

function groupByMonth(items: { created_at?: string }[], year: number) {
	const counts = Array(12).fill(0);
	items.forEach(item => {
		if (item.created_at) {
			const date = new Date(item.created_at);
			if (date.getFullYear() === year) {
				counts[date.getMonth()]++;
			}
		}
	});
	return counts;
}

export default function AdminDashB() {
	const [users, setUsers] = useState<User[]>([]);
	const [entrepreneurships, setEntrepreneurships] = useState<Entrepreneurship[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setLoading(true);
		Promise.all([
			userApi.getAll().then((data) => setUsers(data)),
			entrepreneurshipApi.getAll({ per_page: 1000 }).then((res) => setEntrepreneurships(res.data)),
		])
			.catch(() => setError('Error cargando datos'))
			.finally(() => setLoading(false));
	}, []);

	// Determinar el año actual
	const year = new Date().getFullYear();
	const usersByMonth = groupByMonth(users, year);
	const entreByMonth = groupByMonth(entrepreneurships, year);

	const usersChartData = {
		labels: MONTHS_ES,
		datasets: [
			{
				label: `Usuarios creados en ${year}`,
				data: usersByMonth,
				borderColor: 'rgb(59,130,246)',
				backgroundColor: 'rgba(59,130,246,0.2)',
				tension: 0.3,
				fill: true,
			},
		],
	};

	const entreChartData = {
		labels: MONTHS_ES,
		datasets: [
			{
				label: `Emprendimientos creados en ${year}`,
				data: entreByMonth,
				borderColor: 'rgb(34,197,94)',
				backgroundColor: 'rgba(34,197,94,0.2)',
				tension: 0.3,
				fill: true,
			},
		],
	};

	const chartOptions = {
		responsive: true,
		plugins: {
			legend: { display: true, position: 'top' as const },
			title: { display: false },
		},
		scales: {
			x: { title: { display: true, text: 'Mes' } },
			y: { title: { display: true, text: 'Cantidad' }, beginAtZero: true, precision: 0 },
		},
	};

	if (loading) {
		return <div className="flex justify-center items-center h-96">Cargando...</div>;
	}
	if (error) {
		return <div className="text-red-500 text-center mt-8">{error}</div>;
	}

	return (
		<div className="p-4 md:p-8 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
            
			{/* Usuarios Card */}
			<div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
				<h2 className="text-lg font-semibold mb-4 text-blue-700">Usuarios creados por mes</h2>
				<div className="w-full h-64">
					<Line data={usersChartData} options={chartOptions} />
				</div>
			</div>
			{/* Emprendimientos Card */}
			<div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
				<h2 className="text-lg font-semibold mb-4 text-green-700">Emprendimientos creados por mes</h2>
				<div className="w-full h-64">
					<Line data={entreChartData} options={chartOptions} />
				</div>
			</div>
		</div>
	);
}