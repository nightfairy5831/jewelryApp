<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\DynamicEmail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class PasswordResetController extends Controller
{
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // Return success even if email not found (prevents email enumeration)
            return response()->json([
                'success' => true,
                'message' => 'Se o e-mail estiver cadastrado, você receberá um código de recuperação.',
            ]);
        }

        // Delete any existing tokens for this email
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        // Generate 6-digit code
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Store hashed code
        DB::table('password_reset_tokens')->insert([
            'email' => $request->email,
            'token' => Hash::make($code),
            'created_at' => now(),
        ]);

        // Send email
        $html = "
            <div style='font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;'>
                <h2 style='color: #111827; margin-bottom: 16px;'>Recuperar senha</h2>
                <p style='color: #4b5563; margin-bottom: 24px;'>Use o código abaixo para redefinir sua senha. Ele é válido por 60 minutos.</p>
                <div style='background: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;'>
                    <span style='font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827;'>{$code}</span>
                </div>
                <p style='color: #9ca3af; font-size: 13px;'>Se você não solicitou a recuperação de senha, ignore este e-mail.</p>
            </div>
        ";

        Mail::to($request->email)->send(new DynamicEmail('Código de recuperação de senha', $html));

        return response()->json([
            'success' => true,
            'message' => 'Se o e-mail estiver cadastrado, você receberá um código de recuperação.',
        ]);
    }

    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $record = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Código inválido ou expirado.',
            ], 400);
        }

        // Check expiry (60 minutes)
        if (now()->diffInMinutes($record->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json([
                'success' => false,
                'message' => 'Código expirado. Solicite um novo.',
            ], 400);
        }

        // Verify code
        if (!Hash::check($request->code, $record->token)) {
            return response()->json([
                'success' => false,
                'message' => 'Código inválido ou expirado.',
            ], 400);
        }

        // Update password
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuário não encontrado.',
            ], 404);
        }

        $user->update(['password' => Hash::make($request->password)]);

        // Delete used token
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Senha alterada com sucesso.',
        ]);
    }
}
