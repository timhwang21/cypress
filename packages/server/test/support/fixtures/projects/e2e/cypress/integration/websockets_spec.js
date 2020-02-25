const shouldCloseUrlWithCode = (win, url, code) => {
  return new Promise((resolve, reject) => {
    const ws = new win.WebSocket(url)

    // ws.onerror = (err) ->
    // debugger

    ws.onclose = function (evt) {
      if (evt.code === code) {
        return resolve()
      }

      return reject(`websocket connection should have been closed with code ${code} for url: ${url} but was instead closed with code: ${evt.code}`)
    }

    ws.onopen = (evt) => {
      return reject(`websocket connection should not have opened for url: ${url}`)
    }
  })
}

describe('websockets', () => {
  it('does not crash', () => {
    cy.visit('http://localhost:3038/foo')
    cy.log('should not crash on ECONNRESET websocket upgrade')
    cy.window().then((win) => {
      return Cypress.Promise.all([
        // Firefox should close with code 1015 when using SSL, chrome should close with 1006
        // see https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
        shouldCloseUrlWithCode(win, 'ws://localhost:3038/websocket', 1006),
        shouldCloseUrlWithCode(win, 'wss://localhost:3040/websocket', Cypress.browser.family === 'firefox' ? 1015 : 1006),
      ])
    })

    cy.log('should be able to send websocket messages')

    return cy
    .window()
    .then((win) => {
      return new Promise((resolve, reject) => {
        const ws = new win.WebSocket('ws://localhost:3039/')

        ws.onmessage = (evt) => {
          return resolve(evt.data)
        }

        ws.onerror = reject
        ws.onopen = () => {
          return ws.send('foo')
        }
      })
    }).should('eq', 'foobar')
  })
})
