<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderItemRequest;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemOption;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class OrdersController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->query('user_id');

        if (!$userId) {
            return response()->json(['error' => 'User ID is required'], 400);
        }

        $orders = Order::with(['entrepreneurship', 'items.product', 'items.orderOptions'])
            ->where('user_id', (int) $userId)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($orders);
    }
    public function store(StoreOrderRequest $request)
    {
        $data = $request->validated();

        // Get the authenticated user's ID
        $userId = $request->user()?->id;

        // If user is not authenticated but we have a user_id in the request, use it
        if (!$userId && isset($data['user_id'])) {
            $userId = $data['user_id'];
        }

        // Allow any user to create orders, except if they manage the entrepreneurship (self-order)
        $eid = (int) $data['entrepreneurship_id'];
        if ($userId && Gate::allows('manage-entrepreneurship', $eid)) {
            abort(403, 'No puedes hacer pedidos a tu propio emprendimiento.');
        }

        $order = Order::create([
            'entrepreneurship_id' => $data['entrepreneurship_id'],
            'user_id' => $userId, // This will be null if user is not authenticated and no user_id provided
            'customer_name' => $data['customer_name'],
            'customer_phone_8' => $data['customer_phone_8'],
            'customer_email' => $data['customer_email'],
            'status' => $data['status'] ?? Order::STATUS_DRAFT,
            'shipping_total' => $data['shipping_total'] ?? 0,
            'discount_total' => $data['discount_total'] ?? 0,
            'items_total' => 0,
            'options_total' => 0,
            'grand_total' => 0,
            'currency' => 'CRC',
            'notes' => $data['notes'] ?? null,
        ]);

        $this->recalculateTotals($order);

        return new OrderResource($order->load(['entrepreneurship', 'items.product', 'items.orderOptions']));
    }
    public function addItem(StoreOrderItemRequest $request, Order $order)
    {
        // Permitir agregar ítems a la orden para clientes; bloquear si el usuario administra el emprendimiento (evitar flujo de auto-pedido)
        if (\Illuminate\Support\Facades\Auth::check() && Gate::allows('manage-entrepreneurship', $order->entrepreneurship_id)) {
            abort(403, 'No puedes modificar pedidos de tu propio emprendimiento en este flujo.');
        }

        $data = $request->validated();
        $product = Product::findOrFail($data['product_id']);

        $optionsDeltaSum = 0.0;
        $optionsInput = $data['order_item_options'] ?? [];
        foreach ($optionsInput as $opt) {
            $optionsDeltaSum += (float) $opt['price_delta'];
        }

        $unitBase = (float) $data['unit_price'];
        $qty = (int) $data['quantity'];
        $unitWithOptions = $unitBase + $optionsDeltaSum;
        $itemOptionsTotal = $optionsDeltaSum * $qty;
        $subtotal = $unitWithOptions * $qty;

        $item = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'quantity' => $qty,
            'unit_price' => $unitBase,
            'options_total' => $itemOptionsTotal,
            'subtotal' => $subtotal,
        ]);

        foreach ($optionsInput as $opt) {
            OrderItemOption::create([
                'order_item_id' => $item->id,
                'product_option_id' => $opt['product_option_id'] ?? null,
                'product_option_value_id' => $opt['product_option_value_id'] ?? null,
                'option_name' => $opt['option_name'],
                'option_value' => $opt['option_value'] ?? null,
                'price_delta' => $opt['price_delta'],
            ]);
        }

        $this->recalculateTotals($order->refresh());

        return new OrderResource($order->load(['items.orderOptions']));
    }

    public function updateStatus(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status' => 'required|in:draft,requested,accepted,canceled,completed,rated',
        ]);

        $current = $order->status;
        $next = $validated['status'];

        // Allowed transitions graph
        $allowed = [
            Order::STATUS_DRAFT => [Order::STATUS_REQUESTED, Order::STATUS_CANCELED],
            Order::STATUS_REQUESTED => [Order::STATUS_ACCEPTED, Order::STATUS_CANCELED],
            Order::STATUS_ACCEPTED => [Order::STATUS_COMPLETED, Order::STATUS_CANCELED],
            Order::STATUS_COMPLETED => [Order::STATUS_RATED],
            Order::STATUS_RATED => [], // terminal
            Order::STATUS_CANCELED => [], // terminal
        ];

        // If current status is not in the map (e.g., legacy), treat as draft for safety
        $currentKey = array_key_exists($current, $allowed) ? $current : Order::STATUS_DRAFT;

        $isOwner = false;
        if (\Illuminate\Support\Facades\Auth::check()) {
            $user = \Illuminate\Support\Facades\Auth::user();
            // Ajusta la relación a tu modelo real si es distinto
            if (method_exists($user, 'entrepreneurships')) {
                $isOwner = $user->entrepreneurships()->whereKey($order->entrepreneurship_id)->exists();
            }
        }

        if (!$isOwner) {
            // Customer path: only allow draft -> requested (customer submits order)
            if ($currentKey === Order::STATUS_DRAFT && $next === Order::STATUS_REQUESTED) {
                $order->update(['status' => $next]);
                return new OrderResource($order->load(['items.orderOptions']));
            }
            abort(403, 'No autorizado para cambiar el estado del pedido.');
        }

        // Entrepreneur path: full transition set (validated below)
        abort_unless(in_array($next, $allowed[$currentKey], true), 422, 'Invalid status transition');
        $order->update(['status' => $next]);
        return new OrderResource($order->load(['items.orderOptions']));
    }

    public function destroy(Request $request, Order $order)
    {
        // Authorization: allow if (a) authenticated user matches order's user_id
        // or (b) matches provided user_id query (for non-auth flows)
        $authUser = optional($request->user());
        $paramUserId = $request->query('user_id');

        $authorized = false;
        if ($authUser && $authUser->id) {
            $authorized = ($order->user_id && (int) $order->user_id === (int) $authUser->id);
        }
        if (!$authorized && $paramUserId) {
            $authorized = (int) $order->user_id === (int) $paramUserId;
        }
        abort_unless($authorized, 403);

        // If requested -> cancel; If draft -> delete permanently
        if ($order->status === Order::STATUS_REQUESTED) {
            $order->update(['status' => Order::STATUS_CANCELED]);
            return new OrderResource($order->load(['items.orderOptions']));
        }

        if ($order->status === Order::STATUS_DRAFT) {
            // delete children first to be safe
            foreach ($order->items as $item) {
                $item->orderOptions()->delete();
            }
            $order->items()->delete();
            $order->delete();
            return response()->noContent();
        }

        // Other statuses: forbid client-side deletion
        abort(422, 'Only draft orders can be deleted; requested orders are canceled.');
    }

    public function show(Request $request, Order $order)
    {
        $isOwner = false;
        if (\Illuminate\Support\Facades\Auth::check()) {
            $user = \Illuminate\Support\Facades\Auth::user();
            if (method_exists($user, 'entrepreneurships')) {
                $isOwner = $user->entrepreneurships()->whereKey($order->entrepreneurship_id)->exists();
            }
        }

        $authorized = $isOwner;
        if (!$authorized) {
            $authUser = optional($request->user());
            $paramUserId = $request->query('user_id');
            if ($authUser && $authUser->id) {
                $authorized = ($order->user_id && (int) $order->user_id === (int) $authUser->id);
            }
            if (!$authorized && $paramUserId) {
                $authorized = (int) $order->user_id === (int) $paramUserId;
            }
        }

        abort_unless($authorized, 403);

        $includeItems = filter_var($request->query('include_items', 'true'), FILTER_VALIDATE_BOOLEAN);
        $relations = ['entrepreneurship'];
        if ($includeItems) {
            $relations[] = 'items.orderOptions';
            $relations[] = 'items.product';
        }
        return new OrderResource($order->load($relations));
    }

    public function forEntrepreneur(Request $request, int $entrepreneurship)
    {
        Gate::authorize('manage-entrepreneurship', (int) $entrepreneurship);

        $query = Order::query()
            ->where('entrepreneurship_id', (int) $entrepreneurship)
            ->orderByDesc('id');

        // Optional status filter: supports status=draft,requested or status[]=draft&status[]=requested
        $status = $request->query('status');
        if ($status) {
            if (is_string($status)) {
                $parts = array_filter(array_map('trim', explode(',', $status)));
                if (!empty($parts)) {
                    $query->whereIn('status', $parts);
                }
            } elseif (is_array($status)) {
                $query->whereIn('status', $status);
            }
        }

        $include = (string) $request->query('include', 'entrepreneurship');
        $with = [];
        if (str_contains($include, 'entrepreneurship')) {
            $with[] = 'entrepreneurship';
        }
        if (str_contains($include, 'items')) {
            $with[] = 'items.orderOptions';
            $with[] = 'items.product';
        }
        if (!empty($with)) {
            $query->with($with);
        }

        $orders = $query->paginate(20);
        return OrderResource::collection($orders);
    }

    public function table(Request $request)
    {
        $eid = (int) $request->query('entrepreneurship_id');
        abort_if(!$eid, 400, 'entrepreneurship_id is required');
        Gate::authorize('manage-entrepreneurship', $eid);

        $query = Order::with(['entrepreneurship'])
            ->where('entrepreneurship_id', $eid)
            ->orderByDesc('id');

        // Optional status filter
        $status = $request->query('status');
        if ($status) {
            if (is_string($status)) {
                $parts = array_filter(array_map('trim', explode(',', $status)));
                if (!empty($parts)) {
                    $query->whereIn('status', $parts);
                }
            } elseif (is_array($status)) {
                $query->whereIn('status', $status);
            }
        }

        $orders = $query->paginate(20);
        return OrderResource::collection($orders);
    }

    protected function recalculateTotals(Order $order): void
    {
        $items = $order->items()->get();
        $itemsTotal = 0.0;
        $optionsTotal = 0.0;
        foreach ($items as $it) {
            $itemsTotal += (float) $it->unit_price * (int) $it->quantity;
            $optionsTotal += (float) $it->options_total;
        }
        $shipping = (float) $order->shipping_total;
        $discount = (float) $order->discount_total;
        $grand = $itemsTotal + $optionsTotal + $shipping - $discount;

        $order->update([
            'items_total' => $itemsTotal,
            'options_total' => $optionsTotal,
            'grand_total' => $grand,
        ]);
    }
}
