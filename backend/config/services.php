<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'mercadopago' => [
        'mode' => env('MERCADOPAGO_MODE', 'production'),
        'public_key' => env('MERCADOPAGO_PUBLIC_KEY'),
        'access_token' => env('MERCADOPAGO_ACCESS_TOKEN'),
        'client_id' => env('MERCADOPAGO_CLIENT_ID'),
        'client_secret' => env('MERCADOPAGO_CLIENT_SECRET'),
        'redirect_uri' => env('APP_URL') . '/api/mercadopago/callback',
        'marketplace_enabled' => env('MERCADOPAGO_MARKETPLACE_ENABLED', true),
    ],

    'apponlog' => [
        'base_url' => env('APPONLOG_BASE_URL', 'https://apponlog.com.br'),
        'token' => env('APPONLOG_TOKEN'),
        'user_id' => env('APPONLOG_USER_ID', '17926'),
        'shipping_company_id' => env('APPONLOG_SHIPPING_COMPANY_ID', '132226'),
        'default_modality' => env('APPONLOG_DEFAULT_MODALITY', '133'),
    ],

];
