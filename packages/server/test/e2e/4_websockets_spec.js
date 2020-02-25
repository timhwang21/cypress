const ws = require('ws')
const e2e = require('../support/helpers/e2e')

const onServer = (app) => {
  app.get('/foo', (req, res) => {
    res.send('<html>foo></html>')
  })
}

const onWsServer = function (app, server) {
  const wss = new ws.Server({ server })

  wss.on('connection', (ws) => {
    ws.on('message', (msg) => {
      ws.send(`${msg}bar`)
    })
  })
}

const onWssServer = function (app) {}

describe('e2e websockets', () => {
  e2e.setup({
    servers: [{
      port: 3038,
      static: true,
      onServer,
    }, {
      port: 3039,
      onServer: onWsServer,
    }, {
      port: 3040,
      onServer: onWssServer,
    }],
  })

  // https://github.com/cypress-io/cypress/issues/556
  e2e.it('passes', {
    spec: 'websockets_spec.coffee',
    snapshot: true,
  })
})
