"""
ngrok 없이 HTTPS 로컬 서버 실행
- 자체 서명 인증서 자동 생성
- https://localhost:4443 으로 접속
- 같은 WiFi의 휴대폰에서는 https://[PC_IP]:4443 으로 접속
"""

import http.server, ssl, os, socket, threading, subprocess, sys

PORT = 4443
FOLDER = os.path.dirname(os.path.abspath(__file__))

# ── 인증서 생성 (openssl 사용) ─────────────────────────────────────────────────
CERT = os.path.join(FOLDER, 'cert.pem')
KEY  = os.path.join(FOLDER, 'key.pem')

if not os.path.exists(CERT) or not os.path.exists(KEY):
    print("자체 서명 인증서 생성 중...")
    try:
        subprocess.run([
            'openssl', 'req', '-x509', '-newkey', 'rsa:2048',
            '-keyout', KEY, '-out', CERT,
            '-days', '365', '-nodes',
            '-subj', '/CN=localhost'
        ], check=True, capture_output=True)
        print("인증서 생성 완료!")
    except Exception as e:
        print(f"openssl 없음 → cryptography 패키지로 시도...")
        try:
            from cryptography import x509
            from cryptography.x509.oid import NameOID
            from cryptography.hazmat.primitives import hashes, serialization
            from cryptography.hazmat.primitives.asymmetric import rsa
            import datetime, ipaddress

            key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
            name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, u"localhost")])

            # Get local IP for SAN
            local_ip = socket.gethostbyname(socket.gethostname())

            cert = (x509.CertificateBuilder()
                .subject_name(name)
                .issuer_name(name)
                .public_key(key.public_key())
                .serial_number(x509.random_serial_number())
                .not_valid_before(datetime.datetime.utcnow())
                .not_valid_after(datetime.datetime.utcnow() + datetime.timedelta(days=365))
                .add_extension(x509.SubjectAlternativeName([
                    x509.DNSName(u"localhost"),
                    x509.IPAddress(ipaddress.IPv4Address('127.0.0.1')),
                    x509.IPAddress(ipaddress.IPv4Address(local_ip)),
                ]), critical=False)
                .sign(key, hashes.SHA256()))

            with open(KEY, "wb") as f:
                f.write(key.private_bytes(
                    serialization.Encoding.PEM,
                    serialization.PrivateFormat.TraditionalOpenSSL,
                    serialization.NoEncryption()))
            with open(CERT, "wb") as f:
                f.write(cert.public_bytes(serialization.Encoding.PEM))
            print("인증서 생성 완료!")
        except ImportError:
            subprocess.run([sys.executable, '-m', 'pip', 'install', 'cryptography'], check=True)
            print("cryptography 설치 완료. 스크립트를 다시 실행해주세요.")
            sys.exit(0)

# ── 서버 실행 ─────────────────────────────────────────────────────────────────
os.chdir(FOLDER)

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # 로그 최소화

httpd = http.server.HTTPServer(('0.0.0.0', PORT), Handler)

ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.load_cert_chain(CERT, KEY)
httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)

# 로컬 IP 찾기
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("8.8.8.8", 80))
    local_ip = s.getsockname()[0]
    s.close()
except:
    local_ip = "알수없음"

print()
print("=" * 55)
print("  [AR Archery HTTPS 서버 실행 중!]")
print("=" * 55)
print(f"  PC 접속    :  https://localhost:{PORT}")
print(f"  휴대폰 접속:  https://{local_ip}:{PORT}")
print()
print("  ※ 브라우저에서 '안전하지 않음' 경고가 뜨면")
print("     '고급' → '계속 진행' 클릭하세요")
print("  ※ 휴대폰은 PC와 같은 WiFi에 연결되어야 해요")
print()
print("  종료: Ctrl + C")
print("=" * 55)

import webbrowser
threading.Timer(0.5, lambda: webbrowser.open(f'https://localhost:{PORT}')).start()

try:
    httpd.serve_forever()
except KeyboardInterrupt:
    print("\n서버 종료.")
