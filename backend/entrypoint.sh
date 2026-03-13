#!/bin/sh
# 컨테이너 내부 DNS 고정 (Supabase 등 외부 호스트 조회용)
echo "nameserver 8.8.8.8" > /etc/resolv.conf
echo "nameserver 8.8.4.4" >> /etc/resolv.conf
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
