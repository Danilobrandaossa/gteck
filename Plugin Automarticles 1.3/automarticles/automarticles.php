<?php

/**
 * Plugin Name: Automarticles
 * Description: Plugin para integração com a Automarticles
 * Version: 1.3
 */


// Adicionar a variável de consulta para o endpoint
function registrar_variavel_automarticles($vars)
{
    $vars[] = 'automarticles';
    return $vars;
}
add_filter('query_vars', 'registrar_variavel_automarticles');

// Adicionando ação somente quando conter automarticles na url
if (isset($_GET['automarticles'])) add_action('template_redirect', 'eventos_automarticles');

// Eventos do webhook da automarticles
function eventos_automarticles()
{
    $dados_json = json_decode(file_get_contents('php://input'), true);

    // Verifica se a requisição é no formato json
    if (!$dados_json)
        return wp_send_json_error(array('message' => 'Dados JSON inválidos.'), 400);

    // Pega o valor do token no header
    $token = $_SERVER['HTTP_ACCESS_TOKEN'];

    // Verificar se o token está correto com o definido nas configurações do plugin
    if ($token !== get_option('token_automarticles'))
        return wp_send_json_error(array('message' => 'Token inválido.'), 400);

    // Verifica qual evento está sendo recebido
    switch ($dados_json['event']) {
        case 'CHECK_INTEGRATION': {
                return wp_send_json(array('token' => $token), 200);
            }

        case 'POST_CREATED': {

                $post = $dados_json['post'];
                if (!$post) return wp_send_json_error(array('message' => 'Informações do post não informadas'), 400);

                $id_automarticles = sanitize_text_field($post['id']);
                $slug = sanitize_title($post['slug']);
                $status = sanitize_status_post(sanitize_title($post['status']));
                $title = sanitize_text_field($post['title']);
                $content_html = $post['content']['html'];              
                $description = $post['description'];
                $featured_image_url = esc_url($post['featured_image']['url']);
                $featured_image_filename = sanitize_file_name($post['featured_image']['filename']);
                $featured_image_alt_text = sanitize_text_field($post['featured_image']['alt_text']);
                $category_id_automarticles = sanitize_text_field($post['category']['id']);
                $category_name = sanitize_text_field($post['category']['name']);
                $publication_date = date("Y-m-d H:i:s", $post['publication_date']);

                $posts_exists = get_posts(array(
                    'meta_key' => 'id_automarticles',
                    'meta_value' => $id_automarticles,
                    'post_type' => 'post',
                    'post_status' => array('publish', 'future', 'draft', 'pending', 'private', 'trash', 'auto-draft', 'inherit',),
                    'numberposts' => -1,
                ));

                if ($posts_exists)
                    return wp_send_json_error(array('message' => 'O post com esse id já foi criado.'), 400);

                //VERIFICANDO CATEGORIA E MONTADO O ARRAY

                //buscar pela categoria com o id da autormaticles, se achar
                $verify_categories = get_terms(array(
                    'taxonomy'   => 'category',
                    'hide_empty' => false,
                    'meta_key' => 'id_automarticles',
                    'meta_value' => $category_id_automarticles
                ));

                if ($verify_categories) {
                    $array_categories = array();
                    foreach ($verify_categories as $category) {
                        array_push($array_categories, $category->term_id);
                    }
                } else {
                    // se não exister verificar se existe com esse nome com o id_automarticles vazio
                    $category = get_category_by_name_and_id_automarticles_null($category_name);

                    if ($category) {
                        update_term_meta($category->term_id, 'id_automarticles', $category_id_automarticles);
                        $array_categories = array($category->term_id);
                    } else {
                        $category = criarCategoria($category_name, $category_id_automarticles);
                        $array_categories = array($category['term_id']);
                    }
                }

                //FIM VERIFICANDO CATEGORIA E MONTADO O ARRAY

                $success = criarPost($id_automarticles, $slug, $status, $title, $content_html, $description, $publication_date, $featured_image_url, $featured_image_filename, $featured_image_alt_text, $array_categories);

                if (!$success) return wp_send_json_error(array('message' => 'Erro ao criar o post'), 400);

                return wp_send_json_success(array('message' => 'Post criado com sucesso.'), 200);
            }

        case 'POST_UPDATED': {

                $post = $dados_json['post'];
                if (!$post) return wp_send_json_error(array('message' => 'Informações do post não informadas'), 400);

                $id_automarticles = sanitize_text_field($post['id']);
                $slug = sanitize_title($post['slug']);
                $status = sanitize_status_post(sanitize_title($post['status']));
                $title = sanitize_text_field($post['title']);
                $content_html = $post['content']['html'];
                $description = $post['description'];
                $featured_image_url = esc_url($post['featured_image']['url']);
                $featured_image_filename = sanitize_file_name($post['featured_image']['filename']);
                $featured_image_alt_text = sanitize_text_field($post['featured_image']['alt_text']);
                $category_id_automarticles = sanitize_text_field($post['category']['id']);
                $category_name = sanitize_text_field($post['category']['name']);
                $publication_date = date("Y-m-d H:i:s", $post['publication_date']);

                $posts = get_posts(array(
                    'meta_key' => 'id_automarticles',
                    'meta_value' => $id_automarticles,
                    'post_type' => 'post',
                    'post_status' => array('publish', 'future', 'draft', 'pending', 'private', 'trash', 'auto-draft', 'inherit',),
                    'numberposts' => -1,
                ));

                //VERIFICANDO CATEGORIA E MONTADO O ARRAY

                //buscar pela categoria com o id da autormaticles, se achar
                $verify_categories = get_terms(array(
                    'taxonomy'   => 'category',
                    'hide_empty' => false,
                    'meta_key' => 'id_automarticles',
                    'meta_value' => $category_id_automarticles
                ));

                if ($verify_categories) {
                    $array_categories = array();
                    foreach ($verify_categories as $category) {
                        array_push($array_categories, $category->term_id);
                    }
                } else {
                    // se não exister verificar se existe com esse nome com o id_automarticles vazio
                    $category = get_category_by_name_and_id_automarticles_null($category_name);

                    if ($category) {
                        update_term_meta($category->term_id, 'id_automarticles', $category_id_automarticles);
                        $array_categories = array($category->term_id);
                    } else {
                        $category = criarCategoria($category_name, $category_id_automarticles);
                        $array_categories = array($category['term_id']);
                    }
                }

                //FIM VERIFICANDO CATEGORIA E MONTADO O ARRAY


                if (!$posts) {
                    $success = criarPost($id_automarticles, $slug, $status, $title, $content_html, $description, $publication_date, $featured_image_url, $featured_image_filename, $featured_image_alt_text, $array_categories);

                    if (!$success) return wp_send_json_error(array('message' => 'Erro ao criar o post'), 400);

                    return wp_send_json_success(array('message' => 'Post criado com sucesso.'), 200);
                }

                foreach ($posts as $post) {

                    $post_id = $post->ID;

                    // Obtém o valor do metadado "image_url_automarticles" da imagem de destaque do post
                    $image_url_automarticles = get_post_meta(get_post_thumbnail_id($post_id), 'image_url_automarticles', true);

                    // Verifica se a imagem de destaque mudou
                    if ($featured_image_url != $image_url_automarticles) {
                        if ($featured_image_url != "") {

                            $image_id = upload_image_from_url($post_id, $featured_image_url, $featured_image_filename, $featured_image_alt_text);

                            if (!is_wp_error($image_id))
                                set_post_thumbnail($post_id, $image_id);
                        } else {
                            delete_post_thumbnail($post_id);
                        }
                    } else {
                        update_post_meta(get_post_thumbnail_id($post_id), '_wp_attachment_image_alt', sanitize_text_field($featured_image_alt_text));
                    }


                    $post->post_author = get_option('autor_automarticles');
                    $post->post_name = $slug;
                    $post->post_status = $status;
                    $post->post_title = $title;
                    $post->post_content = $content_html;
                    $post->post_excerpt = $description;
                    $post->post_date = $publication_date;
                    $post->post_date_gmt = gmdate('Y-m-d H:i:s', strtotime($publication_date));
                    remove_filter( 'content_save_pre', 'wp_filter_post_kses' );
                    wp_update_post($post, false, false);
                    wp_set_post_categories($post->ID, $array_categories);
                }

                return wp_send_json_success(array('message' => 'Post atualizado com sucesso.'), 200);
            }

        case 'POST_DELETED': {

                if (!$dados_json['post']) return wp_send_json_error(array('message' => 'Informações do post não informadas.'), 400);

                $post = $dados_json['post'];

                $id_automarticles = sanitize_text_field($post['id']);

                if (empty($id_automarticles))
                    return  wp_send_json_error(array('message' => 'O id não foi informado'), 400);

                $posts_to_delete = get_posts(array(
                    'meta_key' => 'id_automarticles',
                    'meta_value' => $id_automarticles,
                    'post_type' => 'post',
                    'post_status' => array('publish', 'future', 'draft', 'pending', 'private', 'trash', 'auto-draft', 'inherit',),
                    'numberposts' => -1,
                ));

                if (!$posts_to_delete)
                    return wp_send_json_error(array('message' => 'Nenhum post encontrado com esse id'), 400);

                foreach ($posts_to_delete as $post) {
                    wp_delete_post($post->ID, true);
                }

                return wp_send_json_success(array('message' => 'Post apagado com sucesso'), 200);
            }

        case 'CATEGORY_CREATED': {

                if (!$dados_json['category']) return wp_send_json_error(array('message' => 'Informações da categoria não informadas.'), 400);

                $category = $dados_json['category'];

                $id_automarticles = sanitize_text_field($category['id']);
                $name = sanitize_text_field($category['name']);

                if (!$id_automarticles) return wp_send_json_error(array('message' => 'O id da categoria não foi informado.'), 400);
                if (!$name) return wp_send_json_error(array('message' => 'O nome da categoria não foi informado.'), 400);

                //verificar se já existe categoria com o id da automarticles
                $verify_categories = get_terms(array(
                    'taxonomy'   => 'category',
                    'hide_empty' => false,
                    'meta_key' => 'id_automarticles',
                    'meta_value' => $id_automarticles
                ));

                if ($verify_categories)
                    return wp_send_json_error(array('message' => 'A categoria com esse id já foi criada.'), 400);

                // se não exister verificar se existe com esse nome com o id_automarticles vazio
                $category = get_category_by_name_and_id_automarticles_null($name);

                if ($category) {
                    update_term_meta($category['term_id'], 'id_automarticles', $id_automarticles);
                    return wp_send_json_success(array('message' => 'Categoria criada com sucesso.'), 200);
                }

                // Cria a nova categoria
                $category = criarCategoria($name, $id_automarticles);

                if (is_wp_error($category)) return  wp_send_json_error(array('message' => 'Erro ao criar a categoria'), 400);

                return wp_send_json_success(array('message' => 'Categoria criada com sucesso.'), 200);
            }

        case 'CATEGORY_UPDATED': {

                if (!$dados_json['category']) return wp_send_json_error(array('message' => 'Informações da categoria não informadas.'), 400);

                $category = $dados_json['category'];

                $id_automarticles = sanitize_text_field($category['id']);
                $name = sanitize_text_field($category['name']);

                if (!$id_automarticles) return wp_send_json_error(array('message' => 'O id da categoria não foi informado.'), 400);
                if (!$name) return wp_send_json_error(array('message' => 'O nome não foi informado.'), 400);

                //verificar se existe com o id da automarticles
                $categories_to_update = get_terms(array(
                    'taxonomy'   => 'category',
                    'hide_empty' => false,
                    'meta_key' => 'id_automarticles',
                    'meta_value' => $id_automarticles
                ));

                //se existir atualizar
                if ($categories_to_update) {
                    foreach ($categories_to_update as $category) {
                        wp_update_term($category->term_id, 'category', array('name' => $name));
                    }
                    return wp_send_json_success(array('message' => 'Categoria atualizada com sucesso.'), 200);
                }

                // se não exister verificar se existe com esse nome com o id_automarticles vazio
                $category = get_category_by_name_and_id_automarticles_null($name);

                //se existir atualizar e setar o id da automarticles nela
                if ($category) {
                    // wp_update_term($category['term_id'], 'category', array('name' => $name));
                    update_term_meta($category['term_id'], 'id_automarticles', $id_automarticles);
                    return wp_send_json_success(array('message' => 'Categoria atualizada com sucesso.'), 200);
                }

                // se não exister criar
                $category = criarCategoria($name, $id_automarticles);

                if (is_wp_error($category)) return wp_send_json_error(array('message' => 'Erro ao criar a categoria'), 400);

                return wp_send_json_success(array('message' => 'Categoria não existia e foi criada com sucesso.'), 200);
            }

        case 'CATEGORY_DELETED': {

                if (!$dados_json['category']) return wp_send_json_error(array('message' => 'Informações da categoria não informadas.'), 400);

                $category = $dados_json['category'];

                $id_automarticles = sanitize_text_field($category['id']);
                $name = sanitize_text_field($category['name']);

                if (!$id_automarticles) return wp_send_json_error(array('message' => 'O id da categoria não foi informado.'), 400);
                if (!$name) return wp_send_json_error(array('message' => 'O nome não foi informado.'), 400);

                //verificar se existe com o id da automarticles
                $categories_to_delete = get_terms(array(
                    'taxonomy'   => 'category',
                    'hide_empty' => false,
                    'meta_key' => 'id_automarticles',
                    'meta_value' => $id_automarticles
                ));

                if (!$categories_to_delete)
                    return wp_send_json_error(array('message' => 'Nenhuma categoria encontrada com esse id'), 400);

                // ------------------------------
                // Parte do replaceTo aqui
                // ------------------------------

                $replace_to = $dados_json['replace_to'];
                if ($replace_to) {

                    $id_automarticles_replace_to = sanitize_text_field($replace_to['id']);
                    $name_replace_to = sanitize_text_field($replace_to['name']);

                    //verificar se encontrou a categoria do replace to pelo id
                    $verify_categories = get_terms(array(
                        'taxonomy'   => 'category',
                        'hide_empty' => false,
                        'meta_key' => 'id_automarticles',
                        'meta_value' => $id_automarticles_replace_to
                    ));

                    if ($verify_categories) {
                        $array_categories = array();
                        foreach ($verify_categories as $category) {
                            array_push($array_categories, $category->term_id);
                        }
                    } else {
                        // se não exister verificar se existe com esse nome com o id_automarticles vazio
                        $category = get_category_by_name_and_id_automarticles_null($name_replace_to);

                        if ($category) {
                            update_term_meta($category->term_id, 'id_automarticles', $id_automarticles_replace_to);
                            $array_categories = array($category->term_id);
                        } else {
                            $category = criarCategoria($name_replace_to, $id_automarticles_replace_to);
                            $array_categories = array($category['term_id']);
                        }
                    }

                    foreach ($categories_to_delete as $category) {

                        // Obtém todos os posts da categoria antiga
                        $posts = get_posts(array(
                            'category' => $category->term_id,
                            'post_status' => array('publish', 'future', 'draft', 'pending', 'private', 'trash', 'auto-draft', 'inherit',),
                            'numberposts' => -1,
                        ));

                        // Atualiza a categoria para todos os posts
                        foreach ($posts as $post) {
                            wp_set_post_categories($post->ID, $array_categories, true);
                        }
                    }
                }

                // ------------------------------
                // FIM Parte do replaceTo aqui
                // ------------------------------

                // Apagar categoria
                foreach ($categories_to_delete as $category) {
                    wp_delete_term($category->term_id, 'category');
                }

                return wp_send_json_success(array('message' => 'Categoria apagada com sucesso.'), 200);
            }

        default:
            return wp_send_json_error(array('message' => 'Evento não encontrado.'), 400);
    }
}

