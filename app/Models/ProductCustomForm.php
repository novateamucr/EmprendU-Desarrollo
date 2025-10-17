<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductCustomForm extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id','label','input_type','required','max_length','help_text','display_order'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
