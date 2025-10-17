<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItemOption extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_item_id','product_option_id','product_option_value_id','option_name','option_value','price_delta'
    ];

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class);
    }
}
