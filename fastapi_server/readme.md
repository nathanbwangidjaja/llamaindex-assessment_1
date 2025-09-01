To run:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r server/requirements.txt
uvicorn main:app --reload --port 4000
```