import urllib.request
import urllib.error
import json

url = 'http://localhost:3000/api/v1/auth/admin-login/'
data = json.dumps({'identifier': '9989719684', 'password': 'Siddu@9989'}).encode('utf-8')
req = urllib.request.Request(url, data, {'Content-Type': 'application/json'})
try:
    resp = urllib.request.urlopen(req)
    print('status', resp.status)
    print(resp.read().decode())
except urllib.error.HTTPError as e:
    print('status', e.code)
    print('headers:', e.headers)
    try:
        print(e.read().decode())
    except Exception as ex:
        print('error reading body:', ex)
except Exception as e:
    print('exception', type(e).__name__, e)
