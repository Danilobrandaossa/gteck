<?php

if (!defined('ABSPATH')) { exit; }

class Pressel_V2_Logger {
    public static function log($status, $code, $message, $details = []) {
        $entry = [
            'timestamp' => current_time('mysql'),
            'status' => $status,
            'codigo' => $code,
            'mensagem' => $message,
            'detalhes' => $details,
        ];
        // Por ora, envia para error_log; pode ser expandido para options/logs customizados
        error_log('[PRESSEL v2] ' . wp_json_encode($entry));
        return $entry;
    }

    public static function ok($code, $message, $details = []) {
        return self::log('sucesso', $code, $message, $details);
    }

    public static function warn($code, $message, $details = []) {
        return self::log('aviso', $code, $message, $details);
    }

    public static function err($code, $message, $details = []) {
        return self::log('erro', $code, $message, $details);
    }
}


