# JapanLingo Reverb Service

Unit ini memakai:

- User VPS: `webtest`
- Group web server: `www-data`
- Project: `/var/www/project_japan_v2`
- PHP: `/usr/bin/php`
- Reverb internal: `127.0.0.1:8080`

Setelah repository diperbarui di VPS:

```bash
cd /var/www/project_japan_v2
sudo cp deployment/systemd/japanlingo-reverb.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now japanlingo-reverb
```

Periksa status dan log:

```bash
sudo systemctl status japanlingo-reverb
sudo journalctl -u japanlingo-reverb -f
```

Setelah deployment kode atau perubahan `.env` Reverb:

```bash
sudo systemctl restart japanlingo-reverb
```

Reverb hanya mendengarkan koneksi lokal. Nginx harus meneruskan koneksi WebSocket HTTPS/WSS ke `127.0.0.1:8080`; port `8080` tidak perlu dibuka pada firewall publik.
