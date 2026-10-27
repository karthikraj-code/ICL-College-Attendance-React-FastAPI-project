FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8000

# Listen on all interfaces so other containers can reach this service.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
