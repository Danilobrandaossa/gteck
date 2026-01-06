-- Schema para Pressel Automation
-- Adiciona campos WordPress à tabela sites existente

-- Adicionar colunas WordPress à tabela sites
ALTER TABLE sites ADD COLUMN wp_base_url VARCHAR(255);
ALTER TABLE sites ADD COLUMN wp_auth_type ENUM('basic', 'bearer', 'nonce') DEFAULT 'basic';
ALTER TABLE sites ADD COLUMN wp_username VARCHAR(100);
ALTER TABLE sites ADD COLUMN wp_password TEXT; -- App password ou token
ALTER TABLE sites ADD COLUMN wp_nonce VARCHAR(255); -- Para autenticação nonce
ALTER TABLE sites ADD COLUMN wp_configured BOOLEAN DEFAULT FALSE;
ALTER TABLE sites ADD COLUMN wp_last_sync TIMESTAMP NULL;

-- Tabela de modelos Pressel
CREATE TABLE pressel_models (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    template_file VARCHAR(100) NOT NULL,
    locale VARCHAR(10) DEFAULT 'pt-BR',
    schema_version VARCHAR(20) DEFAULT 'v1',
    field_map JSON, -- Mapeamento de campos para ACF
    defaults JSON, -- Valores padrão (cores, labels, etc.)
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inserir modelo V1 inicial
INSERT INTO pressel_models (id, name, description, template_file, locale, field_map, defaults) VALUES (
    'modelo_v1',
    'Modelo V1 (Brasileiro)',
    'Template padrão brasileiro com design completo',
    'pressel-oficial.php',
    'pt-BR',
    JSON_OBJECT(
        'hero_description', 'hero_description',
        'titulo_da_secao', 'titulo_da_secao',
        'texto_botao_p1', 'texto_botao_p1',
        'link_botao_p1', 'link_botao_p1',
        'texto_botao_p2', 'texto_botao_p2',
        'link_botao_p2', 'link_botao_p2',
        'texto_botao_p3', 'texto_botao_p3',
        'link_botao_p3', 'link_botao_p3',
        'texto_usuario', 'texto_usuario',
        'titulo_h2_', 'titulo_h2_',
        'info_content', 'info_content',
        'titulo_beneficios', 'titulo_beneficios',
        'beneficios', 'beneficios',
        'titulo_faq', 'titulo_faq',
        'faq_items', 'faq_items',
        'botao_tipo_selecao', 'botao_tipo_selecao',
        'cor_botao', 'cor_botao'
    ),
    JSON_OBJECT(
        'button_color', '#2352AE',
        'button_type', 'normal',
        'section_title', 'Acesse Agora',
        'benefits_title', 'Principais Benefícios',
        'faq_title', 'Perguntas Frequentes'
    )
);

-- Tabela de jobs da fila para Pressel
CREATE TABLE pressel_jobs (
    id VARCHAR(36) PRIMARY KEY,
    type ENUM('convert', 'create', 'diagnostic') NOT NULL,
    site_id VARCHAR(50) NOT NULL,
    status ENUM('queued', 'running', 'completed', 'failed') DEFAULT 'queued',
    input_data JSON,
    output_data JSON,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_pressel_jobs_status ON pressel_jobs(status);
CREATE INDEX idx_pressel_jobs_site_id ON pressel_jobs(site_id);
CREATE INDEX idx_pressel_jobs_created_at ON pressel_jobs(created_at);
CREATE INDEX idx_sites_wp_configured ON sites(wp_configured);

-- View para sites com WordPress configurado
CREATE VIEW sites_with_wordpress AS
SELECT 
    s.id,
    s.name,
    s.url,
    s.wp_base_url,
    s.wp_auth_type,
    s.wp_configured,
    s.wp_last_sync,
    o.name as organization_name
FROM sites s
JOIN organizations o ON s.organization_id = o.id
WHERE s.wp_configured = TRUE;

-- Stored procedure para criar job
DELIMITER //
CREATE PROCEDURE CreatePresselJob(
    IN p_type VARCHAR(20),
    IN p_site_id VARCHAR(50),
    IN p_input_data JSON
)
BEGIN
    DECLARE job_id VARCHAR(36);
    SET job_id = UUID();
    
    INSERT INTO pressel_jobs (id, type, site_id, input_data)
    VALUES (job_id, p_type, p_site_id, p_input_data);
    
    SELECT job_id as job_id;
END //
DELIMITER ;

-- Trigger para atualizar wp_last_sync quando job é completado
DELIMITER //
CREATE TRIGGER update_wp_sync_after_job_completion
AFTER UPDATE ON pressel_jobs
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE sites 
        SET wp_last_sync = NOW() 
        WHERE id = NEW.site_id;
    END IF;
END //
DELIMITER ;

