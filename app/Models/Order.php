<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    // Status constants
    public const STATUS_DRAFT = 'draft';
    public const STATUS_REQUESTED = 'requested';
    public const STATUS_ACCEPTED = 'accepted';
    public const STATUS_CANCELED = 'canceled';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_RATED = 'rated';

    protected $fillable = [
        'entrepreneurship_id',
        'user_id',
        'customer_name','customer_phone_8','customer_email',
        'status',
        'items_total','options_total','shipping_total','discount_total','grand_total','currency','notes'
    ];

    protected $attributes = [
        'status' => self::STATUS_DRAFT,
    ];

    public function entrepreneurship()
    {
        return $this->belongsTo(Entrepreneurship::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
