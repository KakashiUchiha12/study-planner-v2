import os
import sys
import subprocess
import threading
import time

# Add your project directory to Python path
project_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_dir)

# Set environment variables
os.environ['NODE_ENV'] = 'production'
os.environ['PORT'] = '3000'

def start_app():
    """Start the Next.js application"""
    try:
        # Change to project directory
        os.chdir(project_dir)
        
        # Start the Next.js application
        process = subprocess.Popen(
            ['npm', 'start'],
            cwd=project_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=os.environ.copy()
        )
        
        # Wait a moment for the app to start
        time.sleep(3)
        
        return process
    except Exception as e:
        print(f"Error starting application: {e}")
        return None

# Start the application when Passenger loads this file
app = start_app()

# For Passenger compatibility
if __name__ == '__main__':
    if app:
        app.wait()
