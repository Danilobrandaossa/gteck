<?php
if (!defined('ABSPATH')) { exit; }

class Pressel_Logger {
    public static function log(string $level, string $code, string $message, array $context = array()): void {
        $prefix = 'PS-' . strtoupper($level) . '-' . $code;
        $line = $prefix . ' ' . $message . (empty($context) ? '' : ' ' . wp_json_encode($context));
        error_log($line);
    }

    public static function info(string $code, string $message, array $context = array()): void { self::log('INFO', $code, $message, $context); }
    public static function warn(string $code, string $message, array $context = array()): void { self::log('WARN', $code, $message, $context); }
    public static function success(string $code, string $message, array $context = array()): void { self::log('SUCC', $code, $message, $context); }
    public static function error(string $code, string $message, array $context = array()): void { self::log('ERRO', $code, $message, $context); }
}


