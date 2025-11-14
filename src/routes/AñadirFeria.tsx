import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Save } from 'lucide-react';
import { Button } from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Card } from '../components/ui/Card';
import { fairApi } from '../services/fairService';
import { userApi, User } from '../services/userService';
import { useToast } from '../hooks/useToast';

type FairForm = {
	title: string;
	description: string;
	address: string;
	province: string;
	canton: string;
	district: string;
	location: string; // composed location label or extra info
	date: string; // dd/mm/yyyy
	time: string; // HH:mm
	user_id: number | '';
	image: string | null; // base64 or url
	is_active: boolean;
};

export default function AñadirFeria() {
	const navigate = useNavigate();
	const params = useParams();
	const editId = useMemo(() => (params?.id ? parseInt(params.id, 10) : null), [params?.id]);
	const isEdit = !!editId;
	const { toast } = useToast();

		// Dynamic CR locations via public API (same approach as AñadirUsuario)
		const [provincias, setProvincias] = useState<{ id: string; nombre: string }[]>([]);
		const [cantonesFiltrados, setCantonesFiltrados] = useState<{ id: string; nombre: string }[]>([]);
		const [distritosFiltrados, setDistritosFiltrados] = useState<{ id: string; nombre: string }[]>([]);
		const [provinciaId, setProvinciaId] = useState<string>('');

	const [users, setUsers] = useState<User[]>([]);
	const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
	const [initialLoading, setInitialLoading] = useState<boolean>(false);
	const [saving, setSaving] = useState<boolean>(false);

	const [form, setForm] = useState<FairForm>({
		title: '',
		description: '',
		address: '',
		province: '',
		canton: '',
		district: '',
		location: '',
		date: '',
		time: '',
		user_id: '',
		image: null,
		is_active: true,
	});

		// Load users for owner select
	useEffect(() => {
		const load = async () => {
			try {
				setLoadingUsers(true);
				const list = await userApi.getAll();
				setUsers(list || []);
			} catch (err) {
				console.error('Error loading users', err);
			} finally {
				setLoadingUsers(false);
			}
		};
		load();
	}, []);

		// Load provinces on mount
		useEffect(() => {
			const loadProvs = async () => {
				try {
					const res = await fetch('https://ubicaciones.paginasweb.cr/provincias.json');
					const data = await res.json();
					const provs = Object.entries(data).map(([id, nombre]) => ({ id, nombre: String(nombre) }));
					setProvincias(provs);
				} catch (e) {
					console.error('Error loading provincias', e);
				}
			};
			loadProvs();
		}, []);

		// Load fair when editing
	useEffect(() => {
		const loadFair = async () => {
			if (!editId) return;
			try {
				setInitialLoading(true);
				const data = await fairApi.getById(editId);
				// Populate form
				setForm({
					title: data.title || '',
					description: data.description || '',
					address: data.address || '',
					province: data.province || '',
					canton: data.canton || '',
					district: data.district || '',
					location: data.location || '',
					date: normalizeDateToDDMMYYYY(data.date || ''),
					time: toHHMM(String(data.time || '')),
					user_id: data.user_id ?? '',
					image: data.image || null,
					is_active: (data.is_active === 1 || data.is_active === true),
				});
			} catch (err) {
				console.error('Error loading fair', err);
				// fallback toast
			} finally {
				setInitialLoading(false);
			}
		};
		loadFair();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [editId]);

		// When province in form changes or provinces loaded, fetch cantons
		useEffect(() => {
			const fetchCantones = async () => {
					// try match by name (case/accent-insensitive) or by id (if legacy value stored)
					const prov = findByNameOrId(provincias, form.province);
				if (!prov) {
					setCantonesFiltrados([]);
					setDistritosFiltrados([]);
					setProvinciaId('');
					return;
				}
				setProvinciaId(prov.id);
				// Normalize province to its display name if needed so the <select> value matches an option
				if (form.province !== prov.nombre) {
					setForm((p) => ({ ...p, province: prov.nombre }));
				}
				try {
					const res = await fetch(`https://ubicaciones.paginasweb.cr/provincia/${prov.id}/cantones.json`);
					const data = await res.json();
					const cant = Object.entries(data).map(([id, nombre]) => ({ id, nombre: String(nombre) }));
					setCantonesFiltrados(cant);
						// If current canton is an id or doesn't match by name, normalize it to the option label
						const normalizedCanton = findByNameOrId(cant, form.canton)?.nombre;
						if (form.canton && normalizedCanton && normalizedCanton !== form.canton) {
							setForm((p) => ({ ...p, canton: normalizedCanton }));
						}
				} catch (e) {
					console.error('Error loading cantones', e);
					setCantonesFiltrados([]);
				}
			};
			if (form.province && provincias.length > 0) {
				fetchCantones();
			}
		}, [form.province, provincias]);

		// When canton changes and provinceId exists, fetch districts
		useEffect(() => {
			const fetchDistritos = async () => {
				if (!provinciaId || !form.canton) {
					setDistritosFiltrados([]);
					return;
				}
					const canton = findByNameOrId(cantonesFiltrados, form.canton);
				if (!canton) {
					setDistritosFiltrados([]);
					return;
				}
				try {
					const res = await fetch(`https://ubicaciones.paginasweb.cr/provincia/${provinciaId}/canton/${canton.id}/distritos.json`);
					const data = await res.json();
					const dist = Object.entries(data).map(([id, nombre]) => ({ id, nombre: String(nombre) }));
					setDistritosFiltrados(dist);
						// Normalize district similarly
						const normalizedDistrict = findByNameOrId(dist, form.district)?.nombre;
						if (form.district && normalizedDistrict && normalizedDistrict !== form.district) {
							setForm((p) => ({ ...p, district: normalizedDistrict }));
						}
				} catch (e) {
					console.error('Error loading distritos', e);
					setDistritosFiltrados([]);
				}
			};
			fetchDistritos();
		}, [provinciaId, form.canton, cantonesFiltrados]);

	// Handlers
	const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setForm((p) => ({ ...p, [name]: name === 'user_id' ? (value ? Number(value) : '') : value }));
	};

		const onProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
			const prov = e.target.value;
			setForm((p) => ({ ...p, province: prov, canton: '', district: '' }));
			// cantones/distritos are fetched via effects
		};
		const onCantonChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
			const canton = e.target.value;
			setForm((p) => ({ ...p, canton, district: '' }));
			// distritos fetched via effects
		};

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
			// Debug: log current form before any validation/submit
			console.log('[AñadirFeria] onSubmit -> current form state:', JSON.parse(JSON.stringify(form)));
		// Basic validation
		if (!form.title || !form.user_id || !form.date || !form.time || !form.province || !form.canton || !form.district) {
			toast({ title: 'Campos requeridos', description: 'Completa título, fecha, hora, ubicación y usuario', variant: 'destructive' });
			return;
		}
		try {
			setSaving(true);
			const payload = {
				title: form.title,
				description: form.description || null,
				address: form.address || null,
				province: form.province || null,
				canton: form.canton || null,
				district: form.district || null,
				location: form.location || null,
				date: form.date, // dd/mm/yyyy as required
				time: form.time,
				image: form.image || null,
				user_id: Number(form.user_id),
				is_active: form.is_active ? 1 : 0,
			} as any;

				// Debug: log payload about to be sent
				console.log('[AñadirFeria] about to submit payload:', payload, { isEdit, editId });

			if (isEdit && editId) {
					console.log('[AñadirFeria] calling fairApi.update');
				await fairApi.update(editId, payload);
				toast({ title: 'Feria actualizada', variant: 'success', description: 'Se guardaron los cambios.' });
			} else {
					console.log('[AñadirFeria] calling fairApi.create');
				await fairApi.create(payload);
				toast({ title: 'Feria creada', variant: 'success', description: 'Se creó la feria exitosamente.' });
			}
			navigate('/admin/ferias');
		} catch (err: any) {
			console.error('Error saving fair', err);
			toast({ title: 'Error', description: err?.message || 'No se pudo guardar la feria', variant: 'destructive' });
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="container mx-auto px-4 py-8 max-w-3xl mt-10">
			<div className="mb-8">
				<h1 className="text-2xl font-bold mb-2">{isEdit ? 'Editar feria' : 'Nueva feria'}</h1>
				<p className="text-muted-foreground">{isEdit ? 'Actualiza la información de la feria.' : 'Completa la información para crear una feria.'}</p>
			</div>

			<Card className="p-6">
				<form onSubmit={onSubmit}>
					<div className="space-y-6">
						{initialLoading ? (
							<div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
						) : (
							<>
								{/* Title */}
								<div>
									<label htmlFor="title" className="block text-sm font-medium mb-1">Título *</label>
									<Input id="title" name="title" value={form.title} onChange={onChange} placeholder="Ej: Feria de Emprendedores de San José" required />
								</div>

								{/* Description */}
								<div>
									<label htmlFor="description" className="block text-sm font-medium mb-1">Descripción</label>
									<Textarea id="description" name="description" value={form.description} onChange={onChange} rows={4} placeholder="Describe la feria..." />
								</div>

								{/* Address */}
								<div>
									<label htmlFor="address" className="block text-sm font-medium mb-1">Dirección</label>
									<Input id="address" name="address" value={form.address} onChange={onChange} placeholder="Dirección exacta" />
								</div>

								{/* Location selects */}
												<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
									<div>
										<label className="block text-sm font-medium mb-1">Provincia *</label>
										<select
											value={form.province}
											onChange={onProvinceChange}
											className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
										>
											<option value="">Selecciona provincia</option>
																	{provincias.map((p) => (
																		<option key={p.id} value={p.nombre}>{p.nombre}</option>
																	))}
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium mb-1">Cantón *</label>
										<select
											value={form.canton}
											onChange={onCantonChange}
																	disabled={!form.province}
											className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
										>
											<option value="">Selecciona cantón</option>
																	{cantonesFiltrados.map((c) => (
																		<option key={c.id} value={c.nombre}>{c.nombre}</option>
																	))}
										</select>
									</div>
															<div>
																<label className="block text-sm font-medium mb-1">Distrito *</label>
																<select
																	value={form.district}
																	onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))}
																	disabled={!form.canton}
																	className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
																>
																	<option value="">Selecciona distrito</option>
																	{distritosFiltrados.map((d) => (
																		<option key={d.id} value={d.nombre}>{d.nombre}</option>
																	))}
																</select>
															</div>
								</div>

								{/* Extra location field */}
								<div>
									<label htmlFor="location" className="block text-sm font-medium mb-1">Ubicación (opcional)</label>
									<Input id="location" name="location" value={form.location} onChange={onChange} placeholder="Ej: Parque Central, frente a la iglesia" />
								</div>

								{/* Date and time */}
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<label htmlFor="date" className="block text-sm font-medium mb-1">Fecha (dd/mm/aaaa) *</label>
										<Input id="date" name="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: enforceDDMMYYYY(e.target.value) }))} placeholder="dd/mm/aaaa" inputMode="numeric" />
									</div>
									<div>
										<label htmlFor="time" className="block text-sm font-medium mb-1">Hora *</label>
										<Input id="time" name="time" type="time" value={form.time} onChange={onChange} />
									</div>
								</div>

								{/* Owner */}
								<div>
									<label htmlFor="user_id" className="block text-sm font-medium mb-1">Usuario dueño *</label>
									<select
										id="user_id"
										name="user_id"
										value={String(form.user_id)}
										onChange={onChange}
										disabled={loadingUsers}
										className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
										required
									>
										<option value="">Selecciona un usuario</option>
										{users.map(u => (
											<option key={u.id} value={u.id}>{u.name}</option>
										))}
									</select>
								</div>

								{/* Actions */}
												<div className="flex justify-end gap-3 pt-2">
									<Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={saving}>Cancelar</Button>
													<Button
														type="submit"
														disabled={saving}
														onClick={() => {
															// Debug: log on click in case HTML5 validation prevents onSubmit firing
															console.log('[AñadirFeria] submit button clicked. Current form state:', JSON.parse(JSON.stringify(form)));
														}}
													>
										{saving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>) : (<><Save className="mr-2 h-4 w-4" />Guardar</>)}
									</Button>
								</div>
							</>
						)}
					</div>
				</form>
			</Card>
		</div>
	);
}

