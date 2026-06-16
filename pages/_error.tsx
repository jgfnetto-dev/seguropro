function ErrorPage({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <h1>{statusCode ?? 'Erro'}</h1>
      <p>{statusCode === 404 ? 'Página não encontrada' : 'Erro interno do servidor'}</p>
      <a href="/" style={{ color: '#00288e' }}>Voltar ao início</a>
    </div>
  )
}

ErrorPage.getInitialProps = ({ res, err }: { res?: { statusCode: number }; err?: { statusCode: number } }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default ErrorPage
