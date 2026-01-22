<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    // Get all Q&A messages for the current user (when they are the seller)
    public function myQuestions(Request $request)
    {
        $messages = Message::with(['fromUser', 'toUser'])
            ->where('to_user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($message) {
                return [
                    'id' => $message->id,
                    'from_user_id' => $message->from_user_id,
                    'from_user_name' => $message->fromUser->name,
                    'to_user_id' => $message->to_user_id,
                    'to_user_name' => $message->toUser->name,
                    'question' => $message->question,
                    'answer' => $message->answer,
                    'answered_at' => $message->answered_at?->toISOString(),
                    'created_at' => $message->created_at->toISOString(),
                ];
            });

        return response()->json($messages);
    }

    // Get all Q&A messages for a specific seller (to_user_id)
    public function index(Request $request)
    {
        $request->validate([
            'seller_id' => 'required|integer|exists:users,id',
        ]);

        $messages = Message::with(['fromUser', 'toUser'])
            ->where('to_user_id', $request->seller_id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($message) {
                return [
                    'id' => $message->id,
                    'from_user_id' => $message->from_user_id,
                    'from_user_name' => $message->fromUser->name,
                    'to_user_id' => $message->to_user_id,
                    'to_user_name' => $message->toUser->name,
                    'question' => $message->question,
                    'answer' => $message->answer,
                    'answered_at' => $message->answered_at?->toISOString(),
                    'created_at' => $message->created_at->toISOString(),
                ];
            });

        return response()->json($messages);
    }

    // Create a new question
    public function store(Request $request)
    {
        $request->validate([
            'to_user_id' => 'required|integer|exists:users,id',
            'question' => 'required|string|max:1000',
        ]);

        $message = Message::create([
            'from_user_id' => $request->user()->id,
            'to_user_id' => $request->to_user_id,
            'question' => $request->question,
        ]);

        $message->load(['fromUser', 'toUser']);

        return response()->json([
            'id' => $message->id,
            'from_user_id' => $message->from_user_id,
            'from_user_name' => $message->fromUser->name,
            'to_user_id' => $message->to_user_id,
            'to_user_name' => $message->toUser->name,
            'question' => $message->question,
            'answer' => $message->answer,
            'answered_at' => null,
            'created_at' => $message->created_at->toISOString(),
        ], 201);
    }

    // Answer a question (only the seller can answer)
    public function answer(Request $request, $id)
    {
        $request->validate([
            'answer' => 'required|string|max:1000',
        ]);

        $message = Message::findOrFail($id);

        // Only the recipient (seller) can answer
        if ($message->to_user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $message->update([
            'answer' => $request->answer,
            'answered_at' => now(),
        ]);

        $message->load(['fromUser', 'toUser']);

        return response()->json([
            'id' => $message->id,
            'from_user_id' => $message->from_user_id,
            'from_user_name' => $message->fromUser->name,
            'to_user_id' => $message->to_user_id,
            'to_user_name' => $message->toUser->name,
            'question' => $message->question,
            'answer' => $message->answer,
            'answered_at' => $message->answered_at->toISOString(),
            'created_at' => $message->created_at->toISOString(),
        ]);
    }

    // Delete a question (only the asker can delete)
    public function destroy(Request $request, $id)
    {
        $message = Message::findOrFail($id);

        if ($message->from_user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $message->delete();

        return response()->json(['message' => 'Question deleted successfully']);
    }
}
