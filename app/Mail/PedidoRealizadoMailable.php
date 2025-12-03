<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PedidoRealizadoMailable extends Mailable
{
    use Queueable, SerializesModels;
    public $pedido;
    public $usuario;
    public $emprendedor;
    public $tipo;

     public function __construct($pedido, $usuario, $emprendedor, $tipo = 'cliente')
    {
        $this->pedido = $pedido;
        $this->usuario = $usuario;
        $this->emprendedor = $emprendedor;
        $this->tipo = $tipo;
    }

    /**
     * Create a new message instance.
     */
    /*public function __construct()
    {
        //
    }*/

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Pedido Realizado',
        );
    }

    public function build()
    {
        return $this->subject('Pedido realizado')
            ->markdown('emails.placedOrder')
            ->with([
            'pedido' => $this->pedido,
            'usuario' => $this->usuario,
            'emprendedor' => $this->emprendedor,
            'tipo' => $this->tipo,
        ]);            
    }
    /**
     * Get the message content definition.
     */


    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
