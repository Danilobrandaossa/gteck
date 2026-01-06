# Como Ativar o Debug Log no WordPress

## Método 1: Via wp-config.php (Recomendado)

1. Acesse o arquivo `wp-config.php` na raiz do WordPress (via FTP ou painel de controle do servidor)

2. Adicione ou modifique estas linhas **ANTES** da linha `/* That's all, stop editing! Happy publishing. */`:

```php
// Ativar debug
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);

// Desabilitar exibição de erros no frontend (apenas salvar no log)
@ini_set('display_errors', 0);
```

3. Salve o arquivo

## Método 2: Via .htaccess (Alternativa)

Se não tiver acesso ao wp-config.php, você pode adicionar no `.htaccess`:

```apache
php_flag display_errors On
php_flag log_errors On
php_value error_log /caminho/para/wp-content/debug.log
```

## Onde Encontrar os Logs

Os logs serão salvos em:
- **Arquivo**: `wp-content/debug.log`

## Verificar Logs via Terminal/FTP

1. Conecte-se ao servidor via FTP/SFTP ou SSH
2. Navegue até `wp-content/debug.log`
3. Abra o arquivo e procure por erros recentes
4. Erros do Pressel v2 terão prefixo `[Pressel v2]`

## Verificar Logs via Painel do Servidor

- **cPanel**: File Manager → wp-content → debug.log
- **Plesk**: File Manager → wp-content → debug.log
- **Outros**: Depende do painel, mas geralmente em wp-content/

## Exemplo de Erro no Log

```
[25-Jan-2025 10:30:00 UTC] PHP Fatal error:  Uncaught Error: Class 'Pressel_V2_Featured_Image' not found in /wp-content/plugins/pressel-automation-v2/includes/class-pressel-rest-controller.php:174
```

## Depois de Encontrar o Erro

1. Copie a mensagem de erro completa
2. Envie para análise
3. Desative o debug quando terminar:

```php
define('WP_DEBUG', false);
```

## Segurança

⚠️ **IMPORTANTE**: Sempre desative o debug em produção após identificar o problema, ou configure para não exibir erros no frontend.

