const http = require('http');
const https = require('https');

const ALFIMA_API_KEY = process.env.ALFIMA_API_KEY;
const PORT = process.env.PORT || 3001;
const TEST_EMAIL = 'alfima-test-20260725@leichtart.com';

function httpsPost(body, callback) {
  const payload = JSON.stringify(body);
  const options = {
    hostname: 'app.alfima.com',
    port: 443,
    path: '/api/v1/contacts',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + ALFIMA_API_KEY,
      'Content-Length': Buffer.byteLength(payload)
    }
  };
  const req = https.request(options, function(res) {
    let data = '';
    res.on('data', function(chunk) { data += chunk; });
    res.on('end', function() { callback(null, res.statusCode, data); });
  });
  req.on('error', function(e) { callback(e); });
  req.write(payload);
  req.end();
}

const server = http.createServer(function(req, res) {

  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('alfima Test-Server aktiv. Rufe /test auf.');
    return;
  }

  if (req.method === 'GET' && req.url === '/test') {
    if (!ALFIMA_API_KEY) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('ALFIMA_API_KEY nicht gesetzt');
      return;
    }

    // Debug: zeige die ersten 8 Zeichen des Keys
    const keyDebug = ALFIMA_API_KEY.substring(0, 8) + '...' + ALFIMA_API_KEY.slice(-4);
    console.log('Key Debug:', keyDebug);

    const body1 = {
      email: TEST_EMAIL,
      list_ids: [1]
    };

    const body2 = {
      email: TEST_EMAIL,
      list_ids: ['leichtART Karriere-Kompass']
    };

    let ausgabe = 'alfima list_ids Test\n';
    ausgabe += 'Test-E-Mail: ' + TEST_EMAIL + '\n';
    ausgabe += 'API-Key (gekuerzt): ' + keyDebug + '\n';
    ausgabe += '==========================================\n\n';

    ausgabe += 'Gesendeter JSON-Body Test 1:\n';
    ausgabe += JSON.stringify(body1, null, 2) + '\n\n';

    httpsPost(body1, function(err1, status1, data1) {
      if (err1) {
        ausgabe += 'Test 1 FEHLER: ' + err1.message + '\n\n';
      } else {
        let antwort1;
        try { antwort1 = JSON.parse(data1); } catch(e) { antwort1 = data1; }
        ausgabe += 'Test 1 - Numerische list_id [1]\n';
        ausgabe += 'HTTP-Statuscode: ' + status1 + '\n';
        ausgabe += 'Alfima-Antwort: ' + JSON.stringify(antwort1, null, 2) + '\n';
        if (status1 === 201) ausgabe += 'Ergebnis: Neuer Kontakt erstellt\n';
        else if (status1 === 200) ausgabe += 'Ergebnis: Bestehender Kontakt aktualisiert\n';
        else ausgabe += 'Ergebnis: Fehler\n';
        ausgabe += '\n==========================================\n\n';
      }

      ausgabe += 'Gesendeter JSON-Body Test 2:\n';
      ausgabe += JSON.stringify(body2, null, 2) + '\n\n';

      httpsPost(body2, function(err2, status2, data2) {
        if (err2) {
          ausgabe += 'Test 2 FEHLER: ' + err2.message + '\n\n';
        } else {
          let antwort2;
          try { antwort2 = JSON.parse(data2); } catch(e) { antwort2 = data2; }
          ausgabe += 'Test 2 - Listenname ["leichtART Karriere-Kompass"]\n';
          ausgabe += 'HTTP-Statuscode: ' + status2 + '\n';
          ausgabe += 'Alfima-Antwort: ' + JSON.stringify(antwort2, null, 2) + '\n';
          if (status2 === 201) ausgabe += 'Ergebnis: Neuer Kontakt erstellt\n';
          else if (status2 === 200) ausgabe += 'Ergebnis: Bestehender Kontakt aktualisiert\n';
          else ausgabe += 'Ergebnis: Fehler\n';
        }

        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(ausgabe);
      });
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Nicht gefunden' }));
});

server.listen(PORT, function() {
  console.log('alfima Test-Server laeuft auf Port ' + PORT);
});
