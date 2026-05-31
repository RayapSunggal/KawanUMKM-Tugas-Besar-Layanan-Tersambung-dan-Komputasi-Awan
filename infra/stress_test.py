import requests
import concurrent.futures
import time
import uuid

URL = "https://kawan-backend-rzhvkazwdq-et.a.run.app/generate"

def create_payload(request_id):
    return {
        "productName": f"Keripik Tempe Varian {request_id}",
        "description": f"Keripik tempe renyah gurih nomor {request_id} yang dibuat dengan resep warisan leluhur.",
        "category": "kuliner",
        "vibe": "Tradisional",
        "price": "15000",
        "photoKey": f"test-images/keripik-{request_id}.jpg",
        "sessionId": str(uuid.uuid4())
    }

def send_request(request_id):
    payload = create_payload(request_id)
    
    # Menyamar sebagai browser Chrome asli
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Content-Type": "application/json"
    }
    
    start_time = time.time()
    try:
        response = requests.post(URL, json=payload, headers=headers)
        end_time = time.time()
        duration = end_time - start_time
        
        # Amankan proses parsing
        try:
            data = response.json()
            is_json = True
        except ValueError:
            data = response.text
            is_json = False
            
        if response.status_code == 200:
            if is_json:
                return f"[OK] Request {request_id} | Waktu: {duration:.2f}s | JobID: {data.get('jobId')}"
            else:
                return f"[ANEH] Request {request_id} dapat 200 OK tapi teks kosong/bukan JSON: '{data}'"
        else:
            # Ini akan mengungkap apakah kita kena Error 400 (Bad Request), 403 (Forbidden), atau 500 (Server Error)
            return f"[GAGAL] Request {request_id} | Status HTTP: {response.status_code} | Teks: {data}"
            
    except Exception as e:
        return f"[KONEKSI PUTUS] Request {request_id}: {e}"

if __name__ == "__main__":
    print("Memulai Stress Test (Mode Debug)...\n")
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(send_request, i) for i in range(1, 11)]
        for future in concurrent.futures.as_completed(futures):
            print(future.result())