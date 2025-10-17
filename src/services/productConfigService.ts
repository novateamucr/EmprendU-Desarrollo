import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://emprendu-backend.test/api').replace(/\/+$/, '');
const API_URL = `${API_BASE_URL}`;

export type OptionType = 'select'|'multiselect'|'text'|'number'|'boolean'|'file';
export type CustomInputType = 'text'|'textarea'|'number'|'file'|'boolean'|'date';

export interface ProductOption {
  id: number;
  product_id: number;
  name: string;
  type: OptionType;
  required: boolean;
  display_order: number;
  min_select?: number | null;
  max_select?: number | null;
}

export interface ProductOptionValue {
  id: number;
  product_option_id: number;
  value: string;
  price_modifier: number;
  image_url?: string | null;
  sku_suffix?: string | null;
  display_order: number;
}

export interface ProductCustomForm {
  id: number;
  product_id: number;
  label: string;
  input_type: CustomInputType;
  required: boolean;
  max_length?: number | null;
  help_text?: string | null;
  display_order: number;
}

// Product Options
export async function getProductOptions(productId: number): Promise<ProductOption[]> {
  const res = await axios.get(`${API_URL}/products/${productId}/options`);
  const d = (res.data && 'data' in res.data) ? res.data.data : res.data;
  return d || [];
}

export async function createProductOption(productId: number, payload: Omit<ProductOption,'id'|'product_id'>): Promise<ProductOption> {
  const res = await axios.post(`${API_URL}/products/${productId}/options`, payload);
  const d = (res.data && 'data' in res.data) ? res.data.data : res.data;
  return d as ProductOption;
}

export async function updateProductOption(productId: number, optionId: number, payload: Partial<Omit<ProductOption,'id'|'product_id'>>): Promise<ProductOption> {
  const res = await axios.put(`${API_URL}/products/${productId}/options/${optionId}`, payload);
  const d = (res.data && 'data' in res.data) ? res.data.data : res.data;
  return d as ProductOption;
}

export async function deleteProductOption(productId: number, optionId: number): Promise<void> {
  await axios.delete(`${API_URL}/products/${productId}/options/${optionId}`);
}

// Option Values
export async function getOptionValues(productId: number, optionId: number): Promise<ProductOptionValue[]> {
  const res = await axios.get(`${API_URL}/products/${productId}/options/${optionId}/values`);
  const d = (res.data && 'data' in res.data) ? res.data.data : res.data;
  return d || [];
}

export async function createOptionValue(productId: number, optionId: number, payload: Omit<ProductOptionValue,'id'|'product_option_id'>): Promise<ProductOptionValue> {
  const res = await axios.post(`${API_URL}/products/${productId}/options/${optionId}/values`, payload);
  const d = (res.data && 'data' in res.data) ? res.data.data : res.data;
  return d as ProductOptionValue;
}

export async function updateOptionValue(productId: number, optionId: number, valueId: number, payload: Partial<Omit<ProductOptionValue,'id'|'product_option_id'>>): Promise<ProductOptionValue> {
  const res = await axios.put(`${API_URL}/products/${productId}/options/${optionId}/values/${valueId}`, payload);
  const d = (res.data && 'data' in res.data) ? res.data.data : res.data;
  return d as ProductOptionValue;
}

export async function deleteOptionValue(productId: number, optionId: number, valueId: number): Promise<void> {
  await axios.delete(`${API_URL}/products/${productId}/options/${optionId}/values/${valueId}`);
}

// Custom Forms
export async function getCustomForms(productId: number): Promise<ProductCustomForm[]> {
  const res = await axios.get(`${API_URL}/products/${productId}/custom-forms`);
  const d = (res.data && 'data' in res.data) ? res.data.data : res.data;
  return d || [];
}

export async function createCustomForm(productId: number, payload: Omit<ProductCustomForm,'id'|'product_id'>): Promise<ProductCustomForm> {
  const res = await axios.post(`${API_URL}/products/${productId}/custom-forms`, payload);
  const d = (res.data && 'data' in res.data) ? res.data.data : res.data;
  return d as ProductCustomForm;
}

export async function updateCustomForm(productId: number, customFormId: number, payload: Partial<Omit<ProductCustomForm,'id'|'product_id'>>): Promise<ProductCustomForm> {
  const res = await axios.put(`${API_URL}/products/${productId}/custom-forms/${customFormId}`, payload);
  const d = (res.data && 'data' in res.data) ? res.data.data : res.data;
  return d as ProductCustomForm;
}

export async function deleteCustomForm(productId: number, customFormId: number): Promise<void> {
  await axios.delete(`${API_URL}/products/${productId}/custom-forms/${customFormId}`);
}
