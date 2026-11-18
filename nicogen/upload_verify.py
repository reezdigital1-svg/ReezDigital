import json, urllib.request, uuid, os, sys

def uguu_upload(path):
    boundary = uuid.uuid4().hex
    fname = os.path.basename(path)
    data = open(path, 'rb').read()
    body = b''
    body += f'--{boundary}\r\nContent-Disposition: form-data; name="files[]"; filename="{fname}"\r\nContent-Type: video/mp4\r\n\r\n'.encode()
    body += data
    body += f'\r\n--{boundary}--\r\n'.encode()
    req = urllib.request.Request(
        'https://uguu.se/upload?output=json',
        data=body,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}',
                 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) NicoGen/1.0'})
    r = urllib.request.urlopen(req, timeout=120)
    j = json.loads(r.read())
    return j

def verify(url, expected_bytes):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    r = urllib.request.urlopen(req, timeout=120)
    blob = r.read()
    return (r.status, r.headers.get('Content-Type'), len(blob), blob[:12], len(blob) == expected_bytes)

if __name__ == '__main__':
    path = sys.argv[1]
    print('uploading', path, os.path.getsize(path), 'bytes...')
    j = uguu_upload(path)
    print(json.dumps(j))
    url = (j.get('files') or [{}])[0].get('url')
    if url:
        u = url.replace('https://a.uguu.se/', 'https://d.uguu.se/')
        print('verified:', verify(u, os.path.getsize(path)))
        print('DOWNLOAD LINK:', u)
