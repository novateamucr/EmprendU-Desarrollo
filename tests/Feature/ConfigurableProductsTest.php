<?php

namespace Tests\Feature;

use App\Models\Entrepreneurship;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConfigurableProductsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Ensure default user exists
    }

    public function test_can_create_product_option_and_value(): void
    {
        $user = User::factory()->create();
        $entrepreneurship = Entrepreneurship::create([
            'name' => 'My Shop',
            'description' => 'Desc',
            'category' => 1,
            'image_url' => null,
            'user_id' => $user->id,
        ]);
        $product = Product::create([
            'entrepreneurship_id' => $entrepreneurship->id,
            'name' => 'T-Shirt',
            'description' => 'Cotton',
            'long_description' => null,
            'price' => 5000,
            'image_url' => null,
            'category_id' => 1,
        ]);

        $this->actingAs($user);

        // Create option
        $resp = $this->postJson("/api/products/{$product->id}/options", [
            'name' => 'Size',
            'type' => 'select',
            'required' => true,
            'display_order' => 1,
            'min_select' => 1,
            'max_select' => 1,
        ]);
        $resp->assertStatus(200)->assertJsonPath('data.name', 'Size');
        $optionId = $resp->json('data.id');

        // Add value
        $resp2 = $this->postJson("/api/products/{$product->id}/options/{$optionId}/values", [
            'value' => 'M',
            'price_modifier' => 300,
            'display_order' => 2,
        ]);
        $resp2->assertStatus(200)->assertJsonPath('data.value', 'M');

        // List values ordered by display_order
        $resp3 = $this->getJson("/api/products/{$product->id}/options/{$optionId}/values");
        $resp3->assertStatus(200)->assertJsonStructure(['data']);
        $this->assertEquals('M', $resp3->json('data.0.value'));
    }

    public function test_create_order_add_item_with_options_and_totals(): void
    {
        $user = User::factory()->create();
        $entrepreneurship = Entrepreneurship::create([
            'name' => 'My Shop',
            'description' => 'Desc',
            'category' => 1,
            'image_url' => null,
            'user_id' => $user->id,
        ]);
        $product = Product::create([
            'entrepreneurship_id' => $entrepreneurship->id,
            'name' => 'Mug',
            'description' => 'Ceramic',
            'long_description' => null,
            'price' => 2000,
            'image_url' => null,
            'category_id' => 1,
        ]);

        $this->actingAs($user);

        // Create order
        $orderResp = $this->postJson('/api/orders', [
            'entrepreneurship_id' => $entrepreneurship->id,
            'customer_name' => 'Juan Perez',
            'customer_phone_8' => '88888888',
            'customer_email' => 'juan@example.com',
            'shipping_total' => 1000,
            'discount_total' => 200,
        ]);
        $orderResp->assertStatus(200)->assertJsonPath('data.entrepreneurship_id', $entrepreneurship->id);
        $orderId = $orderResp->json('data.id');

        // Add item with options
        $itemResp = $this->postJson("/api/orders/{$orderId}/items", [
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => 2500,
            'order_item_options' => [
                [
                    'product_option_id' => null,
                    'product_option_value_id' => null,
                    'option_name' => 'Gift Wrap',
                    'option_value' => 'Yes',
                    'price_delta' => 200,
                ]
            ]
        ]);
        $itemResp->assertStatus(200);

        $data = $itemResp->json('data');
        $this->assertEquals(5000.0, (float) $data['items_total']); // unit_price * qty
        $this->assertEquals(400.0, (float) $data['options_total']); // price_delta * qty
        $this->assertEquals(5800.0, (float) $data['grand_total']); // items + options + shipping - discount

        // Confirm item subtotal
        $items = $data['items'];
        $this->assertCount(1, $items);
        $this->assertEquals(5400.0, (float) $items[0]['subtotal']); // (unit + delta) * qty
    }
}
