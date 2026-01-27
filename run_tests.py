import subprocess
import time
import sys

def main():
    # Start the FastAPI server
    server_process = subprocess.Popen([sys.executable, "main.py"], cwd="API_Backend")
    
    # Wait for the server to start
    time.sleep(5)
    
    # Run the tests
    result = subprocess.run(["pytest"], cwd="API_Backend")
    
    # Stop the server
    server_process.terminate()
    
    # Exit with the same code as pytest
    sys.exit(result.returncode)

if __name__ == "__main__":
    main()
