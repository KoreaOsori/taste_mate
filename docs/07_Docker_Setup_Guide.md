# Docker 설치 및 실행 가이드

이 문서는 TasteMate 프로젝트를 Docker 환경에서 설치하고 실행하는 모든 과정을 안내합니다.

## 1. 전제 조건
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) 설치 및 실행 중
*   `.env` 파일 설정 완료 (backend/.env, frontend/.env)

## 2. Docker 설정 파일 요약

| 파일명 | 용도 | 위치 |
| :--- | :--- | :--- |
| `Dockerfile` | 개별 서비스(Backend/Frontend)의 이미지 빌드 규칙 | 각 서비스 폴더 |
| `.dockerignore` | 이미지 빌드 시 제외할 파일 목록 | 각 서비스 폴더 |
| `docker-compose.yml` | 전체 서비스 통합 가동 및 네트워크/볼륨 설정 | 루트 폴더 |

## 3. 실행 방법 (따라하기)

### 단계 1: 프로젝트 루트 디렉토리로 이동
터미널을 열고 `taste_mate` 폴더로 이동합니다.

### 단계 2: 서비스 빌드 및 실행
다음 명령어를 입력하여 이미지를 빌드하고 컨테이너를 가동합니다.
```bash
docker-compose up --build
```
> [!NOTE]
> 처음 실행 시 라이브러리 설치로 인해 몇 분 정도 소요될 수 있습니다.

### 단계 3: 서비스 접속 확인
정상적으로 가동되면 아래 주소로 접속할 수 있습니다.
*   **Frontend**: [http://localhost:3000](http://localhost:3000)
*   **Backend API**: [http://localhost:8000](http://localhost:8000)
*   **Backend Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

## 4. 유용한 명령어

| 작업 | 명령어 |
| :--- | :--- |
| **서비스 종료** | `Ctrl + C` 또는 `docker-compose down` |
| **백그라운드 실행** | `docker-compose up -d` |
| **로그 확인** | `docker-compose logs -f` |
| **특정 서비스만 재빌드** | `docker-compose up --build backend` |

## 5. 문제 해결 (Troubleshooting)

### Q1. "Port 8000 is already in use" 에러가 발생합니다.
*   **원인**: 로컬에서 이미 `python main.py` 등으로 서버를 켜두었을 때 발생합니다.
*   **해결**: 기존에 실행 중인 터미널 프로세스를 종료하거나, `docker-compose down` 명령을 수행 후 다시 시도하세요.

### Q2. 환경 변수(.env) 변경사항이 반영되지 않습니다.
*   **해결**: 환경 변수 변경 후에는 서비스를 재빌드해야 안전하게 반영됩니다. `docker-compose up --build`를 사용하세요.

---
작성일: 2026-02-24
작성자: Antigravity Assistant
