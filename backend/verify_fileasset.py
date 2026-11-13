import os
import sys

sys.path.insert(0, 'backend')
os.environ['SECRET_KEY'] = 'test'
os.environ['JWT_SECRET_KEY'] = 'test'

from app import create_app
from app.extensions import db

app = create_app()
with app.app_context():
    print('FileAsset in db.metadata.tables:', 'file_assets' in db.metadata.tables)
    print('FileAsset class:', db.metadata.tables.get('file_assets'))
    print()
    print('All model tables in metadata:')
    for name in sorted(db.metadata.tables.keys()):
        if name != 'alembic_version':
            print('  -', name)
