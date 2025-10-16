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
        $data['entrepreneurship_id'] = $entrepreneurship->id;

        // Optional: pre-check duplicates to return a friendly 422 instead of DB error
        if (!empty($data['url'])) {
            $exists = EntrepreneurshipChannel::where('entrepreneurship_id', $entrepreneurship->id)
                ->where('platform_code', $data['platform_code'])
                ->where('url', $data['url'])
                ->exists();
            if ($exists) {
                return response()->json([
                    'message' => 'Duplicate channel (platform_code + url) for this entrepreneurship.',
                ], 422);
            }
        }

        try {
            $channel = EntrepreneurshipChannel::create($data);
        } catch (QueryException $e) {
            // handle unique constraint violation gracefully
            return response()->json([
                'message' => 'Could not create channel. It may already exist.',
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

        // If platform_code/url are being changed, pre-check duplicate
        $platformCode = $data['platform_code'] ?? $channel->platform_code;
        $url = array_key_exists('url', $data) ? $data['url'] : $channel->url;
        if (!empty($url)) {
            $exists = EntrepreneurshipChannel::where('entrepreneurship_id', $entrepreneurship->id)
                ->where('platform_code', $platformCode)
                ->where('url', $url)
                ->where('id', '!=', $channel->id)
                ->exists();
            if ($exists) {
                return response()->json([
                    'message' => 'Duplicate channel (platform_code + url) for this entrepreneurship.',
                ], 422);
            }
        }

        $channel->update($data);

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
