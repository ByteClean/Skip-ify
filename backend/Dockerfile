FROM python:3.10-slim

WORKDIR /app

# Installiere netcat + build-tools für cryptography
RUN apt-get update && \
    apt-get install -y netcat-openbsd build-essential libssl-dev libffi-dev python3-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

RUN mkdir -p uploads

EXPOSE 5000

CMD ["/wait-for-it.sh", "mysql", "3306", "--", \
     "/wait-for-it.sh", "mongo", "27017", "--", \
     "python", "run.py"]