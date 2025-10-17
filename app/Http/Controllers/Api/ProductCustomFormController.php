<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductCustomFormRequest;
use App\Http\Requests\UpdateProductCustomFormRequest;
use App\Http\Resources\ProductCustomFormResource;
use App\Models\Product;
use App\Models\ProductCustomForm;
// Gate authorization temporarily disabled

class ProductCustomFormController extends Controller
{
    // Authorization disabled for early release timelines

    public function index(Product $product)
    {
        $forms = $product->customForms()->orderBy('display_order')->get();
        return ProductCustomFormResource::collection($forms);
    }

    public function store(StoreProductCustomFormRequest $request, Product $product)
    {
        $data = $request->validated();
        $data['product_id'] = $product->id;
        $form = ProductCustomForm::create($data);
        return new ProductCustomFormResource($form);
    }

    public function show(Product $product, ProductCustomForm $custom_form)
    {
        abort_if($custom_form->product_id !== $product->id, 404);
        return new ProductCustomFormResource($custom_form);
    }

    public function update(UpdateProductCustomFormRequest $request, Product $product, ProductCustomForm $custom_form)
    {
        abort_if($custom_form->product_id !== $product->id, 404);
        $custom_form->update($request->validated());
        return new ProductCustomFormResource($custom_form);
    }

    public function destroy(Product $product, ProductCustomForm $custom_form)
    {
        abort_if($custom_form->product_id !== $product->id, 404);
        $custom_form->delete();
        return response()->noContent();
    }
}
