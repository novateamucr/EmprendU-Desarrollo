<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductOptionValue extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_option_id','value','price_modifier','image_url','sku_suffix','display_order'
    ];

    public function option()
    {
        return $this->belongsTo(ProductOption::class, 'product_option_id');
    }
}
