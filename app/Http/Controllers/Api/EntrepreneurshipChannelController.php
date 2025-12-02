<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreChannelRequest;
use App\Http\Requests\UpdateChannelRequest;
use App\Http\Resources\EntrepreneurshipChannelResource;
use App\Models\Entrepreneurship;
use App\Models\EntrepreneurshipChannel;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;

class EntrepreneurshipChannelController extends Controller
{
    public function index(Entrepreneurship $entrepreneurship)
    {
        $channels = EntrepreneurshipChannel::with('platform')
            ->where('entrepreneurship_id', $entrepreneurship->id)
            ->orderBy('display_order')
            ->orderByDesc('is_primary')
            ->orderBy('id')
            ->get();

        return EntrepreneurshipChannelResource::collection($channels);
    }

    public function store(StoreChannelRequest $request, Entrepreneurship $entrepreneurship)
    {
        $data = $request->validated();

        // Adaptar nombres del request (pensado para platform_code/url/handle)
        // a las columnas reales de la tabla (channel_type/channel_url/channel_username/handle)
        $channelType = $data['platform_code'] ?? null;
        // La columna channel_url en BD no acepta null, así que normalizamos a '' cuando no hay URL
        $channelUrl = array_key_exists('url', $data) && $data['url'] !== null ? $data['url'] : '';
        $channelUsername = $data['handle'] ?? null;

        $data = [
            'entrepreneurship_id' => $entrepreneurship->id,
            'channel_type' => $channelType,
            'channel_url' => $channelUrl,
            'channel_username' => $channelUsername,
            'handle' => $data['handle'] ?? null,
            'is_primary' => $data['is_primary'] ?? false,
            'is_public' => $data['is_public'] ?? true,
            'display_order' => $data['display_order'] ?? 0,
        ];

        try {
            $channel = EntrepreneurshipChannel::create($data);
        } catch (QueryException $e) {
            $info = $e->errorInfo ?? [];
            return response()->json([
                'message' => 'Could not create channel.',
                'sql_state' => $info[0] ?? null,
                'sql_code' => $info[1] ?? null,
                'sql_error' => $info[2] ?? $e->getMessage(),
            ], 422);
        }

        return (new EntrepreneurshipChannelResource($channel->load('platform')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateChannelRequest $request, Entrepreneurship $entrepreneurship, EntrepreneurshipChannel $channel)
    {
        if ($channel->entrepreneurship_id !== $entrepreneurship->id) {
            return response()->json(['message' => 'Channel does not belong to the specified entrepreneurship.'], 404);
        }

        $data = $request->validated();

        // Mapear cambios a las columnas reales
        $channelType = $data['platform_code'] ?? $channel->channel_type;
        if (array_key_exists('url', $data)) {
            // Si viene url explícitamente en el request, usarla (y si es null, normalizar a '')
            $channelUrl = $data['url'] !== null ? $data['url'] : '';
        } else {
            $channelUrl = $channel->channel_url;
        }
        $channelUsername = array_key_exists('handle', $data) ? $data['handle'] : $channel->channel_username;

        // If channel_type/channel_url are being changed, pre-check duplicate
        if (!empty($channelUrl) && !empty($channelType)) {
            $exists = EntrepreneurshipChannel::where('entrepreneurship_id', $entrepreneurship->id)
                ->where('channel_type', $channelType)
                ->where('channel_url', $channelUrl)
                ->where('id', '!=', $channel->id)
                ->exists();
            if ($exists) {
                return response()->json([
                    'message' => 'Duplicate channel (platform_code + url) for this entrepreneurship.',
                ], 422);
            }
        }

        $updateData = [
            'channel_type' => $channelType,
            'channel_url' => $channelUrl,
            'channel_username' => $channelUsername,
        ];

        if (array_key_exists('is_primary', $data)) {
            $updateData['is_primary'] = $data['is_primary'];
        }
        if (array_key_exists('is_public', $data)) {
            $updateData['is_public'] = $data['is_public'];
        }
        if (array_key_exists('display_order', $data)) {
            $updateData['display_order'] = $data['display_order'];
        }

        $channel->update($updateData);

        return new EntrepreneurshipChannelResource($channel->fresh()->load('platform'));
    }

    public function destroy(Entrepreneurship $entrepreneurship, EntrepreneurshipChannel $channel)
    {
        if ($channel->entrepreneurship_id !== $entrepreneurship->id) {
            return response()->json(['message' => 'Channel does not belong to the specified entrepreneurship.'], 404);
        }

        $channel->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
