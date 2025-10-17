<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;
    protected $fillable = ['entrepreneurship_id','name','description','long_description','price','image_url','category_id'];

    public function entrepreneurship()
    {
        return $this->belongsTo(Entrepreneurship::class);
    }

    public function options()
    {
        return $this->hasMany(ProductOption::class)->orderBy('display_order');
    }

    public function customForms()
    {
        return $this->hasMany(ProductCustomForm::class)->orderBy('display_order');
    }
}