// -----------------------------------------------------
// -------------------- UTILIDADES ---------------------
// -----------------------------------------------------

function slugCategoryUnique($category_slug)
{

    // Verifica se o slug já existe
    $existing_category = get_term_by('slug', $category_slug, 'category');

    // Se o slug já existir, gera um novo slug único
    if ($existing_category) {
        $suffix = 2;
        while ($existing_category) {
            $new_slug = $category_slug . '-' . $suffix;
            $existing_category = get_term_by('slug', $new_slug, 'category');
            $suffix++;
        }
        $category_slug = $new_slug;
    }

    return $category_slug;
}

function criarCategoria($name, $id_automarticles)
{
    $slug = slugCategoryUnique($name);

    $category = wp_insert_term($name, 'category', array('slug' => $slug));

    update_term_meta($category['term_id'], 'id_automarticles', $id_automarticles);

    return $category;
}

function get_category_by_name_and_id_automarticles_null($category_name)
{
    // Obtém a categoria pelo nome
    $category = get_term_by('name', $category_name, 'category');

    // Verifica se a categoria foi encontrada
    if ($category) {
        // Obtém a ID da categoria
        $category_id = $category->term_id;

        // Obtém os metadados da categoria
        $category_meta = get_term_meta($category_id, 'id_automarticles', true);

        // Verifica se a meta_key específica não está definida
        if (empty($category_meta)) {
            // Retorna a categoria se a condição for atendida
            return $category;
        }
    }

    // Retorna null se a categoria não for encontrada ou se a condição não for atendida
    return null;
}

