import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    // Verificar se as credenciais WordPress estão configuradas
    const credentials = {
      username: process.env.WORDPRESS_DEFAULT_USERNAME || 'admin',
      password: process.env.WORDPRESS_DEFAULT_PASSWORD ? '***' + process.env.WORDPRESS_DEFAULT_PASSWORD.slice(-4) : null,
      hasPassword: !!process.env.WORDPRESS_DEFAULT_PASSWORD,
      authType: process.env.WP_DEFAULT_AUTH_TYPE || 'basic',
      configured: !!(process.env.WORDPRESS_DEFAULT_USERNAME && process.env.WORDPRESS_DEFAULT_PASSWORD)
    };

    return NextResponse.json({
      success: true,
      credentials,
      message: credentials.configured 
        ? 'Credenciais WordPress configuradas' 
        : 'Credenciais WordPress não configuradas - usando padrões'
    });

  } catch (error) {
    console.error('Erro ao verificar credenciais WordPress:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}








