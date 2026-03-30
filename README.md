# SprintPilotAI-PMT

Database: 

1. Run XAMPP app

2. THen start apache and MySQL

3. Go to MySQL admin and import the sprintpilotai.sql file to database named sprintpilotai

Front End: 

1. run "npm install" in the cmd front-end folder.

2. run the front end by typing "npm run dev".

Back End: 

1. First ensure the following runtimes and tools are installed on your system before proceeding:

Node.js	v18 
npm	v9 or higher (bundled with Node.js)
Python	3.10 
pip	Latest (upgrade with: pip install --upgrade pip)
CUDA Toolkit (optional)	12.1 — only for GPU-accelerated PyTorch

2. Then run "npm install" in the cmd back-end folder.

3. Then run "pip install -r requirements.txt" in the cmd back-end folder.

4. Then run "pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu" in the cmd back-end folder.

5. THen run "npm run dev" to start the back end.