// Função para fazer o upload da imagem a partir da URL e retornar o ID da imagem
function upload_image_from_url($post_id, $image_url, $filename, $image_alt)
{

    // Obtém o conteúdo da imagem usando wp_remote_get
    $response = wp_remote_get($image_url, array('timeout' => 15));

    if (is_wp_error($response)) {
        error_log("[Automarticles]ERROR: " . $response->get_error_message());
        return $response;
    }

    $image_data = wp_remote_retrieve_body($response);

    if (empty($image_data)) {
        error_log("[Automarticles]ERROR: Empty response from URL");
        return new WP_Error('empty_response', 'Resposta vazia da URL');
    }

    // Define o diretório de upload
    $upload_dir = wp_upload_dir();

    // Verifica o tipo de arquivo
    $wp_filetype = wp_check_filetype($filename, null);

    if ($wp_filetype['ext'] == "") {
        $filename .= ".png";
        $wp_filetype['ext'] = "png";
        $wp_filetype['type'] = "image/png";
    }

    if (wp_mkdir_p($upload_dir['path'])) {
        $filename = wp_unique_filename(wp_upload_dir()['path'], $filename);
        $file = $upload_dir['path'] . '/' . $filename;
    } else {
        $filename = wp_unique_filename(wp_upload_dir()['basedir'], $filename);
        $file = $upload_dir['basedir'] . '/' . $filename;
    }

    // Salva a imagem no servidor
    file_put_contents($file, $image_data);

    // Prepara os dados do anexo
    $attachment = array(
        'post_mime_type' => $wp_filetype['type'],
        'post_title' => sanitize_file_name($filename),
        'post_content' => '',
        'post_status' => 'inherit',
    );

    // Insere o anexo no banco de dados
    $attachment_id = wp_insert_attachment($attachment, $file, $post_id);

    // Adiciona o meta dado com a URL original da imagem
    update_post_meta($attachment_id, 'image_url_automarticles', esc_url($image_url));

    // Adiciona o texto alternativo à imagem
    if ($attachment_id && !empty($image_alt)) {
        update_post_meta($attachment_id, '_wp_attachment_image_alt', sanitize_text_field($image_alt));
    }

    // Gera os metadados do anexo e atualiza no banco de dados
    require_once(ABSPATH . 'wp-admin/includes/image.php');
    $attachment_data = wp_generate_attachment_metadata($attachment_id, $file);
    wp_update_attachment_metadata($attachment_id, $attachment_data);

    return $attachment_id;
}

