<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Message;

class MessageSeeder extends Seeder
{
    public function run(): void
    {
        // Get users - buyers ask questions, sellers answer
        $buyer1 = User::where('email', 'dollycookie0710@gmail.com')->first();
        $buyer2 = User::where('email', 'tom8jerry0913@gmail.com')->first();
        $seller = User::where('email', 'devnight0710@gmail.com')->first();

        if (!$buyer1 || !$buyer2 || !$seller) {
            echo "Required users not found. Skipping message seeding.\n";
            return;
        }

        // Q&A 1: Question with answer
        Message::create([
            'from_user_id' => $buyer1->id,
            'to_user_id' => $seller->id,
            'question' => 'Qual é o peso médio dos anéis de ouro? Estou interessado em comprar um anel de ouro e gostaria de saber mais detalhes.',
            'answer' => 'Geralmente nossos anéis variam entre 3-8 gramas dependendo do modelo. Temos opções em 18k e 22k.',
            'answered_at' => now(),
        ]);

        // Q&A 2: Question with answer
        Message::create([
            'from_user_id' => $buyer2->id,
            'to_user_id' => $seller->id,
            'question' => 'Vocês fazem gravação personalizada nas alianças?',
            'answer' => 'Sim! Oferecemos gravação gratuita de até 20 caracteres em todas as alianças.',
            'answered_at' => now(),
        ]);

        // Q&A 3: Question without answer (pending)
        Message::create([
            'from_user_id' => $buyer1->id,
            'to_user_id' => $seller->id,
            'question' => 'Qual o prazo de entrega para São Paulo?',
            'answer' => null,
            'answered_at' => null,
        ]);

        echo "Created Q&A messages successfully!\n";
    }
}