// Helpers
function enforceDDMMYYYY(value: string): string {
	// Keep only digits and slashes, format as dd/mm/yyyy
	let v = value.replace(/[^0-9/]/g, '');
	if (v.length > 10) v = v.slice(0, 10);
	// Auto-insert slashes
	if (/^\d{3}$/.test(v)) v = v.slice(0,2) + '/' + v.slice(2);
	if (/^\d{2}\/\d{3}$/.test(v)) v = v.slice(0,5) + '/' + v.slice(5);
	return v;
}

function normalizeDateToDDMMYYYY(dateStr: string): string {
	if (!dateStr) return '';
	// If already dd/mm/yyyy
	if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) return dateStr;
	const d = new Date(dateStr);
	if (isNaN(d.getTime())) return '';
	const dd = String(d.getDate()).padStart(2, '0');
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const yyyy = d.getFullYear();
	return `${dd}/${mm}/${yyyy}`;
}

// Convert various time formats to 24h HH:mm acceptable by <input type="time">
function toHHMM(src: string): string {
	if (!src) return '';
	// If already HH:mm
	const exact = src.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
	if (exact) return `${exact[1].padStart(2, '0')}:${exact[2]}`;
	// Try to extract first time from ranges like "10:00 AM - 5:00pm" or "10:00AM-17:30"
	const timeLike = src.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
	if (timeLike) {
		let h = parseInt(timeLike[1], 10);
		const m = timeLike[2];
		const ampm = (timeLike[3] || '').toLowerCase();
		if (ampm === 'pm' && h < 12) h += 12;
		if (ampm === 'am' && h === 12) h = 0;
		if (h >= 0 && h <= 23) {
			return `${String(h).padStart(2, '0')}:${m}`;
		}
	}
	return '';
}

// Helpers to find option by display name (case/accents-insensitive) or by id string.
function normalizeString(s: string): string {
	return s
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim();
}

function findByNameOrId<T extends { id: string; nombre: string }>(list: T[], value: string): T | undefined {
	if (!value) return undefined;
	// direct name match (case/accents-insensitive)
	const norm = normalizeString(String(value));
	const byName = list.find((it) => normalizeString(it.nombre) === norm);
	if (byName) return byName;
	// id match: some legacy records might store the numeric id as string in DB
	const byId = list.find((it) => String(it.id) === String(value));
	return byId;
}