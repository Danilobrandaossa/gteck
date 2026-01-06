<?php
if (!defined('ABSPATH')) { exit; }

class Pressel_Template_Mapper {
    public static function template_for(string $model): string {
        $m = strtoupper($model);
        $map = array(
            'V1' => 'pressel-oficial.php',
            'V4' => 'V4.php', // Template Name: Pressel V4
        );
        return $map[$m] ?? 'pressel-oficial.php';
    }
}


