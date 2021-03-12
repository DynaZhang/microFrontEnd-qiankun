const proxyUrlBeta = 'http://gateway.one.speiyou.net'

module.exports = {
  devServer: {
    proxy: {
      '^/dev-api': {
        target: 'http://localhost:8083',
        changeOrigin: true
      },
      '/api': {
        target: proxyUrlBeta,
        changeOrigin: true
      },
      '/AUTH': {
        target: proxyUrlBeta,
        changeOrigin: true
      },
      '/MASTER-BD': {
        target: proxyUrlBeta,
        changeOrigin: true
      },
      '/bedrock-teacher': {
        target: proxyUrlBeta,
        // target: 'http://10.40.17.7:8080',
        changeOrigin: true,
        pathRewrite: {
          '^/bedrock-teacher': '/TEACHER/bedrock-teacher'
        }
      },
      '/ALADDIN': {
        ws: false,
        target: proxyUrlBeta,
        changeOrigin: true
      },
      '/SPLAT': {
        ws: false,
        target: proxyUrlBeta,
        changeOrigin: true
      }
    }
  }
}
