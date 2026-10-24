"""Read-only FTPS chroot proof. Never upload, rename, delete or print credentials."""
import ftplib
import hashlib
import json
import os
import re
import ssl
import sys
import urllib.request


def main():
    host = os.environ['WRN_FTPS_HOST']
    address = os.environ['WRN_FTPS_IP']
    username = os.environ['WRN_FTPS_USER']
    assert host == 'srv2083.hstgr.io' and address == '82.198.229.55', 'scope-host-binding'
    assert username == 'u353704738.wrnnewsauto', 'scope-account-binding'
    ftp = ftplib.FTP_TLS(context=ssl.create_default_context(), timeout=15)
    ftp.connect(address, 21)
    ftp.host = host  # DNS/IP binding with certificate verification and SNI for the hostname.
    ftp.login(username, os.environ['WRN_FTPS_PASSWORD'])
    ftp.prot_p()
    assert ftp.pwd() == '/', 'scope-root'
    listing = list(ftp.mlsd())
    names = {name for name, facts in listing if facts.get('type') not in ('cdir', 'pdir')}
    allowed = re.compile(r'(?:current\.json|snapshots|\.wrn-news-auto-state-v1\.(?:json|tmp)|current\.[0-9]{12}-[a-f0-9]{64}\.(?:rollback\.)?tmp)')
    assert {'current.json', 'snapshots'} <= names and all(allowed.fullmatch(name) for name in names), 'scope-foreign-root-entry'
    raw = bytearray()

    def receive(chunk):
        assert len(raw) + len(chunk) <= 16384, 'scope-pointer-size'
        raw.extend(chunk)

    ftp.retrbinary('RETR current.json', receive)
    pointer = json.loads(raw)
    assert pointer['schema'] == 'wrn.website-content-tuple-pointer.v1', 'scope-pointer-contract'
    ftp.cwd('..')
    assert ftp.pwd() == '/' and {name for name, facts in ftp.mlsd() if facts.get('type') not in ('cdir', 'pdir')} == names, 'scope-parent-escape'
    denied = []
    for path in ['/public_html', '/atlas', '/wrn-article-content', '/wrn-content-directory', '/apps', '../atlas', '../wrn-article-content']:
        try:
            list(ftp.mlsd(path))
        except ftplib.error_perm:
            denied.append(path)
        else:
            raise RuntimeError('scope-outside-list-readable')
    for path in ['/index.html', '../index.html', '/public_html/index.html', '../wrn-article-content/current.json']:
        try:
            ftp.retrbinary('RETR ' + path, lambda chunk: None)
        except ftplib.error_perm:
            denied.append(path)
        else:
            raise RuntimeError('scope-outside-file-readable')
    ftp.quit()

    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, request, response, code, message, headers, target):
            return None

    opener = urllib.request.build_opener(NoRedirect())
    request = urllib.request.Request('https://solinaridao.com/wrn-website-content/current.json', headers={'Accept': 'application/json', 'Cache-Control': 'no-cache'})
    with opener.open(request, timeout=15) as response:
        public = response.read(16385)
        assert response.status == 200 and public == raw, 'scope-public-pointer-binding'
    print(json.dumps({'state': 'scope-probe-pass', 'readOnly': True, 'tlsVerified': True,
                      'host': host, 'ip': address, 'account': username, 'root': '/',
                      'parentTraversal': 'clamped-to-same-root', 'deniedOutsidePaths': denied,
                      'pointerSequence': pointer['sequence'], 'pointerSha256': hashlib.sha256(raw).hexdigest(),
                      'publicationPerformed': False}))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Never serialize server replies or environment/credential values.
        reason = str(error) if re.fullmatch(r'scope-[a-z-]+', str(error)) else type(error).__name__
        print(json.dumps({'state': 'scope-probe-failed', 'reason': reason, 'publicationPerformed': False}), file=sys.stderr)
        sys.exit(1)
