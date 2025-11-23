<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Product;
use App\Models\ProductOption;
use App\Models\ProductOptionValue;
use App\Models\ProductCustomForm;

class ProductBuilderController extends Controller
{
    public function show(Product $product)
    {
        $options = $product->options()->orderBy('display_order')->get();
        $valuesByOption = [];
        if ($options->isNotEmpty()) {
            $allValues = DB::table('product_option_values')
                ->whereIn('option_id', $options->pluck('id'))
                ->orderBy('display_order')
                ->get();
            foreach ($allValues as $v) {
                $valuesByOption[$v->option_id][] = [
                    'id' => $v->id,
                    'product_option_id' => $v->option_id, // frontend expects this key
                    'value' => $v->value,
                    'price_modifier' => (float) ($v->price_adjustment ?? 0),
                    'image_url' => null,
                    'sku_suffix' => null,
                    'display_order' => $v->display_order,
                ];
            }
        }

        $forms = $product->customForms()->orderBy('display_order')->get();

        return response()->json([
            'product' => $product->only(['id','entrepreneurship_id','name','description','long_description','price','image_url','category_id']),
            'options' => $options->map(function($o){
                // DB columns: is_required, min_selection, max_selection
                $minSel = $o->min_selection ?? null;
                $maxSel = $o->max_selection ?? null;
                $type = ($maxSel !== null && (int)$maxSel > 1) ? 'multiselect' : 'select';
                return [
                    'id' => $o->id,
                    'product_id' => $o->product_id,
                    'name' => $o->name,
                    'type' => $type,
                    'required' => (bool) ($o->is_required ?? false),
                    'display_order' => $o->display_order,
                    'min_select' => $minSel,
                    'max_select' => $maxSel,
                ];
            })->values(),
            'values' => $valuesByOption,
            'custom_forms' => $forms->map(function($f){
                // DB columns: field_type, is_required, placeholder
                return [
                    'id' => $f->id,
                    'product_id' => $f->product_id,
                    'label' => $f->label,
                    'input_type' => $f->field_type,
                    'required' => (bool) ($f->is_required ?? false),
                    'max_length' => null,
                    'help_text' => $f->placeholder,
                    'display_order' => $f->display_order,
                ];
            })->values(),
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $data = $request->all();

        return DB::transaction(function () use ($data, $product) {
            $idMap = [
                'options' => [],
                'values' => [],
                'custom_forms' => [],
            ];

            // 1) Update base product (optional)
            if (!empty($data['product']) && is_array($data['product'])) {
                $allowed = ['entrepreneurship_id','name','description','long_description','price','image_url','category_id'];
                $update = array_intersect_key($data['product'], array_flip($allowed));
                if (!empty($update)) {
                    // Normalize types
                    if (array_key_exists('price', $update)) {
                        $update['price'] = (float) $update['price'];
                    }
                    if (array_key_exists('category_id', $update)) {
                        $update['category_id'] = (int) $update['category_id'];
                    }
                    if (array_key_exists('entrepreneurship_id', $update)) {
                        $update['entrepreneurship_id'] = (int) $update['entrepreneurship_id'];
                    }
                    $product->update($update);
                }
            }

            // Helpers to resolve real IDs when tempId is provided
            $resolveOptionId = function ($idOrTemp) use (&$idMap) {
                if (is_int($idOrTemp) && $idOrTemp < 0) {
                    return $idMap['options'][(string)$idOrTemp] ?? null;
                }
                return $idOrTemp;
            };

            $resolveValueId = function ($idOrTemp) use (&$idMap) {
                if (is_int($idOrTemp) && $idOrTemp < 0) {
                    return $idMap['values'][(string)$idOrTemp] ?? null;
                }
                return $idOrTemp;
            };

            // 2) Upserts for options (DB: no 'type', uses is_required/min_selection/max_selection)
            if (!empty($data['options']['upserts']) && is_array($data['options']['upserts'])) {
                foreach ($data['options']['upserts'] as $o) {
                    // create
                    if (!empty($o['tempId']) && (int)$o['tempId'] < 0) {
                        $createdId = DB::table('product_options')->insertGetId([
                            'product_id' => $product->id,
                            'name' => $o['name'] ?? '',
                            'is_required' => (bool) ($o['required'] ?? false),
                            'display_order' => (int) ($o['display_order'] ?? 0),
                            'min_selection' => $o['min_select'] ?? null,
                            'max_selection' => $o['max_select'] ?? null,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        $idMap['options'][(string)$o['tempId']] = $createdId;
                    } elseif (!empty($o['id'])) {
                        // update
                        $changes = [];
                        foreach (['name','display_order'] as $k) {
                            if (array_key_exists($k, $o)) {
                                $changes[$k] = $o[$k];
                            }
                        }
                        if (array_key_exists('required', $o)) $changes['is_required'] = (bool)$o['required'];
                        if (array_key_exists('min_select', $o)) $changes['min_selection'] = $o['min_select'];
                        if (array_key_exists('max_select', $o)) $changes['max_selection'] = $o['max_select'];
                        if (!empty($changes)) {
                            $changes['updated_at'] = now();
                            DB::table('product_options')->where('product_id', $product->id)->where('id', (int)$o['id'])->update($changes);
                        }
                    }
                }
            }

            // 3) Upserts for values (DB columns: option_id, price_adjustment)
            if (!empty($data['values']['upserts']) && is_array($data['values']['upserts'])) {
                foreach ($data['values']['upserts'] as $v) {
                    $resolvedOptionId = isset($v['optionId']) ? $resolveOptionId((int)$v['optionId']) : null;
                    if (!$resolvedOptionId) continue;

                    // create
                    if (!empty($v['tempId']) && (int)$v['tempId'] < 0) {
                        $createdId = DB::table('product_option_values')->insertGetId([
                            'option_id' => (int)$resolvedOptionId,
                            'value' => $v['value'] ?? '',
                            'price_adjustment' => (float) ($v['price_modifier'] ?? 0),
                            'display_order' => (int) ($v['display_order'] ?? 0),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        $idMap['values'][(string)$v['tempId']] = $createdId;
                    } elseif (!empty($v['id'])) {
                        // update
                        $changes = [];
                        foreach (['value','display_order'] as $k) {
                            if (array_key_exists($k, $v)) $changes[$k] = $v[$k];
                        }
                        if (array_key_exists('price_modifier', $v)) $changes['price_adjustment'] = (float)$v['price_modifier'];
                        if (!empty($changes)) {
                            $changes['updated_at'] = now();
                            DB::table('product_option_values')
                                ->where('option_id', (int)$resolvedOptionId)
                                ->where('id', (int)$v['id'])
                                ->update($changes);
                        }
                    }
                }
            }

            // 4) Upserts for custom forms (DB: field_type, is_required, placeholder)
            if (!empty($data['custom_forms']['upserts']) && is_array($data['custom_forms']['upserts'])) {
                foreach ($data['custom_forms']['upserts'] as $f) {
                    if (!empty($f['tempId']) && (int)$f['tempId'] < 0) {
                        $createdId = DB::table('product_custom_forms')->insertGetId([
                            'product_id' => $product->id,
                            'label' => $f['label'] ?? '',
                            'field_type' => $f['input_type'] ?? 'text',
                            'is_required' => (bool) ($f['required'] ?? false),
                            'options' => null,
                            'placeholder' => $f['help_text'] ?? null,
                            'display_order' => (int) ($f['display_order'] ?? 0),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        $idMap['custom_forms'][(string)$f['tempId']] = $createdId;
                    } elseif (!empty($f['id'])) {
                        $changes = [];
                        foreach (['label','display_order'] as $k) {
                            if (array_key_exists($k, $f)) $changes[$k] = $f[$k];
                        }
                        if (array_key_exists('input_type', $f)) $changes['field_type'] = $f['input_type'];
                        if (array_key_exists('required', $f)) $changes['is_required'] = (bool)$f['required'];
                        if (array_key_exists('help_text', $f)) $changes['placeholder'] = $f['help_text'];
                        if (!empty($changes)) {
                            $changes['updated_at'] = now();
                            DB::table('product_custom_forms')->where('product_id', $product->id)->where('id', (int)$f['id'])->update($changes);
                        }
                    }
                }
            }

            // 5) Deletes: values first
            if (!empty($data['values']['deletes']) && is_array($data['values']['deletes'])) {
                $ids = array_values(array_filter($data['values']['deletes'], fn($x) => is_int($x) && $x > 0));
                if (!empty($ids)) {
                    ProductOptionValue::whereIn('id', $ids)->delete();
                }
            }

            // 6) Deletes: options and custom forms
            if (!empty($data['options']['deletes']) && is_array($data['options']['deletes'])) {
                $ids = array_values(array_filter($data['options']['deletes'], fn($x) => is_int($x) && $x > 0));
                if (!empty($ids)) {
                    // delete values of those options first to keep FK integrity
                    $vals = DB::table('product_option_values')->whereIn('option_id', $ids)->pluck('id');
                    if ($vals->count() > 0) {
                        DB::table('product_option_values')->whereIn('id', $vals)->delete();
                    }
                    DB::table('product_options')->where('product_id', $product->id)->whereIn('id', $ids)->delete();
                }
            }

            if (!empty($data['custom_forms']['deletes']) && is_array($data['custom_forms']['deletes'])) {
                $ids = array_values(array_filter($data['custom_forms']['deletes'], fn($x) => is_int($x) && $x > 0));
                if (!empty($ids)) {
                    ProductCustomForm::where('product_id', $product->id)->whereIn('id', $ids)->delete();
                }
            }

            // Return latest state
            $options = $product->options()->orderBy('display_order')->get();
            $valuesByOption = [];
            if ($options->isNotEmpty()) {
                $allValues = DB::table('product_option_values')
                    ->whereIn('option_id', $options->pluck('id'))
                    ->orderBy('display_order')
                    ->get();
                foreach ($allValues as $v) {
                    $valuesByOption[$v->option_id][] = [
                        'id' => $v->id,
                        'product_option_id' => $v->option_id,
                        'value' => $v->value,
                        'price_modifier' => (float) ($v->price_adjustment ?? 0),
                        'image_url' => null,
                        'sku_suffix' => null,
                        'display_order' => $v->display_order,
                    ];
                }
            }
            $forms = $product->customForms()->orderBy('display_order')->get();

            return response()->json([
                'success' => true,
                'id_map' => $idMap,
                'product' => $product->fresh()->only(['id','entrepreneurship_id','name','description','long_description','price','image_url','category_id']),
                'options' => $options->map(function($o){
                    $minSel = $o->min_selection ?? null;
                    $maxSel = $o->max_selection ?? null;
                    $type = ($maxSel !== null && (int)$maxSel > 1) ? 'multiselect' : 'select';
                    return [
                        'id' => $o->id,
                        'product_id' => $o->product_id,
                        'name' => $o->name,
                        'type' => $type,
                        'required' => (bool) ($o->is_required ?? false),
                        'display_order' => $o->display_order,
                        'min_select' => $minSel,
                        'max_select' => $maxSel,
                    ];
                })->values(),
                'values' => $valuesByOption,
                'custom_forms' => $forms->map(function($f){
                    return [
                        'id' => $f->id,
                        'product_id' => $f->product_id,
                        'label' => $f->label,
                        'input_type' => $f->field_type,
                        'required' => (bool) ($f->is_required ?? false),
                        'max_length' => null,
                        'help_text' => $f->placeholder,
                        'display_order' => $f->display_order,
                    ];
                })->values(),
            ]);
        });
    }
}
