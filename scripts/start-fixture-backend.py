"""Start real FastAPI against the isolated MongoDB created by test-services.mjs."""
import json
import os
from pathlib import Path
import secrets
import sys
root = Path(__file__).resolve().parents[1]
backend = Path(os.environ.get('BEATNOW_BACKEND_PATH', str(root.parent / 'back'))).resolve()
config = json.loads((root / '.e2e/mongo.json').read_text())
if config['db'] != 'beatnow_e2e' or not config['uri'].startswith('mongodb://127.0.0.1:'):
    raise RuntimeError('Refusing non-isolated test database')
fixture_root = root / '.e2e'
test_config = fixture_root / 'test-config.json'
password = secrets.token_urlsafe(20)
test_config.write_text(json.dumps({'password': password, 'api': 'http://127.0.0.1:8000', 'web': 'http://127.0.0.1:5173'}))
test_config.chmod(0o600)
os.environ.update(ENVIRONMENT='test', BEATNOW_ENV_FILE=str(fixture_root / 'no-env'), SECRET_KEY=secrets.token_urlsafe(48), MONGO_URI=config['uri'], MONGO_DB=config['db'], MEDIA_ROOT=str(fixture_root / 'media'), BEATS_ORIGINAL_DIR=str(fixture_root / 'private'), BEATS_PREVIEW_DIR=str(fixture_root / 'media/beats'), PUBLIC_BASE_URL='http://127.0.0.1:8000', APP_WEB_BASE_URL='http://127.0.0.1:5173', MEDIA_BASE_URL='http://127.0.0.1:8000', CORS_ORIGINS='http://127.0.0.1:5173', BEATNOW_FIXTURE_SERVER='1', BEATNOW_FIXTURE_PASSWORD=password, BEATNOW_FIXTURE_DIR=str(fixture_root / 'fixtures'), TRUSTED_PROXY_IPS='127.0.0.1', LOGIN_RATE_LIMIT='100', REGISTER_RATE_LIMIT='100', BEAT_UPLOAD_RATE_LIMIT='100', SEARCH_RATE_LIMIT='1000')
os.environ['PATH'] = str(fixture_root / 'bin') + os.pathsep + os.environ['PATH']
sys.path.insert(0, str(backend))
import uvicorn
uvicorn.run('tests.fixture_app:app', host='127.0.0.1', port=8000, access_log=False)