function criarPost($id_automarticles, $slug, $status, $title, $content_html, $description, $publication_date, $featured_image_url, $featured_image_filename, $featured_image_alt_text, $array_categories)
{
    // Criar o novo post
    $post_data = array(
        'post_name' => $slug,
        'post_status' => $status,
        'post_title' => $title,
        'post_content' => $content_html,
        'post_excerpt' => $description,
        'post_date' => $publication_date,
        'post_date_gmt' => gmdate('Y-m-d H:i:s', strtotime($publication_date)),
        'post_type' => 'post',
        'post_category' => $array_categories,
        'post_author' => get_option('autor_automarticles')
    );

    remove_filter( 'content_save_pre', 'wp_filter_post_kses');
    $post_id = wp_insert_post($post_data, false, false);

    if (is_wp_error($post_id)) return  false;

    update_post_meta($post_id, 'id_automarticles', $id_automarticles);

    if ($featured_image_url != "") {
        $image_id = upload_image_from_url($post_id, $featured_image_url, $featured_image_filename, $featured_image_alt_text);

        if (!is_wp_error($image_id))
            set_post_thumbnail($post_id, $image_id);
    }

    return true;
}

// Função para tratar o status recebido do post para ficar no padrão do wordpress
function sanitize_status_post($status)
{
    switch ($status) {
        case 'publish':
            return $status;

        case 'future':
            return $status;

        case 'draft':
            return $status;

        case 'pending':
            return $status;

        case 'private':
            return $status;

        default:
            return "publish";
    }
}


// -----------------------------------------------------
// -------------- CONFIGURAÇÕES DO PLUGIN --------------
// -----------------------------------------------------

add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'add_action_links');

function add_action_links($actions)
{
    $actions[] = '<a href="' . esc_url(get_admin_url(null, 'options-general.php?page=automarticles')) . '">Configurações</a>';
    //    $actions[] = '<a href="https://automarticles.com/" target="_blank">Conheça a Automarticles</a>';
    return $actions;
}

// Adicionar a página de configuração
function configuracao_automarticles_menu()
{
    add_options_page('Configuração Automarticles', 'Automarticles', 'manage_options', 'automarticles', 'configuracao_automarticles');
}
add_action('admin_menu', 'configuracao_automarticles_menu');

