/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const shouldCloseUrlWithCode = (win, url, code) => new Promise(function(resolve, reject) {
  const ws = new win.WebSocket(url);

  // ws.onerror = (err) ->
    // debugger

  ws.onclose = function(evt) {
    if (evt.code === code) {
      return resolve();
    } else {
      return reject(`websocket connection should have been closed with code ${code} for url: ${url} but was instead closed with code: ${evt.code}`);
    }
  };

  return ws.onopen = evt => reject(`websocket connection should not have opened for url: ${url}`);
});

describe("websockets", () => it("does not crash", function() {
  cy.visit("http://localhost:3038/foo");
  cy.log("should not crash on ECONNRESET websocket upgrade");
  cy.window().then(win => //# Firefox should close with code 1015 when using SSL, chrome should close with 1006
  //# see https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
  Cypress.Promise.all([
    shouldCloseUrlWithCode(win, "ws://localhost:3038/websocket", 1006),
    shouldCloseUrlWithCode(win, "wss://localhost:3040/websocket", Cypress.browser.family === 'firefox' ? 1015 : 1006)
  ]));

  cy.log("should be able to send websocket messages");

  return cy
  .window()
  .then(win => new Promise(function(resolve, reject) {
    const ws = new win.WebSocket("ws://localhost:3039/");
    ws.onmessage = evt => resolve(evt.data);
    ws.onerror = reject;
    return ws.onopen = () => ws.send("foo");
  })).should("eq", "foobar");
}));
