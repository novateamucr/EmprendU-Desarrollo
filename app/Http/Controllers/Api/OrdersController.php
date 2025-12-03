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

use App\Mail\PedidoRealizadoMailable;
use Illuminate\Support\Facades\Mail;
use App\Models\User;

class OrdersController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->query('user_id');

        if (!$userId) {
            return response()->json(['error' => 'User ID is required'], 400);
        }

        $orders = Order::with(['entrepreneurship', 'items.product', 'items.orderOptions', 'additionalLocation'])
            ->where('user_id', (int) $userId)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($orders);
    }
    public function store(StoreOrderRequest $request)
    {

        
        $data = $request->validated();
        \Log::info('Order creation request data:', $data);

        // Get the authenticated user's ID
        $userId = $request->user()?->id;
        \Log::info('Authenticated user ID:', ['user_id' => $userId]);

        // If user is not authenticated but we have a user_id in the request, use it
        if (!$userId && isset($data['user_id'])) {
            $userId = $data['user_id'];
            \Log::info('Using user_id from request:', ['user_id' => $userId]);
        } else {
            \Log::info('No user_id available from request or authentication');
        }

        // Allow any user to create orders, except if they manage the entrepreneurship (self-order)
        $eid = (int) $data['entrepreneurship_id'];
        if ($userId && Gate::allows('manage-entrepreneurship', $eid)) {
            abort(403, 'No puedes hacer pedidos a tu propio emprendimiento.');
        }

        $orderData = [
            'entrepreneurship_id' => $data['entrepreneurship_id'],
            'user_id' => $userId,
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
            'additional_location_id' => $data['additional_location_id'] ?? null,
        ];

        $order = Order::create($orderData);
        $this->recalculateTotals($order);
        $order->refresh(); 
        $order->load(['entrepreneurship.owner', 'items.product', 'items.orderOptions']);

        // Obtener usuario comprador
        $usuario = $order->user;

        // Obtener emprendedor dueño del emprendimiento (propietario)
        $emprendedor = $order->entrepreneurship->owner ?? null;

        // Para el emprendedor
        Mail::to($emprendedor->email)
            ->send(new PedidoRealizadoMailable($order, $emprendedor, $usuario, 'emprendedor'));

        // Enviar correo al usuario
        if ($usuario && $usuario->email) {
            Mail::to($usuario->email)
                ->send(new PedidoRealizadoMailable($order, $usuario, $emprendedor));
        }

        // Enviar correo al emprendedor
      /*  if ($emprendedor && $emprendedor->email) {
            Mail::to($emprendedor->email)
                ->send(new PedidoRealizadoMailable($order, $emprendedor, $usuario));
        }*/
        
        \Log::info('Creating order with data:', $orderData);
       // $order = Order::create($orderData);

       // $this->recalculateTotals($order);

        return new OrderResource($order->load(['entrepreneurship', 'items.product', 'items.orderOptions', 'additionalLocation']));
    }
    public function addItem(StoreOrderItemRequest $request, Order $order)
    {
        // Verify if the order can be modified
        if (!in_array($order->status, ['pending', 'draft'])) {
            return response()->json([
                'message' => 'Cannot modify order. Order must be in draft or pending status.'
            ], 403);
        }

        $data = $request->validated();
        $product = Product::findOrFail($data['product_id']);

        // Calculate options total
        $optionsDeltaSum = 0.0;
        $optionsInput = $data['order_item_options'] ?? [];
        
        foreach ($optionsInput as $opt) {
            $optionsDeltaSum += (float) $opt['price_delta'];
        }

        $unitBase = (float) $data['unit_price'];
        $qty = (int) $data['quantity'];
        $unitWithOptions = $unitBase + $optionsDeltaSum;
        $totalPrice = $unitWithOptions * $qty;

        // Start a database transaction
        return \DB::transaction(function () use ($order, $product, $qty, $unitBase, $totalPrice, $optionsInput) {
            // Create the order item
            $item = OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'product_name' => $product->name, // Store product name at the time of order
                'quantity' => $qty,
                'unit_price' => $unitBase,
                'total_price' => $totalPrice,
                'notes' => request('notes', '') // Add notes if provided
            ]);

            // Add options if any (table does not have FK columns for product options)
            if (!empty($optionsInput)) {
                $options = [];
                foreach ($optionsInput as $opt) {
                    $options[] = [
                        'order_item_id' => $item->id,
                        'option_name'   => $opt['option_name'],
                        'option_value'  => $opt['option_value'] ?? null,
                        'price_delta'   => $opt['price_delta'],
                    ];
                }
                OrderItemOption::insert($options);
            }

            // Recalculate order totals
            $this->recalculateTotals($order);
            $order->refresh();

            return response()->json([
                'message' => 'Item added to order successfully',
                'order' => $order->load(['items.product', 'items.orderOptions'])
            ], 201);
        });
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

        // Check if the authenticated user is the one who placed the order
        $isOrderUser = false;
        if (\Illuminate\Support\Facades\Auth::check()) {
            $user = \Illuminate\Support\Facades\Auth::user();
            $isOrderUser = $order->user_id === $user->id;
        }

        if (!$isOwner && !$isOrderUser) {
            abort(403, 'No autorizado para cambiar el estado del pedido.');
        }

        // If user is the order owner, allow canceling the order if it's not already completed/rated
        if ($isOrderUser && $next === Order::STATUS_CANCELED) {
            // Only allow canceling if order is in a cancelable state
            if (in_array($currentKey, [Order::STATUS_DRAFT, Order::STATUS_REQUESTED, Order::STATUS_ACCEPTED])) {
                $order->update(['status' => $next]);
                return new OrderResource($order->load(['items.orderOptions']));
            }
            abort(422, 'No se puede cancelar un pedido en su estado actual.');
        }

        // Allow customer to submit order (draft -> requested)
        if ($isOrderUser && $currentKey === Order::STATUS_DRAFT && $next === Order::STATUS_REQUESTED) {
            $order->update(['status' => $next]);
            return new OrderResource($order->load(['items.orderOptions']));
        }

        // If we reach here and it's not the owner, deny the action
        if (!$isOwner) {
            abort(403, 'No autorizado para realizar esta acción.');
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
        $relations = ['entrepreneurship', 'additionalLocation'];
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
            $with[] = 'additionalLocation';
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

        $query = Order::with(['entrepreneurship', 'additionalLocation'])
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