// Página de configuração
function configuracao_automarticles()
{
    if (current_user_can('manage_options')) {
        if ($_POST) {
            update_option('token_automarticles', sanitize_text_field($_POST['token_automarticles']));
            update_option('autor_automarticles', sanitize_text_field($_POST['autor_automarticles']));
            $success = true;
        }
        $token = get_option('token_automarticles');
        $autor_automarticles = get_option('autor_automarticles');
?>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');

            body {
                background: #F2F4F7;
            }

            @media only screen and (max-width: 960px) {
                .container {
                    margin-right: 10px;
                }
            }

            .container {
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .card {
                border-radius: 12px;
                padding: 40px;
                border: 0;
                max-width: 550px;
            }

            .title {
                font-family: Inter;
                font-size: 24px !important;
                font-weight: 600 !important;
                margin: 0;
            }

            .desc-title {
                font-family: Inter;
                color: #475467;
                margin-bottom: 24px;
                margin-top: 12px;
                font-size: 16px;
            }

            .label {
                cursor: default;
                font-family: Inter;
                font-size: 14px;
                font-weight: 500;
                display: block;
            }

            .mb-20 {
                margin-bottom: 20px;
            }

            .input {
                width: 100%;
                max-width: 100% !important;
                font-family: Inter;
                font-size: 14px;
                font-style: normal;
                font-weight: 400;
                line-height: 24px;
                padding: 0px 12px !important;
                height: 40px;
                border-color: #D0D5DD !important;
                border-radius: 8px !important;
                margin-top: 5px;
                margin-left: 0px !important;
                margin-right: 0px !important;
                color: #344054 !important;
            }

            .desc-input {
                cursor: default;
                font-family: Inter;
                font-size: 14px;
                display: block;
                margin-top: 5px;
            }

            .desc-input a {
                color: #7839EE;
                font-weight: 600;
            }

            .botao-copiar {
                border: 1px solid #D0D5DD;
                border-radius: 8px;
                background: #fff;
                height: 40px;
                margin-top: 5px;
                color: #344054;
                font-size: 14px;
                font-family: Inter;
                font-weight: 600;
                word-wrap: break-word;
                display: flex;
                align-items: center;
                gap: 5px;
                padding: 0 15px;
                cursor: pointer;
            }

            .botao {
                cursor: pointer;
                font-family: Inter;
                font-size: 14px;
                font-weight: 500px;
                color: #fff;
                background-color: #7839EE;
                border-radius: 8px;
                border: 0;
                width: 100%;
                margin-top: 24px;
                /* padding: 15px 0; */
                height: 40px;
            }
        </style>
        <div class="container">
            <div style="margin-top: 20px;">
                <svg width="244" height="43" viewBox="0 0 244 43" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50.1725 31.0565H45.5892L52.5728 10.8269H58.0846L65.0582 31.0565H60.475L55.4077 15.4497H55.2497L50.1725 31.0565ZM49.8861 23.1049H60.712V26.4436H49.8861V23.1049ZM77.1436 24.5964V15.8843H81.3515V31.0565H77.3116V28.3006H77.1535C76.8111 29.1896 76.2415 29.9041 75.4447 30.444C74.6544 30.984 73.6897 31.254 72.5505 31.254C71.5364 31.254 70.6441 31.0235 69.8736 30.5626C69.1032 30.1016 68.5006 29.4464 68.066 28.5969C67.638 27.7474 67.4207 26.73 67.4141 25.5447V15.8843H71.622V24.794C71.6286 25.6896 71.8689 26.3975 72.3431 26.9177C72.8172 27.4379 73.4527 27.698 74.2495 27.698C74.7565 27.698 75.2306 27.5828 75.6718 27.3523C76.1131 27.1152 76.4687 26.7662 76.7386 26.3053C77.0152 25.8443 77.1502 25.2747 77.1436 24.5964ZM92.7875 15.8843V19.0451H83.6506V15.8843H92.7875ZM85.7249 12.2493H89.9328V26.3942C89.9328 26.7827 89.9921 27.0856 90.1106 27.3029C90.2291 27.5136 90.3938 27.6618 90.6045 27.7474C90.8218 27.833 91.072 27.8758 91.3552 27.8758C91.5528 27.8758 91.7503 27.8594 91.9479 27.8264C92.1454 27.7869 92.2969 27.7573 92.4022 27.7375L93.0641 30.8688C92.8533 30.9346 92.557 31.0104 92.1751 31.096C91.7931 31.1882 91.3289 31.2441 90.7823 31.2639C89.7682 31.3034 88.8792 31.1684 88.1153 30.8589C87.358 30.5494 86.7686 30.0687 86.3472 29.4168C85.9257 28.7648 85.7183 27.9417 85.7249 26.9473V12.2493ZM102.221 31.3528C100.686 31.3528 99.3594 31.0268 98.24 30.3749C97.1271 29.7164 96.2677 28.801 95.6619 27.6289C95.0561 26.4501 94.7531 25.0837 94.7531 23.5296C94.7531 21.9624 95.0561 20.5927 95.6619 19.4205C96.2677 18.2418 97.1271 17.3264 98.24 16.6745C99.3594 16.016 100.686 15.6867 102.221 15.6867C103.755 15.6867 105.079 16.016 106.192 16.6745C107.311 17.3264 108.174 18.2418 108.78 19.4205C109.385 20.5927 109.688 21.9624 109.688 23.5296C109.688 25.0837 109.385 26.4501 108.78 27.6289C108.174 28.801 107.311 29.7164 106.192 30.3749C105.079 31.0268 103.755 31.3528 102.221 31.3528ZM102.24 28.0931C102.938 28.0931 103.521 27.8956 103.989 27.5005C104.456 27.0988 104.809 26.5522 105.046 25.8608C105.289 25.1693 105.411 24.3824 105.411 23.5C105.411 22.6176 105.289 21.8307 105.046 21.1392C104.809 20.4478 104.456 19.9012 103.989 19.4995C103.521 19.0978 102.938 18.897 102.24 18.897C101.536 18.897 100.943 19.0978 100.462 19.4995C99.9883 19.9012 99.6294 20.4478 99.3858 21.1392C99.1487 21.8307 99.0302 22.6176 99.0302 23.5C99.0302 24.3824 99.1487 25.1693 99.3858 25.8608C99.6294 26.5522 99.9883 27.0988 100.462 27.5005C100.943 27.8956 101.536 28.0931 102.24 28.0931ZM112.424 31.0565V15.8843H116.435V18.5611H116.613C116.929 17.6721 117.455 16.9708 118.193 16.4572C118.931 15.9435 119.813 15.6867 120.84 15.6867C121.881 15.6867 122.766 15.9468 123.497 16.4671C124.228 16.9807 124.716 17.6787 124.959 18.5611H125.117C125.427 17.6919 125.986 16.9972 126.796 16.4769C127.613 15.9501 128.578 15.6867 129.691 15.6867C131.106 15.6867 132.256 16.1378 133.138 17.04C134.027 17.9355 134.471 19.2065 134.471 20.8528V31.0565H130.273V21.6825C130.273 20.8396 130.05 20.2074 129.602 19.786C129.154 19.3645 128.594 19.1538 127.923 19.1538C127.159 19.1538 126.563 19.3975 126.135 19.8848C125.707 20.3655 125.493 21.0009 125.493 21.7912V31.0565H121.413V21.5936C121.413 20.8495 121.199 20.2568 120.771 19.8156C120.35 19.3744 119.793 19.1538 119.102 19.1538C118.634 19.1538 118.213 19.2723 117.837 19.5094C117.469 19.7399 117.176 20.0658 116.958 20.4873C116.741 20.9022 116.632 21.3895 116.632 21.9492V31.0565H112.424Z" fill="#344054" />
                    <path d="M142.122 31.3429C141.154 31.3429 140.291 31.175 139.534 30.8391C138.777 30.4967 138.177 29.993 137.736 29.3279C137.301 28.6562 137.084 27.8199 137.084 26.8189C137.084 25.976 137.239 25.2681 137.548 24.6952C137.858 24.1223 138.279 23.6613 138.813 23.3123C139.346 22.9633 139.952 22.6999 140.63 22.5221C141.315 22.3443 142.033 22.2192 142.784 22.1468C143.666 22.0546 144.377 21.969 144.917 21.8899C145.457 21.8043 145.849 21.6792 146.093 21.5146C146.336 21.3499 146.458 21.1063 146.458 20.7836V20.7244C146.458 20.0988 146.261 19.6148 145.865 19.2723C145.477 18.9299 144.924 18.7587 144.206 18.7587C143.449 18.7587 142.846 18.9266 142.398 19.2625C141.951 19.5917 141.654 20.0066 141.509 20.507L137.618 20.191C137.815 19.269 138.204 18.4722 138.783 17.8006C139.363 17.1223 140.11 16.6021 141.025 16.2399C141.947 15.8711 143.014 15.6867 144.226 15.6867C145.069 15.6867 145.875 15.7855 146.646 15.9831C147.423 16.1806 148.111 16.4868 148.71 16.9017C149.316 17.3165 149.793 17.8499 150.142 18.5019C150.491 19.1472 150.666 19.921 150.666 20.8231V31.0565H146.675V28.9525H146.557C146.313 29.4266 145.987 29.8448 145.579 30.207C145.171 30.5626 144.68 30.8424 144.107 31.0466C143.534 31.2441 142.872 31.3429 142.122 31.3429ZM143.327 28.4389C143.946 28.4389 144.492 28.317 144.967 28.0734C145.441 27.8231 145.813 27.4873 146.083 27.0659C146.353 26.6444 146.488 26.167 146.488 25.6336V24.0235C146.356 24.1091 146.175 24.1881 145.944 24.2606C145.721 24.3264 145.467 24.389 145.184 24.4483C144.901 24.5009 144.618 24.5503 144.334 24.5964C144.051 24.6359 143.794 24.6722 143.564 24.7051C143.07 24.7775 142.639 24.8928 142.27 25.0508C141.901 25.2088 141.615 25.4229 141.411 25.6929C141.206 25.9563 141.104 26.2855 141.104 26.6806C141.104 27.2535 141.312 27.6914 141.727 27.9944C142.148 28.2907 142.681 28.4389 143.327 28.4389ZM153.931 31.0565V15.8843H158.01V18.5315H158.168C158.445 17.5898 158.909 16.8786 159.561 16.3979C160.213 15.9106 160.964 15.667 161.813 15.667C162.024 15.667 162.251 15.6801 162.495 15.7065C162.738 15.7328 162.952 15.769 163.137 15.8151V19.5489C162.939 19.4896 162.666 19.437 162.317 19.3909C161.968 19.3448 161.648 19.3217 161.359 19.3217C160.74 19.3217 160.186 19.4567 159.699 19.7267C159.218 19.9901 158.837 20.3589 158.553 20.833C158.277 21.3071 158.138 21.8537 158.138 22.4727V31.0565H153.931ZM174.143 15.8843V19.0451H165.006V15.8843H174.143ZM167.08 12.2493H171.288V26.3942C171.288 26.7827 171.347 27.0856 171.466 27.3029C171.585 27.5136 171.749 27.6618 171.96 27.7474C172.177 27.833 172.427 27.8758 172.711 27.8758C172.908 27.8758 173.106 27.8594 173.303 27.8264C173.501 27.7869 173.652 27.7573 173.758 27.7375L174.419 30.8688C174.209 30.9346 173.912 31.0104 173.53 31.096C173.149 31.1882 172.684 31.2441 172.138 31.2639C171.124 31.3034 170.235 31.1684 169.471 30.8589C168.713 30.5494 168.124 30.0687 167.703 29.4168C167.281 28.7648 167.074 27.9417 167.08 26.9473V12.2493ZM176.884 31.0565V15.8843H181.092V31.0565H176.884ZM178.998 13.9285C178.372 13.9285 177.835 13.7211 177.388 13.3062C176.946 12.8847 176.726 12.381 176.726 11.7949C176.726 11.2154 176.946 10.7182 177.388 10.3034C177.835 9.88191 178.372 9.67119 178.998 9.67119C179.623 9.67119 180.157 9.88191 180.598 10.3034C181.046 10.7182 181.27 11.2154 181.27 11.7949C181.27 12.381 181.046 12.8847 180.598 13.3062C180.157 13.7211 179.623 13.9285 178.998 13.9285ZM191.318 31.3528C189.764 31.3528 188.427 31.0235 187.307 30.365C186.195 29.6999 185.338 28.778 184.739 27.5993C184.147 26.4205 183.85 25.064 183.85 23.5296C183.85 21.9755 184.15 20.6124 184.749 19.4403C185.355 18.2615 186.214 17.3429 187.327 16.6844C188.44 16.0193 189.764 15.6867 191.298 15.6867C192.622 15.6867 193.781 15.9271 194.775 16.4078C195.769 16.8885 196.556 17.5635 197.136 18.4327C197.715 19.302 198.035 20.3227 198.094 21.4948H194.123C194.011 20.7375 193.715 20.1284 193.234 19.6674C192.76 19.1999 192.138 18.9661 191.367 18.9661C190.715 18.9661 190.146 19.1439 189.658 19.4995C189.178 19.8485 188.802 20.3589 188.532 21.0306C188.262 21.7023 188.127 22.5155 188.127 23.4704C188.127 24.4384 188.259 25.2615 188.522 25.9398C188.792 26.6181 189.171 27.135 189.658 27.4906C190.146 27.8462 190.715 28.024 191.367 28.024C191.848 28.024 192.279 27.9252 192.661 27.7277C193.05 27.5301 193.369 27.2437 193.619 26.8683C193.876 26.4864 194.044 26.0287 194.123 25.4953H198.094C198.028 26.6543 197.712 27.675 197.146 28.5574C196.586 29.4332 195.812 30.1181 194.824 30.612C193.837 31.1058 192.668 31.3528 191.318 31.3528ZM204.996 10.8269V31.0565H200.788V10.8269H204.996ZM215.281 31.3528C213.72 31.3528 212.377 31.0367 211.251 30.4045C210.132 29.7658 209.269 28.8636 208.663 27.698C208.057 26.5259 207.754 25.1397 207.754 23.5395C207.754 21.9788 208.057 20.6091 208.663 19.4304C209.269 18.2516 210.122 17.333 211.221 16.6745C212.328 16.016 213.625 15.6867 215.113 15.6867C216.114 15.6867 217.046 15.8481 217.909 16.1707C218.778 16.4868 219.535 16.9642 220.18 17.603C220.832 18.2418 221.339 19.0451 221.702 20.0132C222.064 20.9746 222.245 22.1007 222.245 23.3913V24.547H209.433V21.9393H218.284C218.284 21.3335 218.152 20.7968 217.889 20.3293C217.625 19.8617 217.26 19.4962 216.792 19.2328C216.331 18.9628 215.795 18.8278 215.182 18.8278C214.544 18.8278 213.977 18.976 213.483 19.2723C212.996 19.5621 212.614 19.9539 212.338 20.4478C212.061 20.9351 211.919 21.4784 211.913 22.0776V24.5569C211.913 25.3076 212.051 25.9563 212.328 26.5028C212.611 27.0494 213.009 27.4708 213.523 27.7672C214.037 28.0635 214.646 28.2117 215.35 28.2117C215.818 28.2117 216.246 28.1458 216.634 28.0141C217.023 27.8824 217.355 27.6849 217.632 27.4215C217.909 27.158 218.119 26.8354 218.264 26.4534L222.156 26.7103C221.958 27.6454 221.553 28.4619 220.941 29.1599C220.335 29.8514 219.552 30.3914 218.59 30.7799C217.635 31.1618 216.532 31.3528 215.281 31.3528ZM237.615 20.2107L233.762 20.4478C233.696 20.1185 233.555 19.8222 233.338 19.5588C233.12 19.2888 232.834 19.0748 232.478 18.9167C232.129 18.7521 231.711 18.6698 231.224 18.6698C230.572 18.6698 230.022 18.8081 229.574 19.0847C229.126 19.3546 228.902 19.7168 228.902 20.1712C228.902 20.5334 229.047 20.8396 229.337 21.0898C229.627 21.3401 230.124 21.5409 230.829 21.6924L233.575 22.2455C235.05 22.5484 236.149 23.0357 236.874 23.7074C237.598 24.3791 237.96 25.2615 237.96 26.3547C237.96 27.349 237.667 28.2216 237.081 28.9723C236.502 29.723 235.705 30.309 234.691 30.7305C233.683 31.1454 232.521 31.3528 231.204 31.3528C229.196 31.3528 227.595 30.9346 226.403 30.0983C225.218 29.2554 224.523 28.1096 224.319 26.6609L228.458 26.4436C228.583 27.056 228.886 27.5235 229.367 27.8462C229.847 28.1623 230.463 28.3203 231.214 28.3203C231.951 28.3203 232.544 28.1787 232.992 27.8956C233.446 27.6058 233.677 27.2338 233.683 26.7794C233.677 26.3975 233.515 26.0847 233.199 25.841C232.883 25.5908 232.396 25.3998 231.737 25.2681L229.11 24.7446C227.628 24.4483 226.525 23.9346 225.801 23.2037C225.083 22.4727 224.724 21.5409 224.724 20.4083C224.724 19.4337 224.988 18.5941 225.514 17.8895C226.048 17.1848 226.795 16.6416 227.757 16.2596C228.725 15.8777 229.857 15.6867 231.155 15.6867C233.071 15.6867 234.579 16.0917 235.679 16.9017C236.785 17.7117 237.43 18.8147 237.615 20.2107Z" fill="#7839EE" />
                    <g clip-path="url(#clip0_1_208)">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M26.0218 4.90896C31.326 6.33021 35.3313 10.1798 37.1633 14.9336C37.5086 15.8295 37.0622 16.8357 36.1663 17.181C35.2704 17.5262 34.2642 17.0799 33.9189 16.1839C32.4694 12.4225 29.3072 9.3889 25.1219 8.26744C18.1662 6.40368 11.0167 10.5315 9.15294 17.4871C8.90444 18.4145 7.95117 18.9649 7.02375 18.7164C6.09633 18.4679 5.54596 17.5146 5.79446 16.5872C8.15522 7.77673 17.2113 2.54819 26.0218 4.90896ZM36.4715 23.0075C37.3989 23.256 37.9493 24.2093 37.7008 25.1367C35.34 33.9472 26.2839 39.1757 17.4734 36.815C12.1692 35.3937 8.16397 31.5442 6.33192 26.7903C5.98665 25.8944 6.43304 24.8882 7.32894 24.543C8.22485 24.1977 9.23102 24.6441 9.57629 25.54C11.0259 29.3014 14.188 32.335 18.3733 33.4565C25.329 35.3203 32.4785 31.1925 34.3423 24.2368C34.5908 23.3094 35.5441 22.759 36.4715 23.0075Z" fill="#344054" />
                    </g>
                    <path d="M21.7477 13.9078L23.0876 17.3916C23.3055 17.9582 23.4145 18.2414 23.5839 18.4797C23.7341 18.6909 23.9186 18.8754 24.1298 19.0256C24.368 19.195 24.6513 19.3039 25.2178 19.5218L28.7016 20.8618L25.2178 22.2017C24.6513 22.4196 24.368 22.5285 24.1298 22.698C23.9186 22.8481 23.7341 23.0326 23.5839 23.2438C23.4145 23.4821 23.3055 23.7653 23.0876 24.3319L21.7477 27.8157L20.4078 24.3319C20.1899 23.7653 20.0809 23.4821 19.9115 23.2438C19.7614 23.0326 19.5769 22.8481 19.3657 22.698C19.1274 22.5285 18.8441 22.4196 18.2776 22.2017L14.7938 20.8618L18.2776 19.5218C18.8441 19.3039 19.1274 19.195 19.3657 19.0256C19.5769 18.8754 19.7614 18.6909 19.9115 18.4797C20.0809 18.2414 20.1899 17.9582 20.4078 17.3916L21.7477 13.9078Z" fill="#7839EE" stroke="#7839EE" stroke-width="3.47696" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M134.749 40.2628C165.624 34.8496 200.204 33.2457 238.235 38.1512" stroke="#C3B5FD" stroke-width="2.31797" stroke-linecap="round" />
                    <path d="M154.2 41.2651C179.517 37.0549 210.084 36.0526 238.436 38.232" stroke="#C3B5FD" stroke-width="2.31797" stroke-linecap="round" />
                    <defs>
                        <clipPath id="clip0_1_208">
                            <rect width="41.7235" height="41.7235" fill="white" transform="translate(0.885986)" />
                        </clipPath>
                    </defs>
                </svg>
            </div>

            <div class="card">
                <h2 class="title">Integração</h2>
                <p class="desc-title">Configure o seu WordPress para trabalhar em conjunto com a Automarticles</p>
                <form method="post">
                    <div class="mb-20">
                        <label for="token_automarticles" class="label">Token</label>
                        <input class="input" type="text" id="token_automarticles" name="token_automarticles" value="<?php echo $token; ?>">
                        <label class="desc-input">Este token pode ser obtido na Automarticles em
                            <a href="https://app.automarticles.com/configuracoes?tab=integrations" target="_blank">Configurações > Integrações.</a>
                        </label>
                    </div>
                    <div class="mb-20">
                        <label for="autor_automarticles" class="label">Autor</label>
                        <select class="input" name="autor_automarticles" id="autor_automarticles">
                            <option value="">Nenhum</option>
                            <?php
                            $authors = get_users();
                            $i = 0;
                            foreach ($authors as $author) { ?>
                                <option value="<?php echo $author->data->ID; ?>" <?php if ($autor_automarticles == $author->data->ID) echo "selected" ?>>
                                    <?php echo $author->data->display_name; ?>
                                </option>
                            <?php $i++;
                            } ?>
                        </select>
                        <label class="desc-input">O autor dos posts que serão publicados pela Automarticles.</label>
                    </div>
                    <div class="margin-bottom">
                        <label for="url_webhook" class="label">URL do Webhook:</label>
                        <div style="display: flex; gap: 5px;">
                            <input class="input" style="background-color: #EAECF0;" type="text" id="url_webhook" name="url_webhook" value="<?php echo get_site_url() . "/webhook?automarticles"; ?>" disabled>
                            <button type="button" class="botao-copiar" id="copyButton">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" id="copiarIcon">
                                    <g clip-path="url(#clip0_13_27)">
                                        <path d="M4.16667 12.5C3.3901 12.5 3.00182 12.5 2.69553 12.3731C2.28715 12.204 1.9627 11.8795 1.79354 11.4711C1.66667 11.1649 1.66667 10.7766 1.66667 10V4.33334C1.66667 3.39992 1.66667 2.93321 1.84833 2.57669C2.00812 2.26308 2.26308 2.00812 2.57669 1.84833C2.93321 1.66667 3.39992 1.66667 4.33334 1.66667H10C10.7766 1.66667 11.1649 1.66667 11.4711 1.79354C11.8795 1.9627 12.204 2.28715 12.3731 2.69553C12.5 3.00182 12.5 3.3901 12.5 4.16667M10.1667 18.3333H15.6667C16.6001 18.3333 17.0668 18.3333 17.4233 18.1517C17.7369 17.9919 17.9919 17.7369 18.1517 17.4233C18.3333 17.0668 18.3333 16.6001 18.3333 15.6667V10.1667C18.3333 9.23325 18.3333 8.76654 18.1517 8.41002C17.9919 8.09642 17.7369 7.84145 17.4233 7.68166C17.0668 7.50001 16.6001 7.5 15.6667 7.5H10.1667C9.23325 7.5 8.76654 7.50001 8.41002 7.68166C8.09642 7.84145 7.84145 8.09642 7.68166 8.41002C7.50001 8.76654 7.5 9.23325 7.5 10.1667V15.6667C7.5 16.6001 7.50001 17.0668 7.68166 17.4233C7.84145 17.7369 8.09642 17.9919 8.41002 18.1517C8.76654 18.3333 9.23325 18.3333 10.1667 18.3333Z" stroke="#667085" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_13_27">
                                            <rect width="20" height="20" fill="white" />
                                        </clipPath>
                                    </defs>
                                </svg>

                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" style="display: none;" id="copiarIconSucesso">
                                    <path d="M11.5 21C17.0228 21 21.5 16.5228 21.5 11C21.5 5.47715 17.0228 1 11.5 1C5.97715 1 1.5 5.47715 1.5 11C1.5 16.5228 5.97715 21 11.5 21Z" fill="#039855"></path>
                                    <path d="M7 11L10 14L16 8M21.5 11C21.5 16.5228 17.0228 21 11.5 21C5.97715 21 1.5 16.5228 1.5 11C1.5 5.47715 5.97715 1 11.5 1C17.0228 1 21.5 5.47715 21.5 11Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>

                                <span id="textButtonCopy">Copiar</span>
                            </button>
                        </div>
                        <label class="desc-input">Esta URL deverá ser colada no campo “URL do Webhook” na Automarticles do
                            <a href="https://app.automarticles.com/configuracoes?tab=integrations" target="_blank">Configurações > Integrações.</a>
                        </label>
                    </div>

                    <button type="submit" class="botao">Salvar configurações</button>


                    <?php if (isset($success)) { ?>
                        <div style="display: flex;align-items: center;justify-content: center;gap: 8px;margin-top: 24px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="23" height="22" viewBox="0 0 23 22" fill="none">
                                <path d="M11.5 21C17.0228 21 21.5 16.5228 21.5 11C21.5 5.47715 17.0228 1 11.5 1C5.97715 1 1.5 5.47715 1.5 11C1.5 16.5228 5.97715 21 11.5 21Z" fill="#039855"></path>
                                <path d="M7 11L10 14L16 8M21.5 11C21.5 16.5228 17.0228 21 11.5 21C5.97715 21 1.5 16.5228 1.5 11C1.5 5.47715 5.97715 1 11.5 1C17.0228 1 21.5 5.47715 21.5 11Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                            </svg>
                            <p class="" style="color: #475467;font-family: Inter;font-size: 14px;font-style: normal;font-weight: 600;line-height: 20px;margin: 0;">
                                Configurações atualizadas
                            </p>
                        </div>
                    <?php } ?>
                </form>
            </div>
        </div>
        <script>
            document.querySelector("#copyButton").addEventListener("click", () => {
                navigator.clipboard.writeText(document.querySelector("#url_webhook").value);
                document.querySelector("#copiarIcon").style.display = 'none';
                document.querySelector("#copiarIconSucesso").style.display = 'block';
                document.querySelector("#textButtonCopy").innerHTML = 'Copiado';
            })
        </script>
<?php
    }
}
